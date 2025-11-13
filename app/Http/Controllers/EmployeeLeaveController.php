<?php

namespace App\Http\Controllers;

use App\Models\EmployeeLeave;
use App\Models\Employee;
use App\Models\Department;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class EmployeeLeaveController extends Controller
{
    /**
     * Display a listing of employee leaves
     *
     * @param Request $request
     * @return \Inertia\Response
     */
    public function index(Request $request)
    {
        $query = EmployeeLeave::with(['employee.department', 'employee.company', 'approver'])
            ->when($request->status, function ($q) use ($request) {
                $q->where('status', $request->status);
            })
            ->when($request->type, function ($q) use ($request) {
                $q->where('type', $request->type);
            })
            ->when($request->employee_search, function ($q) use ($request) {
                $q->whereHas('employee', function ($q) use ($request) {
                    $q->where('first_name', 'like', "%{$request->employee_search}%")
                      ->orWhere('last_name', 'like', "%{$request->employee_search}%")
                      ->orWhere('id_number', 'like', "%{$request->employee_search}%");
                });
            })
            ->when($request->company_id, function ($q) use ($request) {
                $q->whereHas('employee', function ($q) use ($request) {
                    $q->where('company_id', $request->company_id);
                });
            })
            ->when($request->date_from, function ($q) use ($request) {
                $q->where('date_to', '>=', $request->date_from);
            })
            ->when($request->date_to, function ($q) use ($request) {
                $q->where('date_from', '<=', $request->date_to);
            });

        $leaves = $query->orderBy('date_from', 'desc')
            ->paginate($request->per_page ?? 20)
            ->through(function ($leave) {
                return [
                    'id' => $leave->leave_id,
                    'employee' => [
                        'id' => $leave->employee->employee_id,
                        'name' => $leave->employee->first_name . ' ' . $leave->employee->last_name,
                        'employee_number' => $leave->employee->id_number,
                        'department' => $leave->employee->department->name ?? 'N/A',
                        'company' => $leave->employee->company->name ?? 'N/A'
                    ],
                    'type' => $leave->type,
                    'date_from' => $leave->date_from->format('Y-m-d'),
                    'date_to' => $leave->date_to->format('Y-m-d'),
                    'duration_days' => $leave->days_count,
                    'status' => $leave->status,
                    'remarks' => $leave->remarks,
                    'has_document' => !is_null($leave->document_path),
                    'approved_by' => $leave->approver?->name,
                    'approved_at' => $leave->updated_at->format('Y-m-d H:i:s'),
                    'can_approve' => $leave->status === 'pending',
                    'can_cancel' => in_array($leave->status, ['pending', 'approved']),
                    'can_delete' => in_array($leave->status, ['pending', 'rejected', 'cancelled'])
                ];
            });

        // Group by department if requested
        $departmentGroups = [];
        if ($request->group_by_department) {
            $departmentGroups = EmployeeLeave::with('employee.department')
                ->whereIn('status', ['pending', 'approved'])
                ->get()
                ->groupBy(fn($l) => $l->employee->department->name ?? 'No Department')
                ->map(fn($group) => [
                    'count' => $group->count(),
                    'employees' => $group->pluck('employee_id')->unique()->count(),
                    'total_days' => $group->sum('days_count')
                ]);
        }

        return Inertia::render('Attendance/Leaves/Index', [
            'leaves' => $leaves,
            'filters' => $request->only(['status', 'type', 'employee_search', 'company_id', 'date_from', 'date_to']),
            'companies' => \App\Models\Company::select(['company_id as id', 'name'])->get(),
            'statuses' => [
                ['value' => 'pending', 'label' => 'Pending'],
                ['value' => 'approved', 'label' => 'Approved'],
                ['value' => 'rejected', 'label' => 'Rejected'],
                ['value' => 'cancelled', 'label' => 'Cancelled']
            ],
            'types' => [
                ['value' => 'sick', 'label' => 'Sick Leave'],
                ['value' => 'vacation', 'label' => 'Vacation Leave'],
                ['value' => 'emergency', 'label' => 'Emergency Leave'],
                ['value' => 'unpaid', 'label' => 'Unpaid Leave'],
                ['value' => 'parental', 'label' => 'Parental Leave'],
                ['value' => 'personal', 'label' => 'Personal Leave'],
                ['value' => 'paid', 'label' => 'Paid Leave'],
                ['value' => 'other', 'label' => 'Other']
            ],
            'departmentGroups' => $departmentGroups
        ]);
    }

    /**
     * Show the form for creating a new leave request
     *
     * @return \Inertia\Response
     */
    public function create()
    {
        $companies = \App\Models\Company::select(['company_id as id', 'name'])->get();

        return Inertia::render('Attendance/Leaves/Create', [
            'companies' => $companies,
            'types' => [
                ['value' => 'sick', 'label' => 'Sick Leave'],
                ['value' => 'vacation', 'label' => 'Vacation Leave'],
                ['value' => 'emergency', 'label' => 'Emergency Leave'],
                ['value' => 'unpaid', 'label' => 'Unpaid Leave'],
                ['value' => 'parental', 'label' => 'Parental Leave'],
                ['value' => 'personal', 'label' => 'Personal Leave'],
                ['value' => 'paid', 'label' => 'Paid Leave'],
                ['value' => 'other', 'label' => 'Other']
            ]
        ]);
    }

    /**
     * Store a newly created leave request
     *
     * @param Request $request
     * @return \Illuminate\Http\RedirectResponse
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'employee_id' => ['required', 'exists:employees,employee_id'],
            'type' => ['required', 'string', 'in:sick,vacation,emergency,unpaid,other'],
            'date_from' => ['required', 'date'],
            'date_to' => ['required', 'date', 'after_or_equal:date_from'],
            'remarks' => ['nullable', 'string', 'max:1000'],
            'document' => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:5120'], // 5MB max
            'include_saturday' => ['nullable'],
            'include_sunday' => ['nullable'],
        ]);

        try {
            DB::beginTransaction();

            // Check for overlapping leaves
            if ($this->checkLeaveOverlap(
                $validated['employee_id'],
                $validated['date_from'],
                $validated['date_to']
            )) {
                throw ValidationException::withMessages([
                    'date_from' => 'This leave period overlaps with an existing approved or pending leave.'
                ]);
            }

            // Calculate duration with weekend exclusion
            $dateFrom = Carbon::parse($validated['date_from']);
            $dateTo = Carbon::parse($validated['date_to']);
            $includeSaturday = filter_var($validated['include_saturday'] ?? false, FILTER_VALIDATE_BOOLEAN);
            $includeSunday = filter_var($validated['include_sunday'] ?? false, FILTER_VALIDATE_BOOLEAN);
            
            $duration = $this->calculateLeaveDuration($dateFrom, $dateTo, $includeSaturday, $includeSunday);

            // Check leave balance (for paid leave types)
            if (in_array($validated['type'], ['sick', 'vacation'])) {
                $employee = Employee::find($validated['employee_id']);
                $leaveBalance = $this->getLeaveBalance($employee, $validated['type']);
                
                if ($leaveBalance < $duration) {
                    throw ValidationException::withMessages([
                        'date_to' => "Insufficient {$validated['type']} leave balance. Available: {$leaveBalance} days, Requested: {$duration} days."
                    ]);
                }
            }

            // Handle document upload - temporarily store in temp location
            $documentPath = null;
            $uploadedFile = null;
            if ($request->hasFile('document')) {
                $uploadedFile = $request->file('document');
            }

            $leave = EmployeeLeave::create([
                'employee_id' => $validated['employee_id'],
                'type' => $validated['type'],
                'date_from' => $validated['date_from'],
                'date_to' => $validated['date_to'],
                'days_count' => $duration,
                'include_saturday' => $includeSaturday,
                'include_sunday' => $includeSunday,
                'status' => 'pending',
                'remarks' => $validated['remarks'],
                'document_path' => null // Will update after moving file
            ]);

            // Now that we have leave_id, store the document in the proper location
            if ($uploadedFile) {
                $extension = $uploadedFile->getClientOriginalExtension();
                $filename = 'document_' . time() . '.' . $extension;
                $documentPath = $uploadedFile->storeAs(
                    "leaves/{$leave->leave_id}",
                    $filename,
                    'local' // Private disk
                );
                
                // Update the leave record with document path
                $leave->update(['document_path' => $documentPath]);
            }

            // Log the creation
            activity()
                ->performedOn($leave)
                ->causedBy(Auth::user())
                ->withProperties(['duration_days' => $duration])
                ->log('leave.created');

            // Send notification to approvers
            $this->notifyApprovers($leave, 'new');

            DB::commit();

            return redirect()->route('attendance.leaves.index')->with('success', 'Leave request submitted successfully.');

        } catch (ValidationException $e) {
            DB::rollBack();
            throw $e;
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to create leave request', [
                'data' => $validated ?? $request->all(),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return back()->withErrors(['error' => 'Failed to create leave request: ' . $e->getMessage()]);
        }
    }

    /**
     * Display the specified leave request
     *
     * @param EmployeeLeave $leave
     * @return \Inertia\Response
     */
    public function show(EmployeeLeave $leave)
    {
        $leave->load(['employee.department', 'employee.company', 'approver']);

        return Inertia::render('Attendance/Leaves/Show', [
            'leave' => [
                'id' => $leave->leave_id,
                'employee' => [
                    'id' => $leave->employee->employee_id,
                    'name' => $leave->employee->first_name . ' ' . $leave->employee->last_name,
                    'employee_number' => $leave->employee->id_number,
                    'department' => $leave->employee->department->name ?? 'N/A',
                    'company' => $leave->employee->company->name ?? 'N/A'
                ],
                'type' => $leave->type,
                'date_from' => $leave->date_from->format('Y-m-d'),
                'date_to' => $leave->date_to->format('Y-m-d'),
                'formatted_date_from' => $leave->date_from->format('F d, Y'),
                'formatted_date_to' => $leave->date_to->format('F d, Y'),
                'duration_days' => $leave->days_count,
                'status' => $leave->status,
                'remarks' => $leave->remarks,
                'document_path' => $leave->document_path,
                'approved_by' => $leave->approver ? [
                    'id' => $leave->approver->id,
                    'name' => $leave->approver->name
                ] : null,
                'created_at' => $leave->created_at->format('Y-m-d H:i:s'),
                'updated_at' => $leave->updated_at->format('Y-m-d H:i:s'),
                'can_approve' => $leave->status === 'pending',
                'can_edit' => $leave->status === 'pending',
                'can_cancel' => in_array($leave->status, ['pending', 'approved']),
                'can_delete' => in_array($leave->status, ['pending', 'rejected', 'cancelled'])
            ]
        ]);
    }

    /**
     * Show the form for editing the specified leave request
     *
     * @param EmployeeLeave $leave
     * @return \Inertia\Response|\Illuminate\Http\RedirectResponse
     */
    public function edit(EmployeeLeave $leave)
    {
        if ($leave->status !== 'pending') {
            return redirect()->route('attendance.leaves.show', $leave->leave_id)
                ->with('error', 'Only pending leaves can be edited.');
        }

        $leave->load(['employee.department', 'employee.company']);

        return Inertia::render('Attendance/Leaves/Edit', [
            'leave' => [
                'id' => $leave->leave_id,
                'employee' => [
                    'id' => $leave->employee->employee_id,
                    'name' => $leave->employee->first_name . ' ' . $leave->employee->last_name,
                    'employee_number' => $leave->employee->id_number,
                    'department' => $leave->employee->department->name ?? 'N/A',
                    'company' => $leave->employee->company->name ?? 'N/A'
                ],
                'type' => $leave->type,
                'date_from' => $leave->date_from->format('Y-m-d'),
                'date_to' => $leave->date_to->format('Y-m-d'),
                'remarks' => $leave->remarks,
                'document_path' => $leave->document_path,
                'include_saturday' => $leave->include_saturday,
                'include_sunday' => $leave->include_sunday,
            ],
            'types' => [
                ['value' => 'sick', 'label' => 'Sick Leave'],
                ['value' => 'vacation', 'label' => 'Vacation Leave'],
                ['value' => 'emergency', 'label' => 'Emergency Leave'],
                ['value' => 'unpaid', 'label' => 'Unpaid Leave'],
                ['value' => 'parental', 'label' => 'Parental Leave'],
                ['value' => 'personal', 'label' => 'Personal Leave'],
                ['value' => 'paid', 'label' => 'Paid Leave'],
                ['value' => 'other', 'label' => 'Other']
            ]
        ]);
    }

    /**
     * Update the specified leave request
     *
     * @param Request $request
     * @param EmployeeLeave $leave
     * @return \Illuminate\Http\RedirectResponse
     */
    public function update(Request $request, EmployeeLeave $leave)
    {
        // Can only update pending leaves
        if ($leave->status !== 'pending') {
            return back()->withErrors(['error' => 'Only pending leaves can be updated.']);
        }

        $validated = $request->validate([
            'type' => ['required', 'string', 'in:sick,vacation,emergency,unpaid,other'],
            'date_from' => ['required', 'date'],
            'date_to' => ['required', 'date', 'after_or_equal:date_from'],
            'remarks' => ['nullable', 'string', 'max:1000'],
            'document' => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:5120'],
            'include_saturday' => ['nullable'],
            'include_sunday' => ['nullable'],
        ]);

        try {
            DB::beginTransaction();

            // Check for overlapping leaves (excluding current leave)
            if ($this->checkLeaveOverlap(
                $leave->employee_id,
                $validated['date_from'],
                $validated['date_to'],
                $leave->leave_id
            )) {
                throw ValidationException::withMessages([
                    'date_from' => 'This leave period overlaps with another existing leave.'
                ]);
            }

            // Calculate new duration with weekend exclusion
            $dateFrom = Carbon::parse($validated['date_from']);
            $dateTo = Carbon::parse($validated['date_to']);
            $includeSaturday = filter_var($validated['include_saturday'] ?? false, FILTER_VALIDATE_BOOLEAN);
            $includeSunday = filter_var($validated['include_sunday'] ?? false, FILTER_VALIDATE_BOOLEAN);
            
            $duration = $this->calculateLeaveDuration($dateFrom, $dateTo, $includeSaturday, $includeSunday);

            // Check leave balance
            if (in_array($validated['type'], ['sick', 'vacation'])) {
                $leaveBalance = $this->getLeaveBalance($leave->employee, $validated['type']);
                
                if ($leaveBalance < $duration) {
                    throw ValidationException::withMessages([
                        'date_to' => "Insufficient {$validated['type']} leave balance. Available: {$leaveBalance} days."
                    ]);
                }
            }

            // Handle document upload
            if ($request->hasFile('document')) {
                // Delete old document if exists
                if ($leave->document_path) {
                    Storage::disk('local')->delete($leave->document_path);
                }
                
                $uploadedFile = $request->file('document');
                $extension = $uploadedFile->getClientOriginalExtension();
                $filename = 'document_' . time() . '.' . $extension;
                $documentPath = $uploadedFile->storeAs(
                    "leaves/{$leave->leave_id}",
                    $filename,
                    'local' // Private disk
                );
                $validated['document_path'] = $documentPath;
            }

            // Record old state
            $oldState = $leave->getAttributes();

            // Add calculated fields to validated data
            $validated['days_count'] = $duration;
            $validated['include_saturday'] = $includeSaturday;
            $validated['include_sunday'] = $includeSunday;

            $leave->update($validated);

            // Log the update
            activity()
                ->performedOn($leave)
                ->causedBy(Auth::user())
                ->withProperties([
                    'old' => $oldState,
                    'new' => $leave->getAttributes()
                ])
                ->log('leave.updated');

            DB::commit();

            return redirect()->route('attendance.leaves.index')->with('success', 'Leave request updated successfully.');

        } catch (ValidationException $e) {
            DB::rollBack();
            throw $e;
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to update leave', [
                'leave_id' => $leave->leave_id,
                'error' => $e->getMessage()
            ]);

            return back()->withErrors(['error' => 'Failed to update leave request.']);
        }
    }

    /**
     * Approve a leave request
     *
     * @param Request $request
     * @return \Illuminate\Http\RedirectResponse
     */
    public function approve(Request $request)
    {
        $validated = $request->validate([
            'leave_id' => ['required', 'exists:employee_leaves,leave_id'],
            'action' => ['required', 'string', 'in:approve,reject'],
            'remarks' => ['nullable', 'string', 'max:500']
        ]);

        try {
            DB::beginTransaction();

            $leave = EmployeeLeave::with('employee')->findOrFail($validated['leave_id']);

            if ($leave->status !== 'pending') {
                return back()->withErrors(['error' => 'Only pending leaves can be approved or rejected.']);
            }

            $newStatus = $validated['action'] === 'approve' ? 'approved' : 'rejected';

            // If approving, update leave balance
            if ($newStatus === 'approved' && in_array($leave->type, ['sick', 'vacation'])) {
                $duration = $leave->date_from->diffInDays($leave->date_to) + 1;
                $this->deductLeaveBalance($leave->employee, $leave->type, $duration);
            }

            $leave->update([
                'status' => $newStatus,
                'approved_by' => Auth::id(),
                'approved_at' => now(),
                'remarks' => $validated['remarks'] ?? $leave->remarks
            ]);

            // Log the approval/rejection
            activity()
                ->performedOn($leave)
                ->causedBy(Auth::user())
                ->withProperties(['action' => $validated['action']])
                ->log("leave.{$validated['action']}d");

            // TODO: Send email notification to employee when user relationship is added

            DB::commit();

            return back()->with('success', "Leave request {$validated['action']}d successfully.");

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to approve/reject leave', [
                'leave_id' => $validated['leave_id'],
                'action' => $validated['action'],
                'error' => $e->getMessage()
            ]);

            return back()->withErrors(['error' => 'Failed to process leave request.']);
        }
    }

    /**
     * Cancel a leave request
     *
     * @param Request $request
     * @return \Illuminate\Http\RedirectResponse
     */
    public function cancel(Request $request)
    {
        $validated = $request->validate([
            'leave_id' => ['required', 'exists:employee_leaves,leave_id'],
            'reason' => ['required', 'string', 'max:500']
        ]);

        try {
            DB::beginTransaction();

            $leave = EmployeeLeave::findOrFail($validated['leave_id']);

            // Status validation
            if (!in_array($leave->status, ['pending', 'approved'])) {
                return back()->withErrors(['error' => 'Only pending or approved leaves can be cancelled.']);
            }

            // Record old status for history
            $oldStatus = $leave->status;

            // If cancelling approved leave, restore balance
            if ($oldStatus === 'approved' && in_array($leave->type, ['sick', 'vacation'])) {
                $duration = $leave->date_from->diffInDays($leave->date_to) + 1;
                $this->restoreLeaveBalance($leave->employee, $leave->type, $duration);
            }

            $leave->update([
                'status' => 'cancelled',
                'remarks' => ($leave->remarks ? $leave->remarks . "\n\n" : '') . 
                            "Cancelled: " . $validated['reason']
            ]);

            // Log the cancellation
            activity()
                ->performedOn($leave)
                ->causedBy(Auth::user())
                ->withProperties([
                    'old_status' => $oldStatus,
                    'reason' => $validated['reason']
                ])
                ->log('leave.cancelled');

            DB::commit();

            return back()->with('success', 'Leave request cancelled successfully.');

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to cancel leave', [
                'leave_id' => $validated['leave_id'],
                'error' => $e->getMessage()
            ]);

            return back()->withErrors(['error' => 'Failed to cancel leave request.']);
        }
    }

    /**
     * Delete a leave request
     *
     * @param EmployeeLeave $leave
     * @return \Illuminate\Http\RedirectResponse
     */
    public function destroy(EmployeeLeave $leave)
    {
        try {
            DB::beginTransaction();

            // Only allow deletion of pending, rejected, or cancelled leaves
            if (!in_array($leave->status, ['pending', 'rejected', 'cancelled'])) {
                return back()->withErrors(['error' => 'Only pending, rejected, or cancelled leaves can be deleted.']);
            }

            // Delete document if exists
            if ($leave->document_path && Storage::disk('local')->exists($leave->document_path)) {
                Storage::disk('local')->delete($leave->document_path);
                
                // Delete the entire folder if empty
                $folder = dirname($leave->document_path);
                if (Storage::disk('local')->exists($folder)) {
                    $files = Storage::disk('local')->files($folder);
                    if (empty($files)) {
                        Storage::disk('local')->deleteDirectory($folder);
                    }
                }
            }

            // Log the deletion before deleting
            activity()
                ->performedOn($leave)
                ->causedBy(Auth::user())
                ->withProperties([
                    'employee' => $leave->employee->first_name . ' ' . $leave->employee->last_name,
                    'type' => $leave->type,
                    'date_from' => $leave->date_from->format('Y-m-d'),
                    'date_to' => $leave->date_to->format('Y-m-d'),
                ])
                ->log('leave.deleted');

            $leave->delete();

            DB::commit();

            return redirect()->route('attendance.leaves.index')
                ->with('success', 'Leave request deleted successfully.');

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to delete leave', [
                'leave_id' => $leave->leave_id,
                'error' => $e->getMessage()
            ]);

            return back()->withErrors(['error' => 'Failed to delete leave request.']);
        }
    }

    /**
     * Check if leave period overlaps with existing leaves
     */
    private function checkLeaveOverlap(
        int $employeeId,
        string $dateFrom,
        string $dateTo,
        ?int $excludeLeaveId = null
    ): bool {
        $query = EmployeeLeave::where('employee_id', $employeeId)
            ->whereIn('status', ['pending', 'approved']);

        if ($excludeLeaveId) {
            $query->where('leave_id', '!=', $excludeLeaveId);
        }

        $query->where(function ($q) use ($dateFrom, $dateTo) {
            $q->whereBetween('date_from', [$dateFrom, $dateTo])
              ->orWhereBetween('date_to', [$dateFrom, $dateTo])
              ->orWhere(function ($q) use ($dateFrom, $dateTo) {
                  $q->where('date_from', '<=', $dateFrom)
                    ->where('date_to', '>=', $dateTo);
              });
        });

        return $query->exists();
    }

    /**
     * Get employee's leave balance for a specific type
     */
    private function getLeaveBalance(Employee $employee, string $type): float
    {
        // This should be implemented based on your leave policy
        // For now, returning a placeholder value
        // You might want to store this in employee_leave_balances table
        return 15.0; // Default 15 days
    }

    /**
     * Deduct leave balance
     */
    private function deductLeaveBalance(Employee $employee, string $type, float $days): void
    {
        // Implementation depends on your leave balance tracking system
        // This is a placeholder
        Log::info("Deducted {$days} days of {$type} leave for employee {$employee->employee_id}");
    }

    /**
     * Restore leave balance
     */
    private function restoreLeaveBalance(Employee $employee, string $type, float $days): void
    {
        // Implementation depends on your leave balance tracking system
        // This is a placeholder
        Log::info("Restored {$days} days of {$type} leave for employee {$employee->employee_id}");
    }

    /**
     * Send notifications to approvers
     */
    private function notifyApprovers(EmployeeLeave $leave, string $type): void
    {
        // Implementation depends on your approval hierarchy
        // This is a placeholder
        Log::info("Notification sent to approvers for leave {$leave->leave_id}");
    }

    /**
     * Calculate leave duration excluding weekends if specified
     */
    private function calculateLeaveDuration(Carbon $dateFrom, Carbon $dateTo, bool $includeSaturday, bool $includeSunday): int
    {
        $count = 0;
        $current = $dateFrom->copy();
        
        while ($current->lte($dateTo)) {
            $dayOfWeek = $current->dayOfWeek; // 0 = Sunday, 6 = Saturday
            
            // Check if we should count this day
            $isSaturday = $dayOfWeek === Carbon::SATURDAY;
            $isSunday = $dayOfWeek === Carbon::SUNDAY;
            
            $shouldCount = 
                (!$isSaturday || $includeSaturday) && 
                (!$isSunday || $includeSunday);
            
            if ($shouldCount) {
                $count++;
            }
            
            $current->addDay();
        }
        
        return $count;
    }

    /**
     * Download leave document
     *
     * @param EmployeeLeave $leave
     * @return \Symfony\Component\HttpFoundation\BinaryFileResponse
     */
    public function downloadDocument(EmployeeLeave $leave)
    {
        if (!$leave->document_path) {
            abort(404, 'No document found');
        }

        if (!Storage::disk('local')->exists($leave->document_path)) {
            abort(404, 'Document file not found');
        }

        $filePath = Storage::disk('local')->path($leave->document_path);
        $filename = basename($leave->document_path);
        
        return response()->download($filePath, $filename);
    }

    /**
     * Get employees by company
     *
     * @param int $company
     * @return \Illuminate\Http\JsonResponse
     */
    public function getEmployeesByCompany($company)
    {
        $employees = Employee::with('department')
            ->where('company_id', $company)
            ->select(['employee_id', 'first_name', 'last_name', 'id_number', 'department_id'])
            ->orderBy('first_name')
            ->get()
            ->map(fn($emp) => [
                'id' => $emp->employee_id,
                'name' => $emp->first_name . ' ' . $emp->last_name,
                'employee_number' => $emp->id_number,
                'department' => $emp->department->name ?? 'N/A'
            ]);

        return response()->json($employees);
    }
}
