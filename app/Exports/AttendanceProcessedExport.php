<?php

namespace App\Exports;

use App\Models\AttendanceProcessed;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class AttendanceProcessedExport implements FromQuery, WithHeadings, WithMapping, WithStyles
{
    protected $filters;

    public function __construct(array $filters = [])
    {
        $this->filters = $filters;
    }

    public function query()
    {
        return AttendanceProcessed::query()
            ->with(['employee.company:company_id,name', 'employee:employee_id,first_name,last_name,id_number,company_id'])
            ->when($this->filters['company_id'] ?? null, function ($query, $companyId) {
                $query->whereHas('employee', fn($q) => $q->where('company_id', $companyId));
            })
            ->when($this->filters['employee_id'] ?? null, function ($query, $employeeId) {
                $query->where('employee_id', $employeeId);
            })
            ->when($this->filters['date_from'] ?? null, function ($query, $dateFrom) {
                $query->whereDate('date', '>=', $dateFrom);
            })
            ->when($this->filters['date_to'] ?? null, function ($query, $dateTo) {
                $query->whereDate('date', '<=', $dateTo);
            })
            ->when($this->filters['status'] ?? null, function ($query, $status) {
                if ($status === 'Present with Warnings') {
                    $query->where('status', 'Present')
                          ->where('status_message', 'LIKE', 'Warning:%');
                } else {
                    $query->where('status', $status);
                }
            })
            ->when($this->filters['batch_id'] ?? null, function ($query, $batchId) {
                $query->where('batch_id', $batchId);
            })
            ->latest('date');
    }

    public function headings(): array
    {
        return [
            'Employee ID',
            'Employee Name',
            'Company',
            'Date',
            'Clock In',
            'Clock Out',
            'Break Out',
            'Break In',
            'Break Minutes',
            'Total Hours',
            'Total Minutes',
            'Status',
            'Status Message',
        ];
    }

    public function map($record): array
    {
        return [
            $record->employee->id_number ?? 'N/A',
            $record->employee 
                ? "{$record->employee->first_name} {$record->employee->last_name}"
                : 'Unmatched',
            $record->employee->company->name ?? 'N/A',
            \Carbon\Carbon::parse($record->date)->format('Y-m-d'),
            $record->clock_in ? \Carbon\Carbon::parse($record->clock_in)->format('H:i:s') : '',
            $record->clock_out ? \Carbon\Carbon::parse($record->clock_out)->format('H:i:s') : '',
            $record->break_out ? \Carbon\Carbon::parse($record->break_out)->format('H:i:s') : '',
            $record->break_in ? \Carbon\Carbon::parse($record->break_in)->format('H:i:s') : '',
            $record->break_minutes ?? '',
            $record->total_hours ?? '',
            $record->total_minutes ?? '',
            $record->status ?? '',
            $record->status_message ?? '',
        ];
    }

    public function styles(Worksheet $sheet)
    {
        return [
            1 => ['font' => ['bold' => true]],
        ];
    }
}
