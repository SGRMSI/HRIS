<?php

namespace App\Services\Attendance;

use App\Models\AttendanceProcessed;
use App\Models\AttendanceRaw;
use App\Models\AttendanceUploadBatch;
use App\Models\Employee;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class AttendanceProcessService
{
    /**
     * Process raw attendance records into processed format
     *
     * @param AttendanceUploadBatch $batch
     * @return void
     */
    public function processBatch(AttendanceUploadBatch $batch): void
    {
        try {
            DB::beginTransaction();

            // Group raw records by employee name (not AC-No)
            $rows = $batch->raws()
                ->orderBy('time_log')
                ->get()
                ->groupBy(fn($r) => strtolower(trim($r->name)));

            foreach ($rows as $employeeName => $events) {
                // Match employee by name
                $employee = Employee::whereRaw(
                    "TRIM(LOWER(first_name || ' ' || last_name)) = ?", 
                    [$employeeName]
                )->first();
                
                // Try reversed order if not found
                if (!$employee) {
                    $employee = Employee::whereRaw(
                        "TRIM(LOWER(last_name || ' ' || first_name)) = ?", 
                        [$employeeName]
                    )->first();
                }
                
                if (!$employee) {
                    Log::warning("No employee found for name: {$employeeName}", [
                        'batch_id' => $batch->batch_id,
                        'events_count' => $events->count()
                    ]);
                    continue;
                }

                // Get the most recent instance of each state (no exception checking)
                // Group by date first to handle multiple days
                $eventsByDate = $events->groupBy(fn($e) => Carbon::parse($e->time_log)->toDateString());
                
                foreach ($eventsByDate as $date => $dailyEvents) {
                    // For each date, get the most recent instance of each state
                    $clockIn = $dailyEvents
                        ->where('state', 'C/In')
                        ->sortByDesc('time_log')
                        ->first();
                    
                    $clockOut = $dailyEvents
                        ->where('state', 'C/Out')
                        ->sortByDesc('time_log')
                        ->first();
                    
                    $breakStart = $dailyEvents
                        ->where('state', 'OverTime In')
                        ->sortByDesc('time_log')
                        ->first();
                    
                    $breakEnd = $dailyEvents
                        ->where('state', 'OverTime Out')
                        ->sortByDesc('time_log')
                        ->first();

                    // Calculate break minutes if both break start and end exist
                    $breakMinutes = 0;
                    $breakPairs = [];
                    
                    if ($breakStart && $breakEnd) {
                        $breakStartTime = $breakStart->time_log;
                        $breakEndTime = $breakEnd->time_log;
                        
                        if ($breakEndTime->gt($breakStartTime)) {
                            $minutes = abs($breakStartTime->diffInMinutes($breakEndTime, false));
                            $breakMinutes = $minutes;
                            $breakPairs[] = [
                                'start' => $breakStartTime->format('Y-m-d H:i:s'),
                                'end' => $breakEndTime->format('Y-m-d H:i:s'),
                                'minutes' => $minutes
                            ];
                        }
                    }

                    // Calculate total hours
                    $totalMinutes = null;
                    $status = 'Present';
                    $meta = [];

                    $clockInTime = $clockIn?->time_log;
                    $clockOutTime = $clockOut?->time_log;

                    if ($clockInTime && $clockOutTime) {
                        // Calculate minutes worked (always positive)
                        $totalMinutes = abs($clockInTime->diffInMinutes($clockOutTime, false)) - $breakMinutes;

                        if ($totalMinutes < 0) {
                            Log::warning("Negative total minutes calculated", [
                                'employee_id' => $employee->employee_id,
                                'date' => $date,
                                'clock_in' => $clockInTime->format('Y-m-d H:i:s'),
                                'clock_out' => $clockOutTime->format('Y-m-d H:i:s'),
                                'break_minutes' => $breakMinutes
                            ]);
                            $totalMinutes = 0;
                        }
                    } else {
                        $status = 'Incomplete';
                        $meta['warnings'] = [
                            'missing_clock_in' => !$clockInTime,
                            'missing_clock_out' => !$clockOutTime
                        ];
                    }

                    // Add break pairing info to meta
                    if (!empty($breakPairs)) {
                        $meta['breaks'] = $breakPairs;
                    }

                    AttendanceProcessed::updateOrCreate(
                        [
                            'batch_id' => $batch->batch_id,
                            'employee_id' => $employee->employee_id,
                            'date' => $date,
                        ],
                        [
                            'clock_in' => $clockInTime?->format('Y-m-d H:i:s'),
                            'break_out' => $breakPairs[0]['start'] ?? null,
                            'break_in' => $breakPairs[0]['end'] ?? null,
                            'clock_out' => $clockOutTime?->format('Y-m-d H:i:s'),
                            'total_hours' => $totalMinutes ? round($totalMinutes / 60, 2) : null,
                            'break_minutes' => $breakMinutes,
                            'status' => $status,
                            'meta' => $meta,
                            'created_at' => now(),
                        ]
                    );
                }
            }

            $batch->update([
                'status' => 'processed',
                'processed_rows' => AttendanceProcessed::where('batch_id', $batch->batch_id)->count(),
            ]);

            DB::commit();

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to process attendance batch', [
                'batch_id' => $batch->batch_id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            $batch->update([
                'status' => 'failed',
                'meta' => array_merge($batch->meta ?? [], [
                    'error' => $e->getMessage(),
                    'error_type' => get_class($e)
                ])
            ]);

            throw $e;
        }
    }

    /**
     * Check if a batch is eligible for processing
     *
     * @param AttendanceUploadBatch $batch
     * @return array
     */
    public function validateBatchForProcessing(AttendanceUploadBatch $batch): array
    {
        $errors = [];

        if ($batch->status !== 'imported') {
            $errors[] = "Batch must be in 'imported' status to process";
        }

        if ($batch->raws()->count() === 0) {
            $errors[] = "Batch contains no raw records to process";
        }

        return $errors;
    }
}