<?php

namespace App\Exports;

use App\Models\Attendance;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class AttendanceExport implements FromCollection, WithHeadings, WithMapping
{
    private $filters;

    public function __construct(array $filters)
    {
        $this->filters = $filters;
    }

    /**
     * @return Collection
     */
    public function collection()
    {
        return Attendance::with(['employee.department', 'shift', 'approvedBy'])
            ->when($this->filters['date_from'] ?? null, fn($q) => $q->where('date', '>=', $this->filters['date_from']))
            ->when($this->filters['date_to'] ?? null, fn($q) => $q->where('date', '<=', $this->filters['date_to']))
            ->when($this->filters['department_id'] ?? null, function ($q) {
                $q->whereHas('employee', fn($q) => $q->where('department_id', $this->filters['department_id']));
            })
            ->when($this->filters['status'] ?? null, fn($q) => $q->where('status', $this->filters['status']))
            ->orderBy('date')
            ->orderBy('employee_id')
            ->get();
    }

    /**
     * @return array
     */
    public function headings(): array
    {
        return [
            'Date',
            'Employee ID',
            'Employee Name',
            'Department',
            'Shift',
            'Clock In',
            'Break Out',
            'Break In',
            'Clock Out',
            'Total Hours',
            'Overtime Hours',
            'Break Minutes',
            'Status',
            'Remarks',
            'Approved By',
            'Approved At'
        ];
    }

    /**
     * @param Attendance $attendance
     * @return array
     */
    public function map($attendance): array
    {
        return [
            $attendance->date,
            $attendance->employee->employee_number,
            $attendance->employee->full_name,
            $attendance->employee->department->name,
            $attendance->shift?->name ?? 'N/A',
            $attendance->clock_in?->format('H:i:s'),
            $attendance->break_out?->format('H:i:s'),
            $attendance->break_in?->format('H:i:s'),
            $attendance->clock_out?->format('H:i:s'),
            number_format((float) $attendance->total_hours ?? 0, 2),
            number_format((float) $attendance->overtime_hours ?? 0, 2),
            $attendance->break_minutes,
            ucfirst($attendance->status),
            $attendance->remarks,
            $attendance->approvedBy?->name ?? 'N/A',
            $attendance->approved_at?->format('Y-m-d H:i:s') ?? 'N/A'
        ];
    }
}