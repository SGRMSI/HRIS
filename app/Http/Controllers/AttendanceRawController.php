<?php

namespace App\Http\Controllers;

use App\Models\AttendanceRaw;
use App\Models\AttendanceUploadBatch;
use App\Models\Employee;
use App\Exports\AttendanceRawExport;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
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
        // Get batches with statistics
        $batches = AttendanceUploadBatch::query()
            ->with('uploadedBy:id,name')
            ->withCount('raws')
            ->latest('created_at')
            ->paginate(10)
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
}
