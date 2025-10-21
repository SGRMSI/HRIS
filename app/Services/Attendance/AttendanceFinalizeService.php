<?php

namespace App\Services\Attendance;

use App\Models\Attendance;
use App\Models\AttendanceProcessed;
use App\Models\AttendanceUploadBatch;
use App\Services\ScheduleResolver;
use Illuminate\Support\Collection;

class AttendanceFinalizeService
{
    protected $scheduleResolver;

    public function __construct(ScheduleResolver $scheduleResolver)
    {
        $this->scheduleResolver = $scheduleResolver;
    }

    /**
     * Finalize a batch of processed attendance records
     *
     * @param AttendanceUploadBatch $batch
     * @return Collection
     */
    public function finalizeBatch(AttendanceUploadBatch $batch): Collection
    {
        $processed = $batch->processedRecords;
        $finalized = collect();

        foreach ($processed as $record) {
            $finalized->push($this->finalizeRecord($record));
        }

        $batch->update(['status' => 'finalized']);
        return $finalized;
    }

    /**
     * Finalize a single processed attendance record
     *
     * @param AttendanceProcessed $processed
     * @return Attendance
     */
    public function finalizeRecord(AttendanceProcessed $processed): Attendance
    {
        // Get employee's schedule for the date
        $schedule = $this->scheduleResolver->getScheduleForDate(
            $processed->employee_id,
            $processed->attendance_date
        );

        // Create finalized attendance record
        $attendance = new Attendance([
            'employee_id' => $processed->employee_id,
            'attendance_date' => $processed->attendance_date,
            'shift_id' => $schedule?->shift_id,
            'time_in' => $processed->time_in,
            'time_out' => $processed->time_out,
            'break_minutes' => $processed->break_minutes,
            'status' => $this->determineStatus($processed, $schedule),
            // Additional fields will be set based on business rules
        ]);

        $attendance->save();
        return $attendance;
    }

    /**
     * Determine attendance status based on schedule and actual times
     *
     * @param AttendanceProcessed $processed
     * @param mixed $schedule
     * @return string
     */
    protected function determineStatus($processed, $schedule): string
    {
        // Status determination logic based on:
        // - Schedule comparison
        // - Holiday checking
        // - Leave status
        // This will be implemented based on specific business rules
        return 'pending';
    }
}