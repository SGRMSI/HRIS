<?php

namespace App\Imports;

use App\Models\Holiday;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithValidation;

class HolidayImport implements ToCollection, WithHeadingRow
{
    private $companyId;
    private $skipDuplicates;
    private $stats = [
        'created' => 0,
        'skipped' => 0,
        'errors' => 0
    ];

    public function __construct($companyId = null, $skipDuplicates = true)
    {
        $this->companyId = $companyId;
        $this->skipDuplicates = $skipDuplicates;
    }

    /**
     * @param Collection $rows
     */
    public function collection(Collection $rows)
    {
        foreach ($rows as $row) {
            try {
                // Skip empty rows
                if (empty($row['name']) || empty($row['date'])) {
                    continue;
                }

                // Parse date
                $date = $this->parseDate($row['date']);
                if (!$date) {
                    $this->stats['errors']++;
                    Log::warning('Invalid date format in holiday import', ['row' => $row->toArray()]);
                    continue;
                }

                // Determine type
                $type = strtolower($row['type'] ?? 'regular');
                if (!in_array($type, ['regular', 'special', 'company'])) {
                    $type = 'regular';
                }

                // Use row company_id if available, otherwise use constructor company_id
                $companyId = $row['company_id'] ?? $this->companyId;

                // Check for duplicates
                $exists = Holiday::where('date', $date)
                    ->where('company_id', $companyId)
                    ->where('type', $type)
                    ->exists();

                if ($exists) {
                    if ($this->skipDuplicates) {
                        $this->stats['skipped']++;
                        continue;
                    } else {
                        $this->stats['errors']++;
                        continue;
                    }
                }

                // Create holiday
                Holiday::create([
                    'name' => $row['name'],
                    'date' => $date,
                    'type' => $type,
                    'company_id' => $companyId
                ]);

                $this->stats['created']++;

            } catch (\Exception $e) {
                $this->stats['errors']++;
                Log::error('Error importing holiday row', [
                    'row' => $row->toArray(),
                    'error' => $e->getMessage()
                ]);
            }
        }
    }

    /**
     * Parse date from various formats
     */
    private function parseDate($value)
    {
        try {
            // Try parsing as Excel serial date first
            if (is_numeric($value)) {
                return Carbon::instance(\PhpOffice\PhpSpreadsheet\Shared\Date::excelToDateTimeObject($value));
            }

            // Try parsing as string
            return Carbon::parse($value);
        } catch (\Exception $e) {
            return null;
        }
    }

    /**
     * Get import statistics
     */
    public function getStats(): array
    {
        return $this->stats;
    }
}
