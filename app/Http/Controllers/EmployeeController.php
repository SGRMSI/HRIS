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
                    'created_at' => $employee->created_at->toISOString(),
                ];
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
                    'hasAccount' => $company->accounts_count > 0, // Only counts active accounts
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
            'date_regularized' => 'nullable|date|after_or_equal:date_hired', // Changed from 'after' to 'after_or_equal'
            'work_shift' => 'nullable|in:Dayshift,Graveyard',
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
            // Generate employee ID based on company
            $company = Company::findOrFail($validated['company_id']);
            \Log::info('Company found:', ['name' => $company->name]);
            
            $companyPrefix = $this->employeeService->generateCompanyPrefix($company->name);
            \Log::info('Generated prefix:', ['prefix' => $companyPrefix]);
            
            $validated['id_number'] = $this->employeeService->generateEmployeeId($companyPrefix);
            \Log::info('Generated employee ID:', ['id_number' => $validated['id_number']]);

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

            return redirect()->route('employee.show', $employee->employee_id)
                ->with('success', "Employee '{$fullName}' has been created successfully!");

        } catch (\Exception $e) {
            // Add logging to see what the actual error is
            \Log::error('Employee creation failed: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
            
            return redirect()->back()
                ->withErrors(['error' => 'Failed to create employee. Please try again.'])
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
            'work_shift' => $employee->work_shift,
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
            'work_shift' => $employee->work_shift,
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
            'work_shift' => 'nullable|in:Dayshift,Graveyard',
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
                'work_shift' => $validated['work_shift'],
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

    public function importCsv(Request $request)
    {
        $request->validate([
            'csv_file' => 'required|file|mimes:csv,txt|max:2048',
        ]);

        $file = $request->file('csv_file');
        $path = $file->getRealPath();
        
        // Read file content
        $content = file_get_contents($path);
        
        // Detect delimiter (tab or comma)
        $firstLine = strtok($content, "\n");
        $delimiter = (strpos($firstLine, "\t") !== false) ? "\t" : ",";
        
        $rows = explode("\n", $content);
        
        // Process header row (first line)
        $headers = str_getcsv(array_shift($rows), $delimiter);
        
        // Debug original headers
        \Log::info('Original Headers:', $headers);
        
        // Normalize header keys - convert from "ID NUMBER" to "id_number"
        $normalizedHeaders = array_map(function($header) {
            // Remove BOM character if present
            $header = preg_replace('/[\x00-\x1F\x80-\xFF]/', '', $header);
            // Convert to lowercase and replace spaces with underscores
            return strtolower(str_replace(' ', '_', trim($header)));
        }, $headers);
        
        \Log::info('Normalized Headers:', $normalizedHeaders);
        
        // Updated field map to use names instead of IDs
        $fieldMap = [
            // note: id_number will be auto-generated during import; remove from required CSV
             'last_name' => 'last_name',
             'first_name' => 'first_name',
             'middle_name' => 'middle_name',
             'gender' => 'gender',
             'birth_date' => 'birth_date',
             'age' => 'age',
             'civil_status' => 'civil_status',
             'address' => 'address',
             'contact_number' => 'contact_number',
             'company' => 'company',       // Changed from company_id to company
             'department' => 'department', // Changed from department_id to department
             'position' => 'position',     // Changed from position_id to position
             'account' => 'account',       // Changed from account_id to account
             'sss_number' => 'sss_number',
             'phic_number' => 'phic_number',
             'hdmf_number' => 'hdmf_number',
             'tin_number' => 'tin_number',
             'date_hired' => 'date_hired',
             'employment_status' => 'employment_status',
         ];
         
        // Cache company, department, position, and account data to avoid multiple DB queries
        // $companies: name => id  (used for case-insensitive lookup)
        $companies = Company::pluck('company_id', 'name')->toArray();
        // Reverse map id => name for ID generation
        $companiesById = Company::pluck('name', 'company_id')->toArray();
         $departments = Department::pluck('department_id', 'name')->toArray();
         $positions = Position::pluck('position_id', 'title')->toArray();
         $accounts = Account::pluck('account_id', 'name')->toArray();
         
        DB::beginTransaction();
        try {
            $importedCount = 0;
            $skippedCount = 0;
            
            foreach ($rows as $index => $row) {
                if (empty(trim($row))) continue; // Skip empty rows
                
                // Parse the row with detected delimiter
                $rowData = str_getcsv($row, $delimiter);
                
                // Ensure we have the right number of columns
                if (count($rowData) < count($normalizedHeaders)) {
                    \Log::warning("Row $index has fewer columns than headers", [
                        'headers_count' => count($normalizedHeaders),
                        'columns_count' => count($rowData)
                    ]);
                    $skippedCount++;
                    continue;
                }
                
                // Combine normalized headers with row data
                $rowDataAssoc = array_combine($normalizedHeaders, $rowData);
                
                // Create employee data array using our field map
                $employeeData = [];
                foreach ($fieldMap as $csvField => $dataField) {
                    if (isset($rowDataAssoc[$csvField])) {
                        $employeeData[$dataField] = $rowDataAssoc[$csvField];
                    }
                }
                
                // Log the data we're processing
                \Log::info("Processing row $index", $employeeData);
                
                // Validate required fields
                // id_number will be auto-generated; require only names
                if (empty($employeeData['last_name']) || empty($employeeData['first_name'])) {
                    \Log::warning("Row $index missing required fields");
                    $skippedCount++;
                    continue;
                }
 
                // Format dates if they exist
                if (!empty($employeeData['birth_date'])) {
                    // Try to parse date in common formats
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
                
                // Convert names to IDs for foreign keys (case-insensitive)
                $companyId = null;
                $departmentId = null;
                $positionId = null;
                $accountId = null;

                // Case-insensitive lookup for company ID
                if (!empty($employeeData['company'])) {
                    $companyName = trim($employeeData['company']);
                    $companyLower = strtolower($companyName);
                    
                    // Find company by case-insensitive comparison
                    foreach ($companies as $dbName => $id) {
                        if (strtolower($dbName) === $companyLower) {
                            $companyId = $id;
                            break;
                        }
                    }
                    
                    if ($companyId === null) {
                        \Log::warning("Row $index: Company '{$companyName}' not found in database");
                    }
                }

                // Case-insensitive lookup for department ID
                if (!empty($employeeData['department'])) {
                    $departmentName = trim($employeeData['department']);
                    $departmentLower = strtolower($departmentName);
                    
                    foreach ($departments as $dbName => $id) {
                        if (strtolower($dbName) === $departmentLower) {
                            $departmentId = $id;
                            break;
                        }
                    }
                    
                    if ($departmentId === null) {
                        \Log::warning("Row $index: Department '{$departmentName}' not found in database");
                    }
                }

                // Case-insensitive lookup for position ID
                if (!empty($employeeData['position'])) {
                    $positionName = trim($employeeData['position']);
                    $positionLower = strtolower($positionName);
                    
                    foreach ($positions as $dbName => $id) {
                        if (strtolower($dbName) === $positionLower) {
                            $positionId = $id;
                            break;
                        }
                    }
                    
                    if ($positionId === null) {
                        \Log::warning("Row $index: Position '{$positionName}' not found in database");
                    }
                }

                // Case-insensitive lookup for account ID
                if (!empty($employeeData['account'])) {
                    $accountName = trim($employeeData['account']);
                    $accountLower = strtolower($accountName);
                    
                    foreach ($accounts as $dbName => $id) {
                        if (strtolower($dbName) === $accountLower) {
                            $accountId = $id;
                            break;
                        }
                    }
                    
                    if ($accountId === null) {
                        \Log::warning("Row $index: Account '{$accountName}' not found in database");
                    }
                }
                
                // Auto-generate employee id_number using company prefix if available.
                // If company not provided, fall back to generic 'EMP' prefix.
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
                    // If generation fails, skip the row to avoid duplicate/null ids
                    $skippedCount++;
                    continue;
                }
                

                 // Create employee with resolved IDs (null if not found)
                 Employee::create([
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
                 $importedCount++;
            }
            
            DB::commit();
            
            return redirect()->route('employee.index')
                ->with('success', "Successfully imported $importedCount employee(s). Skipped $skippedCount row(s).");
                
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('CSV Import failed: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
            
            return redirect()->route('employee.index')
                ->with('error', 'Failed to import CSV file. Error: ' . $e->getMessage());
        }
    }
}