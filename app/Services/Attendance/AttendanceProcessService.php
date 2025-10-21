<?php

namespace App\Services\Attendance;

use App\Models\AttendanceProcessed;
use App\Models\AttendanceRaw;
use App\Models\AttendanceUploadBatch;
use App\Models\Employee;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class AttendanceProcessService
{
    /**
     * Process raw attendance records into processed format
     *
     * @param AttendanceUploadBatch $batch
     * @return Collection
     */
    public function processBatch(AttendanceUploadBatch $batch): Collection
    {
        $raw = $batch->rawRecords;
        $processed = collect();

        // Group raw records by employee and date
        $grouped = $raw->groupBy(function ($record) {
            return $record->employee_number . '_' . $record->log_date;
        });

        foreach ($grouped as $key => $records) {
            $processed->push($this->processEmployeeDay($records));
        }

        return $processed;
    }

    /**
     * Process attendance records for a single employee's day
     *
     * @param Collection $records
     * @return AttendanceProcessed
     */
    protected function processEmployeeDay(Collection $records): AttendanceProcessed
    {
        // Sort records by timestamp
        $records = $records->sortBy('log_time');

        // Initialize processed record
        $processed = new AttendanceProcessed();
        
        // Match employee
        $processed->employee_id = $this->matchEmployee($records->first()->employee_number);
        
        // Set date
        $processed->attendance_date = $records->first()->log_date;

        // Calculate time in, time out, and breaks
        // This will be implemented based on specific business rules

        return $processed;
    }

    /**
     * Match employee by their employee number
     *
     * @param string $employeeNumber
     * @return int|null
     */
    protected function matchEmployee(string $employeeNumber): ?int
    {
        $employee = Employee::where('employee_number', $employeeNumber)->first();
        return $employee?->id;
    }
}