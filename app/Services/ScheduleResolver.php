<?php

namespace App\Services;

use App\Models\Employee;
use App\Models\EmployeeSchedule;
use App\Models\Holiday;
use App\Models\EmployeeLeave;
use App\Models\Shift;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;

class ScheduleResolver
{
    /**
     * Get an employee's schedule for a specific date with all relevant details
     * Handles both indefinite schedules and temporary overrides
     *
     * @param int $employeeId
     * @param string|Carbon $date
     * @return object|null
     */
    public function getScheduleForDate(int $employeeId, $date)
    {
        $date = $date instanceof Carbon ? $date : Carbon::parse($date);
        $cacheKey = "schedule:{$employeeId}:{$date->format('Y-m-d')}";
        
        return Cache::remember($cacheKey, now()->addMinutes(60), function () use ($employeeId, $date) {
            // Get base schedule or temporary override
            $schedule = EmployeeSchedule::where('employee_id', $employeeId)
                ->where('date_start', '<=', $date)
                ->where(function ($query) use ($date) {
                    $query->whereNull('date_end') // Indefinite schedules
                        ->orWhere('date_end', '>=', $date); // Active fixed periods
                })
                ->orderByDesc('date_start') // Latest effective date first
                ->orderByDesc('id') // Latest override wins for same date
                ->with(['shift', 'employee.company'])
                ->first();

            if (!$schedule) {
                return null;
            }

            // Calculate timing details if schedule is valid
            $gracePeriod = null;
            if ($schedule->shift && $this->validateShiftSchedule($schedule->shift, $date)) {
                $gracePeriod = $this->calculateGracePeriod($schedule->shift, $date);
            }

            // Build comprehensive schedule details
            return (object)[
                'schedule' => $schedule,
                'shift' => $schedule->shift,
                'isValid' => $this->validateShiftSchedule($schedule->shift, $date),
                'effectiveUntil' => $schedule->date_end,
                'isOverride' => $schedule->is_override ?? false,
                'timing' => $gracePeriod,
                'metadata' => [
                    'isHoliday' => $this->checkHoliday($date, $schedule->employee->company_id) !== null,
                    'isLeave' => $this->checkLeave($employeeId, $date) !== null,
                    'isOvernight' => $schedule->shift?->isOvernight() ?? false
                ]
            ];
        });
    }

    /**
     * Validate if a shift schedule configuration is valid
     *
     * @param Shift|null $shift
     * @param Carbon $date
     * @return bool
     */
    /**
     * Validate shift schedule configuration and timing rules
     *
     * @param Shift|null $shift
     * @param Carbon $date
     * @return bool
     */
    protected function validateShiftSchedule(?Shift $shift, Carbon $date): bool
    {
        if (!$shift || !$shift->time_in || !$shift->time_out) {
            return false;
        }

        // Convert times to Carbon for comparison
        $timeIn = Carbon::parse($shift->time_in->format('H:i:s'));
        $timeOut = Carbon::parse($shift->time_out->format('H:i:s'));
        
        // For overnight shifts
        if ($shift->isOvernight()) {
            $timeOut->addDay(); // Add a day to make duration calculation correct
            $duration = $timeOut->diffInMinutes($timeIn);
            
            // Validate duration (minimum 2 hours, maximum 16 hours for overnight)
            if ($duration < 120 || $duration > 960) {
                return false;
            }
        } else {
            // For regular shifts, ensure time_out is after time_in
            if ($timeIn >= $timeOut) {
                return false;
            }
            
            // Regular shift should be between 2 and 12 hours
            $duration = $timeOut->diffInMinutes($timeIn);
            if ($duration < 120 || $duration > 720) {
                return false;
            }
        }

        return true;
    }

    /**
     * Calculate grace period window for a given schedule
     *
     * @param Shift $shift
     * @param Carbon $date
     * @return object
     */
    protected function calculateGracePeriod(Shift $shift, Carbon $date): object
    {
        $timeIn = Carbon::parse($date->format('Y-m-d') . ' ' . $shift->time_in->format('H:i:s'));
        $graceEnd = $timeIn->copy()->addMinutes($shift->grace_period ?? 0);
        
        // Handle overnight shifts
        if ($shift->isOvernight() && $timeIn->format('H') >= 18) { // Evening shift
            $timeIn->subDay();
            $graceEnd->subDay();
        }
        
        return (object)[
            'scheduled_time' => $timeIn,
            'grace_end' => $graceEnd,
            'grace_minutes' => $shift->grace_period ?? 0
        ];
    }

    /**
     * Check if a date is a holiday, including both company-specific and national holidays
     * Cached to improve performance
     *
     * @param string|Carbon $date
     * @param int|null $companyId
     * @return Holiday|null
     */
    public function checkHoliday($date, ?int $companyId = null): ?Holiday
    {
        $date = $date instanceof Carbon ? $date : Carbon::parse($date);
        $cacheKey = "holiday:{$companyId}:{$date->format('Y-m-d')}";
        
        return Cache::remember($cacheKey, now()->addDay(), function () use ($date, $companyId) {
            $query = Holiday::query()
                ->whereDate('date', '=', $date->format('Y-m-d'));
            
            if ($companyId) {
                $query->where(function ($q) use ($companyId) {
                    $q->where('company_id', $companyId)
                      ->orWhere('is_national', true);
                });
            }

            return $query->first();
        });
    }

    /**
     * Check if an employee is on approved leave for a specific date
     * Cached to improve performance
     *
     * @param int $employeeId
     * @param string|Carbon $date
     * @return EmployeeLeave|null
     */
    public function checkLeave(int $employeeId, $date): ?EmployeeLeave
    {
        $date = $date instanceof Carbon ? $date : Carbon::parse($date);
        $cacheKey = "leave:{$employeeId}:{$date->format('Y-m-d')}";
        
        return Cache::remember($cacheKey, now()->addHour(), function () use ($employeeId, $date) {
            return EmployeeLeave::where('employee_id', $employeeId)
                ->whereDate('start_date', '<=', $date)
                ->whereDate('end_date', '>=', $date)
                ->where('status', 'approved')
                ->first();
        });
    }

    /**
     * Get the working status for an employee on a specific date
     *
     * @param int $employeeId
     * @param string|Carbon $date
     * @return array
     */
    public function getWorkingStatus(int $employeeId, $date): array
    {
        $employee = Employee::findOrFail($employeeId);
        $date = $date instanceof Carbon ? $date : Carbon::parse($date);

        $schedule = $this->getScheduleForDate($employeeId, $date);
        $holiday = $this->checkHoliday($date, $employee->company_id);
        $leave = $this->checkLeave($employeeId, $date);

        return [
            'has_schedule' => !is_null($schedule),
            'schedule' => $schedule,
            'is_holiday' => !is_null($holiday),
            'holiday' => $holiday,
            'is_on_leave' => !is_null($leave),
            'leave' => $leave,
            'should_work' => !is_null($schedule) && is_null($holiday) && is_null($leave)
        ];
    }
}