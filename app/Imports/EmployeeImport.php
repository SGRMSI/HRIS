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

class EmployeeImport implements ToCollection, WithHeadingRow
{
    private $successCount = 0;
    private $failureCount = 0;
    private $errors = [];

    public function collection(Collection $rows)
    {
        foreach ($rows as $index => $row) {
            try {
                // Initialize nullable fields
                $company = null;
                $department = null;
                $position = null;
                $account = null;

                // Validate required fields
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

                Employee::create([
                    'first_name' => $row['first_name'],
                    'last_name' => $row['last_name'],
                    'middle_name' => $row['middle_name'] ?? null,
                    'gender' => $row['gender'],
                    'birth_date' => $row['birth_date'],
                    'civil_status' => $row['civil_status'],
                    'address' => $row['address'],
                    'contact_number' => $row['contact_number'],
                    'company_id' => $company ? $company->company_id : null,
                    'department_id' => $department ? $department->department_id : null,
                    'position_id' => $position ? $position->position_id : null,
                    'account_id' => $account ? $account->account_id : null,
                    'sss_number' => $row['sss_number'] ?? null,
                    'phic_number' => $row['phic_number'] ?? null,
                    'hdmf_number' => $row['hdmf_number'] ?? null,
                    'tin_number' => $row['tin_number'] ?? null,
                    'date_hired' => $row['date_hired'],
                    'date_regularized' => !empty($row['date_regularized']) ? $row['date_regularized'] : null,
                    'employment_status' => $row['employment_status'],
                    'work_shift' => $row['work_shift'] ?? 'Dayshift',
                    'remarks' => $row['remarks'] ?? null,
                ]);

                $this->successCount++;
            } catch (\Exception $e) {
                $this->failureCount++;
                $this->errors[] = "Row " . ($index + 2) . ": " . $e->getMessage();
            }
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