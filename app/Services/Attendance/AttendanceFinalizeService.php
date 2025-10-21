<?php

namespace App\Services\Attendance;

use App\Models\Attendance;
use App\Models\AttendanceProcessed;
use App\Models\Shift;
use App\Services\ScheduleResolver;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class AttendanceFinalizeService
{
    protected $scheduleResolver;
    
    public function __construct(ScheduleResolver $scheduleResolver)
    {
        $this->scheduleResolver = $scheduleResolver;
    }

    /**
     * Resolve attendance details including schedule, status and working day info
     * 
     * @param AttendanceProcessed $processed
     * @return object
     */
    protected function resolveAttendanceDetails(AttendanceProcessed $processed): object
    {
        // Get employee's schedule for the date
        $schedule = $this->scheduleResolver->getScheduleForDate(
            $processed->employee_id,
            Carbon::parse($processed->date)
        );

        $shift = $schedule?->shift;

        // Check if it's a holiday
        $isHoliday = $this->scheduleResolver->isHoliday(
            Carbon::parse($processed->date),
            $processed->employee->company_id
        );

        // Check if employee is on leave
        $isOnLeave = $this->scheduleResolver->isOnLeave(
            $processed->employee_id,
            Carbon::parse($processed->date)
        );

        // Determine if it's a working day
        $isWorkingDay = !$isHoliday && !$isOnLeave;

        // Determine status
        $status = $this->determineStatus($processed, $schedule, $isHoliday, $isOnLeave);

        return (object) [
            'schedule' => $schedule,
            'shift' => $shift,
            'isHoliday' => $isHoliday,
            'isOnLeave' => $isOnLeave,
            'isWorkingDay' => $isWorkingDay,
            'status' => $status
        ];
    }

    /**
     * Push processed records to final attendance
     *
     * @param array $processedIds
     * @param int $userId
     * @return void
     */
    public function push(array $processedIds, int $userId): void
    {
        DB::beginTransaction();
        
        try {
            $items = AttendanceProcessed::with(['employee.company'])
                ->whereIn('id', $processedIds)
                ->get();

            foreach ($items as $processed) {
                // Get resolved schedule and status details
                $resolved = $this->resolveAttendanceDetails($processed);

                // Skip time calculations for holidays and leaves
                [$lateMinutes, $overtimeHours, $undertimeHours] = 
                    $resolved->isWorkingDay 
                        ? $this->compareToShift($resolved->shift, $processed)
                        : [0, 0, 0];

                Attendance::updateOrCreate(
                    [
                        'employee_id' => $processed->employee_id,
                        'date' => $processed->date,
                    ],
                    [
                        'shift_id' => $resolved->schedule?->shift_id,
                        'clock_in' => $processed->clock_in,
                        'break_out' => $processed->break_out,
                        'break_in' => $processed->break_in,
                        'clock_out' => $processed->clock_out,
                        'total_hours' => $processed->total_hours,
                        'break_minutes' => $processed->break_minutes,
                        'late_minutes' => $lateMinutes,
                        'overtime_hours' => $overtimeHours,
                        'undertime_hours' => $undertimeHours,
                        'status' => $resolved->status,
                        'remarks' => $this->generateRemarks($processed, $resolved),
                        'created_by' => $userId,
                        'created_at' => now(),
                    ]
                );

                // Update processed record status
                $processed->update(['status' => 'finalized']);
            }

            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to finalize attendance records', [
                'processed_ids' => $processedIds,
                'error' => $e->getMessage()
            ]);
            throw $e;
        }
    }

    /**
     * Compare attendance times against shift schedule
     *
     * @param Shift|null $shift
     * @param AttendanceProcessed $attendance
     * @return array
     */
    protected function compareToShift(?Shift $shift, AttendanceProcessed $attendance): array
    {
        if (!$shift || !$attendance->clock_in || !$attendance->clock_out) {
            return [0, 0, 0];
        }

        $attendanceDate = Carbon::parse($attendance->date);
        $clockIn = Carbon::parse($attendance->clock_in);
        $clockOut = Carbon::parse($attendance->clock_out);

        // Get shift times as time strings to avoid date influence
        $shiftStart = Carbon::parse($shift->time_in->format('H:i:s'));
        $shiftEnd = Carbon::parse($shift->time_out->format('H:i:s'));
        
        // Align all times to the attendance date for comparison
        $shiftStart->setDateFrom($attendanceDate);
        $shiftEnd->setDateFrom($attendanceDate);
        
        // For overnight shifts, adjust end times forward a day
        if ($shift->isOvernight()) {
            $shiftEnd->addDay();
            
            // If actual clock out is before clock in, it must be next day
            if ($clockOut->lt($clockIn)) {
                $clockOut->addDay();
            }
            
            // Special case: clock out next morning but still tied to prev day's shift
            if (!$clockOut->isSameDay($attendanceDate) && $clockOut->format('H:i:s') <= $shiftEnd->format('H:i:s')) {
                $clockOut->subDay(); // Align to attendance date
            }
        }

        // Calculate late minutes (considering grace period)
        $lateMinutes = 0;
        $graceEnd = $shiftStart->copy()->addMinutes($shift->grace_period ?? 0);
        if ($clockIn->gt($graceEnd)) {
            $lateMinutes = $clockIn->diffInMinutes($shiftStart);
        }

        // Calculate overtime/undertime (based on actual worked time vs shift duration)
        $workedMinutes = $clockOut->diffInMinutes($clockIn);
        $expectedMinutes = $shift->getDurationMinutes();
        
        $overtimeHours = 0;
        $undertimeHours = 0;
        
        if ($workedMinutes > $expectedMinutes) {
            $overtimeHours = round(($workedMinutes - $expectedMinutes) / 60, 2);
        } else {
            $undertimeHours = round(($expectedMinutes - $workedMinutes) / 60, 2);
        }

        return [$lateMinutes, $overtimeHours, $undertimeHours];
    }

    /**
     * Determine the final attendance status
     *
     * @param AttendanceProcessed $attendance
     * @param mixed $schedule
     * @return string
     */
    protected function determineStatus(
        AttendanceProcessed $attendance,
        $schedule,
        bool $isHoliday,
        bool $isOnLeave
    ): string {
        // Check for holiday first
        if ($isHoliday) {
            return $attendance->clock_in ? 'Holiday - Worked' : 'Holiday';
        }

        // Check for leave
        if ($isOnLeave) {
            return $attendance->clock_in ? 'Leave - Worked' : 'On Leave';
        }

        // Handle invalid schedule case
        if (!$schedule || !$schedule->shift) {
            return 'No Schedule';
        }

        // Handle incomplete attendance
        if (!$attendance->clock_in || !$attendance->clock_out) {
            return 'Incomplete';
        }

        // Handle overnight shifts and lateness
        $shift = $schedule->shift;
        $scheduledClockIn = Carbon::parse($attendance->date . ' ' . $shift->time_in);
        
        if ($shift->isOvernight() && $shift->time_in > $shift->time_out) {
            $scheduledClockIn->subDay();
        }

        $actualClockIn = Carbon::parse($attendance->clock_in);
        $lateThreshold = (int) config('attendance.late_threshold_minutes', 1);

        if ($actualClockIn->diffInMinutes($scheduledClockIn, false) > $lateThreshold) {
            return 'Late';
        }

        return 'Present';
    }

    /**
     * Generate remarks based on attendance and schedule
     *
     * @param AttendanceProcessed $attendance
     * @param mixed $schedule
     * @return string|null
     */
    protected function generateRemarks(AttendanceProcessed $attendance, $schedule): ?string
    {
        $remarks = [];

        if (!$schedule) {
            $remarks[] = 'No assigned schedule found';
        }

        if ($attendance->status === 'Incomplete') {
            $remarks[] = 'Missing clock records';
        }

        if ($meta = $attendance->meta) {
            if (!empty($meta['warnings'])) {
                foreach ($meta['warnings'] as $warning => $details) {
                    $remarks[] = str_replace('_', ' ', ucfirst($warning));
                }
            }
        }

        return !empty($remarks) ? implode('; ', $remarks) : null;
    }
}