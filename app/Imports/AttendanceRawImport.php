<?php

namespace App\Imports;

use App\Models\AttendanceRaw;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithValidation;

class AttendanceRawImport implements ToCollection, WithHeadingRow, WithValidation
{
    private int $batchId;
    private array $headerMap = [
        'ac_no' => 'ac-no',      // "AC-No."
        'no' => 'no',            // "No."
        'name' => 'name',        // "Name"
        'time' => 'time',        // "Time"
        'state' => 'state',      // "State"
        'new_state' => 'new state', // "New State"
        'exception' => 'exception',  // "Exception"
        'operation' => 'operation'   // "Operation"
    ];

    public function __construct(int $batchId)
    {
        $this->batchId = $batchId;
    }

    public function collection(Collection $rows)
    {
        foreach ($rows as $row) {
            try {
                AttendanceRaw::firstOrCreate(
                    [
                        'batch_id' => $this->batchId,
                        'ac_no' => trim($row[$this->headerMap['ac_no']] ?? ''),
                        'time_log' => $this->parseDateTime($row[$this->headerMap['time']] ?? ''),
                        'state' => trim($row[$this->headerMap['state']] ?? ''),
                        'exception' => trim($row[$this->headerMap['exception']] ?? ''),
                    ],
                    [
                        'no' => trim($row[$this->headerMap['no']] ?? ''),
                        'name' => trim($row[$this->headerMap['name']] ?? ''),
                        'new_state' => trim($row[$this->headerMap['new_state']] ?? ''),
                        'operation' => trim($row[$this->headerMap['operation']] ?? ''),
                        'created_at' => now(),
                    ]
                );
            } catch (\Exception $e) {
                // Log the error but continue processing
                \Log::error('Error importing row', [
                    'batch_id' => $this->batchId,
                    'row' => $row,
                    'error' => $e->getMessage()
                ]);
            }
        }
    }

    public function rules(): array
    {
        return [
            '*.ac-no' => ['required', 'string'],
            '*.time' => ['required'],
            '*.state' => ['required', 'string'],
        ];
    }

    private function parseDateTime($value): ?Carbon
    {
        if (empty($value)) {
            return null;
        }

        try {
            return Carbon::parse($value);
        } catch (\Exception $e) {
            \Log::warning('Failed to parse date', [
                'value' => $value,
                'error' => $e->getMessage()
            ]);
            return null;
        }
    }
}