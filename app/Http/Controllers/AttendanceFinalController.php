<?php

namespace App\Http\Controllers;

use App\Exports\AttendanceExport;
use App\Models\Attendance;
use App\Models\Company;
use App\Models\Employee;
use App\Services\ScheduleResolver;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;

class AttendanceFinalController extends Controller
{
    protected $scheduleResolver;

    public function __construct(ScheduleResolver $scheduleResolver) 
    {
        $this->scheduleResolver = $scheduleResolver;
    }

    /**
     * Display final attendance records with filtering and pagination
     *
     * @param Request $request
     * @return \Inertia\Response
     */
    public function index(Request $request)
    {
        // Get companies for filter
        $companies = Company::select(['company_id as id', 'name'])->get();
        
        // Get employees filtered by company if selected
        $employees = Employee::query()
            ->select(['employee_id as id', 'first_name', 'last_name', 'id_number', 'company_id'])
            ->when($request->company_id, fn($q) => $q->where('company_id', $request->company_id))
            ->orderBy('first_name')
            ->get()
            ->map(fn($emp) => [
                'id' => $emp->id,
                'name' => "{$emp->first_name} {$emp->last_name} ({$emp->id_number})",
                'company_id' => $emp->company_id
            ]);
        
        $query = Attendance::with(['employee.department', 'employee.company', 'shift', 'createdBy', 'approvedBy'])
            ->when($request->company_id, function ($q) use ($request) {
                $q->whereHas('employee', fn ($q) => $q->where('company_id', $request->company_id));
            })
            ->when($request->employee_id, function ($q) use ($request) {
                $q->where('employee_id', $request->employee_id);
            })
            ->when($request->search, function ($query, $search) {
                $query->whereHas('employee', function ($q) use ($search) {
                    $q->where('id_number', 'like', "%{$search}%")
                      ->orWhere('first_name', 'like', "%{$search}%")
                      ->orWhere('last_name', 'like', "%{$search}%");
                });
            })
            ->when($request->date_from, fn ($q) => $q->where('date', '>=', $request->date_from))
            ->when($request->date_to, fn ($q) => $q->where('date', '<=', $request->date_to))
            ->when($request->status, fn ($q) => $q->where('status', $request->status));

        // Handle export data request
        if ($request->wantsJson()) {
            return Inertia::render('Attendance/FinalIndex', [
                'exportData' => $query->get()->map->toExportArray()
            ]);
        }

        $attendances = $query->latest('date')
            ->paginate($request->per_page ?? 15)
            ->through(function ($attendance) {
                return [
                    'id' => $attendance->attendance_id,
                    'employee' => [
                        'id' => $attendance->employee->employee_id,
                        'name' => "{$attendance->employee->first_name} {$attendance->employee->last_name}",
                        'id_number' => $attendance->employee->id_number,
                        'company' => $attendance->employee->company->name ?? null,
                        'department' => $attendance->employee->department->name ?? null,
                    ],
                    'date' => $attendance->date->format('Y-m-d'),
                    'shift' => $attendance->shift ? [
                        'name' => $attendance->shift->name,
                        'time_in' => $attendance->shift->getAttributes()['time_in'],
                        'time_out' => $attendance->shift->getAttributes()['time_out'],
                    ] : null,
                    'clock_in' => $attendance->clock_in?->format('H:i:s'),
                    'clock_out' => $attendance->clock_out?->format('H:i:s'),
                    'break_in' => $attendance->break_in?->format('H:i:s'),
                    'break_out' => $attendance->break_out?->format('H:i:s'),
                    'total_hours' => number_format((float) $attendance->total_hours ?? 0, 2),
                    'late_minutes' => $attendance->late_minutes,
                    'overtime_hours' => number_format((float) $attendance->overtime_hours ?? 0, 2),
                    'undertime_hours' => number_format((float) $attendance->undertime_hours ?? 0, 2),
                    'status' => $attendance->status,
                    'remarks' => $attendance->remarks,
                    'approved_by' => $attendance->approvedBy?->name,
                    'approved_at' => $attendance->approved_at?->format('Y-m-d H:i:s'),
                    'can_edit' => !$attendance->approved_by,
                    'can_approve' => !$attendance->approved_by && $attendance->requires_approval
                ];
            });

        return Inertia::render('Attendance/FinalIndex', [
            'attendances' => $attendances,
            'filters' => $request->only(['search', 'date_from', 'date_to', 'status', 'company_id', 'employee_id']),
            'companies' => $companies,
            'employees' => $employees,
            'statuses' => [
                ['value' => 'present', 'label' => 'Present'],
                ['value' => 'absent', 'label' => 'Absent'],
                ['value' => 'leave', 'label' => 'On Leave'],
                ['value' => 'holiday', 'label' => 'Holiday']
            ],
            'can' => [
                'export' => Auth::user()->can('export attendances'),
                'approve' => Auth::user()->can('approve attendances'),
                'edit' => Auth::user()->can('edit attendances')
            ]
        ]);
    }

    /**
     * Display detailed attendance record
     *
     * @param Attendance $attendance
     * @return \Inertia\Response
     */
    public function show(Attendance $attendance)
    {
        $attendance->load(['employee.department', 'shift', 'createdBy', 'approvedBy', 'revisionHistory']);
        
        // Get schedule information for the date
        $schedule = $this->scheduleResolver->getScheduleForDate(
            $attendance->employee_id,
            $attendance->date
        );

        return Inertia::render('Attendance/FinalShow', [
            'attendance' => [
                'id' => $attendance->id,
                'employee' => [
                    'id' => $attendance->employee->id,
                    'name' => $attendance->employee->full_name,
                    'department' => $attendance->employee->department->name,
                    'position' => $attendance->employee->position->name ?? null
                ],
                'date' => $attendance->date,
                'shift' => $attendance->shift ? [
                    'name' => $attendance->shift->name,
                    'start' => $attendance->shift->start_time,
                    'end' => $attendance->shift->end_time,
                    'break_start' => $attendance->shift->break_start,
                    'break_end' => $attendance->shift->break_end,
                ] : null,
                'schedule' => $schedule,
                'times' => [
                    'clock_in' => $attendance->clock_in?->format('H:i:s'),
                    'break_out' => $attendance->break_out?->format('H:i:s'),
                    'break_in' => $attendance->break_in?->format('H:i:s'),
                    'clock_out' => $attendance->clock_out?->format('H:i:s')
                ],
                'computations' => [
                    'total_hours' => number_format((float) $attendance->total_hours ?? 0, 2),
                    'regular_hours' => number_format((float) $attendance->regular_hours ?? 0, 2),
                    'overtime_hours' => number_format((float) $attendance->overtime_hours ?? 0, 2),
                    'undertime_minutes' => $attendance->undertime_minutes,
                    'break_minutes' => $attendance->break_minutes,
                    'late_minutes' => $attendance->late_minutes
                ],
                'status' => $attendance->status,
                'remarks' => $attendance->remarks,
                'meta' => $attendance->meta,
                'approved_by' => $attendance->approvedBy?->name,
                'approved_at' => $attendance->approved_at?->format('Y-m-d H:i:s'),
                'created_by' => $attendance->createdBy?->name,
                'created_at' => $attendance->created_at->format('Y-m-d H:i:s'),
                'history' => $attendance->revisionHistory->map(fn($revision) => [
                    'id' => $revision->id,
                    'user' => $revision->userResponsible()?->name ?? 'System',
                    'changes' => $revision->oldValue(),
                    'timestamp' => $revision->created_at->format('Y-m-d H:i:s')
                ])
            ],
            'can' => [
                'edit' => !$attendance->approved_by && Auth::user()->can('edit attendances'),
                'approve' => !$attendance->approved_by && Auth::user()->can('approve attendances')
            ]
        ]);
    }

    /**
     * Update a specific attendance record
     *
     * @param Request $request
     * @param Attendance $attendance
     * @return \Illuminate\Http\RedirectResponse
     */
    public function update(Request $request, Attendance $attendance)
    {
        abort_if($attendance->approved_by, 403, 'Cannot edit approved attendance records.');
        
        if (!Auth::user()->can('edit attendances')) {
            abort(403);
        }

        $validated = $request->validate([
            'clock_in' => 'required|date_format:Y-m-d H:i:s',
            'break_out' => 'nullable|date_format:Y-m-d H:i:s|after:clock_in',
            'break_in' => 'nullable|date_format:Y-m-d H:i:s|after:break_out',
            'clock_out' => 'required|date_format:Y-m-d H:i:s|after:clock_in',
            'status' => 'required|string|in:present,absent,leave,holiday',
            'remarks' => 'nullable|string|max:500'
        ]);

        try {
            DB::beginTransaction();

            // Record before state for audit
            $oldState = $attendance->getAttributes();

            // Update record
            $attendance->update(array_merge($validated, [
                'approved_by' => null,
                'approved_at' => null,
                'updated_by' => Auth::id()
            ]));

            // Record the changes in activity log
            activity()
                ->performedOn($attendance)
                ->causedBy(Auth::user())
                ->withProperties([
                    'old' => $oldState,
                    'new' => $attendance->getAttributes(),
                    'ip' => $request->ip()
                ])
                ->log('attendance.updated');

            DB::commit();

            return back()->with('success', 'Attendance record updated successfully.');

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to update attendance', [
                'attendance_id' => $attendance->id,
                'error' => $e->getMessage()
            ]);

            return back()->withErrors(['update' => 'Failed to update attendance record.']);
        }
    }

    /**
     * Approve multiple attendance records
     *
     * @param Request $request
     * @return \Illuminate\Http\RedirectResponse
     */
    public function approve(Request $request)
    {
        if (!Auth::user()->can('approve attendances')) {
            abort(403);
        }

        $validated = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'required|exists:attendances,id'
        ]);

        try {
            DB::beginTransaction();

            $records = Attendance::whereIn('id', $validated['ids'])
                ->whereNull('approved_by')
                ->with('employee.user')
                ->get();

            foreach ($records as $attendance) {
                $attendance->update([
                    'approved_by' => Auth::id(),
                    'approved_at' => now()
                ]);

                // Log the approval
                activity()
                    ->performedOn($attendance)
                    ->causedBy(Auth::user())
                    ->log('attendance.approved');

                // Send notification if employee has associated user account
                if ($attendance->employee->user) {
                    Mail::send('emails.attendance.approved', [
                        'attendance' => $attendance
                    ], function ($message) use ($attendance) {
                        $message->to($attendance->employee->user->email)
                            ->subject('Attendance Record Approved');
                    });
                }
            }

            DB::commit();

            return back()->with('success', [
                'message' => 'Selected attendance records approved successfully.',
                'count' => count($records)
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to approve attendance records', [
                'ids' => $validated['ids'],
                'error' => $e->getMessage()
            ]);

            return back()->withErrors(['approve' => 'Failed to approve attendance records.']);
        }
    }

    /**
     * Export attendance records to Excel
     *
     * @param Request $request
     * @return mixed
     */
    public function export(Request $request)
    {
        if (!Auth::user()->can('export attendances')) {
            abort(403);
        }

        $request->validate([
            'date_from' => 'required|date',
            'date_to' => 'required|date|after_or_equal:date_from',
            'company_id' => 'nullable|exists:companies,company_id',
            'status' => 'nullable|string'
        ]);

        $filename = sprintf(
            'attendance_%s_to_%s.xlsx',
            Carbon::parse($request->date_from)->format('Y-m-d'),
            Carbon::parse($request->date_to)->format('Y-m-d')
        );

        try {
            return Excel::download(
                new AttendanceExport($request->only([
                    'date_from',
                    'date_to',
                    'company_id',
                    'status'
                ])),
                $filename
            );
        } catch (\Exception $e) {
            Log::error('Failed to export attendance', [
                'filters' => $request->all(),
                'error' => $e->getMessage()
            ]);

            throw $e; // Let the exception handler deal with it
        }
    }
}