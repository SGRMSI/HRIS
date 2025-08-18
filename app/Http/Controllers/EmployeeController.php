<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\Department;
use Illuminate\Http\Request;
use Inertia\Inertia;

class EmployeeController extends Controller
{
    public function index()
    {
        $employees = Employee::with(['company', 'department', 'position'])
            ->get()
            ->map(function ($employee) {
                return [
                    'employee_id' => $employee->employee_id,
                    'id_number' => $employee->id_number,
                    'full_name' => trim($employee->first_name . ' ' . ($employee->middle_name ? $employee->middle_name . ' ' : '') . $employee->last_name),
                    'company' => $employee->company ? $employee->company->name : 'N/A',
                    'department' => $employee->department ? $employee->department->name : null,
                    'position' => $employee->position ? $employee->position->name : 'N/A',
                    'employment_status' => $employee->employment_status,
                    'date_hired' => $employee->date_hired->format('Y-m-d'),
                    'contact_number' => $employee->contact_number,
                ];
            });

        $departments = Department::all(); // Add this line

        return Inertia::render('employee', [
            'employees' => $employees,
            'departments' => $departments, // Add this line
        ]);
    }

    public function destroy(Employee $employee)
    {
        try {
            $employeeName = trim($employee->first_name . ' ' . ($employee->middle_name ? $employee->middle_name . ' ' : '') . $employee->last_name);
            $employee->delete();

            return redirect()->route('employee.index')->with('success', "Employee '{$employeeName}' has been deleted successfully!");

        } catch (\Exception $e) {
            return redirect()->route('employee.index')->with('error', 'Failed to delete employee. Please try again.');
        }
    }
}