<?php

namespace App\Exports;

use App\Models\Holiday;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithTitle;

class HolidayExport implements FromCollection, WithHeadings, WithMapping, WithTitle
{
    private $filters;

    public function __construct(array $filters = [])
    {
        $this->filters = $filters;
    }

    /**
     * @return Collection
     */
    public function collection()
    {
        return Holiday::with('company:company_id,name')
            ->when($this->filters['year'] ?? null, function ($q) {
                $q->whereYear('date', $this->filters['year']);
            })
            ->when($this->filters['company_id'] ?? null, function ($q) {
                $q->where('company_id', $this->filters['company_id']);
            })
            ->when($this->filters['type'] ?? null, function ($q) {
                $q->where('type', $this->filters['type']);
            })
            ->orderBy('date')
            ->get();
    }

    /**
     * @return array
     */
    public function headings(): array
    {
        return [
            'Date',
            'Name',
            'Type',
            'Day of Week',
            'Company',
            'Company ID'
        ];
    }

    /**
     * @param Holiday $holiday
     * @return array
     */
    public function map($holiday): array
    {
        return [
            $holiday->date instanceof \Carbon\Carbon ? $holiday->date->format('Y-m-d') : $holiday->date,
            $holiday->name,
            ucfirst($holiday->type),
            $holiday->date instanceof \Carbon\Carbon ? $holiday->date->format('l') : '',
            $holiday->company?->name ?? 'All Companies',
            $holiday->company_id ?? ''
        ];
    }

    /**
     * @return string
     */
    public function title(): string
    {
        $year = $this->filters['year'] ?? date('Y');
        return "Holidays {$year}";
    }
}
