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
        $query = AttendanceRaw::query()
            ->with(['batch', 'employee'])
            ->when($request->batch_id, function ($query, $batchId) {
                $query->where('batch_id', $batchId);
            })
            ->when($request->employee_id, function ($query, $employeeId) {
                $query->where('employee_id', $employeeId);
            })
            ->when($request->date_from, function ($query, $dateFrom) {
                $query->whereDate('raw_date', '>=', $dateFrom);
            })
            ->when($request->date_to, function ($query, $dateTo) {
                $query->whereDate('raw_date', '<=', $dateTo);
            })
            ->when($request->search, function ($query, $search) {
                $query->whereHas('employee', function ($q) use ($search) {
                    $q->where('employee_number', 'like', "%{$search}%")
                      ->orWhere('name', 'like', "%{$search}%");
                });
            });

        $rawRecords = $query->latest('raw_date')
            ->paginate($request->per_page ?? 15)
            ->withQueryString();

        // Get batches for filter dropdown
        $batches = AttendanceUploadBatch::select('id', 'file_name', 'uploaded_at')
            ->latest()
            ->get();

        // Get employees for filter dropdown
        $employees = Employee::select('id', 'name', 'employee_number')
            ->orderBy('name')
            ->get();

        return Inertia::render('Attendance/RawIndex', [
            'records' => $rawRecords,
            'filters' => [
                'batches' => $batches,
                'employees' => $employees,
                'date_from' => $request->date_from,
                'date_to' => $request->date_to,
                'batch_id' => $request->batch_id,
                'employee_id' => $request->employee_id,
                'search' => $request->search,
            ]
        ]);
    }

    /**
     * Display the specified attendance raw record
     *
     * @param AttendanceRaw $raw
     * @return \Inertia\Response
     */
    public function show(AttendanceRaw $raw)
    {
        $raw->load([
            'batch',
            'employee.department',
            'employee.position',
            'employee.schedules' => function ($query) use ($raw) {
                $query->where('date_start', '<=', $raw->raw_date)
                    ->where(function ($q) use ($raw) {
                        $q->whereNull('date_end')
                          ->orWhere('date_end', '>=', $raw->raw_date);
                    });
            }
        ]);

        // Get related records for the same day
        $relatedRecords = AttendanceRaw::where('employee_id', $raw->employee_id)
            ->whereDate('raw_date', Carbon::parse($raw->raw_date)->toDateString())
            ->where('id', '!=', $raw->id)
            ->get();

        return Inertia::render('Attendance/RawShow', [
            'record' => $raw,
            'relatedRecords' => $relatedRecords
        ]);
    }

    /**
     * Export filtered raw attendance records to Excel
     *
     * @param Request $request
     * @return \Symfony\Component\HttpFoundation\BinaryFileResponse
     */
    public function export(Request $request)
    {
        $request->validate([
            'batch_id' => 'nullable|exists:attendance_upload_batches,id',
            'employee_id' => 'nullable|exists:employees,id',
            'date_from' => 'nullable|date',
            'date_to' => 'nullable|date|after_or_equal:date_from',
        ]);

        $query = AttendanceRaw::query()
            ->with(['batch', 'employee'])
            ->when($request->batch_id, function ($query, $batchId) {
                $query->where('batch_id', $batchId);
            })
            ->when($request->employee_id, function ($query, $employeeId) {
                $query->where('employee_id', $employeeId);
            })
            ->when($request->date_from, function ($query, $dateFrom) {
                $query->whereDate('raw_date', '>=', $dateFrom);
            })
            ->when($request->date_to, function ($query, $dateTo) {
                $query->whereDate('raw_date', '<=', $dateTo);
            })
            ->orderBy('raw_date');

        return Excel::download(
            new AttendanceRawExport($query), 
            'attendance_raw_' . now()->format('Y-m-d_His') . '.xlsx'
        );
    }
}
