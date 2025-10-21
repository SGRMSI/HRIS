<?php

namespace App\Services;

use App\Models\Employee;
use App\Models\EmployeeSchedule;
use App\Models\Holiday;
use App\Models\EmployeeLeave;
use Carbon\Carbon;

class ScheduleResolver
{
    /**
     * Get an employee's schedule for a specific date
     *
     * @param int $employeeId
     * @param string|Carbon $date
     * @return EmployeeSchedule|null
     */
    public function getScheduleForDate(int $employeeId, $date): ?EmployeeSchedule
    {
        $date = $date instanceof Carbon ? $date : Carbon::parse($date);
        
        return EmployeeSchedule::where('employee_id', $employeeId)
            ->where('effective_date', '<=', $date)
            ->orderBy('effective_date', 'desc')
            ->first();
    }

    /**
     * Check if a date is a holiday
     *
     * @param string|Carbon $date
     * @param int|null $companyId
     * @return Holiday|null
     */
    public function checkHoliday($date, ?int $companyId = null): ?Holiday
    {
        $date = $date instanceof Carbon ? $date : Carbon::parse($date);
        
        $query = Holiday::whereDate('date', $date);
        
        if ($companyId) {
            $query->where('company_id', $companyId);
        }

        return $query->first();
    }

    /**
     * Check if an employee is on leave for a specific date
     *
     * @param int $employeeId
     * @param string|Carbon $date
     * @return EmployeeLeave|null
     */
    public function checkLeave(int $employeeId, $date): ?EmployeeLeave
    {
        $date = $date instanceof Carbon ? $date : Carbon::parse($date);

        return EmployeeLeave::where('employee_id', $employeeId)
            ->whereDate('start_date', '<=', $date)
            ->whereDate('end_date', '>=', $date)
            ->where('status', 'approved')
            ->first();
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