<?php

namespace App\Services;

use App\Models\Employee;
use App\Models\PayrollPeriod;
use App\Models\PayrollRecord;
use App\Models\Attendance;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class PayrollService
{
    /**
     * Add employees to payroll period
     */
    public function addEmployeesToPeriod(PayrollPeriod $period, array $employeeIds): array
    {
        $created = 0;
        $skipped = 0;
        $errors = [];

        DB::beginTransaction();
        try {
            foreach ($employeeIds as $employeeId) {
                // Check if employee already in this period
                $exists = PayrollRecord::where('period_id', $period->period_id)
                    ->where('employee_id', $employeeId)
                    ->exists();

                if ($exists) {
                    $skipped++;
                    continue;
                }

                $employee = Employee::find($employeeId);
                if (!$employee) {
                    $errors[] = "Employee ID {$employeeId} not found";
                    continue;
                }

                try {
                    $this->createPayrollRecord($period, $employee);
                    $created++;
                } catch (\Exception $e) {
                    $errors[] = "Error for {$employee->full_name}: " . $e->getMessage();
                }
            }

            $period->calculateTotals();
            DB::commit();

            return [
                'success' => true,
                'created' => $created,
                'skipped' => $skipped,
                'errors' => $errors,
            ];
        } catch (\Exception $e) {
            DB::rollBack();
            return [
                'success' => false,
                'message' => $e->getMessage(),
                'created' => 0,
                'skipped' => 0,
                'errors' => $errors,
            ];
        }
    }

    /**
     * Create payroll record for an employee
     */
    public function createPayrollRecord(PayrollPeriod $period, Employee $employee): PayrollRecord
    {
        // Load employee payroll settings
        $employee->load('payrollSettings');
        $settings = $employee->payrollSettings;

        $record = new PayrollRecord([
            'period_id' => $period->period_id,
            'employee_id' => $employee->employee_id,
        ]);

        // Set daily rate from employee_payroll_settings
        $record->daily_rate = $settings->daily_rate ?? 0;

        // Calculate days worked from attendance
        $record->days_worked = $this->calculateDaysWorked($employee, $period);

        // Set allowances from employee_payroll_settings
        $record->clothing_allowance = $settings->clothing_allowance ?? 0;
        $record->rice_allowance = $settings->rice_allowance ?? 0;
        $record->transportation_allowance = $settings->transportation_allowance ?? 0;
        $record->program_allowance = $settings->program_allowance ?? 0;
        $record->attendance_incentive = $settings->attendance_incentive ?? 0;

        // Set adjustments from employee_payroll_settings
        $record->adjustments = $settings->adjustments ?? 0;

        // Set government contributions from employee_payroll_settings
        $record->sss_contribution = $settings->sss_contribution ?? 0;
        $record->phic_contribution = $settings->phic_contribution ?? 0;
        $record->hdmf_contribution = $settings->hdmf_contribution ?? 0;

        // Calculate overtime and additional earnings from attendance
        $this->calculateEarnings($record, $employee, $period);

        // Calculate holiday pay from holidays worked
        $this->calculateHolidayPay($record, $employee, $period);

        // Calculate late/undertime deductions from attendance
        $this->calculateLateUndertime($record, $employee, $period);

        // Calculate all totals using the exact formula
        $record->calculateAll();

        $record->save();

        return $record;
    }

    /**
     * Calculate days worked from attendance
     */
    protected function calculateDaysWorked(Employee $employee, PayrollPeriod $period): float
    {
        $attendances = Attendance::where('employee_id', $employee->employee_id)
            ->whereBetween('date', [$period->date_from, $period->date_to])
            ->whereIn('status', ['present', 'late'])
            ->count();

        return (float) $attendances;
    }

    /**
     * Calculate overtime, night differential, and holiday pay
     */
    protected function calculateEarnings(PayrollRecord $record, Employee $employee, PayrollPeriod $period): void
    {
        $attendances = Attendance::where('employee_id', $employee->employee_id)
            ->whereBetween('date', [$period->date_from, $period->date_to])
            ->get();

        $hourlyRate = $record->daily_rate / 8; // 8 hours per day

        // Overtime: Use approved EmployeeOvertime records only
        // Formula: (daily_rate / 8) * 1.25 * total_overtime_hours
        $approvedOvertimes = \App\Models\EmployeeOvertime::where('employee_id', $employee->employee_id)
            ->whereBetween('overtime_date', [$period->date_from, $period->date_to])
            ->where('status', 'approved')
            ->get();

        $totalOvertimeMinutes = $approvedOvertimes->sum(function ($ot) {
            return ($ot->duration_hours * 60) + $ot->duration_minutes;
        });

        $overtimeHours = $totalOvertimeMinutes / 60;
        $record->overtime_hours = round($overtimeHours, 2);
        $record->overtime = round($hourlyRate * $overtimeHours * 1.25, 2);

        // Night Differential (10% of hourly rate, would need time tracking)
        $record->night_differential = 0;

        // Holiday pay
        $specialHolidays = $attendances->filter(function ($att) {
            return $att->holiday_id && $att->holiday && $att->holiday->type === 'special';
        });
        $record->special_holiday = round($hourlyRate * $specialHolidays->sum('total_hours') * 0.30, 2);

        $legalHolidays = $attendances->filter(function ($att) {
            return $att->holiday_id && $att->holiday && $att->holiday->type === 'regular';
        });
        $record->legal_holiday = round($hourlyRate * $legalHolidays->sum('total_hours') * 1.0, 2);
    }

    /**
     * Calculate holiday pay for employees who worked on holidays
     */
    protected function calculateHolidayPay(PayrollRecord $record, Employee $employee, PayrollPeriod $period): void
    {
        // Get holidays within the payroll period for the employee's company
        $holidays = \App\Models\Holiday::where('company_id', $employee->company_id)
            ->whereBetween('date', [$period->date_from, $period->date_to])
            ->get();

        $totalHolidayPay = 0;

        foreach ($holidays as $holiday) {
            // Check if employee has attendance on this holiday
            $attendance = Attendance::where('employee_id', $employee->employee_id)
                ->where('date', $holiday->date)
                ->whereIn('status', ['present', 'late']) // Only if they actually worked
                ->first();

            if ($attendance) {
                // Calculate holiday pay: daily_rate * 1 (or * 2 if double pay)
                $multiplier = $holiday->is_double_pay ? 2 : 1;
                $totalHolidayPay += $record->daily_rate * $multiplier;
            }
        }

        $record->holiday_pay = round($totalHolidayPay, 2);
    }

    /**
     * Calculate late and undertime deductions
     * Formula: (daily_rate / 480 minutes) * total_late_minutes
     */
    protected function calculateLateUndertime(PayrollRecord $record, Employee $employee, PayrollPeriod $period): void
    {
        $attendances = Attendance::where('employee_id', $employee->employee_id)
            ->whereBetween('date', [$period->date_from, $period->date_to])
            ->get();

        // Calculate per-minute rate: daily_rate / 8 hours / 60 minutes
        $minuteRate = $record->daily_rate / 8 / 60;

        $totalLateMinutes = $attendances->sum('late_minutes');
        $totalUndertimeMinutes = $attendances->sum('undertime_hours') * 60;

        $record->late_undertime_minutes = (int) ($totalLateMinutes + $totalUndertimeMinutes);
        $record->late_undertime_amount = round($minuteRate * $record->late_undertime_minutes, 2);
    }

    /**
     * Calculate government contributions (SSS, PhilHealth, Pag-IBIG)
     * Note: Now pulled from employee_payroll_settings, this is kept for legacy/reference
     */
    protected function calculateGovernmentContributions(PayrollRecord $record): void
    {
        $monthlyGross = $record->basic_pay * 2; // Estimate monthly from semi-monthly

        // These are now set from employee_payroll_settings
        // Only calculate if not already set
        if (!$record->sss_contribution) {
            $record->sss_contribution = $this->calculateSSS($monthlyGross);
        }
        if (!$record->phic_contribution) {
            $record->phic_contribution = $this->calculatePhilHealth($monthlyGross);
        }
        if (!$record->hdmf_contribution) {
            $record->hdmf_contribution = $this->calculatePagIBIG($monthlyGross);
        }
    }

    /**
     * SSS Contribution Table (Employee Share)
     */
    protected function calculateSSS(float $salary): float
    {
        if ($salary < 3250) return 135.00;
        if ($salary < 3750) return 157.50;
        if ($salary < 4250) return 180.00;
        if ($salary < 4750) return 202.50;
        if ($salary < 5250) return 225.00;
        if ($salary < 5750) return 247.50;
        if ($salary < 6250) return 270.00;
        if ($salary < 6750) return 292.50;
        if ($salary < 7250) return 315.00;
        if ($salary < 7750) return 337.50;
        if ($salary < 8250) return 360.00;
        if ($salary < 8750) return 382.50;
        if ($salary < 9250) return 405.00;
        if ($salary < 9750) return 427.50;
        if ($salary < 10250) return 450.00;
        if ($salary < 10750) return 472.50;
        if ($salary < 11250) return 495.00;
        if ($salary < 11750) return 517.50;
        if ($salary < 12250) return 540.00;
        if ($salary < 12750) return 562.50;
        if ($salary < 13250) return 585.00;
        if ($salary < 13750) return 607.50;
        if ($salary < 14250) return 630.00;
        if ($salary < 14750) return 652.50;
        if ($salary < 15250) return 675.00;
        if ($salary < 15750) return 697.50;
        if ($salary < 16250) return 720.00;
        if ($salary < 16750) return 742.50;
        if ($salary < 17250) return 765.00;
        if ($salary < 17750) return 787.50;
        if ($salary < 18250) return 810.00;
        if ($salary < 18750) return 832.50;
        if ($salary < 19250) return 855.00;
        if ($salary < 19750) return 877.50;
        return 900.00;
    }

    /**
     * PhilHealth Contribution (Employee Share = 2%)
     */
    protected function calculatePhilHealth(float $salary): float
    {
        $contribution = $salary * 0.02;
        return min(max($contribution, 200.00), 1800.00);
    }

    /**
     * Pag-IBIG/HDMF Contribution (Employee Share)
     */
    protected function calculatePagIBIG(float $salary): float
    {
        if ($salary <= 1500) {
            return $salary * 0.01;
        }
        return min($salary * 0.02, 100.00);
    }

    /**
     * Recalculate payroll record
     */
    public function recalculateRecord(PayrollRecord $record): PayrollRecord
    {
        $period = $record->period;
        $employee = $record->employee;
        
        // Reload employee payroll settings
        $employee->load('payrollSettings');
        $settings = $employee->payrollSettings;

        // Update from employee_payroll_settings
        $record->daily_rate = $settings->daily_rate ?? $record->daily_rate;
        $record->clothing_allowance = $settings->clothing_allowance ?? 0;
        $record->rice_allowance = $settings->rice_allowance ?? 0;
        $record->transportation_allowance = $settings->transportation_allowance ?? 0;
        $record->program_allowance = $settings->program_allowance ?? 0;
        $record->attendance_incentive = $settings->attendance_incentive ?? 0;
        $record->adjustments = $settings->adjustments ?? 0;
        $record->sss_contribution = $settings->sss_contribution ?? 0;
        $record->phic_contribution = $settings->phic_contribution ?? 0;
        $record->hdmf_contribution = $settings->hdmf_contribution ?? 0;

        // Recalculate days worked from attendance
        $record->days_worked = $this->calculateDaysWorked($employee, $period);

        // Recalculate overtime and earnings from attendance
        $this->calculateEarnings($record, $employee, $period);

        // Recalculate holiday pay from holidays worked
        $this->calculateHolidayPay($record, $employee, $period);

        // Recalculate late/undertime from attendance
        $this->calculateLateUndertime($record, $employee, $period);

        // Recalculate all totals
        $record->calculateAll();
        $record->save();

        return $record;
    }
}
