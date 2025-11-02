<?php

namespace App\Http\Controllers;

use App\Http\Requests\UploadAttendanceRequest;
use App\Services\Attendance\AttendanceImportService;
use App\Models\AttendanceUploadBatch;
use Illuminate\Support\Facades\DB;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Foundation\Validation\ValidatesRequests;
use Illuminate\Routing\Controller as BaseController;
use Inertia\Inertia;

class AttendanceController extends BaseController
{
    use AuthorizesRequests, ValidatesRequests;

    /**
     * Create a new controller instance.
     */
    /**
     * Create a new controller instance.
     */
    public function __construct(
        private AttendanceImportService $importService
    ) {
        // Authentication and permissions will be handled via middleware in routes
    }

    /**
     * Show the attendance upload page.
     * 
     * @return \Inertia\Response
     */
    public function upload()
    {
        // Get recent batches with error states
        $batches = AttendanceUploadBatch::query()
            ->with(['createdBy:id,name'])
            ->withCount('raws')
            ->latest()
            ->limit(10)
            ->get()
            ->map(fn ($batch) => [
                'id' => $batch->id,
                'filename' => $batch->file_name,
                'uploaded_at' => $batch->uploaded_at->format('Y-m-d H:i:s'),
                'total_rows' => $batch->total_records,
                'processed_rows' => $batch->processed_rows,
                'status' => $batch->status,
                'created_by' => $batch->createdBy->name,
                'has_errors' => $batch->status === 'failed',
                'error_message' => $batch->meta['error'] ?? null,
                'progress_percentage' => $batch->total_records > 0 
                    ? round(($batch->processed_rows / $batch->total_records) * 100) 
                    : 0
            ]);

        return Inertia::render('Attendance/Upload', [
            'batches' => $batches,
            'maxFileSize' => config('excel.max_file_size', 10240), // 10MB default
            'allowedTypes' => ['xlsx', 'xls', 'csv'],
            'errors' => session('errors'),
            'success' => session('success'),
            'canUpload' => auth()->user()->can('attendance.upload')
        ]);
    }

    /**
     * Import attendance file and create a batch.
     * 
     * @param UploadAttendanceRequest $request
     * @return \Illuminate\Http\RedirectResponse
     */
    public function import(UploadAttendanceRequest $request)
    {
        try {
            DB::beginTransaction();

            // Use service to handle import
            $batch = $this->importService->import(
                file: $request->file('file'),
                uploadedBy: auth()->id()
            );

            DB::commit();

            return redirect()
                ->route('attendance.raw.index', ['batch_id' => $batch->id])
                ->with('success', [
                    'message' => 'File uploaded successfully. Processing attendance records.',
                    'batch_id' => $batch->id
                ]);

        } catch (\Exception $e) {
            DB::rollBack();
            
            report($e); // Log the error

            return back()
                ->withErrors([
                    'file' => 'Failed to process file: ' . $e->getMessage()
                ])
                ->withInput();
        }
    }

    /**
     * Delete a batch and its associated records.
     * 
     * @param AttendanceUploadBatch $batch
     * @return \Illuminate\Http\RedirectResponse
     */
    public function deleteBatch(AttendanceUploadBatch $batch)
    {
        try {
            if ($batch->status === 'finalized') {
                throw new \Exception('Cannot delete finalized batch');
            }

            DB::beginTransaction();

            // Delete associated raw records first
            $batch->raws()->delete();
            
            // Delete the batch
            $batch->delete();

            DB::commit();

            return redirect()
                ->route('attendance.upload')
                ->with('success', ['message' => 'Batch deleted successfully']);

        } catch (\Exception $e) {
            DB::rollBack();
            
            report($e);

            return redirect()
                ->route('attendance.upload')
                ->withErrors([
                    'batch' => 'Failed to delete batch: ' . $e->getMessage()
                ]);
        }
    }
}
