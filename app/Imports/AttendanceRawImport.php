<?php

namespace App\Imports;

use App\Models\AttendanceRaw;
use App\Models\Employee;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithValidation;

class AttendanceRawImport implements ToCollection, WithHeadingRow, WithValidation
{
    private int $batchId;
    private int $rowCount = 0;

    public function __construct(int $batchId)
    {
        $this->batchId = $batchId;
    }

    public function collection(Collection $rows)
    {
        foreach ($rows as $row) {
            try {
                // Map Excel columns (with dots and dashes) to our keys
                // AC-No. can be numeric or string, handle both
                $acNo = $row['ac_no'] ?? $row['ac-no'] ?? $row['acno'] ?? '';
                
                // Convert to string and trim
                $acNo = trim((string) $acNo);
                
                $name = trim($row['name'] ?? '');
                $timeLog = $row['time'] ?? '';
                $state = trim($row['state'] ?? '');
                $newState = trim($row['new_state'] ?? $row['new state'] ?? '');
                $exception = trim($row['exception'] ?? '');
                $operation = trim($row['operation'] ?? '');

                if (empty($acNo) || empty($timeLog)) {
                    continue; // Skip invalid rows
                }

                // Try to match employee by AC-No
                // First try to match by employee_id (if AC-No is numeric)
                // Then fall back to id_number (if it's alphanumeric)
                $employee = null;
                
                if (is_numeric($acNo)) {
                    // If AC-No is numeric, match by employee_id
                    $employee = Employee::find((int) $acNo);
                }
                
                // If not found by employee_id, try matching by id_number
                if (!$employee) {
                    $employee = Employee::where('id_number', $acNo)->first();
                }

                AttendanceRaw::create([
                    'batch_id' => $this->batchId,
                    'employee_id' => $employee?->employee_id,
                    'ac_no' => $acNo,
                    'name' => $name,
                    'time_log' => $this->parseDateTime($timeLog),
                    'state' => $state,
                    'new_state' => $newState,
                    'exception' => $exception,
                    'operation' => $operation,
                ]);

                $this->rowCount++;

            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::error('Error importing attendance row', [
                    'batch_id' => $this->batchId,
                    'row' => $row->toArray(),
                    'error' => $e->getMessage()
                ]);
            }
        }
    }

    public function rules(): array
    {
        return [
            // AC-No. can be numeric or string from biometric device
            '*.ac_no' => ['nullable'],
            '*.ac-no' => ['nullable'],
            '*.acno' => ['nullable'],
            '*.no' => ['nullable'], // Sometimes "No." column exists
            '*.time' => ['nullable'],
            '*.name' => ['nullable'],
            '*.state' => ['nullable'],
        ];
    }

    public function getRowCount(): int
    {
        return $this->rowCount;
    }

    private function parseDateTime($value): ?Carbon
    {
        if (empty($value)) {
            return null;
        }

        try {
            // Handle Excel numeric date format (Excel serial number)
            if (is_numeric($value)) {
                return Carbon::instance(\PhpOffice\PhpSpreadsheet\Shared\Date::excelToDateTimeObject($value));
            }
            
            // Handle text date formats like "02/07/2025 8:54 pm"
            // Try parsing with DD/MM/YYYY format first (international format)
            try {
                return Carbon::createFromFormat('d/m/Y g:i a', trim($value));
            } catch (\Exception $e) {
                // If that fails, try MM/DD/YYYY (US format)
                try {
                    return Carbon::createFromFormat('m/d/Y g:i a', trim($value));
                } catch (\Exception $e) {
                    // Fall back to Carbon's general parser
                    return Carbon::parse($value);
                }
            }
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::warning('Failed to parse date', [
                'value' => $value,
                'error' => $e->getMessage()
            ]);
            return null;
        }
    }
}
