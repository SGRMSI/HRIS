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
        $query = EmployeeLeave::with(['employee.department', 'approver'])
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
                      ->orWhere('employee_number', 'like', "%{$request->employee_search}%");
                });
            })
            ->when($request->department_id, function ($q) use ($request) {
                $q->whereHas('employee', function ($q) use ($request) {
                    $q->where('department_id', $request->department_id);
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
                        'id' => $leave->employee->id,
                        'name' => $leave->employee->first_name . ' ' . $leave->employee->last_name,
                        'employee_number' => $leave->employee->employee_number,
                        'department' => $leave->employee->department->name ?? 'N/A'
                    ],
                    'type' => $leave->type,
                    'date_from' => $leave->date_from->format('Y-m-d'),
                    'date_to' => $leave->date_to->format('Y-m-d'),
                    'duration_days' => $leave->date_from->diffInDays($leave->date_to) + 1,
                    'status' => $leave->status,
                    'remarks' => $leave->remarks,
                    'approved_by' => $leave->approver?->name,
                    'approved_at' => $leave->updated_at->format('Y-m-d H:i:s'),
                    'can_approve' => $leave->status === 'pending' && Auth::user()->can('approve leaves'),
                    'can_cancel' => in_array($leave->status, ['pending', 'approved']) && 
                                    ($leave->employee_id === Auth::id() || Auth::user()->can('cancel leaves'))
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
                    'total_days' => $group->sum(fn($l) => $l->date_from->diffInDays($l->date_to) + 1)
                ]);
        }

        return Inertia::render('Attendance/Leaves/Index', [
            'leaves' => $leaves,
            'filters' => $request->only(['status', 'type', 'employee_search', 'department_id', 'date_from', 'date_to']),
            'departments' => Department::select(['id', 'name'])->get(),
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
                ['value' => 'other', 'label' => 'Other']
            ],
            'departmentGroups' => $departmentGroups
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
            'employee_id' => ['required', 'exists:employees,id'],
            'type' => ['required', 'string', 'in:sick,vacation,emergency,unpaid,other'],
            'date_from' => ['required', 'date', 'after_or_equal:today'],
            'date_to' => ['required', 'date', 'after_or_equal:date_from'],
            'remarks' => ['nullable', 'string', 'max:1000'],
            'document' => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:5120'] // 5MB max
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

            // Calculate duration
            $dateFrom = Carbon::parse($validated['date_from']);
            $dateTo = Carbon::parse($validated['date_to']);
            $duration = $dateFrom->diffInDays($dateTo) + 1;

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

            // Handle document upload
            $documentPath = null;
            if ($request->hasFile('document')) {
                $documentPath = $request->file('document')->store(
                    "employee_leaves/{$validated['employee_id']}",
                    'public'
                );
            }

            $leave = EmployeeLeave::create([
                'employee_id' => $validated['employee_id'],
                'type' => $validated['type'],
                'date_from' => $validated['date_from'],
                'date_to' => $validated['date_to'],
                'status' => 'pending',
                'remarks' => $validated['remarks'],
                'document_path' => $documentPath
            ]);

            // Log the creation
            activity()
                ->performedOn($leave)
                ->causedBy(Auth::user())
                ->withProperties(['duration_days' => $duration])
                ->log('leave.created');

            // Send notification to approvers
            $this->notifyApprovers($leave, 'new');

            DB::commit();

            return back()->with('success', 'Leave request submitted successfully.');

        } catch (ValidationException $e) {
            DB::rollBack();
            throw $e;
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to create leave request', [
                'data' => $validated,
                'error' => $e->getMessage()
            ]);

            return back()->withErrors(['error' => 'Failed to create leave request.']);
        }
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
            'document' => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:5120']
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

            // Calculate new duration
            $dateFrom = Carbon::parse($validated['date_from']);
            $dateTo = Carbon::parse($validated['date_to']);
            $duration = $dateFrom->diffInDays($dateTo) + 1;

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
                    Storage::disk('public')->delete($leave->document_path);
                }
                
                $documentPath = $request->file('document')->store(
                    "employee_leaves/{$leave->employee_id}",
                    'public'
                );
                $validated['document_path'] = $documentPath;
            }

            // Record old state
            $oldState = $leave->getAttributes();

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

            return back()->with('success', 'Leave request updated successfully.');

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
        if (!Auth::user()->can('approve leaves')) {
            abort(403);
        }

        $validated = $request->validate([
            'leave_id' => ['required', 'exists:employee_leaves,leave_id'],
            'action' => ['required', 'string', 'in:approve,reject'],
            'remarks' => ['nullable', 'string', 'max:500']
        ]);

        try {
            DB::beginTransaction();

            $leave = EmployeeLeave::with('employee.user')->findOrFail($validated['leave_id']);

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
                'remarks' => $validated['remarks'] ?? $leave->remarks
            ]);

            // Log the approval/rejection
            activity()
                ->performedOn($leave)
                ->causedBy(Auth::user())
                ->withProperties(['action' => $validated['action']])
                ->log("leave.{$validated['action']}d");

            // Send email notification to employee
            if ($leave->employee->user) {
                Mail::send('emails.leave.' . $validated['action'] . 'd', [
                    'leave' => $leave,
                    'approver' => Auth::user()
                ], function ($message) use ($leave, $newStatus) {
                    $message->to($leave->employee->user->email)
                        ->subject('Leave Request ' . ucfirst($newStatus));
                });
            }

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

            // Permission check
            $canCancel = $leave->employee_id === Auth::id() || Auth::user()->can('cancel leaves');
            if (!$canCancel) {
                abort(403);
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
        Log::info("Deducted {$days} days of {$type} leave for employee {$employee->id}");
    }

    /**
     * Restore leave balance
     */
    private function restoreLeaveBalance(Employee $employee, string $type, float $days): void
    {
        // Implementation depends on your leave balance tracking system
        // This is a placeholder
        Log::info("Restored {$days} days of {$type} leave for employee {$employee->id}");
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
}
