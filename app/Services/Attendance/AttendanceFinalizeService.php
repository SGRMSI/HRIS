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
            $items = AttendanceProcessed::with(['employee'])
                ->whereIn('id', $processedIds)
                ->get();

            foreach ($items as $processed) {
                $schedule = $this->scheduleResolver->getScheduleForDate(
                    $processed->employee_id,
                    $processed->date
                );

                $shift = $schedule?->shift;
                [$lateMinutes, $overtimeHours, $undertimeHours] = $this->compareToShift($shift, $processed);

                Attendance::updateOrCreate(
                    [
                        'employee_id' => $processed->employee_id,
                        'date' => $processed->date,
                    ],
                    [
                        'shift_id' => $schedule?->shift_id,
                        'clock_in' => $processed->clock_in,
                        'break_out' => $processed->break_out,
                        'break_in' => $processed->break_in,
                        'clock_out' => $processed->clock_out,
                        'total_hours' => $processed->total_hours,
                        'break_minutes' => $processed->break_minutes,
                        'late_minutes' => $lateMinutes,
                        'overtime_hours' => $overtimeHours,
                        'undertime_hours' => $undertimeHours,
                        'status' => $this->determineStatus($processed, $schedule),
                        'remarks' => $this->generateRemarks($processed, $schedule),
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
    protected function determineStatus(AttendanceProcessed $attendance, $schedule): string
    {
        if (!$schedule) {
            return 'No Schedule';
        }

        if ($attendance->status === 'Incomplete') {
            return 'Incomplete';
        }

        if ($this->scheduleResolver->checkLeave($attendance->employee_id, $attendance->date)) {
            return 'On Leave';
        }

        if ($this->scheduleResolver->checkHoliday($attendance->date, $attendance->employee->company_id)) {
            return 'Holiday';
        }

        // Default to Present if all basic requirements are met
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