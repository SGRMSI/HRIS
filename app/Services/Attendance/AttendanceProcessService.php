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
     * - Detects intersecting dates between new batch and existing processed records
     * - Merges raw data from ALL batches with intersecting dates
     * - Reprocesses as one combined dataset to properly pair clock-in/out across batches
     * - Tracks original batch_id for each processed record for filtering
     * 
     * Example: Batch 1 (Oct 1-16) has Oct 16 clock-in, Batch 2 (Oct 16-Nov 1) has Oct 16 clock-in + Oct 17 clock-out
     * Result: System merges both, pairs Oct 16 clock-in with Oct 17 clock-out, creates complete record
     *
     * @param AttendanceUploadBatch $batch
     * @return void
     */
    public function processBatch(AttendanceUploadBatch $batch): void
    {
        try {
            DB::beginTransaction();

            // Get date range of this batch
            $batchDateRange = $batch->raws()
                ->selectRaw('MIN(DATE(time_log)) as min_date, MAX(DATE(time_log)) as max_date')
                ->first();
            
            // Find batches with intersecting dates (processed records that overlap with this batch's date range)
            $intersectingBatchIds = [];
            $intersectingDates = [];
            
            if ($batchDateRange->min_date && $batchDateRange->max_date) {
                $intersecting = AttendanceProcessed::whereBetween('date', [
                        $batchDateRange->min_date, 
                        $batchDateRange->max_date
                    ])
                    ->where('batch_id', '!=', $batch->batch_id)
                    ->select('batch_id', 'date')
                    ->distinct()
                    ->get();
                
                $intersectingBatchIds = $intersecting->pluck('batch_id')->unique()->toArray();
                $intersectingDates = $intersecting->pluck('date')->map(fn($d) => Carbon::parse($d)->toDateString())->unique()->toArray();
                
                if (!empty($intersectingBatchIds)) {
                    Log::info("Found intersecting batches", [
                        'current_batch' => $batch->batch_id,
                        'intersecting_batches' => $intersectingBatchIds,
                        'intersecting_dates' => $intersectingDates,
                        'count' => count($intersectingDates)
                    ]);
                }
            }

            // Delete processed records for ALL intersecting batches + current batch
            // We'll reprocess them together with merged raw data
            $batchesToReprocess = array_merge([$batch->batch_id], $intersectingBatchIds);
            
            $deletedCount = AttendanceProcessed::whereIn('batch_id', $batchesToReprocess)->delete();
            
            Log::info("Deleted processed records for reprocessing", [
                'batches' => $batchesToReprocess,
                'deleted_count' => $deletedCount,
            ]);

            Log::info("Deleted processed records for reprocessing", [
                'batches' => $batchesToReprocess,
                'deleted_count' => $deletedCount,
            ]);

            // Get ALL raw records from current batch + intersecting batches
            // This merges raw data across batches for complete clock-in/out pairing
            $allRawRecords = AttendanceRaw::whereIn('batch_id', $batchesToReprocess)
                ->orderBy('time_log')
                ->get();
            
            Log::info("Merged raw records from all intersecting batches", [
                'batches' => $batchesToReprocess,
                'total_raw_records' => $allRawRecords->count()
            ]);

            // Group raw records by employee name (not AC-No)
            $rows = $allRawRecords->groupBy(fn($r) => strtolower(trim($r->name)));

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

                // Process attendance by pairing Clock In -> Clock Out sequences
                // Events are already merged from all intersecting batches
                // Deduplicate events based on sequence (consecutive same states)
                $deduplicatedEvents = $this->deduplicateEvents($events);
                
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
                            // Calculate minutes worked (clock_out - clock_in, without subtracting break)
                            $totalMinutes = abs($clockInTime->diffInMinutes($clockOutTime, false));

                            if ($totalMinutes < 0) {
                                Log::warning("Negative total minutes calculated", [
                                    'employee_id' => $employee->employee_id,
                                    'date' => $attendanceDate,
                                    'clock_in' => $clockInTime->format('Y-m-d H:i:s'),
                                    'clock_out' => $clockOutTime->format('Y-m-d H:i:s'),
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

                    // Determine which batch this attendance belongs to
                    // Use the batch_id from the clock-in event (the shift start determines ownership)
                    $attendanceBatchId = $clockIn->batch_id;

                    AttendanceProcessed::updateOrCreate(
                        [
                            'batch_id' => $attendanceBatchId,
                            'employee_id' => $employee->employee_id,
                            'date' => $attendanceDate,
                        ],
                        [
                            'clock_in' => $clockInTime?->format('Y-m-d H:i:s'),
                            'break_out' => $breakPairs[0]['start'] ?? null,
                            'break_in' => $breakPairs[0]['end'] ?? null,
                            'clock_out' => $clockOutTime?->format('Y-m-d H:i:s'),
                            'total_hours' => $totalMinutes ? (int) floor($totalMinutes / 60) : null,
                            'total_minutes' => $totalMinutes ? ($totalMinutes % 60) : null,
                            'break_minutes' => $breakMinutes,
                            'status' => $status,
                            'status_message' => $statusMessage,
                            'meta' => $meta,
                            'created_at' => now(),
                        ]
                    );
                }
            }

            // Update status for the current batch
            $batch->update([
                'status' => 'processed',
                'processed_rows' => AttendanceProcessed::where('batch_id', $batch->batch_id)->count(),
            ]);
            
            // Update processed_rows count for all intersecting batches too
            foreach ($intersectingBatchIds as $intersectingBatchId) {
                $intersectingBatch = AttendanceUploadBatch::find($intersectingBatchId);
                if ($intersectingBatch) {
                    $intersectingBatch->update([
                        'status' => 'processed',
                        'processed_rows' => AttendanceProcessed::where('batch_id', $intersectingBatchId)->count(),
                    ]);
                }
            }

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