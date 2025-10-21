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
     * Import attendance data from Excel file
     *
     * @param UploadedFile $file
     * @param int $uploadedBy
     * @return AttendanceUploadBatch
     */
    public function import(UploadedFile $file, int $uploadedBy): AttendanceUploadBatch
    {
        DB::beginTransaction();
        
        try {
            // Create batch record
            $batch = AttendanceUploadBatch::create([
                'file_name' => $file->getClientOriginalName(),
                'file_size' => $file->getSize(),
                'file_type' => $file->getClientMimeType(),
                'uploaded_by' => $uploadedBy,
                'uploaded_at' => now(),
                'status' => 'pending',
                'meta' => [
                    'original_name' => $file->getClientOriginalName(),
                    'mime_type' => $file->getClientMimeType(),
                    'size' => $file->getSize(),
                ]
            ]);

            // Import Excel file
            Excel::import(new AttendanceRawImport($batch->id), $file);

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