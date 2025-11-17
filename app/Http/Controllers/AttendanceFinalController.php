<?php

namespace App\Http\Controllers;

use App\Exports\AttendanceExport;
use App\Models\Attendance;
use App\Models\Company;
use App\Models\Employee;
use App\Models\EmployeeSchedule;
use App\Models\EmployeeLeave;
use App\Services\AttendanceCalculationService;
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
    protected $attendanceCalculationService;

    public function __construct(
        ScheduleResolver $scheduleResolver,
        AttendanceCalculationService $attendanceCalculationService
    ) {
        $this->scheduleResolver = $scheduleResolver;
        $this->attendanceCalculationService = $attendanceCalculationService;
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
            ->when($request->date_from, fn ($q) => $q->whereDate('date', '>=', $request->date_from))
            ->when($request->date_to, fn ($q) => $q->whereDate('date', '<=', $request->date_to))
            ->when($request->status, fn ($q) => $q->where('status', $request->status))
            // Exclude 'absent' status - those are shown in the Absences table
            ->where('status', '!=', 'absent');

        // Handle request for all pending IDs (for bulk selection across pages)
        if ($request->get_all_pending_ids) {
            $pendingIds = (clone $query)
                ->whereNull('approved_by')
                ->pluck('attendance_id')
                ->toArray();
            
            return Inertia::render('Attendance/FinalIndex', [
                'pendingIds' => $pendingIds,
            ]);
        }

        // Handle request for all absence IDs (for bulk selection across pages)
        if ($request->get_all_absence_ids) {
            $absencesCollection = $this->calculateAbsences($request);
            $allAbsenceIds = $absencesCollection
                ->filter(fn($a) => $a['can_approve'])
                ->map(fn($a) => [
                    'employee_id' => $a['employee_id'],
                    'date' => $a['date'],
                    'shift_id' => $a['shift_id']
                ])
                ->values()
                ->toArray();
            
            return Inertia::render('Attendance/FinalIndex', [
                'allAbsenceIds' => $allAbsenceIds,
            ]);
        }

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
                    'break_minutes' => $attendance->break_minutes,
                    'total_hours' => $attendance->total_hours,
                    'total_minutes' => $attendance->total_minutes,
                    'late_minutes' => $attendance->late_minutes,
                    'overtime_hours' => number_format((float) $attendance->overtime_hours ?? 0, 2),
                    'undertime_hours' => number_format((float) $attendance->undertime_hours ?? 0, 2),
                    'status' => $attendance->status,
                    'is_holiday' => $attendance->holiday_id !== null,
                    'remarks' => $attendance->remarks,
                    'approved_by' => $attendance->approvedBy?->name,
                    'approved_at' => $attendance->approved_at?->format('Y-m-d H:i:s'),
                    'can_edit' => !$attendance->approved_by,
                    'can_approve' => !$attendance->approved_by
                ];
            });

        // Count total pending approvals - all unapproved records
        $totalPendingCount = Attendance::whereNull('approved_by')->count();

        // Also count filtered pending (respects current filters)
        $filteredPendingCount = (clone $query)
            ->whereNull('approved_by')
            ->count();

        // Calculate statistics for dashboard - using same filters as main query
        $statsQuery = Attendance::query()
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
            ->when($request->date_from, fn($q) => $q->whereDate('date', '>=', $request->date_from))
            ->when($request->date_to, fn($q) => $q->whereDate('date', '<=', $request->date_to))
            ->when($request->status, fn($q) => $q->where('status', $request->status))
            // Exclude 'absent' status from stats - those are counted separately in absences
            ->where('status', '!=', 'absent');

        // Calculate absences based on schedules
        $absencesCollection = $this->calculateAbsences($request);
        
        // Manual pagination for absences
        $absencesPage = $request->get('absences_page', 1);
        $absencesPerPage = 10;
        $absencesOffset = ($absencesPage - 1) * $absencesPerPage;
        
        $absences = new \Illuminate\Pagination\LengthAwarePaginator(
            $absencesCollection->slice($absencesOffset, $absencesPerPage)->values(),
            $absencesCollection->count(),
            $absencesPerPage,
            $absencesPage,
            ['path' => $request->url(), 'query' => $request->query(), 'pageName' => 'absences_page']
        );

        // Get leaves data
        $leavesQuery = EmployeeLeave::with(['employee.department', 'employee.company', 'approvedBy'])
            ->where('status', 'approved')
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
            ->when($request->date_from, function ($q) use ($request) {
                $q->where(function ($query) use ($request) {
                    $query->whereDate('date_from', '<=', $request->date_to ?? now())
                          ->whereDate('date_to', '>=', $request->date_from);
                });
            })
            ->when($request->date_to && !$request->date_from, function ($q) use ($request) {
                $q->where(function ($query) use ($request) {
                    $query->whereDate('date_from', '<=', $request->date_to)
                          ->whereDate('date_to', '>=', $request->date_to);
                });
            })
            ->latest('date_from');

        $leaves = $leavesQuery->paginate(10, ['*'], 'leaves_page')
            ->through(function ($leave) {
                return [
                    'id' => $leave->leave_id,
                    'employee' => [
                        'id' => $leave->employee->employee_id,
                        'name' => $leave->employee->first_name . ' ' . $leave->employee->last_name,
                        'id_number' => $leave->employee->id_number,
                        'department' => $leave->employee->department->name ?? 'N/A',
                        'company' => $leave->employee->company->name ?? 'N/A',
                    ],
                    'leave_type' => $leave->type,
                    'date_start' => $leave->date_from->format('Y-m-d'),
                    'date_end' => $leave->date_to->format('Y-m-d'),
                    'period' => $leave->date_from->format('M d, Y') . ' - ' . $leave->date_to->format('M d, Y'),
                    'days_count' => $leave->days_count,
                    'status' => $leave->status,
                    'has_document' => !empty($leave->document_path),
                    'approved_by' => $leave->approvedBy?->name,
                ];
            });

        $stats = [
            'total' => (clone $statsQuery)->count(),
            'present' => (clone $statsQuery)->where('status', 'present')->count(),
            'late' => (clone $statsQuery)->where('status', 'late')->count(),
            'undertime' => (clone $statsQuery)->where('status', 'undertime')->count(),
            'absent' => $absencesCollection->count(),
            'on_leave' => $leavesQuery->count(),
            'pending_approval' => (clone $statsQuery)->whereNull('approved_by')->count(),
            'pending_absences' => $absencesCollection->where('can_approve', true)->count(),
            'approved' => (clone $statsQuery)->whereNotNull('approved_by')->count(),
        ];

        return Inertia::render('Attendance/FinalIndex', [
            'attendances' => $attendances,
            'absences' => $absences,
            'leaves' => $leaves,
            'stats' => $stats,
            'pendingCount' => $totalPendingCount, // Total pending in entire system
            'filteredPendingCount' => $filteredPendingCount, // Pending with current filters
            'filters' => $request->only(['search', 'date_from', 'date_to', 'status', 'company_id', 'employee_id']),
            'companies' => $companies,
            'employees' => $employees,
            'statuses' => [
                ['value' => 'present', 'label' => 'Present'],
                ['value' => 'late', 'label' => 'Late'],
                ['value' => 'undertime', 'label' => 'Undertime']
            ],
            'can' => [
                'export' => Auth::user()->can('export attendances'),
                'approve' => Auth::user()->can('approve attendances'),
                'edit' => Auth::user()->can('edit attendances')
            ]
        ]);
    }

    /**
     * Calculate absences based on employee schedules
     */
    protected function calculateAbsences(Request $request)
    {
        $dateFrom = $request->date_from ?? now()->subDays(30)->format('Y-m-d');
        $dateTo = $request->date_to ?? now()->format('Y-m-d');

        // Get all employees with schedules in the date range
        $schedulesQuery = EmployeeSchedule::with(['employee.department', 'employee.company', 'shift'])
            ->where(function ($q) use ($dateFrom, $dateTo) {
                $q->where(function ($query) use ($dateFrom, $dateTo) {
                    // Schedule overlaps with date range
                    $query->whereDate('date_start', '<=', $dateTo)
                          ->where(function ($q) use ($dateFrom) {
                              $q->whereNull('date_end')
                                ->orWhereDate('date_end', '>=', $dateFrom);
                          });
                });
            })
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
            ->get();

        $absences = collect();

        foreach ($schedulesQuery as $schedule) {
            $start = Carbon::parse(max($schedule->date_start, $dateFrom));
            $end = $schedule->date_end ? Carbon::parse(min($schedule->date_end, $dateTo)) : Carbon::parse($dateTo);

            // Generate dates for this schedule
            $currentDate = $start->copy();
            while ($currentDate->lte($end)) {
                // Skip weekends if shift doesn't include them
                $dayOfWeek = $currentDate->dayOfWeek; // 0 = Sunday, 6 = Saturday
                if ($dayOfWeek === 6 && !$schedule->shift->include_saturday) {
                    // Saturday not included in shift
                    $currentDate->addDay();
                    continue;
                }
                if ($dayOfWeek === 0 && !$schedule->shift->include_sunday) {
                    // Sunday not included in shift
                    $currentDate->addDay();
                    continue;
                }

                // Check if there's an attendance record for this date
                $attendanceRecord = Attendance::with('approvedBy')
                    ->where('employee_id', $schedule->employee_id)
                    ->where(DB::raw('DATE(date)'), $currentDate->format('Y-m-d'))
                    ->first();

                // Check if employee is on leave
                $onLeave = EmployeeLeave::where('employee_id', $schedule->employee_id)
                    ->where('status', 'approved')
                    ->where(DB::raw('DATE(date_from)'), '<=', $currentDate->format('Y-m-d'))
                    ->where(DB::raw('DATE(date_to)'), '>=', $currentDate->format('Y-m-d'))
                    ->exists();

                // Include absence if:
                // 1. No attendance record at all (pending absence)
                // 2. Has attendance record with status='absent' (approved or denied absence)
                // Exclude if: has attendance with other status (present, late, etc) or on leave
                $isAbsence = false;
                $approvedBy = null;
                $approvedAt = null;
                $remarks = null;

                if ($onLeave) {
                    // Skip if on leave
                    $currentDate->addDay();
                    continue;
                }

                if (!$attendanceRecord) {
                    // No attendance record = pending absence
                    $isAbsence = true;
                } elseif ($attendanceRecord->status === 'absent') {
                    // Has attendance with status='absent' = approved or denied absence
                    $isAbsence = true;
                    $approvedBy = $attendanceRecord->approved_by;
                    $approvedAt = $attendanceRecord->approved_at;
                    $remarks = $attendanceRecord->remarks;
                }

                if ($isAbsence) {
                    $absences->push([
                        'employee_id' => $schedule->employee_id,
                        'employee' => [
                            'id' => $schedule->employee->employee_id,
                            'name' => $schedule->employee->first_name . ' ' . $schedule->employee->last_name,
                            'id_number' => $schedule->employee->id_number,
                            'department' => $schedule->employee->department->name ?? 'N/A',
                            'company' => $schedule->employee->company->name ?? 'N/A',
                        ],
                        'date' => $currentDate->format('Y-m-d'),
                        'shift_id' => $schedule->shift_id,
                        'shift' => $schedule->shift ? [
                            'id' => $schedule->shift->shift_id,
                            'name' => $schedule->shift->name,
                            'time_in' => $schedule->shift->getAttributes()['time_in'],
                            'time_out' => $schedule->shift->getAttributes()['time_out'],
                        ] : null,
                        'status' => 'absent',
                        'remarks' => $remarks,
                        'approved_by' => $approvedBy ? ($attendanceRecord->approvedBy->name ?? 'N/A') : null,
                        'approved_at' => $approvedAt,
                        'can_approve' => !$approvedBy, // Can only approve/deny if not already processed
                    ]);
                }

                $currentDate->addDay();
            }
        }

        return $absences;
    }

    /**
     * Display detailed attendance record
     *
     * @param Attendance $attendance
     * @return \Inertia\Response
     */
    public function show(Attendance $attendance)
    {
        $attendance->load(['employee.department', 'employee.company', 'employee.position', 'shift', 'createdBy', 'approvedBy']);
        
        // Get schedule information for the date
        $schedule = $this->scheduleResolver->getScheduleForDate(
            $attendance->employee_id,
            $attendance->date
        );

        return Inertia::render('Attendance/FinalShow', [
            'attendance' => [
                'id' => $attendance->attendance_id,
                'employee' => [
                    'id' => $attendance->employee->employee_id,
                    'name' => $attendance->employee->first_name . ' ' . $attendance->employee->last_name,
                    'department' => $attendance->employee->department->name ?? 'N/A',
                    'company' => $attendance->employee->company->name ?? 'N/A',
                    'position' => $attendance->employee->position->name ?? 'N/A'
                ],
                'date' => $attendance->date instanceof \Carbon\Carbon 
                    ? $attendance->date->format('Y-m-d') 
                    : $attendance->date,
                'shift' => $attendance->shift ? [
                    'name' => $attendance->shift->name,
                    'time_in' => $attendance->shift->getAttributes()['time_in'],
                    'time_out' => $attendance->shift->getAttributes()['time_out'],
                    'break_start' => $attendance->shift->getAttributes()['break_start'] ?? null,
                    'break_end' => $attendance->shift->getAttributes()['break_end'] ?? null,
                ] : null,
                'schedule' => $schedule,
                'times' => [
                    'clock_in' => $attendance->clock_in?->format('H:i:s'),
                    'break_out' => $attendance->break_out?->format('H:i:s'),
                    'break_in' => $attendance->break_in?->format('H:i:s'),
                    'clock_out' => $attendance->clock_out?->format('H:i:s')
                ],
                'computations' => [
                    'total_hours' => $attendance->total_hours ?? 0,
                    'total_minutes' => $attendance->total_minutes ?? 0,
                    'total_rendered_hours' => number_format((float) $attendance->total_rendered_hours ?? 0, 2),
                    'overtime_hours' => number_format((float) $attendance->overtime_hours ?? 0, 2),
                    'undertime_hours' => number_format((float) $attendance->undertime_hours ?? 0, 2),
                    'break_minutes' => $attendance->break_minutes ?? 0,
                    'late_minutes' => $attendance->late_minutes ?? 0
                ],
                'status' => $attendance->status,
                'remarks' => $attendance->remarks,
                'approved_by' => $attendance->approvedBy?->name,
                'approved_at' => $attendance->approved_at?->format('Y-m-d H:i:s'),
                'created_by' => $attendance->createdBy?->name,
                'created_at' => $attendance->created_at->format('Y-m-d H:i:s'),
            ],
            'can' => [
                'edit' => !$attendance->approved_by,
                'approve' => !$attendance->approved_by
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

        $validated = $request->validate([
            'clock_in' => 'required|date_format:H:i:s',
            'break_out' => 'nullable|date_format:H:i:s',
            'break_in' => 'nullable|date_format:H:i:s',
            'clock_out' => 'required|date_format:H:i:s',
            'remarks' => 'nullable|string|max:500'
        ]);

        try {
            DB::beginTransaction();

            // Record before state for audit
            $oldState = $attendance->getAttributes();

            // Get date string
            $dateStr = $attendance->date instanceof Carbon 
                ? $attendance->date->format('Y-m-d')
                : (is_string($attendance->date) ? substr($attendance->date, 0, 10) : $attendance->date);
            
            $updateData = [
                'clock_in' => $validated['clock_in'] ? Carbon::parse($dateStr . ' ' . $validated['clock_in']) : null,
                'break_out' => $validated['break_out'] ? Carbon::parse($dateStr . ' ' . $validated['break_out']) : null,
                'break_in' => $validated['break_in'] ? Carbon::parse($dateStr . ' ' . $validated['break_in']) : null,
                'clock_out' => $validated['clock_out'] ? Carbon::parse($dateStr . ' ' . $validated['clock_out']) : null,
                'remarks' => $validated['remarks'],
                'approved_by' => null,
                'approved_at' => null,
            ];

            // Update record
            $attendance->update($updateData);
            
            // Recalculate attendance metrics (total rendered hours, overtime, etc.)
            $attendance->refresh();
            $this->attendanceCalculationService->calculateAttendance($attendance);

            // Recalculate any payroll records that include this attendance date
            $payrollRecords = \App\Models\PayrollRecord::whereHas('period', function ($query) use ($attendance) {
                    $attendanceDate = $attendance->date instanceof Carbon 
                        ? $attendance->date 
                        : Carbon::parse($attendance->date);
                    
                    $query->where('period_start', '<=', $attendanceDate)
                          ->where('period_end', '>=', $attendanceDate)
                          ->where('status', 'draft'); // Only recalculate draft payrolls
                })
                ->where('employee_id', $attendance->employee_id)
                ->get();

            foreach ($payrollRecords as $payrollRecord) {
                $payrollService = app(\App\Services\PayrollService::class);
                $payrollService->recalculateRecord($payrollRecord);
            }

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

            $message = 'Attendance record updated successfully.';
            if ($payrollRecords->isNotEmpty()) {
                $message .= ' Payroll records recalculated: ' . $payrollRecords->count();
            }

            return back()->with('success', $message);

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
    public function bulkApprove(Request $request)
    {
        $validated = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'required|integer'
        ]);

        try {
            DB::beginTransaction();

            $records = Attendance::whereIn('attendance_id', $validated['ids'])
                ->whereNull('approved_by')
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
            }

            DB::commit();

            $count = count($records);
            
            return redirect()
                ->route('attendance.final.index')
                ->with('success', "$count attendance record(s) approved successfully.");

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to approve attendance records', [
                'ids' => $validated['ids'],
                'error' => $e->getMessage()
            ]);

            return back()->with('error', 'Failed to approve attendance records.');
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
        $request->validate([
            'date_from' => 'nullable|date',
            'date_to' => 'nullable|date|after_or_equal:date_from',
            'company_id' => 'nullable|exists:companies,company_id',
            'employee_id' => 'nullable|exists:employees,employee_id',
            'status' => 'nullable|string'
        ]);

        $dateFrom = $request->date_from ? Carbon::parse($request->date_from)->format('Y-m-d') : 'all';
        $dateTo = $request->date_to ? Carbon::parse($request->date_to)->format('Y-m-d') : 'all';

        $filename = sprintf(
            'attendance_%s_to_%s.xlsx',
            $dateFrom,
            $dateTo
        );

        try {
            return Excel::download(
                new AttendanceExport($request->only([
                    'date_from',
                    'date_to',
                    'company_id',
                    'employee_id',
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

    /**
     * Approve an absence - creates an Attendance record with status='absent'
     */
    public function approveAbsence(Request $request)
    {
        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,employee_id',
            'date' => 'required|date',
            'shift_id' => 'nullable|exists:shifts,shift_id',
        ]);

        try {
            DB::beginTransaction();

            // Check if attendance record already exists
            $existing = Attendance::where('employee_id', $validated['employee_id'])
                ->where(DB::raw('DATE(date)'), $validated['date'])
                ->first();

            if ($existing) {
                DB::rollBack();
                return back()->with('error', 'Attendance record already exists for this date.');
            }

            // Create absence attendance record
            $attendance = Attendance::create([
                'employee_id' => $validated['employee_id'],
                'date' => $validated['date'],
                'shift_id' => $validated['shift_id'],
                'status' => 'absent',
                'approved_by' => Auth::id(),
                'approved_at' => now(),
                'created_by' => Auth::id(),
            ]);

            activity()
                ->performedOn($attendance)
                ->causedBy(Auth::user())
                ->withProperties(['date' => $validated['date']])
                ->log('Approved absence');

            DB::commit();

            return back()->with('success', 'Absence approved successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to approve absence', [
                'data' => $validated,
                'error' => $e->getMessage()
            ]);
            return back()->with('error', 'Failed to approve absence.');
        }
    }

    /**
     * Deny an absence - creates an Attendance record with status='absent' and remarks='Denied'
     */
    public function denyAbsence(Request $request)
    {
        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,employee_id',
            'date' => 'required|date',
            'shift_id' => 'nullable|exists:shifts,shift_id',
        ]);

        try {
            DB::beginTransaction();

            // Check if attendance record already exists
            $existing = Attendance::where('employee_id', $validated['employee_id'])
                ->where(DB::raw('DATE(date)'), $validated['date'])
                ->first();

            if ($existing) {
                DB::rollBack();
                return back()->with('error', 'Attendance record already exists for this date.');
            }

            // Create denied absence record - status is 'absent' but remarks is 'Denied'
            $attendance = Attendance::create([
                'employee_id' => $validated['employee_id'],
                'date' => $validated['date'],
                'shift_id' => $validated['shift_id'],
                'status' => 'absent',
                'remarks' => 'Denied',
                'approved_by' => Auth::id(),
                'approved_at' => now(),
                'created_by' => Auth::id(),
            ]);

            activity()
                ->performedOn($attendance)
                ->causedBy(Auth::user())
                ->withProperties(['date' => $validated['date']])
                ->log('Denied absence');

            DB::commit();

            return back()->with('success', 'Absence denied successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to deny absence', [
                'data' => $validated,
                'error' => $e->getMessage()
            ]);
            return back()->with('error', 'Failed to deny absence.');
        }
    }

    /**
     * Bulk approve absences
     */
    public function bulkApproveAbsences(Request $request)
    {
        $validated = $request->validate([
            'absences' => 'required|array',
            'absences.*.employee_id' => 'required|exists:employees,employee_id',
            'absences.*.date' => 'required|date',
            'absences.*.shift_id' => 'nullable|exists:shifts,shift_id',
        ]);

        try {
            DB::beginTransaction();

            $approved = 0;
            $skipped = 0;

            foreach ($validated['absences'] as $absence) {
                // Check if attendance record already exists
                $existing = Attendance::where('employee_id', $absence['employee_id'])
                    ->where(DB::raw('DATE(date)'), $absence['date'])
                    ->exists();

                if ($existing) {
                    $skipped++;
                    continue;
                }

                // Create absence attendance record
                Attendance::create([
                    'employee_id' => $absence['employee_id'],
                    'date' => $absence['date'],
                    'shift_id' => $absence['shift_id'] ?? null,
                    'status' => 'absent',
                    'approved_by' => Auth::id(),
                    'approved_at' => now(),
                    'created_by' => Auth::id(),
                ]);

                $approved++;
            }

            activity()
                ->causedBy(Auth::user())
                ->withProperties([
                    'approved' => $approved,
                    'skipped' => $skipped
                ])
                ->log('Bulk approved absences');

            DB::commit();

            $message = "Successfully approved {$approved} absence(s).";
            if ($skipped > 0) {
                $message .= " {$skipped} record(s) were skipped (already exist).";
            }

            return back()->with('success', $message);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to bulk approve absences', [
                'error' => $e->getMessage()
            ]);
            return back()->with('error', 'Failed to approve absences.');
        }
    }

    /**
     * Bulk reject absences
     */
    public function bulkRejectAbsences(Request $request)
    {
        $validated = $request->validate([
            'absences' => 'required|array',
            'absences.*.employee_id' => 'required|exists:employees,employee_id',
            'absences.*.date' => 'required|date',
            'absences.*.shift_id' => 'nullable|exists:shifts,shift_id',
        ]);

        try {
            DB::beginTransaction();

            $rejected = 0;
            $skipped = 0;

            foreach ($validated['absences'] as $absence) {
                // Check if attendance record already exists
                $existing = Attendance::where('employee_id', $absence['employee_id'])
                    ->where(DB::raw('DATE(date)'), $absence['date'])
                    ->exists();

                if ($existing) {
                    $skipped++;
                    continue;
                }

                // Create denied absence record - status is 'absent' but remarks is 'Denied'
                Attendance::create([
                    'employee_id' => $absence['employee_id'],
                    'date' => $absence['date'],
                    'shift_id' => $absence['shift_id'] ?? null,
                    'status' => 'absent',
                    'remarks' => 'Denied',
                    'approved_by' => Auth::id(),
                    'approved_at' => now(),
                    'created_by' => Auth::id(),
                ]);

                $rejected++;
            }

            activity()
                ->causedBy(Auth::user())
                ->withProperties([
                    'rejected' => $rejected,
                    'skipped' => $skipped
                ])
                ->log('Bulk denied absences');

            DB::commit();

            $message = "Successfully denied {$rejected} absence(s).";
            if ($skipped > 0) {
                $message .= " {$skipped} record(s) were skipped (already exist).";
            }

            return back()->with('success', $message);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to bulk deny absences', [
                'error' => $e->getMessage()
            ]);
            return back()->with('error', 'Failed to deny absences.');
        }
    }
}