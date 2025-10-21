<?php

namespace App\Http\Controllers;

use App\Models\AttendanceProcessed;
use App\Models\Employee;
use App\Services\Attendance\AttendanceProcessService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AttendanceProcessedController extends Controller
{
    protected $processService;

    public function __construct(AttendanceProcessService $processService)
    {
        $this->processService = $processService;
    }

    /**
     * Display a listing of processed attendance records.
     */
    public function index(Request $request)
    {
        $filters = $request->only([
            'employee_id',
            'date_from',
            'date_to',
            'status'
        ]);

        $query = AttendanceProcessed::with('employee:id,first_name,last_name')
            ->select([
                'id', 
                'employee_id', 
                'date', 
                'clock_in',
                'break_out',
                'break_in', 
                'clock_out',
                'total_hours',
                'break_minutes',
                'status',
                'meta'
            ])
            ->orderBy('date', 'desc')
            ->orderBy('employee_id');

        if ($filters['employee_id'] ?? null) {
            $query->where('employee_id', $filters['employee_id']);
        }

        if ($filters['date_from'] ?? null) {
            $query->where('date', '>=', $filters['date_from']);
        }

        if ($filters['date_to'] ?? null) {
            $query->where('date', '<=', $filters['date_to']);
        }

        if ($filters['status'] ?? null) {
            $query->where('status', $filters['status']);
        }

        return Inertia::render('Attendance/ProcessedIndex', [
            'processed' => $query->paginate(25)
                ->through(fn ($record) => [
                    'id' => $record->id,
                    'employee' => [
                        'id' => $record->employee->id,
                        'name' => $record->employee->first_name . ' ' . $record->employee->last_name,
                    ],
                    'date' => $record->date,
                    'clock_in' => $record->clock_in,
                    'break_out' => $record->break_out,
                    'break_in' => $record->break_in,
                    'clock_out' => $record->clock_out,
                    'total_hours' => $record->total_hours,
                    'break_minutes' => $record->break_minutes,
                    'status' => $record->status,
                    'meta' => $record->meta,
                ]),
            'filters' => $filters,
            'employees' => Employee::select(['id', 'first_name', 'last_name'])
                ->orderBy('last_name')
                ->orderBy('first_name')
                ->get()
                ->map(fn($emp) => [
                    'id' => $emp->id,
                    'name' => $emp->first_name . ' ' . $emp->last_name,
                ]),
        ]);
    }

    /**
     * Process the selected records to final attendance.
     */
    public function finalize(Request $request)
    {
        $request->validate([
            'records' => ['required', 'array'],
            'records.*' => ['required', 'exists:attendance_processed,id'],
        ]);

        // TODO: Implement finalization logic
        // This will be implemented when we work on the final attendance feature

        return back()->with('success', 'Records have been pushed to final attendance.');
    }
}
