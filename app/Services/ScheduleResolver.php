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

            // Build comprehensive schedule details
            return (object)[
                'schedule' => $schedule,
                'shift' => $schedule->shift,
                'isValid' => $this->validateShiftSchedule($schedule->shift, $date),
                'effectiveUntil' => $schedule->date_end,
                'isOverride' => $schedule->is_override ?? false,
                'metadata' => [
                    'isHoliday' => $this->checkHoliday($date, $schedule->employee->company_id) !== null,
                    'isLeave' => $this->checkLeave($employeeId, $date) !== null,
                    'graceMinutes' => $schedule->shift?->grace_period ?? 0
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
    protected function validateShiftSchedule(?Shift $shift, Carbon $date): bool
    {
        if (!$shift || !$shift->time_in || !$shift->time_out) {
            return false;
        }

        // For overnight shifts, ensure duration is reasonable
        if ($shift->isOvernight()) {
            $duration = $shift->getDurationMinutes();
            return $duration > 0 && $duration <= 24 * 60; // Max 24 hours
        }

        return true;
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
            $query = Holiday::whereDate('date', $date);
            
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