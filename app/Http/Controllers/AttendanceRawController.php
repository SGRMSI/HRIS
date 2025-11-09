<?php

namespace App\Http\Controllers;

use App\Models\AttendanceRaw;
use App\Models\AttendanceUploadBatch;
use App\Models\Employee;
use App\Exports\AttendanceRawExport;
use App\Imports\AttendanceRawImport;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;

class AttendanceRawController extends Controller
{
    /**
     * Display a listing of attendance raw records
     *
     * @param Request $request
     * @return \Inertia\Response
     */
    public function index(Request $request)
    {
        // Extract filters
        $filters = $request->only([
            'search',
            'status',
            'uploaded_by',
            'date_from',
            'date_to',
            'sort_by',
            'sort_direction',
        ]);

        // Get unique uploaders for filter dropdown
        $uploaders = \App\Models\User::whereIn('id', function ($query) {
            $query->select('uploaded_by')
                ->from('attendance_upload_batches')
                ->whereNotNull('uploaded_by')
                ->distinct();
        })->select('id', 'name')->get();

        // Build query with filters
        $query = AttendanceUploadBatch::query()
            ->with('uploadedBy:id,name')
            ->withCount('raws');

        // Apply filters
        if (!empty($filters['search'])) {
            $query->where('filename', 'like', '%' . $filters['search'] . '%');
        }

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (!empty($filters['uploaded_by'])) {
            $query->where('uploaded_by', $filters['uploaded_by']);
        }

        if (!empty($filters['date_from'])) {
            $query->whereDate('created_at', '>=', $filters['date_from']);
        }

        if (!empty($filters['date_to'])) {
            $query->whereDate('created_at', '<=', $filters['date_to']);
        }

        // Apply sorting
        $sortBy = $filters['sort_by'] ?? 'created_at';
        $sortDirection = $filters['sort_direction'] ?? 'desc';
        
        // Validate sort fields
        $allowedSortFields = ['created_at', 'filename', 'status', 'total_rows'];
        if (!in_array($sortBy, $allowedSortFields)) {
            $sortBy = 'created_at';
        }
        
        $query->orderBy($sortBy, $sortDirection);

        // Get statistics for dashboard
        $stats = [
            'total_batches' => AttendanceUploadBatch::count(),
            'total_records' => AttendanceUploadBatch::sum('total_rows'),
            'by_status' => AttendanceUploadBatch::select('status', DB::raw('count(*) as count'))
                ->groupBy('status')
                ->get()
                ->keyBy('status'),
            'recent_uploads' => AttendanceUploadBatch::where('created_at', '>=', now()->subDays(7))->count(),
        ];

        $batches = $query->paginate(10)
            ->withQueryString()
            ->through(fn ($batch) => [
                'id' => $batch->batch_id,
                'filename' => $batch->filename,
                'uploaded_at' => $batch->created_at->format('Y-m-d H:i:s'),
                'uploaded_by' => $batch->uploadedBy?->name ?? 'Unknown',
                'total_records' => $batch->total_rows,
                'raws_count' => $batch->raws_count,
                'status' => $batch->status,
            ]);

        return Inertia::render('Attendance/RawIndex', [
            'batches' => $batches,
            'filters' => $filters,
            'uploaders' => $uploaders,
            'stats' => $stats,
            'statuses' => [
                ['value' => 'uploaded', 'label' => 'Uploaded'],
                ['value' => 'processing', 'label' => 'Processing'],
                ['value' => 'processed', 'label' => 'Processed'],
                ['value' => 'failed', 'label' => 'Failed'],
                ['value' => 'finalized', 'label' => 'Finalized'],
            ],
        ]);
    }

    /**
     * Display raw records for a specific batch
     *
     * @param int $batchId
     * @param Request $request
     * @return \Inertia\Response
     */
    public function show($batchId, Request $request)
    {
        $batch = AttendanceUploadBatch::with('uploadedBy:id,name')
            ->findOrFail($batchId);

        $query = AttendanceRaw::query()
            ->where('batch_id', $batchId)
            ->with('employee:employee_id,id_number,first_name,last_name')
            ->when($request->search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('ac_no', 'like', "%{$search}%")
                      ->orWhere('name', 'like', "%{$search}%");
                });
            })
            ->when($request->has_employee, function ($query) use ($request) {
                if ($request->has_employee === 'matched') {
                    $query->whereNotNull('employee_id');
                } elseif ($request->has_employee === 'unmatched') {
                    $query->whereNull('employee_id');
                }
            });

        $records = $query->latest('time_log')
            ->paginate($request->per_page ?? 50)
            ->withQueryString()
            ->through(fn ($record) => [
                'id' => $record->raw_id,
                'ac_no' => $record->ac_no,
                'name' => $record->name,
                'time_log' => $record->time_log?->format('Y-m-d H:i:s'),
                'state' => $record->state,
                'new_state' => $record->new_state,
                'exception' => $record->exception,
                'operation' => $record->operation,
                'employee' => $record->employee ? [
                    'id' => $record->employee->employee_id,
                    'number' => $record->employee->id_number,
                    'name' => $record->employee->first_name . ' ' . $record->employee->last_name,
                ] : null,
            ]);

        // Statistics
        $stats = [
            'total' => AttendanceRaw::where('batch_id', $batchId)->count(),
            'matched' => AttendanceRaw::where('batch_id', $batchId)->whereNotNull('employee_id')->count(),
            'unmatched' => AttendanceRaw::where('batch_id', $batchId)->whereNull('employee_id')->count(),
        ];

        return Inertia::render('Attendance/RawShow', [
            'batch' => [
                'id' => $batch->batch_id,
                'filename' => $batch->filename,
                'uploaded_at' => $batch->created_at->format('Y-m-d H:i:s'),
                'uploaded_by' => $batch->uploadedBy?->name ?? 'Unknown',
                'total_records' => $batch->total_rows,
                'status' => $batch->status,
            ],
            'records' => $records,
            'stats' => $stats,
            'filters' => [
                'search' => $request->search,
                'has_employee' => $request->has_employee,
            ],
        ]);
    }

    /**
     * Export filtered raw attendance records to Excel
     *
     * @param int $batchId
     * @return \Symfony\Component\HttpFoundation\BinaryFileResponse
     */
    public function export($batchId)
    {
        $batch = AttendanceUploadBatch::findOrFail($batchId);

        $records = AttendanceRaw::query()
            ->where('batch_id', $batchId)
            ->with('employee:employee_id,id_number,first_name,last_name')
            ->orderBy('time_log')
            ->get();

        return Excel::download(
            new AttendanceRawExport($records, $batch), 
            'attendance_raw_' . $batch->filename . '_' . now()->format('Y-m-d_His') . '.xlsx'
        );
    }

    /**
     * Handle file upload and import
     *
     * @param Request $request
     * @return \Illuminate\Http\RedirectResponse
     */
    public function import(Request $request)
    {
        $request->validate([
            'file' => ['required', 'file', 'mimes:xlsx,xls,csv', 'max:10240'], // 10MB max
        ]);

        try {
            DB::beginTransaction();

            $file = $request->file('file');
            $originalName = $file->getClientOriginalName();
            $timestamp = now()->format('YmdHis');
            $filename = "{$timestamp}_{$originalName}";

            // Store the file
            $path = $file->storeAs('attendance-imports', $filename);

            // Create batch record
            $batch = AttendanceUploadBatch::create([
                'filename' => $originalName,
                'file_path' => $path,
                'total_rows' => 0,
                'processed_rows' => 0,
                'status' => 'importing',
                'created_by' => Auth::id(),
            ]);

            // Import the Excel data
            $import = new AttendanceRawImport($batch->batch_id);
            Excel::import($import, $file);

            // Update batch with row count
            $batch->update([
                'total_rows' => $import->getRowCount(),
                'status' => 'imported',
            ]);

            // Log activity
            activity()
                ->causedBy(Auth::user())
                ->performedOn($batch)
                ->withProperties(['filename' => $originalName, 'rows' => $import->getRowCount()])
                ->log('Uploaded attendance file');

            DB::commit();

            return redirect()
                ->route('attendance.raw.index')
                ->with('success', "File uploaded successfully! {$import->getRowCount()} records imported.");

        } catch (\Exception $e) {
            DB::rollBack();

            return redirect()
                ->back()
                ->withErrors(['file' => 'Failed to import file: ' . $e->getMessage()]);
        }
    }

    /**
     * Delete a batch and all related records
     *
     * @param int $batchId
     * @return \Illuminate\Http\RedirectResponse
     */
    public function destroy($batchId)
    {
        try {
            DB::beginTransaction();

            $batch = AttendanceUploadBatch::findOrFail($batchId);

            // Prevent deletion of finalized batches
            if ($batch->status === 'finalized') {
                return redirect()
                    ->route('attendance.raw.index')
                    ->withErrors(['delete' => 'Cannot delete finalized batches. Finalized data is locked for audit purposes.']);
            }

            // Delete the physical file
            if ($batch->file_path && Storage::exists($batch->file_path)) {
                Storage::delete($batch->file_path);
            }

            // Explicitly delete related records (SQLite may not enforce cascade)
            
            // First, get all processed records to find dates and employees
            $processedRecords = DB::table('attendance_processed')
                ->where('batch_id', $batch->batch_id)
                ->select('employee_id', 'date')
                ->get();
            
            // Delete final attendance records that match these employee_id and date combinations
            foreach ($processedRecords as $record) {
                DB::table('attendances')
                    ->where('employee_id', $record->employee_id)
                    ->where('date', $record->date)
                    ->delete();
            }
            
            // Delete processed records
            DB::table('attendance_processed')
                ->where('batch_id', $batch->batch_id)
                ->delete();
            
            // Delete raw records
            DB::table('attendance_raws')
                ->where('batch_id', $batch->batch_id)
                ->delete();
            
            $filename = $batch->filename;
            
            // Log activity before deletion
            activity()
                ->causedBy(Auth::user())
                ->performedOn($batch)
                ->withProperties(['filename' => $filename])
                ->log('Deleted attendance batch');

            $batch->delete();

            DB::commit();

            return redirect()
                ->route('attendance.raw.index')
                ->with('success', "Batch '{$filename}' and all related records have been deleted.");

        } catch (\Exception $e) {
            DB::rollBack();

            return redirect()
                ->back()
                ->withErrors(['delete' => 'Failed to delete batch: ' . $e->getMessage()]);
        }
    }
}
