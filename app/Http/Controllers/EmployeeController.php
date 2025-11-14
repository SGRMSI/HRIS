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
use Illuminate\Support\Facades\DB;

class EmployeeController extends Controller
{
    protected $employeeService;

    public function __construct(EmployeeService $employeeService)
    {
        $this->employeeService = $employeeService;
    }

    public function index()
    {
        $employees = Employee::with(['company', 'department', 'position', 'currentSchedule.shift'])
            ->get()
            ->map(function ($employee) {
                $currentSchedule = $employee->currentSchedule;
                
                $data = [
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
                    'current_shift' => $currentSchedule && $currentSchedule->shift ? $currentSchedule->shift->name : ($employee->work_shift ?? 'Not Assigned'),
                    'created_at' => $employee->created_at->toISOString(),
                ];

                // Add evaluation data for Probationary and Trainee employees
                if (in_array($employee->employment_status, ['Probationary', 'Trainee']) && $employee->evaluation_end_date) {
                    $data['evaluation_start_date'] = $employee->evaluation_start_date ? $employee->evaluation_start_date->format('Y-m-d') : null;
                    $data['evaluation_end_date'] = $employee->evaluation_end_date->format('Y-m-d');
                    $data['days_until_evaluation'] = $employee->getDaysUntilEvaluation();
                    $data['is_evaluation_overdue'] = $employee->isEvaluationOverdue();
                }

                return $data;
            });

        return Inertia::render('employee', [
            'employees' => $employees,
        ]);
    }

    public function create()
    {
        $companies = Company::withCount(['accounts' => function ($query) {
                $query->where('active', true);
            }])
            ->get(['company_id', 'name'])
            ->map(function ($company) {
                return [
                    'company_id' => $company->company_id,
                    'name' => $company->name,
                    'hasAccount' => $company->accounts_count > 0,
                ];
            });

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
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'middle_name' => 'nullable|string|max:255',
            'gender' => 'required|in:Male,Female',
            'birth_date' => 'required|date',
            'civil_status' => 'required|in:Single,Married,Divorced,Widowed',
            'address' => 'required|string',
            'contact_number' => 'required|string|max:20',
            'company_id' => 'nullable|exists:companies,company_id',
            'department_id' => 'nullable|exists:departments,department_id',
            'position_id' => 'nullable|exists:positions,position_id',
            'account_id' => 'nullable|exists:accounts,account_id',
            'sss_number' => 'nullable|string|max:20',
            'phic_number' => 'nullable|string|max:20',
            'hdmf_number' => 'nullable|string|max:20',
            'tin_number' => 'nullable|string|max:20',
            'date_hired' => 'required|date',
            'date_regularized' => 'nullable|date|after_or_equal:date_hired',
            'employment_status' => 'required|in:Probationary,Trainee,Regular,Contractual,Terminated',
            'evaluation_start_date' => 'nullable|date',
            'evaluation_end_date' => 'nullable|date|after_or_equal:evaluation_start_date',
            'remarks' => 'nullable|string',
            'profile_picture' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
        ]);

        if (empty($validated['account_id'])) {
            $validated['account_id'] = null;
        }

        if ($techubCompany && $validated['company_id'] != $techubCompany->company_id) {
            $validated['account_id'] = null;
        }

        try {
            $company = Company::findOrFail($validated['company_id']);
            $companyPrefix = $this->employeeService->generateCompanyPrefix($company->name);
            $validated['id_number'] = $this->employeeService->generateEmployeeId($companyPrefix);

            $employeeData = $this->employeeService->prepareEmployeeData($validated);

            $employeeData['profile_picture'] = $this->employeeService->handleProfilePictureUpload(
                $request->file('profile_picture')
            );

            $employeeData['contact_number'] = $this->employeeService->formatContactNumber(
                $validated['contact_number']
            );

            $employee = Employee::create($employeeData);

            activity()
                ->performedOn($employee)
                ->causedBy(auth()->user())
                ->withProperties([
                    'employee_id' => $employee->employee_id,
                    'id_number' => $employee->id_number,
                    'name' => "{$employee->first_name} " . ($employee->middle_name ? "{$employee->middle_name} " : "") . "{$employee->last_name}",
                    'first_name' => $employee->first_name,
                    'middle_name' => $employee->middle_name,
                    'last_name' => $employee->last_name,
                ])
                ->log('Employee created');

            $fullName = $this->employeeService->generateFullName(
                $employee->first_name,
                $employee->middle_name,
                $employee->last_name
            );

            return redirect()->route('employee.show', $employee->employee_id)
                ->with('success', "Employee '{$fullName}' has been created successfully!");

        } catch (\Exception $e) {
            \Log::error('Employee creation failed: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
            
            return redirect()->back()
                ->withErrors(['error' => 'Failed to create employee. Please try again.'])
                ->withInput();
        }
    }

    public function show(Employee $employee)
    {
        $employee->load(['currentSchedule.shift', 'company', 'department', 'position']);
        
        $currentSchedule = $employee->currentSchedule;
        
        $employeeData = [
            'employee_id' => $employee->employee_id,
            'id_number' => $employee->id_number,
            'first_name' => $employee->first_name,
            'middle_name' => $employee->middle_name,
            'last_name' => $employee->last_name,
            'full_name' => trim($employee->first_name . ' ' . ($employee->middle_name ? $employee->middle_name . ' ' : '') . $employee->last_name),
            'company' => $employee->company ? $employee->company->name : 'N/A',
            'company_id' => $employee->company_id,
            'department' => $employee->department ? $employee->department->name : 'N/A',
            'position' => $employee->position ? $employee->position->title : 'N/A',
            'employment_status' => $employee->employment_status,
            'date_hired' => $employee->date_hired ? date('Y-m-d', strtotime($employee->date_hired)) : null,
            'date_regularized' => $employee->date_regularized ? date('Y-m-d', strtotime($employee->date_regularized)) : null,
            'work_shift' => $employee->work_shift,
            'current_shift' => $currentSchedule && $currentSchedule->shift ? [
                'schedule_id' => $currentSchedule->schedule_id,
                'name' => $currentSchedule->shift->name,
                'time_in' => $currentSchedule->shift->time_in,
                'time_out' => $currentSchedule->shift->time_out,
                'date_start' => $currentSchedule->date_start,
                'date_end' => $currentSchedule->date_end,
            ] : null,
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
            'profile_picture' => $employee->profile_picture,
        ];

        // Add evaluation data for Probationary and Trainee employees
        if (in_array($employee->employment_status, ['Probationary', 'Trainee']) && $employee->evaluation_end_date) {
            $employeeData['evaluation_start_date'] = $employee->evaluation_start_date ? date('Y-m-d', strtotime($employee->evaluation_start_date)) : null;
            $employeeData['evaluation_end_date'] = date('Y-m-d', strtotime($employee->evaluation_end_date));
            $employeeData['days_until_evaluation'] = $employee->getDaysUntilEvaluation();
            $employeeData['is_evaluation_overdue'] = $employee->isEvaluationOverdue();
            $employeeData['is_evaluation_due_soon'] = $employee->isEvaluationDueSoon() && !$employee->isEvaluationOverdue();
        }
        
        $documents = $employee->documents()
            ->with(relations: 'uploader')
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
            
        $infractionCount = $documents->where('category', 'Infractions')->count();

        // Get current month absents
        $currentYear = now()->year;
        $currentMonth = now()->month;
        $absentsThisMonth = $employee->getAbsentsForMonth($currentYear, $currentMonth);

        return Inertia::render('employee/show', [
            'employee' => array_merge($employeeData, [
                'infractions' => $infractionCount,
                'infractions_last_reset_at' => $employee->infractions_last_reset_at,
                'absents_this_month' => $absentsThisMonth,
                'current_year' => $currentYear,
                'current_month' => $currentMonth,
            ]),
            'documents' => $documents,
        ]);
    }

    public function getAbsents(Employee $employee, Request $request)
    {
        $year = $request->input('year', now()->year);
        $month = $request->input('month', now()->month);
        
        $absentsCount = $employee->attendances()
            ->whereYear('date', $year)
            ->whereMonth('date', $month)
            ->whereRaw('LOWER(status) = ?', ['absent'])
            ->whereNotNull('approved_at') // Only finalized absents
            ->count();
        
        // Get detailed absent records for the month
        $absentRecords = $employee->attendances()
            ->whereYear('date', $year)
            ->whereMonth('date', $month)
            ->whereRaw('LOWER(status) = ?', ['absent'])
            ->whereNotNull('approved_at')
            ->orderBy('date', 'asc')
            ->get(['date', 'remarks', 'approved_at'])
            ->map(function ($record) {
                return [
                    'date' => $record->date,
                    'remarks' => $record->remarks,
                    'approved_at' => $record->approved_at,
                ];
            });
        
        return response()->json([
            'absents_count' => $absentsCount,
            'records' => $absentRecords,
            'year' => $year,
            'month' => $month,
        ]);
    }

    public function edit(Employee $employee)
    {
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

        $employee->load(['currentSchedule.shift']);
        
        $currentSchedule = $employee->currentSchedule;

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
            'work_shift' => $employee->work_shift,
            'current_shift' => $currentSchedule && $currentSchedule->shift ? [
                'schedule_id' => $currentSchedule->schedule_id,
                'shift_id' => $currentSchedule->shift->shift_id,
                'name' => $currentSchedule->shift->name,
                'time_in' => $currentSchedule->shift->time_in,
                'time_out' => $currentSchedule->shift->time_out,
                'date_start' => $currentSchedule->date_start,
                'date_end' => $currentSchedule->date_end,
            ] : null,
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
            'profile_picture' => $employee->profile_picture,
        ];

        // Add evaluation data for Probationary and Trainee employees
        if (in_array($employee->employment_status, ['Probationary', 'Trainee'])) {
            $employeeData['evaluation_start_date'] = $employee->evaluation_start_date ? $employee->evaluation_start_date->format('Y-m-d') : null;
            $employeeData['evaluation_end_date'] = $employee->evaluation_end_date ? $employee->evaluation_end_date->format('Y-m-d') : null;
        }

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
            'employment_status' => 'required|in:Probationary,Trainee,Regular,Contractual,Resigned,Terminated',
            'evaluation_start_date' => 'nullable|date',
            'evaluation_end_date' => 'nullable|date|after_or_equal:evaluation_start_date',
            'remarks' => 'nullable|string',
        ]);

        try {
            $originalData = [
                'id_number' => $employee->id_number,
                'first_name' => $employee->first_name,
                'middle_name' => $employee->middle_name,
                'last_name' => $employee->last_name,
                'company_id' => $employee->company_id,
                'department_id' => $employee->department_id,
                'position_id' => $employee->position_id,
                'employment_status' => $employee->employment_status,
                'date_hired' => $employee->date_hired?->toDateString(),
            ];

            $birthDate = new \DateTime($validated['birth_date']);
            $today = new \DateTime('today');
            $age = $birthDate->diff($today)->y;

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
                'evaluation_start_date' => $validated['evaluation_start_date'] ?? null,
                'evaluation_end_date' => $validated['evaluation_end_date'] ?? null,
                'remarks' => $validated['remarks'],
            ]);

            $employeeName = $this->employeeService->generateFullName(
                $validated['first_name'],
                $validated['middle_name'],
                $validated['last_name']
            );

            $changes = [];
            if ($originalData['id_number'] !== $validated['id_number']) {
                $changes['id_number'] = [
                    'old' => $originalData['id_number'],
                    'new' => $validated['id_number']
                ];
            }
            if ($originalData['first_name'] !== $validated['first_name'] ||
                $originalData['middle_name'] !== $validated['middle_name'] ||
                $originalData['last_name'] !== $validated['last_name']) {
                $oldName = $this->employeeService->generateFullName(
                    $originalData['first_name'],
                    $originalData['middle_name'],
                    $originalData['last_name']
                );
                $changes['name'] = [
                    'old' => $oldName,
                    'new' => $employeeName
                ];
            }
            if ($originalData['employment_status'] !== $validated['employment_status']) {
                $changes['employment_status'] = [
                    'old' => $originalData['employment_status'],
                    'new' => $validated['employment_status']
                ];
            }
            if ($originalData['company_id'] !== $validated['company_id']) {
                $oldCompany = Company::find($originalData['company_id'])?->name ?? 'Unknown';
                $newCompany = Company::find($validated['company_id'])?->name ?? 'Unknown';
                $changes['company'] = [
                    'old' => $oldCompany,
                    'new' => $newCompany
                ];
            }

            activity()
                ->performedOn($employee)
                ->causedBy(auth()->user())
                ->withProperties([
                    'employee_id' => $employee->employee_id,
                    'id_number' => $employee->id_number,
                    'name' => $employeeName,
                    'first_name' => $employee->first_name,
                    'middle_name' => $employee->middle_name,
                    'last_name' => $employee->last_name,
                    'changes' => $changes,
                ])
                ->log('Employee updated');

            return redirect()->route('employee.show', $employee->employee_id)
                ->with('success', "Employee '{$employeeName}' has been updated successfully!");

        } catch (\Exception $e) {
            \Log::error('Employee update failed: ' . $e->getMessage());
            
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

            $employeeData = [
                'employee_id' => $employee->employee_id,
                'id_number' => $employee->id_number,
                'name' => $employeeName,
                'first_name' => $employee->first_name,
                'middle_name' => $employee->middle_name,
                'last_name' => $employee->last_name,
            ];

            $constraints = [];
            
            $attendanceRawCount = DB::table('attendance_raws')
                ->where('employee_id', $employee->employee_id)
                ->count();
            $attendanceProcessedCount = DB::table('attendance_processed')
                ->where('employee_id', $employee->employee_id)
                ->count();
            $attendanceCount = DB::table('attendances')
                ->where('employee_id', $employee->employee_id)
                ->count();
            
            if ($attendanceRawCount > 0) {
                $constraints[] = "Raw Attendance Records: $attendanceRawCount";
            }
            if ($attendanceProcessedCount > 0) {
                $constraints[] = "Processed Attendance Records: $attendanceProcessedCount";
            }
            if ($attendanceCount > 0) {
                $constraints[] = "Final Attendance Records: $attendanceCount";
            }
            
            $scheduleCount = DB::table('employee_schedules')
                ->where('employee_id', $employee->employee_id)
                ->count();
            if ($scheduleCount > 0) {
                $constraints[] = "Schedules: $scheduleCount";
            }
            
            $leaveCount = DB::table('employee_leaves')
                ->where('employee_id', $employee->employee_id)
                ->count();
            if ($leaveCount > 0) {
                $constraints[] = "Leave Records: $leaveCount";
            }
            
            $documentCount = DB::table('employee_documents')
                ->where('employee_id', $employee->employee_id)
                ->count();
            if ($documentCount > 0) {
                $constraints[] = "Documents: $documentCount";
            }
            
            $userAccount = DB::table('users')
                ->where('employee_id', $employee->employee_id)
                ->first();
            if ($userAccount) {
                $constraints[] = "User Account: {$userAccount->email}";
            }

            if (!empty($constraints)) {
                $constraintList = implode(", ", $constraints);
                return back()->with('error', 
                    "Cannot delete {$employeeName}. Employee has: {$constraintList}. Please remove these records first or mark employee as inactive."
                );
            }

            if ($employee->profile_picture) {
                try {
                    $this->employeeService->deleteProfilePicture($employee->profile_picture);
                } catch (\Exception $e) {
                    \Log::error('Failed to delete profile picture', [
                        'employee_id' => $employee->employee_id,
                        'error' => $e->getMessage()
                    ]);
                }
            }

            // **FIX: Log activity BEFORE deletion and BEFORE redirect**
            activity()
                ->performedOn($employee)
                ->causedBy(auth()->user())
                ->withProperties($employeeData)
                ->log('Employee deleted');

            $employee->delete();

            return redirect()->route('employee.index')
                ->with('success', "Employee '{$employeeName}' has been deleted successfully!");

        } catch (\Illuminate\Database\QueryException $e) {
            \Log::error('Database constraint error during employee deletion', [
                'employee_id' => $employee->employee_id ?? null,
                'error_code' => $e->getCode(),
                'error_message' => $e->getMessage(),
            ]);
            
            $errorMessage = $e->getMessage();
            $tableName = 'related records';
            
            if (str_contains($errorMessage, 'attendance_raws')) {
                $tableName = 'Raw Attendance Records';
            } elseif (str_contains($errorMessage, 'attendance_processed')) {
                $tableName = 'Processed Attendance Records';
            } elseif (str_contains($errorMessage, 'attendances')) {
                $tableName = 'Final Attendance Records';
            } elseif (str_contains($errorMessage, 'employee_schedules')) {
                $tableName = 'Employee Schedules';
            } elseif (str_contains($errorMessage, 'employee_leaves')) {
                $tableName = 'Leave Records';
            } elseif (str_contains($errorMessage, 'employee_documents')) {
                $tableName = 'Employee Documents';
            } elseif (str_contains($errorMessage, 'users')) {
                $tableName = 'User Account';
            }
            
            return back()->with('error', 
                "Cannot delete employee due to related {$tableName}. Please remove these records first."
            );
            
        } catch (\Exception $e) {
            \Log::error('Exception during employee deletion', [
                'employee_id' => $employee->employee_id ?? null,
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);
            
            return back()->with('error', 
                'An unexpected error occurred while deleting the employee. Please try again or contact support.'
            );
        }
    }

    public function importCsv(Request $request)
    {
        $request->validate([
            'csv_file' => 'required|file|mimes:csv,txt|max:2048',
        ]);

        $file = $request->file('csv_file');
        $path = $file->getRealPath();
        
        $content = file_get_contents($path);
        $firstLine = strtok($content, "\n");
        $delimiter = (strpos($firstLine, "\t") !== false) ? "\t" : ",";
        $rows = explode("\n", $content);
        $headers = str_getcsv(array_shift($rows), $delimiter);
        
        $normalizedHeaders = array_map(function($header) {
            $header = preg_replace('/[\x00-\x1F\x80-\xFF]/', '', $header);
            return strtolower(str_replace(' ', '_', trim($header)));
        }, $headers);
        
        $fieldMap = [
            'last_name' => 'last_name',
            'first_name' => 'first_name',
            'middle_name' => 'middle_name',
            'gender' => 'gender',
            'birth_date' => 'birth_date',
            'age' => 'age',
            'civil_status' => 'civil_status',
            'address' => 'address',
            'contact_number' => 'contact_number',
            'company' => 'company',
            'department' => 'department',
            'position' => 'position',
            'account' => 'account',
            'sss_number' => 'sss_number',
            'phic_number' => 'phic_number',
            'hdmf_number' => 'hdmf_number',
            'tin_number' => 'tin_number',
            'date_hired' => 'date_hired',
            'employment_status' => 'employment_status',
        ];
         
        $companies = Company::pluck('company_id', 'name')->toArray();
        $companiesById = Company::pluck('name', 'company_id')->toArray();
        $departments = Department::pluck('department_id', 'name')->toArray();
        $positions = Position::pluck('position_id', 'title')->toArray();
        $accounts = Account::pluck('account_id', 'name')->toArray();
         
        $importedCount = 0;
        $skippedCount = 0;
        $importedEmployees = [];
    
        DB::beginTransaction();
        try {
            foreach ($rows as $index => $row) {
                if (empty(trim($row))) continue;
                
                $rowData = str_getcsv($row, $delimiter);
                
                if (count($rowData) < count($normalizedHeaders)) {
                    $skippedCount++;
                    continue;
                }
                
                $rowDataAssoc = array_combine($normalizedHeaders, $rowData);
                
                $employeeData = [];
                foreach ($fieldMap as $csvField => $dataField) {
                    if (isset($rowDataAssoc[$csvField])) {
                        $employeeData[$dataField] = $rowDataAssoc[$csvField];
                    }
                }
                
                if (empty($employeeData['last_name']) || empty($employeeData['first_name'])) {
                    $skippedCount++;
                    continue;
                }

                if (!empty($employeeData['birth_date'])) {
                    $date = \DateTime::createFromFormat('m/d/Y', $employeeData['birth_date']);
                    if ($date) {
                        $employeeData['birth_date'] = $date->format('Y-m-d');
                    }
                }

                if (!empty($employeeData['date_hired'])) {
                    $date = \DateTime::createFromFormat('m/d/Y', $employeeData['date_hired']);
                    if ($date) {
                        $employeeData['date_hired'] = $date->format('Y-m-d');
                    }
                }
                
                $companyId = null;
                $departmentId = null;
                $positionId = null;
                $accountId = null;

                if (!empty($employeeData['company'])) {
                    $companyLower = strtolower(trim($employeeData['company']));
                    foreach ($companies as $dbName => $id) {
                        if (strtolower($dbName) === $companyLower) {
                            $companyId = $id;
                            break;
                        }
                    }
                }

                if (!empty($employeeData['department'])) {
                    $departmentLower = strtolower(trim($employeeData['department']));
                    foreach ($departments as $dbName => $id) {
                        if (strtolower($dbName) === $departmentLower) {
                            $departmentId = $id;
                            break;
                        }
                    }
                }

                if (!empty($employeeData['position'])) {
                    $positionLower = strtolower(trim($employeeData['position']));
                    foreach ($positions as $dbName => $id) {
                        if (strtolower($dbName) === $positionLower) {
                            $positionId = $id;
                            break;
                        }
                    }
                }

                if (!empty($employeeData['account'])) {
                    $accountLower = strtolower(trim($employeeData['account']));
                    foreach ($accounts as $dbName => $id) {
                        if (strtolower($dbName) === $accountLower) {
                            $accountId = $id;
                            break;
                        }
                    }
                }
                
                $generatedId = null;
                try {
                    $prefix = 'EMP';
                    if (!is_null($companyId) && isset($companiesById[$companyId])) {
                        $companyNameForPrefix = $companiesById[$companyId];
                        $prefix = $this->employeeService->generateCompanyPrefix($companyNameForPrefix);
                    }
                    $generatedId = $this->employeeService->generateEmployeeId($prefix);
                } catch (\Exception $e) {
                    \Log::error("Row $index: Failed to generate employee id - " . $e->getMessage());
                    $skippedCount++;
                    continue;
                }

                $employee = Employee::create([
                    'id_number' => $generatedId,
                    'last_name' => $employeeData['last_name'],
                    'first_name' => $employeeData['first_name'],
                    'middle_name' => $employeeData['middle_name'] ?? null,
                    'gender' => $employeeData['gender'] ?? 'Other',
                    'birth_date' => $employeeData['birth_date'] ?? now(),
                    'age' => $employeeData['age'] ?? 0,
                    'civil_status' => $employeeData['civil_status'] ?? 'Single',
                    'address' => $employeeData['address'] ?? '',
                    'contact_number' => !empty($employeeData['contact_number']) 
                        ? $this->employeeService->formatContactNumber($employeeData['contact_number']) 
                        : null,
                    'company_id' => $companyId,  
                    'department_id' => $departmentId,  
                    'position_id' => $positionId,  
                    'account_id' => $accountId,  
                    'sss_number' => $employeeData['sss_number'] ?? null,
                    'phic_number' => $employeeData['phic_number'] ?? null,
                    'hdmf_number' => $employeeData['hdmf_number'] ?? null,
                    'tin_number' => $employeeData['tin_number'] ?? null,
                    'date_hired' => $employeeData['date_hired'] ?? now(),
                    'employment_status' => $employeeData['employment_status'] ?? 'Probationary',
                ]);

                $importedEmployees[] = [
                    'id_number' => $employee->id_number,
                    'name' => $this->employeeService->generateFullName(
                        $employee->first_name,
                        $employee->middle_name,
                        $employee->last_name
                    ),
                ];

                $importedCount++;
            }
            

            DB::commit();

            if ($importedCount > 0) {
                activity()
                    ->causedBy(auth()->user())
                    ->withProperties([
                        'total_imported' => $importedCount,
                        'total_skipped' => $skippedCount,
                        'filename' => $file->getClientOriginalName(),
                        'employees' => $importedEmployees,
                    ])
                    ->log("Bulk employee import: {$importedCount} employee(s) imported");
            }
            
            return redirect()->route('employee.index')
                ->with('success', "Successfully imported $importedCount employee(s). Skipped $skippedCount row(s).");
                
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('CSV Import failed: ' . $e->getMessage());

            activity()
                ->causedBy(auth()->user())
                ->withProperties([
                    'filename' => $file->getClientOriginalName(),
                    'error' => $e->getMessage(),
                ])
                ->log('Bulk employee import failed');
        
            return redirect()->route('employee.index')
                ->with('error', 'Failed to import CSV file. Error: ' . $e->getMessage());
        }
    }

    /**
     * Get employees by company (API endpoint for payroll)
     */
    public function getByCompany(Company $company)
    {
        $employees = Employee::where('company_id', $company->company_id)
            ->whereIn('employment_status', ['Probationary', 'Regular', 'Contractual'])
            ->with(['department', 'position'])
            ->orderBy('id_number')
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
                    'department' => $employee->department,
                    'position' => $employee->position,
                ];
            });

        return response()->json($employees);
    }
}