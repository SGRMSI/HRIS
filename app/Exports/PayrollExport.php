<?php

namespace App\Exports;

use App\Models\PayrollPeriod;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class PayrollExport implements FromCollection, WithHeadings, WithMapping, WithStyles, WithTitle
{
    protected $period;

    public function __construct(PayrollPeriod $period)
    {
        $this->period = $period;
    }

    public function collection()
    {
        return $this->period->payrollRecords()
            ->with(['employee.company', 'employee.department', 'employee.position'])
            ->get();
    }

    public function headings(): array
    {
        return [
            'Employee ID',
            'Employee Name',
            'Company',
            'Department',
            'Position',
            'Daily Rate',
            'Days Worked',
            'Rate 15th/30th',
            'Overtime',
            'Night Differential',
            'Special Holiday',
            'Legal Holiday',
            'Clothing Allowance',
            'Rice Allowance',
            'Transportation Allowance',
            'Program Allowance',
            'Attendance Incentive',
            'Adjustments',
            'Gross Pay',
            'SSS',
            'PhilHealth',
            'Pag-IBIG',
            'Late/Undertime Minutes',
            'Late/Undertime Amount',
            'Cash Advance',
            'Total Deductions',
            'Net Pay',
            'Status',
        ];
    }

    public function map($record): array
    {
        return [
            $record->employee->id_number ?? '',
            $record->employee->full_name ?? '',
            $record->employee->company->name ?? '',
            $record->employee->department->name ?? '',
            $record->employee->position->name ?? '',
            $record->daily_rate,
            $record->days_worked,
            $record->rate_15th_30th,
            $record->overtime,
            $record->night_differential,
            $record->special_holiday,
            $record->legal_holiday,
            $record->clothing_allowance,
            $record->rice_allowance,
            $record->transportation_allowance,
            $record->program_allowance,
            $record->attendance_incentive,
            $record->adjustments,
            $record->gross_pay,
            $record->sss_contribution,
            $record->phic_contribution,
            $record->hdmf_contribution,
            $record->late_undertime_minutes,
            $record->late_undertime_amount,
            $record->cash_advance,
            $record->total_deductions,
            $record->net_pay,
            ucfirst($record->status),
        ];
    }

    public function styles(Worksheet $sheet)
    {
        return [
            1 => ['font' => ['bold' => true]],
        ];
    }

    public function title(): string
    {
        return substr($this->period->period_name, 0, 31); // Excel limit
    }
}
