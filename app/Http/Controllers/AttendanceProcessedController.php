<?php

namespace App\Http\Controllers;

use App\Models\AttendanceProcessed;
use App\Models\AttendanceUploadBatch;
use App\Models\Employee;
use App\Services\Attendance\AttendanceProcessService;
use App\Services\Attendance\AttendanceFinalizeService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class AttendanceProcessedController extends Controller
{
    protected $processService;
    protected $finalizeService;

    public function __construct(
        AttendanceProcessService $processService,
        AttendanceFinalizeService $finalizeService
    ) {
        $this->processService = $processService;
        $this->finalizeService = $finalizeService;
    }

    /**
     * Display the processed attendance records.
     */
    public function index(Request $request)
    {
        $filters = $request->only([
            'company_id',
            'employee_id',
            'date_from',
            'date_to',
            'status',
            'batch_id'
        ]);

        // Get companies for filter
        $companies = \App\Models\Company::select(['company_id as id', 'name'])->get();
        
        // Get employees filtered by company if selected
        $employees = \App\Models\Employee::query()
            ->select(['employee_id as id', 'first_name', 'last_name', 'id_number', 'company_id'])
            ->when($request->company_id, fn($q) => $q->where('company_id', $request->company_id))
            ->orderBy('first_name')
            ->get()
            ->map(fn($emp) => [
                'id' => $emp->id,
                'name' => "{$emp->first_name} {$emp->last_name} ({$emp->id_number})",
                'company_id' => $emp->company_id
            ]);

        // Query batches
        $batches = AttendanceUploadBatch::query()
            ->whereIn('status', ['imported', 'processing', 'processed', 'failed', 'finalized'])
            ->with('uploadedBy')
            ->latest('created_at')
            ->get()
            ->map(function ($batch) {
                return [
                    'id' => $batch->batch_id,
                    'filename' => $batch->filename,
                    'created_at' => $batch->created_at,
                    'uploaded_by' => $batch->uploadedBy?->name ?? 'Unknown',
                    'status' => $batch->status,
                    'total_records' => $batch->total_rows,
                    'processed_records' => $batch->processed_rows,
                    'progress' => $batch->total_rows > 0 
                        ? round(($batch->processed_rows / $batch->total_rows) * 100, 2)
                        : 0,
                ];
            });

        // Query processed records
        $processed = AttendanceProcessed::query()
            ->with(['employee.company:company_id,name', 'employee:employee_id,first_name,last_name,id_number,company_id'])
            ->when($request->company_id, function ($query, $companyId) {
                $query->whereHas('employee', fn($q) => $q->where('company_id', $companyId));
            })
            ->when($request->employee_id, function ($query, $employeeId) {
                $query->where('employee_id', $employeeId);
            })
            ->when($request->date_from, function ($query, $dateFrom) {
                $query->whereDate('date', '>=', $dateFrom);
            })
            ->when($request->date_to, function ($query, $dateTo) {
                $query->whereDate('date', '<=', $dateTo);
            })
            ->when($request->status, function ($query, $status) {
                if ($status === 'Present with Warnings') {
                    // Filter for Present status with warnings in status_message
                    $query->where('status', 'Present')
                          ->where('status_message', 'LIKE', 'Warning:%');
                } else {
                    $query->where('status', $status);
                }
            })
            ->when($request->batch_id, function ($query, $batchId) {
                $query->where('batch_id', $batchId);
            })
            ->latest('date')
            ->paginate(50)
            ->through(function ($record) {
                return [
                    'id' => $record->processed_id,
                    'batch_id' => $record->batch_id,
                    'employee' => [
                        'id' => $record->employee->employee_id ?? null,
                        'name' => $record->employee 
                            ? "{$record->employee->first_name} {$record->employee->last_name}"
                            : 'Unmatched',
                        'id_number' => $record->employee->id_number ?? null,
                        'company' => $record->employee->company->name ?? null,
                    ],
                    'date' => $record->date,
                    'clock_in' => $record->clock_in,
                    'clock_out' => $record->clock_out,
                    'break_out' => $record->break_out,
                    'break_in' => $record->break_in,
                    'break_minutes' => $record->break_minutes,
                    'total_hours' => $record->total_hours,
                    'total_minutes' => $record->total_minutes,
                    'status' => $record->status,
                    'status_message' => $record->status_message,
                    'meta' => $record->meta,
                    'errors' => $record->errors,
                ];
            });

        return Inertia::render('Attendance/Processed', [
            'batches' => $batches,
            'processed' => $processed,
            'filters' => $filters,
            'companies' => $companies,
            'employees' => $employees,
            'statuses' => [
                ['value' => 'Present', 'label' => 'Present'],
                ['value' => 'Present with Warnings', 'label' => 'Present with Warnings'],
                ['value' => 'Incomplete', 'label' => 'Incomplete'],
            ]
        ]);
    }

    /**
     * Process a batch of raw attendance records.
     */
    public function process(AttendanceUploadBatch $batch)
    {
        try {
            // Allow processing for imported, failed, and processed (reprocess) statuses
            if (!in_array($batch->status, ['imported', 'failed', 'processed'])) {
                throw new \Exception('Batch cannot be processed in its current state.');
            }

            DB::beginTransaction();

            $batch->update(['status' => 'processing']);

            // Process the batch
            $this->processService->processBatch($batch);

            DB::commit();

            return back()->with('success', 'Batch processed successfully.');

        } catch (\Exception $e) {
            DB::rollBack();
            
            Log::error('Batch processing failed', [
                'batch_id' => $batch->batch_id,
                'error' => $e->getMessage()
            ]);

            $batch->update([
                'status' => 'failed',
                'remarks' => 'Processing failed: ' . $e->getMessage()
            ]);

            return back()->withErrors([
                'process' => 'Failed to process batch: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Retry processing failed records.
     */
    public function reprocess(Request $request)
    {
        $request->validate([
            'batch_id' => ['required', 'exists:attendance_upload_batches,batch_id'],
            'records' => ['required', 'array'],
            'records.*' => ['required', 'exists:attendance_processed,processed_id']
        ]);

        try {
            DB::beginTransaction();

            $batch = AttendanceUploadBatch::findOrFail($request->batch_id);
            
            // Prevent reprocessing of finalized batches
            if ($batch->status === 'finalized') {
                return back()->withErrors([
                    'reprocess' => 'Cannot reprocess finalized batches. Finalized data is locked for audit purposes.'
                ]);
            }
            
            // Mark selected records for reprocessing
            AttendanceProcessed::whereIn('processed_id', $request->records)
                ->where('batch_id', $batch->batch_id)
                ->update(['status' => 'Pending']);

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

    /**
     * Finalize processed records to final attendance
     */
    public function finalize(AttendanceUploadBatch $batch)
    {
        try {
            Log::info('Finalize attempt started', [
                'batch_id' => $batch->batch_id,
                'batch_status' => $batch->status,
                'user_id' => Auth::id()
            ]);

            if ($batch->status !== 'processed') {
                throw new \Exception('Only processed batches can be finalized. Current status: ' . $batch->status);
            }

            DB::beginTransaction();

            // Get all processed records for this batch that haven't been finalized yet
            $processedRecords = AttendanceProcessed::where('batch_id', $batch->batch_id)
                ->whereNotNull('employee_id') // Only finalize matched records
                ->where('status', '!=', 'Incomplete') // Don't finalize incomplete records
                ->get();
            
            Log::info('Found processed records', [
                'batch_id' => $batch->batch_id,
                'total_records' => $processedRecords->count()
            ]);

            // Filter out already finalized records
            $recordsToFinalize = $processedRecords->filter(function($record) {
                return !in_array(strtolower($record->status), ['finalized', 'completed']);
            });

            $processedIds = $recordsToFinalize->pluck('processed_id')->toArray();

            if (empty($processedIds)) {
                // Check if all records are already finalized
                if ($processedRecords->count() > 0) {
                    throw new \Exception('All records in this batch have already been finalized.');
                } else {
                    throw new \Exception('No valid records to finalize in this batch.');
                }
            }

            Log::info('Finalizing records', [
                'batch_id' => $batch->batch_id,
                'record_count' => count($processedIds)
            ]);

            // Push to final attendance
            $this->finalizeService->push($processedIds, Auth::id());

            // Update batch status
            $batch->update(['status' => 'finalized']);

            DB::commit();

            Log::info('Finalization successful', [
                'batch_id' => $batch->batch_id,
                'finalized_count' => count($processedIds)
            ]);

            return back()->with('success', count($processedIds) . ' records finalized successfully and moved to Final Attendance!');

        } catch (\Exception $e) {
            DB::rollBack();
            
            Log::error('Finalization failed', [
                'batch_id' => $batch->batch_id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return back()->withErrors([
                'finalize' => 'Failed to finalize batch: ' . $e->getMessage()
            ]);
        }
    }
}
