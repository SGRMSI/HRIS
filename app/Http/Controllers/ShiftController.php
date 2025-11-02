<?php

namespace App\Http\Controllers;

use App\Models\Shift;
use App\Models\EmployeeSchedule;
use App\Models\Attendance;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class ShiftController extends Controller
{
    /**
     * Display a listing of shifts
     *
     * @param Request $request
     * @return \Inertia\Response
     */
    public function index(Request $request)
    {
        $query = Shift::query()
            ->withCount(['schedules', 'attendances'])
            ->when($request->search, function ($q) use ($request) {
                $q->where('name', 'like', "%{$request->search}%")
                  ->orWhere('description', 'like', "%{$request->search}%");
            })
            ->when($request->status === 'active', function ($q) {
                $q->whereHas('schedules', function ($q) {
                    $q->where('date_end', '>=', now())
                      ->orWhereNull('date_end');
                });
            })
            ->when($request->status === 'inactive', function ($q) {
                $q->whereDoesntHave('schedules', function ($q) {
                    $q->where('date_end', '>=', now())
                      ->orWhereNull('date_end');
                });
            });

        $shifts = $query->orderBy('name')
            ->paginate($request->per_page ?? 15)
            ->through(function ($shift) {
                return [
                    'id' => $shift->shift_id,
                    'name' => $shift->name,
                    'description' => $shift->description,
                    'times' => [
                        'time_in' => $shift->time_in?->format('H:i'),
                        'time_out' => $shift->time_out?->format('H:i'),
                        'break_start' => $shift->break_start?->format('H:i'),
                        'break_end' => $shift->break_end?->format('H:i'),
                    ],
                    'grace_period' => $shift->grace_period,
                    'working_hours' => $shift->getWorkingHours(),
                    'is_overnight' => $shift->isOvernight(),
                    'schedules_count' => $shift->schedules_count,
                    'attendances_count' => $shift->attendances_count,
                    'is_active' => $shift->schedules_count > 0,
                    'can_delete' => $shift->schedules_count === 0 && $shift->attendances_count === 0
                ];
            });

        return Inertia::render('Attendance/Shifts/Index', [
            'shifts' => $shifts,
            'filters' => $request->only(['search', 'status'])
        ]);
    }

    /**
     * Show the form for creating a new shift
     *
     * @return \Inertia\Response
     */
    public function create()
    {
        return Inertia::render('Attendance/Shifts/Create', [
            'defaultGracePeriod' => 15 // 15 minutes default
        ]);
    }

    /**
     * Store a newly created shift
     *
     * @param Request $request
     * @return \Illuminate\Http\RedirectResponse
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100', 'unique:shifts,name'],
            'description' => ['nullable', 'string', 'max:500'],
            'time_in' => ['required', 'date_format:H:i'],
            'time_out' => ['required', 'date_format:H:i'],
            'break_start' => ['nullable', 'date_format:H:i'],
            'break_end' => ['nullable', 'date_format:H:i', 'required_with:break_start'],
            'grace_period' => ['nullable', 'integer', 'min:0', 'max:60']
        ]);

        // Additional validation
        $this->validateShiftTimes($validated);

        try {
            DB::beginTransaction();

            // Parse times properly
            $shift = Shift::create([
                'name' => $validated['name'],
                'description' => $validated['description'] ?? null,
                'time_in' => Carbon::createFromFormat('H:i', $validated['time_in']),
                'time_out' => Carbon::createFromFormat('H:i', $validated['time_out']),
                'break_start' => isset($validated['break_start']) 
                    ? Carbon::createFromFormat('H:i', $validated['break_start']) 
                    : null,
                'break_end' => isset($validated['break_end']) 
                    ? Carbon::createFromFormat('H:i', $validated['break_end']) 
                    : null,
                'grace_period' => $validated['grace_period'] ?? 0
            ]);

            // Log the creation
            activity()
                ->performedOn($shift)
                ->causedBy(Auth::user())
                ->log('shift.created');

            DB::commit();

            return redirect()
                ->route('shifts.index')
                ->with('success', 'Shift created successfully.');

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to create shift', [
                'data' => $validated,
                'error' => $e->getMessage()
            ]);

            return back()
                ->withErrors(['error' => 'Failed to create shift.'])
                ->withInput();
        }
    }

    /**
     * Show the form for editing the specified shift
     *
     * @param Shift $shift
     * @return \Inertia\Response
     */
    public function edit(Shift $shift)
    {
        // Get impact information
        $activeSchedules = $shift->schedules()
            ->where(function ($q) {
                $q->where('date_end', '>=', now())
                  ->orWhereNull('date_end');
            })
            ->count();

        $upcomingAttendances = Attendance::where('shift_id', $shift->shift_id)
            ->where('date', '>=', now()->subDays(7))
            ->count();

        return Inertia::render('Attendance/Shifts/Edit', [
            'shift' => [
                'id' => $shift->shift_id,
                'name' => $shift->name,
                'description' => $shift->description,
                'time_in' => $shift->time_in?->format('H:i'),
                'time_out' => $shift->time_out?->format('H:i'),
                'break_start' => $shift->break_start?->format('H:i'),
                'break_end' => $shift->break_end?->format('H:i'),
                'grace_period' => $shift->grace_period,
                'working_hours' => $shift->getWorkingHours(),
                'is_overnight' => $shift->isOvernight()
            ],
            'impact' => [
                'active_schedules' => $activeSchedules,
                'recent_attendances' => $upcomingAttendances,
                'has_impact' => $activeSchedules > 0 || $upcomingAttendances > 0
            ]
        ]);
    }

    /**
     * Update the specified shift
     *
     * @param Request $request
     * @param Shift $shift
     * @return \Illuminate\Http\RedirectResponse
     */
    public function update(Request $request, Shift $shift)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100', Rule::unique('shifts', 'name')->ignore($shift->shift_id, 'shift_id')],
            'description' => ['nullable', 'string', 'max:500'],
            'time_in' => ['required', 'date_format:H:i'],
            'time_out' => ['required', 'date_format:H:i'],
            'break_start' => ['nullable', 'date_format:H:i'],
            'break_end' => ['nullable', 'date_format:H:i', 'required_with:break_start'],
            'grace_period' => ['nullable', 'integer', 'min:0', 'max:60']
        ]);

        // Additional validation
        $this->validateShiftTimes($validated);

        try {
            DB::beginTransaction();

            // Record old state for audit
            $oldState = $shift->getAttributes();

            // Update shift
            $shift->update([
                'name' => $validated['name'],
                'description' => $validated['description'] ?? null,
                'time_in' => Carbon::createFromFormat('H:i', $validated['time_in']),
                'time_out' => Carbon::createFromFormat('H:i', $validated['time_out']),
                'break_start' => isset($validated['break_start']) 
                    ? Carbon::createFromFormat('H:i', $validated['break_start']) 
                    : null,
                'break_end' => isset($validated['break_end']) 
                    ? Carbon::createFromFormat('H:i', $validated['break_end']) 
                    : null,
                'grace_period' => $validated['grace_period'] ?? 0
            ]);

            // Log the update with changes
            activity()
                ->performedOn($shift)
                ->causedBy(Auth::user())
                ->withProperties([
                    'old' => $oldState,
                    'new' => $shift->getAttributes()
                ])
                ->log('shift.updated');

            DB::commit();

            return redirect()
                ->route('shifts.index')
                ->with('success', 'Shift updated successfully.');

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to update shift', [
                'shift_id' => $shift->shift_id,
                'data' => $validated,
                'error' => $e->getMessage()
            ]);

            return back()
                ->withErrors(['error' => 'Failed to update shift.'])
                ->withInput();
        }
    }

    /**
     * Remove the specified shift
     *
     * @param Shift $shift
     * @return \Illuminate\Http\RedirectResponse
     */
    public function destroy(Shift $shift)
    {
        try {
            // Check if shift is in use
            $schedulesCount = $shift->schedules()->count();
            $attendancesCount = $shift->attendances()->count();

            if ($schedulesCount > 0 || $attendancesCount > 0) {
                return back()->withErrors([
                    'delete' => "Cannot delete shift. It is assigned to {$schedulesCount} schedule(s) and has {$attendancesCount} attendance record(s)."
                ]);
            }

            DB::beginTransaction();

            // Log before deletion
            activity()
                ->performedOn($shift)
                ->causedBy(Auth::user())
                ->withProperties([
                    'shift' => $shift->toArray()
                ])
                ->log('shift.deleted');

            $shift->delete();

            DB::commit();

            return redirect()
                ->route('shifts.index')
                ->with('success', 'Shift deleted successfully.');

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to delete shift', [
                'shift_id' => $shift->shift_id,
                'error' => $e->getMessage()
            ]);

            return back()->withErrors(['error' => 'Failed to delete shift.']);
        }
    }

    /**
     * Validate shift times logic
     *
     * @param array $data
     * @return void
     * @throws \Illuminate\Validation\ValidationException
     */
    private function validateShiftTimes(array $data)
    {
        $timeIn = Carbon::createFromFormat('H:i', $data['time_in']);
        $timeOut = Carbon::createFromFormat('H:i', $data['time_out']);

        // Check if shift duration is reasonable (at least 1 hour, max 24 hours)
        $duration = $timeOut->diffInMinutes($timeIn);
        if ($timeOut < $timeIn) {
            // Overnight shift
            $duration = 1440 - $timeIn->diffInMinutes($timeOut);
        }

        if ($duration < 60) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'time_out' => 'Shift duration must be at least 1 hour.'
            ]);
        }

        if ($duration > 1440) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'time_out' => 'Shift duration cannot exceed 24 hours.'
            ]);
        }

        // Validate break times if provided
        if (isset($data['break_start']) && isset($data['break_end'])) {
            $breakStart = Carbon::createFromFormat('H:i', $data['break_start']);
            $breakEnd = Carbon::createFromFormat('H:i', $data['break_end']);

            // Break must be within shift hours
            if ($timeOut > $timeIn) {
                // Regular shift
                if ($breakStart < $timeIn || $breakEnd > $timeOut) {
                    throw \Illuminate\Validation\ValidationException::withMessages([
                        'break_start' => 'Break times must be within shift hours.'
                    ]);
                }
            }

            // Break duration validation
            $breakDuration = $breakEnd->diffInMinutes($breakStart);
            if ($breakEnd < $breakStart) {
                $breakDuration = 1440 - $breakStart->diffInMinutes($breakEnd);
            }

            if ($breakDuration < 15) {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'break_end' => 'Break duration must be at least 15 minutes.'
                ]);
            }

            if ($breakDuration > 180) {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'break_end' => 'Break duration cannot exceed 3 hours.'
                ]);
            }
        }
    }
}
