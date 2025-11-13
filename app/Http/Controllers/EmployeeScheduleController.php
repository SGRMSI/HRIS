<?php

namespace App\Http\Controllers;

use App\Models\EmployeeSchedule;
use App\Models\Employee;
use App\Models\Shift;
use App\Models\Department;
use App\Models\Company;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class EmployeeScheduleController extends Controller
{
    /**
     * Display a listing of employee schedules
     *
     * @param Request $request
     * @return \Inertia\Response
     */
    public function index(Request $request)
    {
        $query = EmployeeSchedule::with(['employee.department.company', 'shift'])
            ->when($request->employee_search, function ($q) use ($request) {
                $q->whereHas('employee', function ($q) use ($request) {
                    $q->where('first_name', 'like', "%{$request->employee_search}%")
                      ->orWhere('last_name', 'like', "%{$request->employee_search}%")
                      ->orWhere('id_number', 'like', "%{$request->employee_search}%");
                });
            })
            ->when($request->company_id, function ($q) use ($request) {
                $q->whereHas('employee.department', function ($q) use ($request) {
                    $q->where('company_id', $request->company_id);
                });
            })
            ->when($request->shift_id, function ($q) use ($request) {
                $q->where('shift_id', $request->shift_id);
            })
            ->when($request->date_from, function ($q) use ($request) {
                $q->where(function ($q) use ($request) {
                    $q->where('date_end', '>=', $request->date_from)
                      ->orWhereNull('date_end');
                });
            })
            ->when($request->date_to, function ($q) use ($request) {
                $q->where('date_start', '<=', $request->date_to);
            });

        // Detect conflicts
        $schedules = $query->orderBy('date_start', 'desc')
            ->paginate($request->per_page ?? 20)
            ->through(function ($schedule) {
                // Check for conflicts with this schedule
                $hasConflict = $this->checkScheduleConflict(
                    $schedule->employee_id,
                    $schedule->date_start,
                    $schedule->date_end,
                    $schedule->schedule_id
                );

                return [
                    'id' => $schedule->schedule_id,
                    'employee' => [
                        'id' => $schedule->employee->employee_id,
                        'name' => $schedule->employee->first_name . ' ' . $schedule->employee->last_name,
                        'employee_number' => $schedule->employee->id_number,
                        'department' => $schedule->employee->department->name ?? 'N/A',
                        'company' => $schedule->employee->department->company->name ?? 'N/A'
                    ],
                    'shift' => [
                        'id' => $schedule->shift->shift_id,
                        'name' => $schedule->shift->name,
                        'time_in' => $schedule->shift->time_in ? 
                            (is_string($schedule->shift->time_in) ? 
                                substr($schedule->shift->time_in, 0, 5) : 
                                $schedule->shift->time_in->format('H:i')) : '',
                        'time_out' => $schedule->shift->time_out ? 
                            (is_string($schedule->shift->time_out) ? 
                                substr($schedule->shift->time_out, 0, 5) : 
                                $schedule->shift->time_out->format('H:i')) : '',
                    ],
                    'date_start' => $schedule->date_start->format('Y-m-d'),
                    'date_end' => $schedule->date_end?->format('Y-m-d'),
                    'is_holiday' => $schedule->is_holiday,
                    'has_conflict' => $hasConflict,
                    'is_active' => !$schedule->date_end || $schedule->date_end >= now()
                ];
            });

        return Inertia::render('Attendance/Schedules/Index', [
            'schedules' => $schedules,
            'filters' => $request->only(['employee_search', 'company_id', 'shift_id', 'date_from', 'date_to']),
            'companies' => Company::select(['company_id as id', 'name'])->get(),
            'shifts' => Shift::select(['shift_id', 'name'])->get()
        ]);
    }

    /**
     * Show the form for creating a new schedule
     *
     * @param Request $request
     * @return \Inertia\Response
     */
    public function create(Request $request)
    {
        $companies = Company::select(['company_id as id', 'name'])->get();

        $shifts = Shift::select(['shift_id', 'name', 'time_in', 'time_out'])
            ->orderBy('name')
            ->get()
            ->map(function($shift) {
                return [
                    'shift_id' => $shift->shift_id,
                    'name' => $shift->name,
                    'time_in' => $shift->time_in ? 
                        (is_string($shift->time_in) ? 
                            substr($shift->time_in, 0, 5) : 
                            $shift->time_in->format('H:i')) : '',
                    'time_out' => $shift->time_out ? 
                        (is_string($shift->time_out) ? 
                            substr($shift->time_out, 0, 5) : 
                            $shift->time_out->format('H:i')) : '',
                ];
            });

        // Get pre-filled employee data if provided
        $prefilledEmployee = null;
        if ($request->employee_id) {
            $employee = Employee::with('company')->find($request->employee_id);
            if ($employee) {
                $prefilledEmployee = [
                    'employee_id' => $employee->employee_id,
                    'full_name' => trim($employee->first_name . ' ' . ($employee->middle_name ? $employee->middle_name . ' ' : '') . $employee->last_name),
                    'id_number' => $employee->id_number,
                    'company_id' => $employee->company_id,
                    'company_name' => $employee->company ? $employee->company->name : null,
                ];
            }
        }

        return Inertia::render('Attendance/Schedules/Create', [
            'companies' => $companies,
            'shifts' => $shifts,
            'prefilledEmployee' => $prefilledEmployee,
            'prefilledCompanyId' => $request->company_id ? (int)$request->company_id : null,
        ]);
    }

    /**
     * Store a newly created schedule
     *
     * @param Request $request
     * @return \Illuminate\Http\RedirectResponse
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'employee_id' => ['required', 'exists:employees,employee_id'],
            'shift_id' => ['required', 'exists:shifts,shift_id'],
            'date_start' => ['required', 'date', 'after_or_equal:today'],
            'date_end' => ['nullable', 'date', 'after_or_equal:date_start'],
            'is_holiday' => ['nullable', 'boolean']
        ]);

        try {
            DB::beginTransaction();

            // Check for overlapping schedules
            if ($this->checkScheduleConflict(
                $validated['employee_id'],
                $validated['date_start'],
                $validated['date_end'] ?? null
            )) {
                throw ValidationException::withMessages([
                    'date_start' => 'This schedule overlaps with an existing schedule for this employee.'
                ]);
            }

            $schedule = EmployeeSchedule::create([
                'employee_id' => $validated['employee_id'],
                'shift_id' => $validated['shift_id'],
                'date_start' => $validated['date_start'],
                'date_end' => $validated['date_end'] ?? null,
                'is_holiday' => $validated['is_holiday'] ?? false
            ]);

            // Log the creation
            activity()
                ->performedOn($schedule)
                ->causedBy(Auth::user())
                ->log('schedule.created');

            DB::commit();

            return redirect()->route('attendance.schedules.index')->with('success', 'Schedule created successfully.');

        } catch (ValidationException $e) {
            DB::rollBack();
            throw $e;
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to create schedule', [
                'data' => $validated,
                'error' => $e->getMessage()
            ]);

            return back()->withErrors(['error' => 'Failed to create schedule.']);
        }
    }

    /**
     * Show the form for editing the specified schedule
     *
     * @param EmployeeSchedule $schedule
     * @return \Inertia\Response
     */
    public function edit(EmployeeSchedule $schedule)
    {
        $schedule->load(['employee.department', 'shift']);

        $scheduleData = [
            'id' => $schedule->schedule_id,
            'employee' => [
                'id' => $schedule->employee->employee_id,
                'name' => $schedule->employee->first_name . ' ' . $schedule->employee->last_name,
                'employee_number' => $schedule->employee->id_number,
                'department' => $schedule->employee->department->name ?? 'N/A'
            ],
            'shift_id' => $schedule->shift_id,
            'date_start' => $schedule->date_start->format('Y-m-d'),
            'date_end' => $schedule->date_end?->format('Y-m-d'),
            'is_holiday' => $schedule->is_holiday
        ];

        $shifts = Shift::select(['shift_id', 'name', 'time_in', 'time_out'])
            ->orderBy('name')
            ->get()
            ->map(function($shift) {
                return [
                    'shift_id' => $shift->shift_id,
                    'name' => $shift->name,
                    'time_in' => $shift->time_in ? 
                        (is_string($shift->time_in) ? 
                            substr($shift->time_in, 0, 5) : 
                            $shift->time_in->format('H:i')) : '',
                    'time_out' => $shift->time_out ? 
                        (is_string($shift->time_out) ? 
                            substr($shift->time_out, 0, 5) : 
                            $shift->time_out->format('H:i')) : '',
                ];
            });

        return Inertia::render('Attendance/Schedules/Edit', [
            'schedule' => $scheduleData,
            'shifts' => $shifts
        ]);
    }

    /**
     * Update the specified schedule
     *
     * @param Request $request
     * @param EmployeeSchedule $schedule
     * @return \Illuminate\Http\RedirectResponse
     */
    public function update(Request $request, EmployeeSchedule $schedule)
    {
        $validated = $request->validate([
            'shift_id' => ['required', 'exists:shifts,shift_id'],
            'date_start' => ['required', 'date'],
            'date_end' => ['nullable', 'date', 'after_or_equal:date_start'],
            'is_holiday' => ['nullable', 'boolean']
        ]);

        try {
            DB::beginTransaction();

            // Check for conflicts (excluding current schedule)
            if ($this->checkScheduleConflict(
                $schedule->employee_id,
                $validated['date_start'],
                $validated['date_end'] ?? null,
                $schedule->schedule_id
            )) {
                throw ValidationException::withMessages([
                    'date_start' => 'This schedule overlaps with another existing schedule for this employee.'
                ]);
            }

            // Record old state for audit
            $oldState = $schedule->getAttributes();

            $schedule->update([
                'shift_id' => $validated['shift_id'],
                'date_start' => $validated['date_start'],
                'date_end' => $validated['date_end'] ?? null,
                'is_holiday' => $validated['is_holiday'] ?? false
            ]);

            // Log the update with changes
            activity()
                ->performedOn($schedule)
                ->causedBy(Auth::user())
                ->withProperties([
                    'old' => $oldState,
                    'new' => $schedule->getAttributes()
                ])
                ->log('schedule.updated');

            DB::commit();

            return redirect()->route('attendance.schedules.index')->with('success', 'Schedule updated successfully.');

        } catch (ValidationException $e) {
            DB::rollBack();
            throw $e;
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to update schedule', [
                'schedule_id' => $schedule->schedule_id,
                'data' => $validated,
                'error' => $e->getMessage()
            ]);

            return back()->withErrors(['error' => 'Failed to update schedule.']);
        }
    }

    /**
     * Bulk update schedules for multiple employees
     *
     * @param Request $request
     * @return \Illuminate\Http\RedirectResponse
     */
    public function bulkUpdate(Request $request)
    {
        $validated = $request->validate([
            'employee_ids' => ['required', 'array'],
            'employee_ids.*' => ['required', 'exists:employees,employee_id'],
            'shift_id' => ['required', 'exists:shifts,shift_id'],
            'date_start' => ['required', 'date', 'after_or_equal:today'],
            'date_end' => ['nullable', 'date', 'after_or_equal:date_start'],
            'is_holiday' => ['nullable', 'boolean'],
            'close_existing' => ['nullable', 'boolean']
        ]);

        $errors = [];
        $successCount = 0;

        try {
            DB::beginTransaction();

            foreach ($validated['employee_ids'] as $employeeId) {
                try {
                    // Close existing schedules if requested
                    if ($validated['close_existing'] ?? false) {
                        EmployeeSchedule::where('employee_id', $employeeId)
                            ->whereNull('date_end')
                            ->update(['date_end' => Carbon::parse($validated['date_start'])->subDay()]);
                    }

                    // Check for conflicts
                    if ($this->checkScheduleConflict(
                        $employeeId,
                        $validated['date_start'],
                        $validated['date_end'] ?? null
                    )) {
                        $employee = Employee::find($employeeId);
                        $errors[] = "Conflict for {$employee->first_name} {$employee->last_name}";
                        continue;
                    }

                    // Create new schedule
                    $schedule = EmployeeSchedule::create([
                        'employee_id' => $employeeId,
                        'shift_id' => $validated['shift_id'],
                        'date_start' => $validated['date_start'],
                        'date_end' => $validated['date_end'] ?? null,
                        'is_holiday' => $validated['is_holiday'] ?? false
                    ]);

                    // Log the creation
                    activity()
                        ->performedOn($schedule)
                        ->causedBy(Auth::user())
                        ->log('schedule.bulk_created');

                    $successCount++;

                } catch (\Exception $e) {
                    $employee = Employee::find($employeeId);
                    $errors[] = "Failed for {$employee->first_name} {$employee->last_name}: {$e->getMessage()}";
                }
            }

            DB::commit();

            if ($successCount > 0 && empty($errors)) {
                return back()->with('success', "Successfully created schedules for {$successCount} employee(s).");
            } elseif ($successCount > 0 && !empty($errors)) {
                return back()
                    ->with('success', "Created schedules for {$successCount} employee(s).")
                    ->withErrors(['bulk' => $errors]);
            } else {
                return back()->withErrors(['bulk' => $errors]);
            }

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to bulk update schedules', [
                'data' => $validated,
                'error' => $e->getMessage()
            ]);

            return back()->withErrors(['error' => 'Failed to bulk update schedules.']);
        }
    }

    /**
     * Remove the specified schedule
     *
     * @param EmployeeSchedule $schedule
     * @return \Illuminate\Http\RedirectResponse
     */
    public function destroy(EmployeeSchedule $schedule)
    {
        try {
            DB::beginTransaction();

            // Log before deletion
            activity()
                ->performedOn($schedule)
                ->causedBy(Auth::user())
                ->withProperties([
                    'schedule' => $schedule->toArray()
                ])
                ->log('schedule.deleted');

            $schedule->delete();

            DB::commit();

            return back()->with('success', 'Schedule deleted successfully.');

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to delete schedule', [
                'schedule_id' => $schedule->schedule_id,
                'error' => $e->getMessage()
            ]);

            return back()->withErrors(['error' => 'Failed to delete schedule.']);
        }
    }

    /**
     * Check if schedule conflicts with existing schedules
     *
     * @param int $employeeId
     * @param string $dateStart
     * @param string|null $dateEnd
     * @param int|null $excludeScheduleId
     * @return bool
     */
    private function checkScheduleConflict(
        int $employeeId,
        string $dateStart,
        ?string $dateEnd = null,
        ?int $excludeScheduleId = null
    ): bool {
        $query = EmployeeSchedule::where('employee_id', $employeeId);

        if ($excludeScheduleId) {
            $query->where('schedule_id', '!=', $excludeScheduleId);
        }

        // Check for overlapping date ranges
        $query->where(function ($q) use ($dateStart, $dateEnd) {
            if ($dateEnd) {
                // New schedule has end date
                $q->where(function ($q) use ($dateStart, $dateEnd) {
                    // Existing schedule overlaps
                    $q->where(function ($q) use ($dateStart, $dateEnd) {
                        $q->where('date_start', '<=', $dateEnd)
                          ->where(function ($q) use ($dateStart) {
                              $q->where('date_end', '>=', $dateStart)
                                ->orWhereNull('date_end');
                          });
                    });
                });
            } else {
                // New schedule has no end date (ongoing)
                $q->where(function ($q) use ($dateStart) {
                    $q->whereNull('date_end')
                      ->orWhere('date_end', '>=', $dateStart);
                });
            }
        });

        return $query->exists();
    }

    /**
     * Get employees by company
     *
     * @param int $company
     * @return \Illuminate\Http\JsonResponse
     */
    public function getEmployeesByCompany($company)
    {
        $employees = Employee::with('department')
            ->where('company_id', $company)
            ->select(['employee_id', 'first_name', 'last_name', 'id_number', 'department_id'])
            ->orderBy('first_name')
            ->get()
            ->map(fn($emp) => [
                'id' => $emp->employee_id,
                'name' => $emp->first_name . ' ' . $emp->last_name,
                'employee_number' => $emp->id_number,
                'department' => $emp->department->name ?? 'N/A'
            ]);

        return response()->json($employees);
    }
}

