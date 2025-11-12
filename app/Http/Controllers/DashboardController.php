<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\Employee;
use App\Models\EmployeeLeave;
use App\Models\Holiday;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Spatie\Activitylog\Models\Activity;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        // Get employee counts by employment status
        $employeeStats = [
            'total' => Employee::count(),
            'probationary' => Employee::where('employment_status', 'Probationary')->count(),
            'regular' => Employee::where('employment_status', 'Regular')->count(),
            'contractual' => Employee::where('employment_status', 'Contractual')->count(),
        ];

        // Get selected month or default to current
        $selectedMonth = $request->input('month', Carbon::now()->format('Y-m'));

        // Get monthly attendance summary
        $attendanceSummary = $this->getAttendanceSummary($selectedMonth);

        // Get pending leave requests
        $leaveSummary = $this->getLeaveSummary();

        // Get recent activities
        $recentActivities = $this->getRecentActivities();

        // Get upcoming events
        $upcomingEvents = $this->getUpcomingEvents();

        return Inertia::render('dashboard', [
            'employeeStats' => $employeeStats,
            'attendanceSummary' => $attendanceSummary,
            'leaveSummary' => $leaveSummary,
            'recentActivities' => $recentActivities,
            'upcomingEvents' => $upcomingEvents,
            'selectedMonth' => $selectedMonth,
        ]);
    }

    private function getAttendanceSummary($selectedMonth)
    {
        // Parse selected month
        $date = Carbon::createFromFormat('Y-m', $selectedMonth);
        $monthStart = $date->copy()->startOfMonth();
        $monthEnd = $date->copy()->endOfMonth();
        $today = Carbon::today();
        
        $totalEmployees = Employee::where('employment_status', '!=', 'Resigned')->count();

        // Today's present count (only if viewing current month)
        $presentToday = 0;
        if ($date->isSameMonth(Carbon::now())) {
            $presentToday = Attendance::whereDate('date', $today)
                ->whereIn('status', ['present', 'late'])
                ->distinct('employee_id')
                ->count('employee_id');
        }

        // Selected month's attendance - count distinct employee+date combinations
        // Following copilot-instructions.md #12: SQLite compatible syntax
        $monthlyAttendance = Attendance::whereBetween('date', [$monthStart, $monthEnd])
            ->select('status', DB::raw('count(DISTINCT employee_id || date) as count'))
            ->groupBy('status')
            ->pluck('count', 'status')
            ->toArray();

        // Calculate working days (excluding weekends)
        $workingDays = $this->calculateWorkDays($monthStart, $monthEnd);
        
        // Total calendar days in month
        $totalDays = $monthEnd->day;

        // Get individual status counts
        $presentDays = $monthlyAttendance['present'] ?? 0;
        $lateDays = $monthlyAttendance['late'] ?? 0;
        $absentDays = $monthlyAttendance['absent'] ?? 0;
        $leaveDays = $monthlyAttendance['on_leave'] ?? 0;

        // Calculate attendance rate: (worked days / expected days) * 100
        $workedDays = $presentDays + $lateDays;
        $expectedDays = $totalEmployees * $workingDays;
        $attendanceRate = $expectedDays > 0 
            ? round(($workedDays / $expectedDays) * 100, 2) 
            : 0;

        // Pending approvals (all pending, not month-specific)
        $pendingApprovals = Attendance::where('requires_approval', true)
            ->whereNull('approved_at')
            ->count();

        return [
            'month_label' => $date->format('F Y'),
            'is_current_month' => $date->isSameMonth(Carbon::now()),
            'this_month' => [
                'total_days' => $totalDays,
                'working_days' => $workingDays,
                'present_days' => $presentDays,
                'late_days' => $lateDays,
                'absent_days' => $absentDays,
                'leave_days' => $leaveDays,
                'average_attendance_rate' => $attendanceRate,
                'total_employees' => $totalEmployees,
                'present_today' => $presentToday,
            ],
            'pending_approvals' => $pendingApprovals,
        ];
    }

    private function getLeaveSummary()
    {
        $pendingLeaves = EmployeeLeave::with(['employee.department'])
            ->where('status', 'pending')
            ->orderBy('created_at', 'asc')
            ->limit(5)
            ->get()
            ->map(function ($leave) {
                return [
                    'id' => $leave->leave_id,
                    'employee' => [
                        'id' => $leave->employee->employee_id,
                        'name' => $leave->employee->first_name . ' ' . $leave->employee->last_name,
                        'id_number' => $leave->employee->id_number,
                        'department' => $leave->employee->department ? [
                            'name' => $leave->employee->department->name,
                        ] : null,
                    ],
                    'leave_type' => $leave->type ?? 'Unknown',
                    'date_start' => $leave->date_from ? $leave->date_from->toDateString() : null,
                    'date_end' => $leave->date_to ? $leave->date_to->toDateString() : null,
                    'days_count' => $leave->days_count,
                    'reason' => $leave->remarks ?? '',
                    'status' => $leave->status,
                    'created_at' => $leave->created_at->toISOString(),
                ];
            });

        $approvedToday = EmployeeLeave::whereDate('approved_at', Carbon::today())
            ->count();

        return [
            'pending_leaves' => $pendingLeaves,
            'total_pending' => EmployeeLeave::where('status', 'pending')->count(),
            'approved_today' => $approvedToday,
        ];
    }

    private function getRecentActivities()
    {
        try {
            $activities = Activity::with('causer')
                ->orderBy('created_at', 'desc')
                ->limit(10)
                ->get();

            return $activities->map(function ($activity) {
                try {
                    $description = $activity->description ?? 'Unknown activity';
                    $properties = $activity->properties ?? collect();

                    // Extract employee name from properties for employee-related activities
                    if ($activity->subject_type === 'App\\Models\\Employee') {
                        // Check if it's a creation, update, or deletion activity
                        if (stripos($description, 'created') !== false || 
                            stripos($description, 'deleted') !== false ||
                            stripos($description, 'updated') !== false) {
                            
                            // Try to get name from properties
                            $employeeName = null;
                            if (isset($properties['name'])) {
                                $employeeName = $properties['name'];
                            } elseif (isset($properties['first_name']) && isset($properties['last_name'])) {
                                $nameParts = array_filter([
                                    $properties['first_name'],
                                    $properties['middle_name'] ?? null,
                                    $properties['last_name']
                                ]);
                                $employeeName = implode(' ', $nameParts);
                            }

                            // Append name to description if found
                            if ($employeeName) {
                                $description = $description . ": {$employeeName}";
                            }
                        }
                    }

                    return [
                        'id' => $activity->id,
                        'description' => $description,
                        'subject_type' => class_basename($activity->subject_type ?? 'Unknown'),
                        'subject_id' => $activity->subject_id ?? null,
                        'causer' => $activity->causer ? [
                            'name' => $activity->causer->name ?? 'Unknown User',
                            'avatar' => null, // Add avatar URL if available in your User model
                        ] : null,
                        'properties' => is_array($properties) ? $properties : $properties->toArray(),
                        'created_at' => $activity->created_at ? $activity->created_at->toISOString() : now()->toISOString(),
                    ];
                } catch (\Exception $e) {
                    \Log::error('Error formatting activity', [
                        'activity_id' => $activity->id ?? 'unknown',
                        'error' => $e->getMessage()
                    ]);
                    
                    // Return safe default
                    return [
                        'id' => $activity->id ?? 0,
                        'description' => 'Activity details unavailable',
                        'subject_type' => 'Unknown',
                        'subject_id' => null,
                        'causer' => null,
                        'properties' => [],
                        'created_at' => now()->toISOString(),
                    ];
                }
            })->toArray();

        } catch (\Exception $e) {
            \Log::error('Error fetching activities', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            // Return empty array on error
            return [];
        }
    }

    private function getUpcomingEvents()
    {
        try {
            $today = Carbon::today();
            $next30Days = Carbon::today()->addDays(30);
            $events = [];

            // Holidays
            $holidays = Holiday::whereBetween('date', [$today, $next30Days])
                ->with('company')
                ->orderBy('date', 'asc')
                ->get()
                ->map(function ($holiday) {
                    return [
                        'id' => $holiday->holiday_id,
                        'type' => 'holiday',
                        'title' => $holiday->name ?? 'Holiday',
                        'date' => $holiday->date ? $holiday->date->toDateString() : today()->toDateString(),
                        'description' => $holiday->description ?? null,
                        'company' => $holiday->company ? [
                            'name' => $holiday->company->name,
                        ] : null,
                    ];
                });

            // Employee birthdays
            $birthdays = Employee::whereNotNull('birth_date')
                ->get()
                ->filter(function ($employee) use ($today, $next30Days) {
                    try {
                        $birthday = Carbon::parse($employee->birth_date);
                        $thisYearBirthday = $birthday->copy()->setYear($today->year);

                        if ($thisYearBirthday->lt($today)) {
                            $thisYearBirthday->addYear();
                        }

                        return $thisYearBirthday->between($today, $next30Days);
                    } catch (\Exception $e) {
                        return false;
                    }
                })
                ->map(function ($employee) use ($today) {
                    $birthday = Carbon::parse($employee->birth_date);
                    $thisYearBirthday = $birthday->copy()->setYear($today->year);

                    if ($thisYearBirthday->lt($today)) {
                        $thisYearBirthday->addYear();
                    }

                    return [
                        'id' => $employee->employee_id,
                        'type' => 'birthday',
                        'title' => trim($employee->first_name . ' ' . $employee->last_name),
                        'date' => $thisYearBirthday->toDateString(),
                        'employee' => [
                            'id' => $employee->employee_id,
                            'name' => trim($employee->first_name . ' ' . $employee->last_name),
                        ],
                    ];
                });

            // Work anniversaries
            $anniversaries = Employee::whereNotNull('date_hired')
                ->get()
                ->filter(function ($employee) use ($today, $next30Days) {
                    try {
                        $hireDate = Carbon::parse($employee->date_hired);
                        $thisYearAnniversary = $hireDate->copy()->setYear($today->year);

                        // Only include if it's been at least 1 year
                        if ($today->diffInYears($hireDate) < 1) {
                            return false;
                        }

                        if ($thisYearAnniversary->lt($today)) {
                            $thisYearAnniversary->addYear();
                        }

                        return $thisYearAnniversary->between($today, $next30Days);
                    } catch (\Exception $e) {
                        return false;
                    }
                })
                ->map(function ($employee) use ($today) {
                    $hireDate = Carbon::parse($employee->date_hired);
                    $thisYearAnniversary = $hireDate->copy()->setYear($today->year);

                    if ($thisYearAnniversary->lt($today)) {
                        $thisYearAnniversary->addYear();
                    }

                    $years = $today->diffInYears($hireDate);

                    return [
                        'id' => $employee->employee_id,
                        'type' => 'anniversary',
                        'title' => trim($employee->first_name . ' ' . $employee->last_name),
                        'date' => $thisYearAnniversary->toDateString(),
                        'description' => $years . ' year' . ($years !== 1 ? 's' : '') . ' with the company',
                        'employee' => [
                            'id' => $employee->employee_id,
                            'name' => trim($employee->first_name . ' ' . $employee->last_name),
                        ],
                    ];
                });

            // Merge and sort all events
            $events = $holidays
                ->concat($birthdays)
                ->concat($anniversaries)
                ->sortBy('date')
                ->take(10)
                ->values();

            return $events->toArray();

        } catch (\Exception $e) {
            \Log::error('Error fetching upcoming events', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return [];
        }
    }

    private function calculateWorkDays($start, $end)
    {
        $workDays = 0;
        $current = $start->copy();

        while ($current->lte($end)) {
            // Count weekdays (Monday to Friday)
            if ($current->isWeekday()) {
                $workDays++;
            }
            $current->addDay();
        }

        // Subtract holidays
        $holidays = Holiday::whereBetween('date', [$start, $end])->count();
        $workDays -= $holidays;

        return max($workDays, 0);
    }
}