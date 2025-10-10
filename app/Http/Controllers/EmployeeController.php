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
            'date_regularized' => 'nullable|date|after_or_equal:date_hired', // Changed from 'after' to 'after_or_equal'
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
            'date_hired' => $employee->date_hired ? date('Y-m-d', strtotime($employee->date_hired)) : null,
            'date_regularized' => $employee->date_regularized ? date('Y-m-d', strtotime($employee->date_regularized)) : null,
            'contact_number' => $employee->contact_number,
            'email' => $employee->email,
            'address' => $employee->address,
            'date_of_birth' => $employee->birth_date ? date('Y-m-d', strtotime($employee->birth_date)) : null,
            'gender' => $employee->gender,
            'civil_status' => $employee->civil_status,
            'age' => $employee->age,
            'sss_number' => $employee->sss_number,
            'phic_number' => $employee->phic_number,
            'hdmf_number' => $employee->hdmf_number,
            'tin_number' => $employee->tin_number,
            'emergency_contact_name' => $employee->emergency_contact_name,
            'emergency_contact_number' => $employee->emergency_contact_number,
        ];
        
        // Get employee documents with uploader information
        $documents = $employee->documents()
            ->with('uploader')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($document) {
                return [
                    'document_id' => $document->document_id,
                    'file_name' => $document->file_name,
                    'category' => $document->category,
                    'uploaded_by' => $document->uploader ? $document->uploader->name : 'Unknown',
                    'uploaded_at' => $document->uploaded_at ? date('Y-m-d', strtotime($document->uploaded_at)) : date('Y-m-d', strtotime($document->created_at)),
                    'remarks' => $document->remarks ?? '',
                    'file_path' => $document->file_path,
                ];
            });
            
        // Count infractions documents
        $infractionCount = $documents->where('category', 'Infractions')->count();

        return Inertia::render('employee/show', [
            'employee' => array_merge($employeeData, ['infractions' => $infractionCount]),
            'documents' => $documents,
        ]);
    }

    public function edit(Employee $employee)
    {
        // Get all companies with their related data
        $companies = Company::all()->map(function ($company) {
            return [
                'company_id' => $company->company_id,
                'name' => $company->name,
            ];
        });

        $departments = Department::all()->map(function ($department) {
            return [
                'department_id' => $department->department_id,
                'name' => $department->name,
                'company_id' => $department->company_id,
            ];
        });

        $positions = Position::all()->map(function ($position) {
            return [
                'position_id' => $position->position_id,
                'title' => $position->title,
                'company_id' => $position->company_id,
            ];
        });

        $accounts = Account::all()->map(function ($account) {
            return [
                'account_id' => $account->account_id,
                'name' => $account->name,
                'company_id' => $account->company_id,
            ];
        });

        // Prepare employee data for editing
        $employeeData = [
            'employee_id' => $employee->employee_id,
            'id_number' => $employee->id_number,
            'first_name' => $employee->first_name,
            'middle_name' => $employee->middle_name,
            'last_name' => $employee->last_name,
            'full_name' => $this->employeeService->generateFullName(
                $employee->first_name,
                $employee->middle_name,
                $employee->last_name
            ),
            'company' => $employee->company ? $employee->company->name : 'N/A',
            'department' => $employee->department ? $employee->department->name : 'N/A',
            'position' => $employee->position ? $employee->position->title : 'N/A',
            'employment_status' => $employee->employment_status,
            'date_hired' => $employee->date_hired ? $employee->date_hired->format('Y-m-d') : '',
            'date_regularized' => $employee->date_regularized ? $employee->date_regularized->format('Y-m-d') : null,
            'contact_number' => $employee->contact_number,
            'address' => $employee->address,
            'date_of_birth' => $employee->birth_date ? $employee->birth_date->format('Y-m-d') : null,
            'gender' => $employee->gender,
            'civil_status' => $employee->civil_status,
            'age' => $employee->age,
            'sss_number' => $employee->sss_number,
            'phic_number' => $employee->phic_number,
            'hdmf_number' => $employee->hdmf_number,
            'tin_number' => $employee->tin_number,
            'company_id' => $employee->company_id,
            'department_id' => $employee->department_id,
            'position_id' => $employee->position_id,
            'account_id' => $employee->account_id,
            'remarks' => $employee->remarks,
        ];

        // Get employee documents
        $documents = $employee->documents()
            ->with('uploader')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($document) {
                return [
                    'document_id' => $document->document_id,
                    'file_name' => $document->file_name,
                    'category' => $document->category,
                    'uploaded_by' => $document->uploader ? $document->uploader->name : 'Unknown',
                    'uploaded_at' => $document->uploaded_at ? date('Y-m-d', strtotime($document->uploaded_at)) : date('Y-m-d', strtotime($document->created_at)),
                    'remarks' => $document->remarks ?? '',
                    'file_path' => $document->file_path,
                ];
            });
            
        // Count infractions documents
        $infractionCount = $documents->where('category', 'Infractions')->count();

        return Inertia::render('employee/edit', [
            'employee' => array_merge($employeeData, ['infractions' => $infractionCount]),
            'companies' => $companies,
            'departments' => $departments,
            'positions' => $positions,
            'accounts' => $accounts,
            'documents' => $documents,
        ]);
    }

    public function update(Request $request, Employee $employee)
    {
        // Validate the input
        $validated = $request->validate([
            'id_number' => 'required|string|max:255|unique:employees,id_number,' . $employee->employee_id . ',employee_id',
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'middle_name' => 'nullable|string|max:255',
            'gender' => 'required|in:Male,Female,Other',
            'birth_date' => 'required|date',
            'civil_status' => 'required|in:Single,Married,Separated,Widowed',
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
            'date_regularized' => 'nullable|date|after_or_equal:date_hired',
            'employment_status' => 'required|in:Probationary,Regular,Contractual,Resigned,Terminated',
            'remarks' => 'nullable|string',
        ]);

        try {
            // Calculate age from birth date
            $birthDate = new \DateTime($validated['birth_date']);
            $today = new \DateTime('today');
            $age = $birthDate->diff($today)->y;

            // Update the employee
            $employee->update([
                'id_number' => $validated['id_number'],
                'first_name' => $validated['first_name'],
                'last_name' => $validated['last_name'],
                'middle_name' => $validated['middle_name'],
                'gender' => $validated['gender'],
                'birth_date' => $validated['birth_date'],
                'age' => $age,
                'civil_status' => $validated['civil_status'],
                'address' => $validated['address'],
                'contact_number' => $validated['contact_number'],
                'company_id' => $validated['company_id'],
                'department_id' => $validated['department_id'],
                'position_id' => $validated['position_id'],
                'account_id' => $validated['account_id'],
                'sss_number' => $validated['sss_number'],
                'phic_number' => $validated['phic_number'],
                'hdmf_number' => $validated['hdmf_number'],
                'tin_number' => $validated['tin_number'],
                'date_hired' => $validated['date_hired'],
                'date_regularized' => $validated['date_regularized'],
                'employment_status' => $validated['employment_status'],
                'remarks' => $validated['remarks'],
            ]);

            $employeeName = $this->employeeService->generateFullName(
                $validated['first_name'],
                $validated['middle_name'],
                $validated['last_name']
            );

            return redirect()->route('employee.show', $employee->employee_id)
                ->with('success', "Employee '{$employeeName}' has been updated successfully!");

        } catch (\Exception $e) {
            return redirect()->back()
                ->withErrors(['error' => 'Failed to update employee. Please try again.'])
                ->withInput();
        }
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