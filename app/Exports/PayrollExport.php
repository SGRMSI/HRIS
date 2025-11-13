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
        $records = $this->period->payrollRecords()
            ->with(['employee.company', 'employee.department', 'employee.position'])
            ->get();

        // Construct full name for each employee
        $records->each(function ($record) {
            if ($record->employee) {
                $record->employee->full_name = trim(
                    $record->employee->first_name . ' ' . 
                    ($record->employee->middle_name ? $record->employee->middle_name . ' ' : '') . 
                    $record->employee->last_name
                );
            }
        });

        return $records;
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
            'Basic Pay',
            'Overtime',
            'Night Differential',
            'Holiday',
            'Holiday Pay',
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
            $record->employee->position->title ?? '',
            $record->daily_rate,
            $record->days_worked,
            $record->basic_pay,
            $record->overtime,
            $record->night_differential,
            ($record->special_holiday ?? 0) + ($record->legal_holiday ?? 0),
            $record->holiday_pay,
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
