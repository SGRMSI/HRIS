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

            $rows = $batch->raws()
                ->orderBy('time_log')
                ->get()
                ->groupBy(fn($r) => $r->ac_no);

            foreach ($rows as $acNo => $events) {
                $employee = Employee::find($acNo);
                if (!$employee) {
                    Log::warning("No employee found for ID: {$acNo}", [
                        'batch_id' => $batch->batch_id,
                        'events_count' => $events->count()
                    ]);
                    continue;
                }

                // Get all clock events sorted by time
                $clockIns = $events->filter(fn($e) => $e->state === 'C/In' && in_array($e->exception, ['FOT', 'OT']))->values();
                $clockOuts = $events->filter(fn($e) => $e->state === 'C/Out' && in_array($e->exception, ['FOT', 'OT']))->values();
                
                // For breaks: OverTime In = break starts, OverTime Out = break ends
                $breakStarts = $events->filter(fn($e) => $e->state === 'OverTime In' && in_array($e->exception, ['FOT', 'OT']))->values();
                $breakEnds = $events->filter(fn($e) => $e->state === 'OverTime Out' && in_array($e->exception, ['FOT', 'OT']))->values();

                // Pair each Clock In with the next Clock Out
                $processedDates = [];
                foreach ($clockIns as $index => $clockIn) {
                    $clockInTime = $clockIn->time_log;
                    $attendanceDate = $clockInTime->toDateString();
                    
                    // Skip if we've already processed this date
                    if (in_array($attendanceDate, $processedDates)) {
                        continue;
                    }
                    $processedDates[] = $attendanceDate;

                    // Find the next clock out after this clock in
                    $clockOutTime = null;
                    foreach ($clockOuts as $clockOut) {
                        if ($clockOut->time_log->gt($clockInTime)) {
                            $clockOutTime = $clockOut->time_log;
                            break;
                        }
                    }

                    // Find breaks between clock in and clock out (or just after clock in if no clock out)
                    $breakMinutes = 0;
                    $breakPairs = [];
                    
                    // Define the time range for finding breaks
                    $breakRangeStart = $clockInTime;
                    $breakRangeEnd = $clockOutTime ?? Carbon::now(); // If no clock out, use current time
                    
                    // Get breaks that fall within the time range
                    $relevantBreakStarts = $breakStarts->filter(fn($b) => 
                        $b->time_log->gte($breakRangeStart) && $b->time_log->lte($breakRangeEnd)
                    )->values();
                    
                    $relevantBreakEnds = $breakEnds->filter(fn($b) => 
                        $b->time_log->gte($breakRangeStart) && $b->time_log->lte($breakRangeEnd)
                    )->values();

                    // Pair breaks: OverTime In (start) -> OverTime Out (end)
                    $pairs = min($relevantBreakStarts->count(), $relevantBreakEnds->count());
                    for ($i = 0; $i < $pairs; $i++) {
                        $breakStartTime = $relevantBreakStarts[$i]->time_log;
                        $breakEndTime = $relevantBreakEnds[$i]->time_log;
                        $minutes = abs($breakStartTime->diffInMinutes($breakEndTime, false));

                        if ($breakEndTime->gt($breakStartTime)) {
                            $breakMinutes += $minutes;
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

                    if ($clockInTime && $clockOutTime) {
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
                            'date' => $attendanceDate,
                        ],
                        [
                            'clock_in' => $clockInTime?->format('Y-m-d H:i:s'),
                            'break_out' => $breakPairs[0]['start'] ?? null,  // OverTime In = break starts
                            'break_in' => $breakPairs[0]['end'] ?? null,     // OverTime Out = break ends
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