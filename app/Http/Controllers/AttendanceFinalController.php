<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\Employee;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class AttendanceFinalController extends Controller
{
    /**
     * Display final attendance records with filtering and pagination
     */
    public function index(Request $request)
    {
        $query = Attendance::with(['employee', 'shift', 'createdBy', 'approvedBy'])
            ->when($request->search, function ($query, $search) {
                $query->whereHas('employee', function ($q) use ($search) {
                    $q->where('employee_number', 'like', "%{$search}%")
                      ->orWhere('first_name', 'like', "%{$search}%")
                      ->orWhere('last_name', 'like', "%{$search}%");
                });
            })
            ->when($request->date_from, fn ($q) => $q->where('date', '>=', $request->date_from))
            ->when($request->date_to, fn ($q) => $q->where('date', '<=', $request->date_to))
            ->when($request->status, fn ($q) => $q->where('status', $request->status))
            ->when($request->department_id, function ($q) use ($request) {
                $q->whereHas('employee', fn ($q) => $q->where('department_id', $request->department_id));
            });

        $attendances = $query->latest('date')->paginate($request->per_page ?? 15)
            ->withQueryString();

        return Inertia::render('Attendance/FinalIndex', [
            'attendances' => $attendances,
            'filters' => $request->only(['search', 'date_from', 'date_to', 'status', 'department_id']),
            'can' => [
                'approve' => Auth::user()->can('approve attendances'),
                'edit' => Auth::user()->can('edit attendances')
            ]
        ]);
    }

    /**
     * Update a specific attendance record
     */
    public function update(Request $request, Attendance $attendance)
    {
        $this->authorize('edit attendances');

        $validated = $request->validate([
            'clock_in' => 'required|date_format:Y-m-d H:i:s',
            'break_out' => 'nullable|date_format:Y-m-d H:i:s',
            'break_in' => 'nullable|date_format:Y-m-d H:i:s',
            'clock_out' => 'required|date_format:Y-m-d H:i:s|after:clock_in',
            'status' => 'required|string',
            'remarks' => 'nullable|string|max:500'
        ]);

        // Clear approval if record is modified
        $validated['approved_by'] = null;

        $attendance->update($validated);

        return back()->with('success', 'Attendance record updated successfully.');
    }

    /**
     * Approve a specific attendance record
     */
    public function approve(Attendance $attendance)
    {
        $this->authorize('approve attendances');

        $attendance->update([
            'approved_by' => Auth::id()
        ]);

        return back()->with('success', 'Attendance record approved.');
    }

    /**
     * Bulk approve multiple attendance records
     */
    public function bulkApprove(Request $request)
    {
        $this->authorize('approve attendances');

        $validated = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'required|exists:attendances,id'
        ]);

        Attendance::whereIn('id', $validated['ids'])
            ->whereNull('approved_by')
            ->update(['approved_by' => Auth::id()]);

        return back()->with('success', 'Selected attendance records approved.');
    }
}