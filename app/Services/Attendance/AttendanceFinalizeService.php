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
    
    // Thresholds for approval requirements
    const OVERTIME_APPROVAL_THRESHOLD = 2; // hours
    const UNDERTIME_APPROVAL_THRESHOLD = 2; // hours
    
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
        $scheduleData = $this->scheduleResolver->getScheduleForDate(
            $processed->employee_id,
            Carbon::parse($processed->date)
        );

        // Extract the actual EmployeeSchedule model and Shift model
        $schedule = $scheduleData?->schedule; // This is the EmployeeSchedule model
        $shift = $scheduleData?->shift; // This is the Shift model

        // Use the workingStatus method from ScheduleResolver for comprehensive check
        $workingStatus = $this->scheduleResolver->getWorkingStatus(
            $processed->employee_id,
            Carbon::parse($processed->date)
        );

        $isHoliday = $workingStatus['is_holiday'];
        $isOnLeave = $workingStatus['is_on_leave'];
        $holiday = $workingStatus['holiday'];
        $leave = $workingStatus['leave'];

        // Determine if it's a working day
        $isWorkingDay = !$isHoliday && !$isOnLeave;

        // Determine status - pass the schedule data object, not the model
        $status = $this->determineStatus($processed, $scheduleData, $isHoliday, $isOnLeave);

        return (object) [
            'schedule' => $schedule, // EmployeeSchedule model
            'shift' => $shift, // Shift model
            'isHoliday' => $isHoliday,
            'isOnLeave' => $isOnLeave,
            'isWorkingDay' => $isWorkingDay,
            'status' => $status,
            'holiday' => $holiday,
            'leave' => $leave
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
            // Get all items with necessary relations
            $items = AttendanceProcessed::with([
                'employee.company',
                'batch' // For audit trail
            ])->whereIn('processed_id', $processedIds)
                ->get();

            // Track batch processing
            $batchGroups = $items->groupBy('batch_id');
            foreach ($batchGroups as $batchId => $batchItems) {
                activity()
                    ->performedOn($batchItems->first()->batch)
                    ->causedBy($userId)
                    ->withProperties([
                        'processed_count' => $batchItems->count(),
                        'total_count' => $batchItems->first()->batch->total_records
                    ])
                    ->log('Finalizing attendance records');
            }

            // Process individual records
            foreach ($items as $processed) {
                // Get resolved schedule and status details
                $resolved = $this->resolveAttendanceDetails($processed);

                // Skip time calculations for holidays and leaves
                [$lateMinutes, $overtimeHours, $undertimeHours] = 
                    $resolved->isWorkingDay 
                        ? $this->compareToShift($resolved->shift, $processed)
                        : [0, 0, 0];

                // Create or update attendance record
                $attendance = Attendance::updateOrCreate(
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
                        'late_minutes' => $lateMinutes,
                        'overtime_hours' => $overtimeHours,
                        'undertime_hours' => $undertimeHours,
                        'status' => $resolved->status,
                        'remarks' => $this->generateRemarks($processed, $resolved),
                        'created_by' => $userId,
                        'created_at' => now(),
                        'requires_approval' => $this->requiresApproval($overtimeHours, $undertimeHours),
                        'holiday_id' => $resolved->holiday->id ?? null,
                        'leave_id' => $resolved->leave->id ?? null
                    ]
                );

                // Log the attendance creation/update
                activity()
                    ->performedOn($attendance)
                    ->causedBy($userId)
                    ->withProperties([
                        'status' => $resolved->status,
                        'source_id' => $processed->processed_id,
                        'batch_id' => $processed->batch_id,
                        'changes' => array_diff_assoc($attendance->getChanges(), $attendance->getOriginal())
                    ])
                    ->log('Attendance record ' . ($attendance->wasRecentlyCreated ? 'created' : 'updated'));

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

        // Get the date only (Y-m-d format) - extract from string to avoid Carbon object issues
        if ($attendance->date instanceof \Carbon\Carbon) {
            $dateOnly = $attendance->date->format('Y-m-d');
        } else {
            // If it's a string, extract just the date part
            $dateOnly = substr($attendance->date, 0, 10);
        }
        
        \Log::info('Finalize Debug', [
            'raw_date' => $attendance->date,
            'date_only' => $dateOnly,
            'shift_time_in_raw' => $shift->getAttributes()['time_in'],
        ]);
        
        // Clock in/out are already Carbon datetime objects - just use them directly
        $clockIn = $attendance->clock_in instanceof \Carbon\Carbon 
            ? $attendance->clock_in 
            : Carbon::parse($attendance->clock_in);
            
        $clockOut = $attendance->clock_out instanceof \Carbon\Carbon 
            ? $attendance->clock_out 
            : Carbon::parse($attendance->clock_out);

        // Get raw shift time strings from database attributes (bypass the datetime cast)
        // These are stored as "08:00", "17:00" format
        $shiftTimeIn = $shift->getAttributes()['time_in'] . ':00';
        $shiftTimeOut = $shift->getAttributes()['time_out'] . ':00';
        
        \Log::info('Parsing shift times', [
            'date_only' => $dateOnly,
            'shift_time_in' => $shiftTimeIn,
            'concatenated' => $dateOnly . ' ' . $shiftTimeIn,
        ]);
        
        // Create shift start/end times on the attendance date
        $shiftStart = Carbon::parse($dateOnly . ' ' . $shiftTimeIn);
        $shiftEnd = Carbon::parse($dateOnly . ' ' . $shiftTimeOut);
        
        // For overnight shifts, adjust end times forward a day
        if ($shift->isOvernight()) {
            $shiftEnd->addDay();
            
            // If actual clock out is before clock in, it must be next day
            if ($clockOut->lt($clockIn)) {
                $clockOut->addDay();
            }
            
            // Special case: clock out next morning but still tied to prev day's shift
            $attendanceDate = Carbon::parse($dateOnly);
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
            return $attendance->clock_in ? 'holiday_worked' : 'holiday';
        }

        // Check for leave
        if ($isOnLeave) {
            return $attendance->clock_in ? 'leave_worked' : 'on_leave';
        }

        // Handle invalid schedule case
        if (!$schedule || !$schedule->shift) {
            return 'no_schedule';
        }

        // Handle incomplete attendance
        if (!$attendance->clock_in || !$attendance->clock_out) {
            return 'incomplete';
        }

        // Handle overnight shifts and lateness
        $shift = $schedule->shift;
        
        // Get just the date portion (Y-m-d) to avoid double time specification
        $dateOnly = $attendance->date instanceof \Carbon\Carbon 
            ? $attendance->date->format('Y-m-d')
            : substr($attendance->date, 0, 10);
            
        // Get shift time from raw attributes
        $shiftTimeIn = $shift->getAttributes()['time_in'] . ':00';
        
        $scheduledClockIn = Carbon::parse($dateOnly . ' ' . $shiftTimeIn);
        
        if ($shift->isOvernight()) {
            $scheduledClockIn->subDay();
        }

        $actualClockIn = $attendance->clock_in instanceof \Carbon\Carbon
            ? $attendance->clock_in
            : Carbon::parse($attendance->clock_in);
        
        // Use shift's grace period
        $graceEnd = $scheduledClockIn->copy()->addMinutes($shift->grace_period ?? 0);
        
        if ($actualClockIn->gt($graceEnd)) {
            return 'late';
        }

        return 'present';
    }

    /**
     * Generate remarks based on attendance and schedule
     *
     * @param AttendanceProcessed $attendance
     * @param mixed $schedule
     * @return string|null
     */
    protected function generateRemarks(AttendanceProcessed $attendance, $resolved): ?string
    {
        $remarks = [];

        if (!$resolved->schedule) {
            $remarks[] = 'No assigned schedule found';
        }

        if ($attendance->status === 'incomplete') {
            $remarks[] = 'Missing clock records';
        }

        if ($resolved->isHoliday && $attendance->clock_in) {
            $remarks[] = 'Worked on holiday';
        }

        if ($resolved->isOnLeave && $attendance->clock_in) {
            $remarks[] = 'Worked while on leave';
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

    /**
     * Determine if attendance record requires approval
     * 
     * @param float $overtimeHours
     * @param float $undertimeHours
     * @return bool
     */
    protected function requiresApproval(float $overtimeHours, float $undertimeHours): bool
    {
        return $overtimeHours >= self::OVERTIME_APPROVAL_THRESHOLD ||
               $undertimeHours >= self::UNDERTIME_APPROVAL_THRESHOLD;
    }

    /**
     * Handle error states and logging
     * 
     * @param \Exception $e
     * @param array $context
     * @throws \Exception
     */
    protected function handleError(\Exception $e, array $context = []): void
    {
        Log::error('Attendance finalization failed', array_merge([
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString()
        ], $context));

        if (isset($context['batch_id'])) {
            activity()
                ->performedOn($context['batch'])
                ->withProperties([
                    'error' => $e->getMessage(),
                    'processed_ids' => $context['processed_ids'] ?? []
                ])
                ->log('Attendance finalization failed');
        }

        throw $e;
    }
}