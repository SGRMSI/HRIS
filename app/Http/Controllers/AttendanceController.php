<?php

namespace App\Http\Controllers;

use App\Http\Requests\UploadAttendanceRequest;
use App\Imports\AttendanceRawImport;
use App\Models\AttendanceUploadBatch;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;

class AttendanceController extends Controller
{
    /**
     * Show the attendance upload page.
     *
     * @return \Inertia\Response
     */
    public function upload()
    {
        return Inertia::render('Attendance/UploadPage', [
            'batches' => AttendanceUploadBatch::query()
                ->with('createdBy:id,name')
                ->latest()
                ->limit(10)
                ->get()
                ->map(fn ($batch) => [
                    'id' => $batch->id,
                    'filename' => $batch->filename,
                    'uploaded_at' => $batch->created_at->format('Y-m-d H:i:s'),
                    'total_rows' => $batch->total_rows,
                    'processed_rows' => $batch->processed_rows,
                    'status' => $batch->status,
                    'created_by' => $batch->createdBy,
                ])
        ]);
    }

    /**
     * Import attendance file and create a batch.
     *
     * @param  \App\Http\Requests\UploadAttendanceRequest  $request
     * @return \Illuminate\Http\RedirectResponse
     */
    public function import(UploadAttendanceRequest $request)
    {
        // Store the file
        $file = $request->file('file');
        $filename = $file->getClientOriginalName();
        $path = $file->store('attendance-imports');

        // Create batch record
        $batch = AttendanceUploadBatch::create([
            'filename' => $filename,
            'file_path' => $path,
            'status' => 'pending',
            'total_rows' => 0, // Will be updated after import
            'processed_rows' => 0,
            'created_by' => auth()->id()
        ]);

        try {
            // Import using queue
            Excel::queueImport(new AttendanceRawImport($batch), $path);

            return redirect()->back()->with('success', 'File uploaded successfully and is being processed.');
        } catch (\Exception $e) {
            // Clean up on failure
            Storage::delete($path);
            $batch->delete();

            return redirect()->back()->withErrors([
                'file' => 'Failed to process file: ' . $e->getMessage()
            ]);
        }
    }
}
