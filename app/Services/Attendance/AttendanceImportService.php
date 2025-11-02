<?php

namespace App\Services\Attendance;

use App\Imports\AttendanceRawImport;
use App\Models\AttendanceUploadBatch;
use Carbon\Carbon;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Maatwebsite\Excel\Facades\Excel;

class AttendanceImportService
{
    /**
     * Store uploaded file in the filesystem
     * 
     * @param UploadedFile $file
     * @return string File path
     */
    /**
     * Store uploaded file in private storage
     * Files are stored privately since they contain sensitive employee data
     * 
     * @param UploadedFile $file
     * @return string File path
     * @throws \RuntimeException
     */
    protected function storeFile(UploadedFile $file): string
    {
        // Store in local private storage (not public)
        $path = $file->store('attendance/uploads', 'local');
        
        if (!$path) {
            throw new \RuntimeException('Failed to store attendance file');
        }
        
        return $path;
    }

    /**
     * Check for duplicate entries in raw data
     * 
     * @param AttendanceUploadBatch $batch
     * @return array Found duplicates
     */
    protected function checkDuplicates(AttendanceUploadBatch $batch): array
    {
        return DB::table('attendance_raws')
            ->select(
                'employee_id',
                'raw_date',
                'raw_time',
                DB::raw('COUNT(*) as count')
            )
            ->where('batch_id', $batch->id)
            ->groupBy('employee_id', 'raw_date', 'raw_time')
            ->having('count', '>', 1)
            ->get()
            ->toArray();
    }

    /**
     * Track import progress
     * 
     * @param AttendanceUploadBatch $batch
     * @param int $processed
     * @return void
     */
    protected function trackProgress(AttendanceUploadBatch $batch, int $processed): void
    {
        $batch->update([
            'processed_rows' => $processed,
            'meta' => array_merge($batch->meta ?? [], [
                'last_processed' => now()->toDateTimeString(),
                'processing_duration' => now()->diffInSeconds($batch->uploaded_at)
            ])
        ]);
    }

    /**
     * Import attendance data from Excel file
     *
     * @param UploadedFile $file
     * @param int $uploadedBy
     * @return AttendanceUploadBatch
     */
    public function import(UploadedFile $file, int $uploadedBy): AttendanceUploadBatch
    {
        // Validate file first
        $errors = $this->validateFile($file);
        if (!empty($errors)) {
            throw new \InvalidArgumentException(implode("\n", $errors));
        }

        DB::beginTransaction();
        
        try {
            // Store file first
            $filePath = $this->storeFile($file);

            // Create batch record
            $batch = AttendanceUploadBatch::create([
                'file_name' => $file->getClientOriginalName(),
                'file_path' => $filePath,
                'file_size' => $file->getSize(),
                'file_type' => $file->getClientMimeType(),
                'uploaded_by' => $uploadedBy,
                'uploaded_at' => now(),
                'status' => 'pending',
                'total_records' => 0,
                'processed_rows' => 0,
                'meta' => [
                    'original_name' => $file->getClientOriginalName(),
                    'mime_type' => $file->getClientMimeType(),
                    'size' => $file->getSize(),
                ]
            ]);

            // Import Excel file using chunk reading for large files
            Excel::import(new AttendanceRawImport($batch->id, function($chunk) use ($batch) {
                $this->trackProgress($batch, $chunk);
            }), $file);

            // Check for duplicates
            $duplicates = $this->checkDuplicates($batch);
            
            // Log duplicates if found
            if (!empty($duplicates)) {
                Log::warning('Duplicate entries found in attendance batch', [
                    'batch_id' => $batch->id,
                    'duplicates' => $duplicates
                ]);
            }

            // Update batch status and metadata
            $totalRecords = $batch->raws()->count();
            $batch->update([
                'status' => 'imported',
                'total_records' => $totalRecords,
                'processed_at' => now(),
                'meta' => array_merge($batch->meta ?? [], [
                    'total_records' => $totalRecords,
                    'import_duration' => now()->diffInSeconds($batch->uploaded_at),
                ])
            ]);

            DB::commit();
            return $batch;

        } catch (\Exception $e) {
            DB::rollBack();
            
            Log::error('Failed to import attendance file', [
                'file' => $file->getClientOriginalName(),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            if (isset($batch)) {
                $batch->update([
                    'status' => 'failed',
                    'meta' => array_merge($batch->meta ?? [], [
                        'error' => $e->getMessage(),
                        'error_type' => get_class($e)
                    ])
                ]);
            }

            throw $e;
        }
    }

    /**
     * Validate the uploaded file
     *
     * @param UploadedFile $file
     * @return array
     */
    public function validateFile(UploadedFile $file): array
    {
        $errors = [];

        // Check file type
        $allowedTypes = [
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'text/csv'
        ];

        if (!in_array($file->getClientMimeType(), $allowedTypes)) {
            $errors[] = 'Invalid file type. Please upload an Excel file (xls, xlsx) or CSV.';
        }

        // Check file size (10MB limit)
        $maxSize = 10 * 1024 * 1024; // 10MB in bytes
        if ($file->getSize() > $maxSize) {
            $errors[] = 'File size exceeds limit. Maximum size is 10MB.';
        }

        return $errors;
    }

    /**
     * Get recent batches with summary
     *
     * @param int $limit
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public function getRecentBatches(int $limit = 10)
    {
        return AttendanceUploadBatch::with(['uploadedBy:id,name'])
            ->select([
                'id',
                'file_name',
                'status',
                'total_records',
                'uploaded_by',
                'uploaded_at',
                'processed_at',
                'meta'
            ])
            ->orderBy('uploaded_at', 'desc')
            ->limit($limit)
            ->get();
    }
}