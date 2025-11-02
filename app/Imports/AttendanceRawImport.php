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
                $acNo = trim($row['ac_no'] ?? $row['ac-no'] ?? '');
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
                $employee = Employee::where('employee_number', $acNo)->first();

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
            '*.ac_no' => ['nullable', 'string'],
            '*.ac-no' => ['nullable', 'string'],
            '*.time' => ['nullable'],
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
            // Handle Excel date format
            if (is_numeric($value)) {
                return Carbon::createFromFormat('Y-m-d H:i:s', \PhpOffice\PhpSpreadsheet\Shared\Date::excelToDateTimeObject($value)->format('Y-m-d H:i:s'));
            }
            
            return Carbon::parse($value);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::warning('Failed to parse date', [
                'value' => $value,
                'error' => $e->getMessage()
            ]);
            return null;
        }
    }
}
