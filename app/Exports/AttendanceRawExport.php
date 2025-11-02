<?php

namespace App\Exports;

use Illuminate\Database\Query\Builder;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;

class AttendanceRawExport implements FromQuery, WithHeadings, WithMapping, WithTitle, ShouldAutoSize
{
    protected $query;

    public function __construct(Builder $query)
    {
        $this->query = $query;
    }

    public function query()
    {
        return $this->query;
    }

    public function headings(): array
    {
        return [
            'Batch',
            'Employee ID',
            'Employee Name',
            'Date',
            'Time',
            'Type',
            'Original Data',
            'Created At'
        ];
    }

    public function map($row): array
    {
        return [
            $row->batch->file_name,
            $row->employee->employee_number,
            $row->employee->name,
            $row->raw_date->format('Y-m-d'),
            $row->raw_time->format('H:i:s'),
            $row->raw_type,
            $row->raw_data,
            $row->created_at->format('Y-m-d H:i:s')
        ];
    }

    public function title(): string
    {
        return 'Raw Attendance Records';
    }
}