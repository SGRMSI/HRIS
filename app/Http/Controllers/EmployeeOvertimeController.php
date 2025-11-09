<?php

namespace App\Http\Controllers;

use App\Models\EmployeeOvertime;
use App\Models\Employee;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class EmployeeOvertimeController extends Controller
{
    /**
     * Display a listing of overtime requests
     */
    public function index(Request $request)
    {
        $query = EmployeeOvertime::with(['employee.department.company', 'creator', 'approver'])
            ->when($request->search, function ($q) use ($request) {
                $q->whereHas('employee', function ($q) use ($request) {
                    $q->where('first_name', 'like', "%{$request->search}%")
                      ->orWhere('last_name', 'like', "%{$request->search}%")
                      ->orWhere('id_number', 'like', "%{$request->search}%");
                })
                ->orWhere('reason', 'like', "%{$request->search}%");
            })
            ->when($request->status, function ($q) use ($request) {
                $q->where('status', $request->status);
            })
            ->when($request->company, function ($q) use ($request) {
                $q->whereHas('employee.department', function ($q) use ($request) {
                    $q->where('company_id', $request->company);
                });
            })
            ->when($request->employee_id, function ($q) use ($request) {
                $q->where('employee_id', $request->employee_id);
            })
            ->when($request->date_from, function ($q) use ($request) {
                $q->where('overtime_date', '>=', $request->date_from);
            })
            ->when($request->date_to, function ($q) use ($request) {
                $q->where('overtime_date', '<=', $request->date_to);
            });

        $overtimes = $query->orderBy('overtime_date', 'desc')
            ->orderBy('created_at', 'desc')
            ->paginate($request->per_page ?? 20)
            ->through(function ($overtime) {
                return [
                    'id' => $overtime->overtime_id,
                    'employee' => [
                        'id' => $overtime->employee->employee_id,
                        'name' => $overtime->employee->first_name . ' ' . $overtime->employee->last_name,
                        'id_number' => $overtime->employee->id_number,
                        'department' => $overtime->employee->department->name ?? 'N/A',
                        'company' => $overtime->employee->department->company->name ?? 'N/A',
                    ],
                    'overtime_date' => $overtime->overtime_date->format('Y-m-d'),
                    'duration' => [
                        'hours' => $overtime->duration_hours,
                        'minutes' => $overtime->duration_minutes,
                        'formatted' => $overtime->getFormattedDuration(),
                        'total_minutes' => $overtime->getTotalMinutes(),
                    ],
                    'reason' => $overtime->reason,
                    'status' => $overtime->status,
                    'remarks' => $overtime->remarks,
                    'has_document' => !is_null($overtime->document_path),
                    'created_by' => $overtime->creator ? $overtime->creator->name : 'System',
                    'approved_by' => $overtime->approver ? $overtime->approver->name : null,
                    'approved_at' => $overtime->approved_at?->format('M d, Y H:i'),
                    'created_at' => $overtime->created_at->format('M d, Y H:i'),
                ];
            });

        $companies = DB::table('companies')
            ->select(['company_id as id', 'name'])
            ->orderBy('name')
            ->get();

        return Inertia::render('Attendance/Overtimes/Index', [
            'overtimes' => $overtimes,
            'filters' => $request->only(['search', 'status', 'company', 'employee_id', 'date_from', 'date_to']),
            'companies' => $companies,
        ]);
    }

    /**
     * Show the form for creating a new overtime request
     */
    public function create()
    {
        $companies = DB::table('companies')
            ->select(['company_id as id', 'name'])
            ->orderBy('name')
            ->get();

        return Inertia::render('Attendance/Overtimes/Create', [
            'companies' => $companies,
        ]);
    }

    /**
     * Get employees by company
     */
    public function getEmployeesByCompany($companyId)
    {
        $employees = Employee::with('department')
            ->whereHas('department', function ($q) use ($companyId) {
                $q->where('company_id', $companyId);
            })
            ->select(['employee_id', 'first_name', 'last_name', 'id_number', 'department_id'])
            ->orderBy('first_name')
            ->get()
            ->map(fn($emp) => [
                'id' => $emp->employee_id,
                'name' => $emp->first_name . ' ' . $emp->last_name,
                'id_number' => $emp->id_number,
                'department' => $emp->department->name ?? 'N/A',
            ]);

        return response()->json($employees);
    }

    /**
     * Store a newly created overtime request
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'employee_id' => ['required', 'exists:employees,employee_id'],
            'overtime_date' => ['required', 'date'],
            'duration_hours' => ['required', 'integer', 'min:0', 'max:24'],
            'duration_minutes' => ['required', 'integer', 'min:0', 'max:59'],
            'reason' => ['required', 'string', 'max:1000'],
            'document' => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:10240'], // 10MB max
        ]);

        // Validate that total duration is at least 1 minute
        if ($validated['duration_hours'] == 0 && $validated['duration_minutes'] == 0) {
            return back()->withErrors(['duration_hours' => 'Duration must be at least 1 minute.']);
        }

        try {
            DB::beginTransaction();

            $overtimeData = [
                'employee_id' => $validated['employee_id'],
                'overtime_date' => $validated['overtime_date'],
                'duration_hours' => $validated['duration_hours'],
                'duration_minutes' => $validated['duration_minutes'],
                'reason' => $validated['reason'],
                'status' => 'pending',
                'created_by' => Auth::id(),
            ];

            // Handle document upload
            if ($request->hasFile('document')) {
                $file = $request->file('document');
                $filename = time() . '_' . $file->getClientOriginalName();
                $path = $file->storeAs('overtime-documents', $filename, 'local');
                $overtimeData['document_path'] = $path;
            }

            $overtime = EmployeeOvertime::create($overtimeData);

            // Log activity
            activity()
                ->performedOn($overtime)
                ->causedBy(Auth::user())
                ->log('overtime.created');

            DB::commit();

            return redirect()
                ->route('attendance.overtimes.index')
                ->with('success', 'Overtime request created successfully.');

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to create overtime request', [
                'data' => $validated,
                'error' => $e->getMessage()
            ]);

            return back()->withErrors(['error' => 'Failed to create overtime request.']);
        }
    }

    /**
     * Display the specified overtime request
     */
    public function show(EmployeeOvertime $overtime)
    {
        $overtime->load(['employee.department', 'employee.company', 'employee.position', 'creator', 'approver']);

        return Inertia::render('Attendance/Overtimes/Show', [
            'overtime' => [
                'overtime_id' => $overtime->overtime_id,
                'employee_id' => $overtime->employee_id,
                'overtime_date' => \Carbon\Carbon::parse($overtime->overtime_date)->format('Y-m-d'),
                'duration_hours' => $overtime->duration_hours,
                'duration_minutes' => $overtime->duration_minutes,
                'reason' => $overtime->reason,
                'status' => $overtime->status,
                'remarks' => $overtime->remarks,
                'document_path' => $overtime->document_path,
                'created_at' => $overtime->created_at->format('Y-m-d H:i:s'),
                'updated_at' => $overtime->updated_at->format('Y-m-d H:i:s'),
                'approved_at' => $overtime->approved_at?->format('Y-m-d H:i:s'),
                'employee' => [
                    'employee_id' => $overtime->employee->employee_id,
                    'first_name' => $overtime->employee->first_name,
                    'last_name' => $overtime->employee->last_name,
                    'id_number' => $overtime->employee->id_number,
                    'department' => $overtime->employee->department ? [
                        'department_id' => $overtime->employee->department->department_id,
                        'department_name' => $overtime->employee->department->department_name,
                    ] : null,
                    'company' => $overtime->employee->company ? [
                        'company_id' => $overtime->employee->company->company_id,
                        'company_name' => $overtime->employee->company->company_name,
                    ] : null,
                    'position' => $overtime->employee->position?->title ?? null,
                ],
                'created_by' => $overtime->creator ? [
                    'user_id' => $overtime->creator->user_id,
                    'name' => $overtime->creator->name,
                ] : null,
                'approved_by' => $overtime->approver ? [
                    'user_id' => $overtime->approver->user_id,
                    'name' => $overtime->approver->name,
                ] : null,
                'formatted_duration' => $overtime->getFormattedDuration(),
                'total_minutes' => $overtime->getTotalMinutes(),
            ],
        ]);
    }

    /**
     * Show the form for editing the specified overtime request
     */
    public function edit(EmployeeOvertime $overtime)
    {
        // Only allow editing if status is pending
        if ($overtime->status !== 'pending') {
            return redirect()
                ->route('attendance.overtimes.show', $overtime)
                ->withErrors(['error' => 'Only pending overtime requests can be edited.']);
        }

        $overtime->load(['employee.department', 'employee.company']);

        return Inertia::render('Attendance/Overtimes/Edit', [
            'overtime' => [
                'overtime_id' => $overtime->overtime_id,
                'employee_id' => $overtime->employee_id,
                'overtime_date' => \Carbon\Carbon::parse($overtime->overtime_date)->format('Y-m-d'),
                'duration_hours' => $overtime->duration_hours,
                'duration_minutes' => $overtime->duration_minutes,
                'reason' => $overtime->reason,
                'document_path' => $overtime->document_path,
                'employee' => [
                    'employee_id' => $overtime->employee->employee_id,
                    'first_name' => $overtime->employee->first_name,
                    'last_name' => $overtime->employee->last_name,
                    'id_number' => $overtime->employee->id_number,
                    'department' => $overtime->employee->department ? [
                        'department_id' => $overtime->employee->department->department_id,
                        'department_name' => $overtime->employee->department->department_name,
                    ] : null,
                    'company' => $overtime->employee->company ? [
                        'company_id' => $overtime->employee->company->company_id,
                        'company_name' => $overtime->employee->company->company_name,
                    ] : null,
                ],
            ],
        ]);
    }

    /**
     * Update the specified overtime request
     */
    public function update(Request $request, EmployeeOvertime $overtime)
    {
        // Only allow updating if status is pending
        if ($overtime->status !== 'pending') {
            return back()->withErrors(['error' => 'Only pending overtime requests can be updated.']);
        }

        $validated = $request->validate([
            'overtime_date' => ['required', 'date'],
            'duration_hours' => ['required', 'integer', 'min:0', 'max:24'],
            'duration_minutes' => ['required', 'integer', 'min:0', 'max:59'],
            'reason' => ['required', 'string', 'max:1000'],
            'document' => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:10240'],
            'remove_document' => ['nullable', 'boolean'],
        ]);

        // Validate that total duration is at least 1 minute
        if ($validated['duration_hours'] == 0 && $validated['duration_minutes'] == 0) {
            return back()->withErrors(['duration_hours' => 'Duration must be at least 1 minute.']);
        }

        try {
            DB::beginTransaction();

            $updateData = [
                'overtime_date' => $validated['overtime_date'],
                'duration_hours' => $validated['duration_hours'],
                'duration_minutes' => $validated['duration_minutes'],
                'reason' => $validated['reason'],
            ];

            // Handle document removal
            if ($request->remove_document && $overtime->document_path) {
                Storage::disk('local')->delete($overtime->document_path);
                $updateData['document_path'] = null;
            }

            // Handle new document upload
            if ($request->hasFile('document')) {
                // Delete old document if exists
                if ($overtime->document_path) {
                    Storage::disk('local')->delete($overtime->document_path);
                }
                
                $file = $request->file('document');
                $filename = time() . '_' . $file->getClientOriginalName();
                $path = $file->storeAs('overtime-documents', $filename, 'local');
                $updateData['document_path'] = $path;
            }

            $overtime->update($updateData);

            // Log activity
            activity()
                ->performedOn($overtime)
                ->causedBy(Auth::user())
                ->log('overtime.updated');

            DB::commit();

            return redirect()
                ->route('attendance.overtimes.index')
                ->with('success', 'Overtime request updated successfully.');

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to update overtime request', [
                'overtime_id' => $overtime->overtime_id,
                'data' => $validated,
                'error' => $e->getMessage()
            ]);

            return back()->withErrors(['error' => 'Failed to update overtime request.']);
        }
    }

    /**
     * Remove the specified overtime request
     */
    public function destroy(EmployeeOvertime $overtime)
    {
        // Only allow deletion if status is pending, rejected, or cancelled
        if (!in_array($overtime->status, ['pending', 'rejected', 'cancelled'])) {
            return back()->withErrors(['error' => 'Only pending, rejected, or cancelled overtime requests can be deleted.']);
        }

        try {
            DB::beginTransaction();

            // Delete document if exists
            if ($overtime->document_path) {
                Storage::disk('local')->delete($overtime->document_path);
            }

            // Log before deletion
            activity()
                ->performedOn($overtime)
                ->causedBy(Auth::user())
                ->withProperties(['overtime' => $overtime->toArray()])
                ->log('overtime.deleted');

            $overtime->delete();

            DB::commit();

            return redirect()
                ->route('attendance.overtimes.index')
                ->with('success', 'Overtime request deleted successfully.');

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to delete overtime request', [
                'overtime_id' => $overtime->overtime_id,
                'error' => $e->getMessage()
            ]);

            return back()->withErrors(['error' => 'Failed to delete overtime request.']);
        }
    }

    /**
     * Approve an overtime request
     */
    public function approve(Request $request, EmployeeOvertime $overtime)
    {
        if ($overtime->status !== 'pending') {
            return back()->withErrors(['error' => 'Only pending overtime requests can be approved.']);
        }

        $validated = $request->validate([
            'remarks' => ['nullable', 'string', 'max:500'],
        ]);

        try {
            DB::beginTransaction();

            $overtime->update([
                'status' => 'approved',
                'remarks' => $validated['remarks'] ?? null,
                'approved_by' => Auth::id(),
                'approved_at' => now(),
            ]);

            // Log activity
            activity()
                ->performedOn($overtime)
                ->causedBy(Auth::user())
                ->log('overtime.approved');

            DB::commit();

            return back()->with('success', 'Overtime request approved successfully.');

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to approve overtime request', [
                'overtime_id' => $overtime->overtime_id,
                'error' => $e->getMessage()
            ]);

            return back()->withErrors(['error' => 'Failed to approve overtime request.']);
        }
    }

    /**
     * Reject an overtime request
     */
    public function reject(Request $request, EmployeeOvertime $overtime)
    {
        if ($overtime->status !== 'pending') {
            return back()->withErrors(['error' => 'Only pending overtime requests can be rejected.']);
        }

        $validated = $request->validate([
            'remarks' => ['required', 'string', 'max:500'],
        ]);

        try {
            DB::beginTransaction();

            $overtime->update([
                'status' => 'rejected',
                'remarks' => $validated['remarks'],
                'approved_by' => Auth::id(),
                'approved_at' => now(),
            ]);

            // Log activity
            activity()
                ->performedOn($overtime)
                ->causedBy(Auth::user())
                ->log('overtime.rejected');

            DB::commit();

            return back()->with('success', 'Overtime request rejected.');

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to reject overtime request', [
                'overtime_id' => $overtime->overtime_id,
                'error' => $e->getMessage()
            ]);

            return back()->withErrors(['error' => 'Failed to reject overtime request.']);
        }
    }

    /**
     * Cancel an approved overtime request
     */
    public function cancel(Request $request, EmployeeOvertime $overtime)
    {
        if ($overtime->status !== 'approved') {
            return back()->withErrors(['error' => 'Only approved overtime requests can be cancelled.']);
        }

        $validated = $request->validate([
            'remarks' => ['required', 'string', 'max:500'],
        ]);

        try {
            DB::beginTransaction();

            $overtime->update([
                'status' => 'cancelled',
                'remarks' => $validated['remarks'],
            ]);

            // Log activity
            activity()
                ->performedOn($overtime)
                ->causedBy(Auth::user())
                ->log('overtime.cancelled');

            DB::commit();

            return back()->with('success', 'Overtime request cancelled successfully.');

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to cancel overtime request', [
                'overtime_id' => $overtime->overtime_id,
                'error' => $e->getMessage()
            ]);

            return back()->withErrors(['error' => 'Failed to cancel overtime request.']);
        }
    }

    /**
     * Download overtime document
     */
    public function downloadDocument(EmployeeOvertime $overtime)
    {
        if (!$overtime->document_path) {
            return back()->withErrors(['error' => 'No document found for this overtime request.']);
        }

        if (!Storage::disk('local')->exists($overtime->document_path)) {
            return back()->withErrors(['error' => 'Document file not found.']);
        }

        return response()->download(
            Storage::disk('local')->path($overtime->document_path),
            basename($overtime->document_path)
        );
    }
}

