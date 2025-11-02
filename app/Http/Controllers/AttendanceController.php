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
        // Get recent batches
        $batches = AttendanceUploadBatch::query()
            ->with(['uploadedBy:id,name'])
            ->latest('created_at')
            ->paginate(10)
            ->through(fn ($batch) => [
                'id' => $batch->batch_id,
                'filename' => $batch->filename,
                'uploaded_at' => $batch->created_at->format('Y-m-d H:i:s'),
                'uploaded_by' => $batch->uploadedBy->name ?? 'Unknown',
                'total_records' => $batch->total_rows,
                'status' => $batch->status,
            ]);

        return Inertia::render('Attendance/Upload', [
            'batches' => $batches,
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
