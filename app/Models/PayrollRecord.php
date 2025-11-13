<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PayrollRecord extends Model
{
    use HasFactory;

    protected $table = 'payroll_records';
    protected $primaryKey = 'payroll_id';

    protected $fillable = [
        'period_id',
        'employee_id',
        'daily_rate',
        'days_worked',
        'rate_15th_30th',
        'overtime',
        'night_differential',
        'special_holiday',
        'legal_holiday',
        'clothing_allowance',
        'rice_allowance',
        'transportation_allowance',
        'program_allowance',
        'attendance_incentive',
        'adjustments',
        'adjustment_notes',
        'gross_pay',
        'sss_contribution',
        'phic_contribution',
        'hdmf_contribution',
        'late_undertime_minutes',
        'late_undertime_amount',
        'cash_advance',
        'total_deductions',
        'net_pay',
        'status',
        'is_editable',
    ];

    protected $casts = [
        'daily_rate' => 'decimal:2',
        'days_worked' => 'decimal:2',
        'rate_15th_30th' => 'decimal:2',
        'overtime' => 'decimal:2',
        'night_differential' => 'decimal:2',
        'special_holiday' => 'decimal:2',
        'legal_holiday' => 'decimal:2',
        'clothing_allowance' => 'decimal:2',
        'rice_allowance' => 'decimal:2',
        'transportation_allowance' => 'decimal:2',
        'program_allowance' => 'decimal:2',
        'attendance_incentive' => 'decimal:2',
        'adjustments' => 'decimal:2',
        'gross_pay' => 'decimal:2',
        'sss_contribution' => 'decimal:2',
        'phic_contribution' => 'decimal:2',
        'hdmf_contribution' => 'decimal:2',
        'late_undertime_amount' => 'decimal:2',
        'cash_advance' => 'decimal:2',
        'total_deductions' => 'decimal:2',
        'net_pay' => 'decimal:2',
        'is_editable' => 'boolean',
    ];

    public function period(): BelongsTo
    {
        return $this->belongsTo(PayrollPeriod::class, 'period_id', 'period_id');
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'employee_id', 'employee_id');
    }

    /**
     * Calculate Rate 15th/30th: Daily Rate × Days Worked
     */
    public function calculateRate15th30th(): void
    {
        $this->rate_15th_30th = round($this->daily_rate * $this->days_worked, 2);
    }

    /**
     * Calculate Gross Pay: Rate 15th/30th + all earnings
     */
    public function calculateGrossPay(): void
    {
        $this->gross_pay = round(
            $this->rate_15th_30th +
            $this->overtime +
            $this->night_differential +
            $this->special_holiday +
            $this->legal_holiday +
            $this->clothing_allowance +
            $this->rice_allowance +
            $this->transportation_allowance +
            $this->program_allowance +
            $this->attendance_incentive +
            $this->adjustments,
            2
        );
    }

    /**
     * Calculate Total Deductions: Government + Late/Undertime + Cash Advance
     */
    public function calculateTotalDeductions(): void
    {
        $this->total_deductions = round(
            $this->sss_contribution +
            $this->phic_contribution +
            $this->hdmf_contribution +
            $this->late_undertime_amount +
            $this->cash_advance,
            2
        );
    }

    /**
     * Calculate Net Pay: Gross Pay - Total Deductions
     */
    public function calculateNetPay(): void
    {
        $this->net_pay = round($this->gross_pay - $this->total_deductions, 2);
    }

    /**
     * Calculate all totals following the payroll formula
     */
    public function calculateAll(): void
    {
        $this->calculateRate15th30th();
        $this->calculateGrossPay();
        $this->calculateTotalDeductions();
        $this->calculateNetPay();
    }
}
