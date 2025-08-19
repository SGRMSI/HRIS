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
                    'position' => $employee->position ? $employee->position->title : 'N/A',
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

    public function show(Employee $employee)
    {
        $employeeData = [
            'employee_id' => $employee->employee_id,
            'id_number' => $employee->id_number,
            'first_name' => $employee->first_name,
            'middle_name' => $employee->middle_name,
            'last_name' => $employee->last_name,
            'full_name' => trim($employee->first_name . ' ' . ($employee->middle_name ? $employee->middle_name . ' ' : '') . $employee->last_name),
            'company' => $employee->company ? $employee->company->name : 'N/A',
            'department' => $employee->department ? $employee->department->name : 'N/A',
            'position' => $employee->position ? $employee->position->title : 'N/A',
            'employment_status' => $employee->employment_status,
            'date_hired' => $employee->date_hired->format('Y-m-d'),
            'contact_number' => $employee->contact_number,
            'email' => $employee->email,
            'address' => $employee->address,
            'date_of_birth' => $employee->date_of_birth ? $employee->date_of_birth->format('Y-m-d') : null,
            'gender' => $employee->gender,
            'civil_status' => $employee->civil_status,
            'emergency_contact_name' => $employee->emergency_contact_name,
            'emergency_contact_number' => $employee->emergency_contact_number,
        ];

        return Inertia::render('employee/show', [
            'employee' => $employeeData,
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