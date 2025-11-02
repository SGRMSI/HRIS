<?php

namespace App\Exports;

use App\Models\AttendanceUploadBatch;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;

class AttendanceRawExport implements FromCollection, WithHeadings, WithMapping, WithTitle, ShouldAutoSize
{
    protected Collection $records;
    protected AttendanceUploadBatch $batch;

    public function __construct(Collection $records, AttendanceUploadBatch $batch)
    {
        $this->records = $records;
        $this->batch = $batch;
    }

    public function collection()
    {
        return $this->records;
    }

    public function headings(): array
    {
        return [
            'AC-No.',
            'Name (File)',
            'Time Log',
            'State',
            'New State',
            'Exception',
            'Operation',
            'Employee Match',
            'Employee Number',
            'Employee Name',
        ];
    }

    public function map($row): array
    {
        return [
            $row->ac_no,
            $row->name,
            $row->time_log?->format('Y-m-d H:i:s'),
            $row->state,
            $row->new_state,
            $row->exception,
            $row->operation,
            $row->employee ? 'Matched' : 'Unmatched',
            $row->employee?->id_number ?? '',
            $row->employee ? ($row->employee->first_name . ' ' . $row->employee->last_name) : '',
        ];
    }

    public function title(): string
    {
        return 'Raw Attendance - ' . substr($this->batch->filename, 0, 20);
    }
}