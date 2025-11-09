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
     * Handles intelligent merging of overlapping attendance data:
     * - Example: User uploads Oct 1-15 (Batch 1), then Oct 14-31 (Batch 2)
     * - System detects overlap (Oct 14-15)
     * - Merges raw data from both batches for overlapping dates
     * - Deduplicates by sequence (C/In, OverTime In, OverTime Out, C/Out)
     * - Processes non-overlapping dates normally (Oct 1-13, Oct 16-31)
     *
     * @param AttendanceUploadBatch $batch
     * @return void
     */
    public function processBatch(AttendanceUploadBatch $batch): void
    {
        try {
            DB::beginTransaction();

            // Delete existing processed records for this batch to avoid duplicates on reprocess
            AttendanceProcessed::where('batch_id', $batch->batch_id)->delete();
            
            Log::info("Deleted existing processed records for batch", [
                'batch_id' => $batch->batch_id,
            ]);

            // Get date range of this batch
            $batchDateRange = $batch->raws()
                ->selectRaw('MIN(DATE(time_log)) as min_date, MAX(DATE(time_log)) as max_date')
                ->first();
            
            // Find overlapping dates from other processed batches
            $overlappingDates = [];
            if ($batchDateRange->min_date && $batchDateRange->max_date) {
                $overlappingDates = AttendanceProcessed::whereBetween('date', [
                        $batchDateRange->min_date, 
                        $batchDateRange->max_date
                    ])
                    ->where('batch_id', '!=', $batch->batch_id)
                    ->distinct()
                    ->pluck('date')
                    ->map(fn($d) => Carbon::parse($d)->toDateString())
                    ->toArray();
                
                if (!empty($overlappingDates)) {
                    Log::info("Found overlapping dates with other batches", [
                        'batch_id' => $batch->batch_id,
                        'overlapping_dates' => $overlappingDates,
                        'count' => count($overlappingDates)
                    ]);
                }
            }

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

                // For overlapping dates, merge raw data from all batches
                $mergedEvents = $events;
                if (!empty($overlappingDates)) {
                    // Get raw data from other batches for this employee on overlapping dates
                    $additionalRaws = AttendanceRaw::where('name', $employeeName)
                        ->where('batch_id', '!=', $batch->batch_id)
                        ->whereIn(DB::raw('DATE(time_log)'), $overlappingDates)
                        ->orderBy('time_log')
                        ->get();
                    
                    if ($additionalRaws->count() > 0) {
                        Log::info("Merging overlapping data for employee", [
                            'employee_name' => $employeeName,
                            'employee_id' => $employee->employee_id,
                            'current_batch' => $batch->batch_id,
                            'additional_records' => $additionalRaws->count(),
                            'overlapping_dates' => $overlappingDates
                        ]);
                        
                        // Merge the collections
                        $mergedEvents = $events->merge($additionalRaws)->sortBy('time_log');
                        
                        // Delete old processed records for this employee on overlapping dates
                        AttendanceProcessed::where('employee_id', $employee->employee_id)
                            ->whereIn('date', $overlappingDates)
                            ->where('batch_id', '!=', $batch->batch_id)
                            ->delete();
                    }
                }

                // Process attendance by pairing Clock In -> Clock Out sequences
                // Deduplicate events based on sequence (consecutive same states)
                $deduplicatedEvents = $this->deduplicateEvents($mergedEvents);
                
                // Get all clock-in events sorted by time
                $clockInEvents = $deduplicatedEvents
                    ->where('state', 'C/In')
                    ->sortBy('time_log')
                    ->values();
                
                // Process each clock-in and find its corresponding clock-out
                foreach ($clockInEvents as $clockIn) {
                    $clockInTime = $clockIn->time_log;
                    $attendanceDate = $clockInTime->toDateString();
                    
                    // Find the next clock-out AFTER this clock-in
                    $clockOut = $deduplicatedEvents
                        ->where('state', 'C/Out')
                        ->filter(fn($e) => $e->time_log->gt($clockInTime))
                        ->sortBy('time_log')
                        ->first();
                    
                    $clockOutTime = $clockOut?->time_log;
                    
                    // Validate sequence: Check if there's another C/In between this C/In and C/Out
                    // If yes, it means employee forgot to clock out and the C/Out belongs to next shift
                    if ($clockOutTime) {
                        $nextClockIn = $deduplicatedEvents
                            ->where('state', 'C/In')
                            ->filter(fn($e) => $e->time_log->gt($clockInTime) && $e->time_log->lt($clockOutTime))
                            ->sortBy('time_log')
                            ->first();
                        
                        if ($nextClockIn) {
                            // There's another clock-in before the clock-out, which means forgot to clock out
                            Log::warning("Missing clock-out detected", [
                                'employee_id' => $employee->employee_id,
                                'employee_name' => $employeeName,
                                'clock_in' => $clockInTime->format('Y-m-d H:i:s'),
                                'next_clock_in' => $nextClockIn->time_log->format('Y-m-d H:i:s'),
                                'ignored_clock_out' => $clockOutTime->format('Y-m-d H:i:s')
                            ]);
                            
                            // Invalidate this clock-out, treat as missing
                            $clockOut = null;
                            $clockOutTime = null;
                        }
                    }
                    
                    // Find breaks - check even if no clock-out exists
                    $breakStart = null;
                    $breakEnd = null;
                    
                    // Define the time range for finding breaks
                    $breakRangeStart = $clockInTime;
                    $breakRangeEnd = $clockOutTime ?? Carbon::now(); // If no clock out, use current time
                    
                    // Get breaks that fall after clock-in
                    // Normal sequence: OverTime In (break start) -> OverTime Out (break end)
                    // But handle reversed sequence: OverTime Out -> OverTime In (employee mistake)
                    $overtimeIn = $deduplicatedEvents
                        ->where('state', 'OverTime In')
                        ->filter(fn($e) => $e->time_log->gte($breakRangeStart) && $e->time_log->lte($breakRangeEnd))
                        ->sortBy('time_log')
                        ->first();
                    
                    $overtimeOut = $deduplicatedEvents
                        ->where('state', 'OverTime Out')
                        ->filter(fn($e) => $e->time_log->gte($breakRangeStart) && $e->time_log->lte($breakRangeEnd))
                        ->sortBy('time_log')
                        ->first();
                    
                    // Track if break sequence is reversed
                    $breakSequenceReversed = false;
                    
                    // Determine correct order based on timestamps
                    if ($overtimeIn && $overtimeOut) {
                        if ($overtimeIn->time_log->lt($overtimeOut->time_log)) {
                            // Normal order: OverTime In first, then OverTime Out
                            $breakStart = $overtimeIn;
                            $breakEnd = $overtimeOut;
                        } else {
                            // Reversed order: OverTime Out first, then OverTime In (employee pressed wrong buttons)
                            $breakStart = $overtimeOut;
                            $breakEnd = $overtimeIn;
                            $breakSequenceReversed = true;
                        }
                    } elseif ($overtimeIn) {
                        $breakStart = $overtimeIn;
                    } elseif ($overtimeOut) {
                        $breakStart = $overtimeOut;
                    }

                    // Calculate break minutes if both break start and end exist
                    $breakMinutes = 0;
                    $breakPairs = [];
                    $breakWarnings = [];
                    
                    // Add warning if break sequence was reversed
                    if ($breakSequenceReversed) {
                        $breakWarnings[] = 'OverTime In and OverTime Out buttons were pressed in reversed order';
                        Log::warning("Reversed break button sequence", [
                            'employee_id' => $employee->employee_id,
                            'employee_name' => $employeeName,
                            'date' => $attendanceDate,
                            'overtime_out' => $overtimeOut->time_log->format('Y-m-d H:i:s'),
                            'overtime_in' => $overtimeIn->time_log->format('Y-m-d H:i:s'),
                        ]);
                    }
                    
                    // Validate break sequence
                    if ($breakStart && !$breakEnd) {
                        $breakWarnings[] = 'Break started but no break end recorded';
                        Log::warning("Incomplete break sequence", [
                            'employee_id' => $employee->employee_id,
                            'employee_name' => $employeeName,
                            'date' => $attendanceDate,
                            'break_start' => $breakStart->time_log->format('Y-m-d H:i:s'),
                        ]);
                    } elseif (!$breakStart && $breakEnd) {
                        $breakWarnings[] = 'Break end recorded but no break start';
                        Log::warning("Incomplete break sequence", [
                            'employee_id' => $employee->employee_id,
                            'employee_name' => $employeeName,
                            'date' => $attendanceDate,
                            'break_end' => $breakEnd->time_log->format('Y-m-d H:i:s'),
                        ]);
                    } elseif ($breakStart && $breakEnd) {
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
                        } else {
                            $breakWarnings[] = 'Break end time is before break start time';
                            Log::warning("Invalid break sequence", [
                                'employee_id' => $employee->employee_id,
                                'employee_name' => $employeeName,
                                'date' => $attendanceDate,
                                'break_start' => $breakStartTime->format('Y-m-d H:i:s'),
                                'break_end' => $breakEndTime->format('Y-m-d H:i:s'),
                            ]);
                        }
                    }

                    // Calculate total hours and determine status
                    $totalMinutes = null;
                    $status = 'Present';
                    $statusMessage = null;
                    $meta = [];

                    // Validate that clock-in is before clock-out
                    if ($clockInTime && $clockOutTime) {
                        if ($clockOutTime->lt($clockInTime)) {
                            // Clock out is before clock in - this should not happen with our new logic
                            Log::warning("Invalid attendance: Clock out before clock in", [
                                'employee_id' => $employee->employee_id,
                                'employee_name' => $employeeName,
                                'date' => $attendanceDate,
                                'clock_in' => $clockInTime->format('Y-m-d H:i:s'),
                                'clock_out' => $clockOutTime->format('Y-m-d H:i:s'),
                            ]);
                            
                            // Set status as incomplete with error
                            $status = 'Incomplete';
                            $statusMessage = 'Invalid: Clock-out before clock-in';
                            $meta['errors'] = [
                                'invalid_sequence' => 'Clock out time is before clock in time'
                            ];
                            $totalMinutes = null;
                        } else {
                            // Calculate minutes worked (always positive)
                            $totalMinutes = abs($clockInTime->diffInMinutes($clockOutTime, false)) - $breakMinutes;

                            if ($totalMinutes < 0) {
                                Log::warning("Negative total minutes calculated", [
                                    'employee_id' => $employee->employee_id,
                                    'date' => $attendanceDate,
                                    'clock_in' => $clockInTime->format('Y-m-d H:i:s'),
                                    'clock_out' => $clockOutTime->format('Y-m-d H:i:s'),
                                    'break_minutes' => $breakMinutes
                                ]);
                                $totalMinutes = 0;
                            }
                            
                            // Check for break issues
                            if (!empty($breakWarnings)) {
                                $status = 'Present';
                                $statusMessage = 'Warning: ' . implode(', ', $breakWarnings);
                            }
                        }
                    } else {
                        $status = 'Incomplete';
                        
                        // Create descriptive status message
                        if (!$clockInTime && !$clockOutTime) {
                            $statusMessage = 'Missing: No clock-in or clock-out';
                        } elseif (!$clockInTime) {
                            $statusMessage = 'Missing: No clock-in';
                        } else {
                            $statusMessage = 'Missing: No clock-out';
                        }
                        
                        $meta['warnings'] = [
                            'missing_clock_in' => !$clockInTime,
                            'missing_clock_out' => !$clockOutTime
                        ];
                    }

                    // Add break pairing info to meta
                    if (!empty($breakPairs)) {
                        $meta['breaks'] = $breakPairs;
                    }
                    
                    // Add break warnings to meta if any
                    if (!empty($breakWarnings)) {
                        if (!isset($meta['warnings'])) {
                            $meta['warnings'] = [];
                        }
                        $meta['warnings']['break_issues'] = $breakWarnings;
                    }

                    AttendanceProcessed::updateOrCreate(
                        [
                            'batch_id' => $batch->batch_id,
                            'employee_id' => $employee->employee_id,
                            'date' => $attendanceDate,
                        ],
                        [
                            'clock_in' => $clockInTime?->format('Y-m-d H:i:s'),
                            'break_out' => $breakPairs[0]['start'] ?? null,
                            'break_in' => $breakPairs[0]['end'] ?? null,
                            'clock_out' => $clockOutTime?->format('Y-m-d H:i:s'),
                            'total_hours' => $totalMinutes ? round($totalMinutes / 60, 2) : null,
                            'break_minutes' => $breakMinutes,
                            'status' => $status,
                            'status_message' => $statusMessage,
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
     * Deduplicate consecutive events of the same state
     * Takes the FIRST instance of consecutive duplicate states
     *
     * @param Collection $events
     * @return Collection
     */
    private function deduplicateEvents(Collection $events): Collection
    {
        $deduplicated = collect();
        $sorted = $events->sortBy('time_log')->values();
        
        $lastState = null;
        
        foreach ($sorted as $event) {
            $currentState = $event->state;
            
            // If this is a different state from the last one, add it
            if ($currentState !== $lastState) {
                $deduplicated->push($event);
                $lastState = $currentState;
            } else {
                // Same state as previous - this is a duplicate, skip it
                Log::info("Skipped duplicate consecutive event", [
                    'state' => $currentState,
                    'skipped_time' => $event->time_log->format('Y-m-d H:i:s'),
                    'kept_previous' => $deduplicated->last()->time_log->format('Y-m-d H:i:s'),
                ]);
            }
        }
        
        return $deduplicated;
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