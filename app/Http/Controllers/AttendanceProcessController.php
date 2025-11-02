<?php

namespace App\Http\Controllers;

use App\Models\AttendanceProcessed;
use App\Models\AttendanceUploadBatch;
use App\Models\Employee;
use App\Services\Attendance\AttendanceProcessService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class AttendanceProcessController extends Controller
{
    protected $processService;

    public function __construct(AttendanceProcessService $processService)
    {
        $this->processService = $processService;
    }

    /**
     * Display a listing of processed attendance records and batches.
     *
     * @param Request $request
     * @return \Inertia\Response
     */
    public function index(Request $request)
    {
        $filters = $request->only([
            'employee_id',
            'date_from',
            'date_to',
            'status',
            'batch_id'
        ]);

        // Get batches for processing
        $batches = AttendanceUploadBatch::query()
            ->select(['id', 'file_name', 'uploaded_at', 'status', 'total_records', 'processed_rows'])
            ->where('status', 'IN', ['pending', 'processing', 'failed'])
            ->orderBy('uploaded_at', 'desc')
            ->get()
            ->map(fn ($batch) => [
                'id' => $batch->id,
                'file_name' => $batch->file_name,
                'uploaded_at' => $batch->uploaded_at->format('Y-m-d H:i:s'),
                'status' => $batch->status,
                'progress' => $batch->total_records > 0 
                    ? round(($batch->processed_rows / $batch->total_records) * 100) 
                    : 0,
                'can_process' => $batch->status === 'pending',
                'can_retry' => $batch->status === 'failed',
                'error' => $batch->meta['error'] ?? null
            ]);

        // Build processed records query
        $query = AttendanceProcessed::with('employee:id,first_name,last_name')
            ->select([
                'id', 
                'employee_id', 
                'date', 
                'clock_in',
                'break_out',
                'break_in', 
                'clock_out',
                'total_hours',
                'break_minutes',
                'status',
                'meta',
                'batch_id'
            ])
            ->orderBy('date', 'desc')
            ->orderBy('employee_id');

        // Apply filters
        if ($filters['employee_id'] ?? null) {
            $query->where('employee_id', $filters['employee_id']);
        }

        if ($filters['date_from'] ?? null) {
            $query->where('date', '>=', $filters['date_from']);
        }

        if ($filters['date_to'] ?? null) {
            $query->where('date', '<=', $filters['date_to']);
        }

        if ($filters['status'] ?? null) {
            $query->where('status', $filters['status']);
        }

        if ($filters['batch_id'] ?? null) {
            $query->where('batch_id', $filters['batch_id']);
        }

        return Inertia::render('Attendance/ProcessedIndex', [
            'batches' => $batches,
            'processed' => $query->paginate(25)
                ->through(fn ($record) => [
                    'id' => $record->id,
                    'employee' => [
                        'id' => $record->employee->id,
                        'name' => $record->employee->first_name . ' ' . $record->employee->last_name,
                    ],
                    'date' => $record->date,
                    'clock_in' => $record->clock_in,
                    'break_out' => $record->break_out,
                    'break_in' => $record->break_in,
                    'clock_out' => $record->clock_out,
                    'total_hours' => $record->total_hours,
                    'break_minutes' => $record->break_minutes,
                    'status' => $record->status,
                    'meta' => $record->meta,
                    'has_errors' => !empty($record->meta['errors']),
                    'can_finalize' => $record->status === 'processed'
                ]),
            'filters' => $filters,
            'employees' => Employee::select(['id', 'first_name', 'last_name'])
                ->orderBy('last_name')
                ->orderBy('first_name')
                ->get()
                ->map(fn($emp) => [
                    'id' => $emp->id,
                    'name' => $emp->first_name . ' ' . $emp->last_name,
                ]),
            'statuses' => [
                ['value' => 'pending', 'label' => 'Pending'],
                ['value' => 'processing', 'label' => 'Processing'],
                ['value' => 'processed', 'label' => 'Processed'],
                ['value' => 'failed', 'label' => 'Failed'],
                ['value' => 'finalized', 'label' => 'Finalized']
            ]
        ]);
    }

    /**
     * Process a batch of raw attendance records.
     *
     * @param AttendanceUploadBatch $batch
     * @return \Illuminate\Http\RedirectResponse
     */
    public function process(AttendanceUploadBatch $batch)
    {
        try {
            if (!in_array($batch->status, ['pending', 'failed'])) {
                throw new \Exception('Batch cannot be processed in its current state.');
            }

            DB::beginTransaction();

            $batch->update(['status' => 'processing']);

            // Process async
            $this->processService->processBatch($batch);

            DB::commit();

            return back()->with('success', [
                'message' => 'Batch processing started successfully.',
                'batch_id' => $batch->id
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            
            Log::error('Batch processing failed', [
                'batch_id' => $batch->id,
                'error' => $e->getMessage()
            ]);

            $batch->update([
                'status' => 'failed',
                'meta' => array_merge($batch->meta ?? [], [
                    'error' => $e->getMessage()
                ])
            ]);

            return back()->withErrors([
                'process' => 'Failed to process batch: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Retry processing failed records.
     *
     * @param Request $request
     * @return \Illuminate\Http\RedirectResponse
     */
    public function reprocess(Request $request)
    {
        $request->validate([
            'batch_id' => ['required', 'exists:attendance_upload_batches,id'],
            'records' => ['required', 'array'],
            'records.*' => ['required', 'exists:attendance_processed,id']
        ]);

        try {
            DB::beginTransaction();

            $batch = AttendanceUploadBatch::findOrFail($request->batch_id);
            
            // Mark selected records for reprocessing
            AttendanceProcessed::whereIn('id', $request->records)
                ->where('batch_id', $batch->id)
                ->update(['status' => 'pending']);

            // Update batch status if needed
            if ($batch->status === 'failed') {
                $batch->update(['status' => 'processing']);
            }

            DB::commit();

            return back()->with('success', 'Selected records have been queued for reprocessing.');

        } catch (\Exception $e) {
            DB::rollBack();
            
            Log::error('Record reprocessing failed', [
                'batch_id' => $request->batch_id,
                'records' => $request->records,
                'error' => $e->getMessage()
            ]);

            return back()->withErrors([
                'reprocess' => 'Failed to reprocess records: ' . $e->getMessage()
            ]);
        }
    }
}
