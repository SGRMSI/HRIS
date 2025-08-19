<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\Department;
use App\Models\Company;
use App\Models\Position;
use App\Models\Account;
use App\Services\EmployeeService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class EmployeeController extends Controller
{
    protected $employeeService;

    public function __construct(EmployeeService $employeeService)
    {
        $this->employeeService = $employeeService;
    }

    public function index()
    {
        $employees = Employee::with(['company', 'department', 'position'])
            ->get()
            ->map(function ($employee) {
                return [
                    'employee_id' => $employee->employee_id,
                    'id_number' => $employee->id_number,
                    'full_name' => $this->employeeService->generateFullName(
                        $employee->first_name,
                        $employee->middle_name,
                        $employee->last_name
                    ),
                    'company' => $employee->company ? $employee->company->name : 'N/A',
                    'department' => $employee->department ? $employee->department->name : null,
                    'position' => $employee->position ? $employee->position->title : 'N/A',
                    'employment_status' => $employee->employment_status,
                    'date_hired' => $employee->date_hired->format('Y-m-d'),
                    'contact_number' => $employee->contact_number,
                ];
            });

        return Inertia::render('employee', [
            'employees' => $employees,
        ]);
    }

    public function create()
    {
        $companies = Company::all(['company_id', 'name']);
        $departments = Department::all(['department_id', 'name', 'company_id']);
        $positions = Position::all(['position_id', 'title', 'company_id']);
        $accounts = Account::where('active', true)->get(['account_id', 'name', 'company_id']);

        return Inertia::render('employee/create-employee', [
            'companies' => $companies,
            'departments' => $departments,
            'positions' => $positions,
            'accounts' => $accounts,
        ]);
    }

    public function store(Request $request)
    {
        $techubCompany = Company::where('name', 'TechHub')->first();

        $validated = $request->validate([
            'id_number' => 'required|string|unique:employees,id_number',
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'middle_name' => 'nullable|string|max:255',
            'gender' => 'required|in:Male,Female',
            'birth_date' => 'required|date',
            'civil_status' => 'required|in:Single,Married,Divorced,Widowed',
            'address' => 'required|string',
            'contact_number' => 'required|string|max:20',
            'company_id' => 'required|exists:companies,company_id',
            'department_id' => 'required|exists:departments,department_id',
            'position_id' => 'required|exists:positions,position_id',
            'account_id' => 'nullable|exists:accounts,account_id',
            'sss_number' => 'nullable|string|max:20',
            'phic_number' => 'nullable|string|max:20',
            'hdmf_number' => 'nullable|string|max:20',
            'tin_number' => 'nullable|string|max:20',
            'date_hired' => 'required|date',
            'date_regularized' => 'nullable|date|after:date_hired',
            'employment_status' => 'required|in:Probationary,Regular,Contractual,Terminated',
            'remarks' => 'nullable|string',
            'profile_picture' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
        ]);

        // Convert empty string to null for account_id
        if (empty($validated['account_id'])) {
            $validated['account_id'] = null;
        }

        // Force account_id = null if not TechHub
        if ($techubCompany && $validated['company_id'] != $techubCompany->company_id) {
            $validated['account_id'] = null;
        }

        try {
            $employeeData = $this->employeeService->prepareEmployeeData($validated);

            $employeeData['profile_picture'] = $this->employeeService->handleProfilePictureUpload(
                $request->file('profile_picture')
            );

            $employeeData['contact_number'] = $this->employeeService->formatContactNumber(
                $validated['contact_number']
            );

            $employee = Employee::create($employeeData);

            $fullName = $this->employeeService->generateFullName(
                $employee->first_name,
                $employee->middle_name,
                $employee->last_name
            );

            return redirect()->route('employee.index')
                ->with('success', "Employee '{$fullName}' has been created successfully!");

        } catch (\Exception $e) {
            // Add logging to see what the actual error is
            \Log::error('Employee creation failed: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
            
            return redirect()->back()
                ->withErrors(['error' => 'Failed to create employee: ' . $e->getMessage()])
                ->withInput();
        }
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
            $employeeName = $this->employeeService->generateFullName(
                $employee->first_name,
                $employee->middle_name,
                $employee->last_name
            );

            // Delete profile picture if exists
            $this->employeeService->deleteProfilePicture($employee->profile_picture);

            $employee->delete();

            return redirect()->route('employee.index')
                ->with('success', "Employee '{$employeeName}' has been deleted successfully!");

        } catch (\Exception $e) {
            return redirect()->route('employee.index')
                ->with('error', 'Failed to delete employee. Please try again.');
        }
    }
}