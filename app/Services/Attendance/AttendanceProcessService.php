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
                ->groupBy(fn($r) => $r->ac_no); // ac_no is now the same as employee_id

            foreach ($rows as $acNo => $events) {
                // Map ac_no directly to employee_id since they're the same
                $employee = Employee::find($acNo); // Changed from where('biometric_ac_no')
                if (!$employee) {
                    Log::warning("No employee found for ID: {$acNo}", [
                        'batch_id' => $batch->id,
                        'events_count' => $events->count()
                    ]);
                    continue;
                }

                $byDate = $events->groupBy(fn($e) => $e->time_log->toDateString());

                foreach ($byDate as $date => $logs) {
                    $ins = $logs->filter(fn($e) => $e->state === 'C/In' && $e->exception === 'FOT')->values();
                    $outs = $logs->filter(fn($e) => $e->state === 'C/Out' && $e->exception === 'FOT')->values();
                    $bout = $logs->filter(fn($e) => $e->state === 'OverTime Out' && $e->exception === 'OT')->values();
                    $bin = $logs->filter(fn($e) => $e->state === 'OverTime In' && $e->exception === 'OT')->values();

                    $clockIn = optional($ins->first())->time_log?->format('H:i:s');
                    $clockOut = optional($outs->last())->time_log?->format('H:i:s');

                    // Pair breaks in order (bout -> bin)
                    $breakMinutes = 0;
                    $breakPairs = [];
                    $pairs = min($bout->count(), $bin->count());

                    for ($i = 0; $i < $pairs; $i++) {
                        $breakStart = $bout[$i]->time_log;
                        $breakEnd = $bin[$i]->time_log;

                        if ($breakEnd->gt($breakStart)) {
                            $breakMinutes += $breakEnd->diffInMinutes($breakStart);
                            $breakPairs[] = [
                                'out' => $breakStart->format('H:i:s'),
                                'in' => $breakEnd->format('H:i:s'),
                                'minutes' => $breakEnd->diffInMinutes($breakStart)
                            ];
                        } else {
                            Log::warning("Invalid break pair found", [
                                'employee_id' => $employee->id,
                                'date' => $date,
                                'break_start' => $breakStart,
                                'break_end' => $breakEnd
                            ]);
                        }
                    }

                    // Calculate total minutes if we have both clock in and out
                    $totalMinutes = null;
                    $status = 'Present';
                    $meta = [];

                    if ($clockIn && $clockOut) {
                        $totalMinutes = Carbon::parse("$date $clockOut")
                            ->diffInMinutes(Carbon::parse("$date $clockIn"))
                            - $breakMinutes;

                        if ($totalMinutes < 0) {
                            Log::warning("Negative total minutes calculated", [
                                'employee_id' => $employee->id,
                                'date' => $date,
                                'clock_in' => $clockIn,
                                'clock_out' => $clockOut,
                                'break_minutes' => $breakMinutes
                            ]);
                            $totalMinutes = 0;
                        }
                    } else {
                        $status = 'Incomplete';
                        $meta['warnings'] = [
                            'missing_clock_in' => !$clockIn,
                            'missing_clock_out' => !$clockOut
                        ];
                    }

                    // Add break pairing info to meta
                    if (!empty($breakPairs)) {
                        $meta['breaks'] = $breakPairs;
                    }

                    if ($bout->count() !== $bin->count()) {
                        $meta['warnings'] = ($meta['warnings'] ?? []) + [
                            'unpaired_breaks' => [
                                'break_outs' => $bout->count(),
                                'break_ins' => $bin->count()
                            ]
                        ];
                    }

                    AttendanceProcessed::updateOrCreate(
                        [
                            'batch_id' => $batch->id,
                            'employee_id' => $employee->employee_id,
                            'date' => $date,
                        ],
                        [
                            'clock_in' => $clockIn,
                            'break_out' => $bout->first()?->time_log?->format('H:i:s'),
                            'break_in' => $bin->first()?->time_log?->format('H:i:s'),
                            'clock_out' => $clockOut,
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
                'processed_at' => now(),
                'meta' => array_merge($batch->meta ?? [], [
                    'processed_records' => AttendanceProcessed::where('batch_id', $batch->id)->count()
                ])
            ]);

            DB::commit();

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to process attendance batch', [
                'batch_id' => $batch->id,
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