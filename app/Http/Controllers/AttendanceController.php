<?php

namespace App\Http\Controllers;

use App\Http\Requests\UploadAttendanceRequest;
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
     * Show the attendance upload page.
     * 
     * @return \Inertia\Response
     */
    public function upload()
    {
        // Get recent batches
        $batches = AttendanceUploadBatch::query()
            ->with('uploadedBy')
            ->latest('created_at')
            ->paginate(10)
            ->through(fn ($batch) => [
                'id' => $batch->batch_id,
                'filename' => $batch->filename,
                'uploaded_at' => $batch->created_at->format('Y-m-d H:i:s'),
                'uploaded_by' => $batch->uploadedBy?->name ?? 'Unknown',
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

            $file = $request->file('file');
            $filename = $file->getClientOriginalName();
            
            // Check if filename already exists
            $existingBatch = AttendanceUploadBatch::where('filename', $filename)->first();
            if ($existingBatch) {
                return back()
                    ->withErrors([
                        'file' => 'A file with this name has already been uploaded. Please rename the file or choose a different one.'
                    ])
                    ->withInput();
            }
            
            // Store the file
            $filePath = $file->store('attendance/uploads', 'local');
            
            // Create the batch record
            $batch = AttendanceUploadBatch::create([
                'filename' => $filename,
                'file_path' => $filePath,
                'total_rows' => 0,
                'processed_rows' => 0,
                'status' => 'pending',
                'remarks' => $request->remarks,
                'created_by' => auth()->id(),
            ]);

            // Import the Excel file using Laravel Excel
            $import = new \App\Imports\AttendanceRawImport($batch->batch_id);
            \Maatwebsite\Excel\Facades\Excel::import($import, $file);
            
            // Update batch with actual row count
            $batch->update([
                'total_rows' => $import->getRowCount(),
                'status' => 'uploaded'
            ]);

            DB::commit();

            return redirect()
                ->route('attendance.upload')
                ->with('success', 'File uploaded successfully. ' . $import->getRowCount() . ' records imported.');

        } catch (\Exception $e) {
            DB::rollBack();
            
            \Illuminate\Support\Facades\Log::error('Attendance import failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

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
