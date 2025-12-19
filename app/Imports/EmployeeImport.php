<?php

namespace App\Imports;

use App\Models\Employee;
use App\Models\Company;
use App\Models\Department;
use App\Models\Position;
use App\Models\Account;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use PhpOffice\PhpSpreadsheet\Shared\Date as ExcelDate;

class EmployeeImport implements ToCollection, WithHeadingRow
{
    private $successCount = 0;
    private $failureCount = 0;
    private $errors = [];

    // Valid values mapping
    private const CIVIL_STATUS_MAP = [
        'SINGLE' => 'Single',
        'MARRIED' => 'Married',
        'WIDOWED' => 'Widowed',
        'DIVORCED' => 'Divorced',
        'SEPARATED' => 'Separated',
    ];

    private const GENDER_MAP = [
        'MALE' => 'Male',
        'FEMALE' => 'Female',
        'M' => 'Male',
        'F' => 'Female',
    ];

    private const EMPLOYMENT_STATUS_MAP = [
        'REGULAR' => 'Regular',
        'PROBATIONARY' => 'Probationary',
        'CONTRACTUAL' => 'Contractual',
        'TRAINEE' => 'Trainee',
        'PROJECT-BASED' => 'Project-Based',
    ];

    public function collection(Collection $rows)
    {
        foreach ($rows as $index => $row) {
            try {
                // Log the row being processed
                \Log::info("Processing employee import row " . ($index + 2), $row->toArray());

                // Initialize nullable fields
                $company = null;
                $department = null;
                $position = null;
                $account = null;

                // Validate and normalize required fields
                if (empty($row['first_name'])) {
                    throw new \Exception("First name is required");
                }
                if (empty($row['last_name'])) {
                    throw new \Exception("Last name is required");
                }
                if (empty($row['gender'])) {
                    throw new \Exception("Gender is required");
                }
                if (empty($row['birth_date'])) {
                    throw new \Exception("Birth date is required");
                }
                if (empty($row['civil_status'])) {
                    throw new \Exception("Civil status is required");
                }
                if (empty($row['address'])) {
                    throw new \Exception("Address is required");
                }
                if (empty($row['contact_number'])) {
                    throw new \Exception("Contact number is required");
                }
                if (empty($row['employment_status'])) {
                    throw new \Exception("Employment status is required");
                }
                if (empty($row['date_hired'])) {
                    throw new \Exception("Date hired is required");
                }

                // Normalize civil_status
                $civilStatus = strtoupper(trim($row['civil_status']));
                if (!isset(self::CIVIL_STATUS_MAP[$civilStatus])) {
                    throw new \Exception("Invalid civil status: '{$row['civil_status']}'. Must be one of: Single, Married, Widowed, Divorced, Separated");
                }
                $civilStatus = self::CIVIL_STATUS_MAP[$civilStatus];

                // Normalize gender
                $gender = strtoupper(trim($row['gender']));
                if (!isset(self::GENDER_MAP[$gender])) {
                    throw new \Exception("Invalid gender: '{$row['gender']}'. Must be Male or Female");
                }
                $gender = self::GENDER_MAP[$gender];

                // Normalize employment_status
                $employmentStatus = strtoupper(trim($row['employment_status']));
                if (!isset(self::EMPLOYMENT_STATUS_MAP[$employmentStatus])) {
                    throw new \Exception("Invalid employment status: '{$row['employment_status']}'. Must be one of: Regular, Probationary, Contractual, Trainee, Project-Based");
                }
                $employmentStatus = self::EMPLOYMENT_STATUS_MAP[$employmentStatus];

                // Only look up company if provided
                if (!empty($row['company'])) {
                    $company = Company::where('name', $row['company'])->first();
                    if (!$company) {
                        throw new \Exception("Company '{$row['company']}' not found");
                    }
                }

                // Only look up department if provided and company exists
                if (!empty($row['department']) && $company) {
                    $department = Department::where('name', $row['department'])
                        ->where('company_id', $company->company_id)
                        ->first();
                    if (!$department) {
                        throw new \Exception("Department '{$row['department']}' not found for company '{$row['company']}'");
                    }
                }

                // Only look up position if provided and company exists
                if (!empty($row['position']) && $company) {
                    $position = Position::where('title', $row['position'])
                        ->where('company_id', $company->company_id)
                        ->first();
                    if (!$position) {
                        throw new \Exception("Position '{$row['position']}' not found for company '{$row['company']}'");
                    }
                }

                // Only look up account if provided and company exists
                if (!empty($row['account']) && $company) {
                    $account = Account::where('name', $row['account'])
                        ->where('company_id', $company->company_id)
                        ->where('active', true)
                        ->first();
                    if (!$account) {
                        throw new \Exception("Account '{$row['account']}' not found or not active for company '{$row['company']}'");
                    }
                }

                // Parse dates (handle Excel serial numbers and string dates)
                $birthDate = $this->parseDate($row['birth_date']);
                $dateHired = $this->parseDate($row['date_hired']);
                $dateRegularized = !empty($row['date_regularized']) 
                    ? $this->parseDate($row['date_regularized']) 
                    : null;

                Employee::create([
                    'first_name' => trim($row['first_name']),
                    'last_name' => trim($row['last_name']),
                    'middle_name' => !empty($row['middle_name']) ? trim($row['middle_name']) : null,
                    'gender' => $gender,
                    'birth_date' => $birthDate,
                    'civil_status' => $civilStatus,
                    'address' => trim($row['address']),
                    'contact_number' => trim($row['contact_number']),
                    'company_id' => $company?->company_id,
                    'department_id' => $department?->department_id,
                    'position_id' => $position?->position_id,
                    'account_id' => $account?->account_id,
                    'sss_number' => !empty($row['sss_number']) ? trim($row['sss_number']) : null,
                    'phic_number' => !empty($row['phic_number']) ? trim($row['phic_number']) : null,
                    'hdmf_number' => !empty($row['hdmf_number']) ? trim($row['hdmf_number']) : null,
                    'tin_number' => !empty($row['tin_number']) ? trim($row['tin_number']) : null,
                    'date_hired' => $dateHired,
                    'date_regularized' => $dateRegularized,
                    'employment_status' => $employmentStatus,
                    'work_shift' => !empty($row['work_shift']) ? trim($row['work_shift']) : 'Dayshift',
                    'remarks' => !empty($row['remarks']) ? trim($row['remarks']) : null,
                ]);

                $this->successCount++;

            } catch (\Illuminate\Database\QueryException $e) {
                $this->failureCount++;
                $errorMessage = $e->getMessage();
                
                // Parse specific constraint violations
                if (str_contains($errorMessage, 'civil_status')) {
                    $this->errors[] = "Row " . ($index + 2) . ": Invalid civil status value. Must be: Single, Married, Widowed, Divorced, or Separated";
                } elseif (str_contains($errorMessage, 'gender')) {
                    $this->errors[] = "Row " . ($index + 2) . ": Invalid gender value. Must be Male or Female";
                } elseif (str_contains($errorMessage, 'employment_status')) {
                    $this->errors[] = "Row " . ($index + 2) . ": Invalid employment status value";
                } elseif (str_contains($errorMessage, 'Duplicate')) {
                    $this->errors[] = "Row " . ($index + 2) . ": Duplicate employee record";
                } else {
                    $this->errors[] = "Row " . ($index + 2) . ": Database error - " . $errorMessage;
                }

                \Log::error("Employee import database error on row " . ($index + 2), [
                    'error' => $errorMessage,
                    'row_data' => $row->toArray(),
                ]);

            } catch (\Exception $e) {
                $this->failureCount++;
                $this->errors[] = "Row " . ($index + 2) . ": " . $e->getMessage();
                
                \Log::error("Employee import error on row " . ($index + 2), [
                    'error' => $e->getMessage(),
                    'row_data' => $row->toArray(),
                ]);
            }
        }
    }

    /**
     * Parse date from Excel format or string
     */
    private function parseDate($value)
    {
        if (empty($value)) {
            return null;
        }
        
        // If numeric, it's an Excel serial date
        if (is_numeric($value)) {
            try {
                return ExcelDate::excelToDateTimeObject($value)->format('Y-m-d');
            } catch (\Exception $e) {
                throw new \Exception("Invalid date format: {$value}");
            }
        }
        
        // Otherwise try to parse as string
        try {
            return \Carbon\Carbon::parse($value)->format('Y-m-d');
        } catch (\Exception $e) {
            throw new \Exception("Invalid date format: {$value}");
        }
    }

    public function getSuccessCount(): int
    {
        return $this->successCount;
    }

    public function getFailureCount(): int
    {
        return $this->failureCount;
    }

    public function getErrors(): array
    {
        return $this->errors;
    }
}