<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EmployeePayrollSettings extends Model
{
    use HasFactory;

    protected $table = 'employee_payroll_settings';
    protected $primaryKey = 'setting_id';

    protected $fillable = [
        'employee_id',
        'daily_rate',
        'clothing_allowance',
        'rice_allowance',
        'transportation_allowance',
        'program_allowance',
        'attendance_incentive',
        'adjustments',
        'sss_contribution',
        'phic_contribution',
        'hdmf_contribution',
    ];

    protected $casts = [
        'daily_rate' => 'decimal:2',
        'clothing_allowance' => 'decimal:2',
        'rice_allowance' => 'decimal:2',
        'transportation_allowance' => 'decimal:2',
        'program_allowance' => 'decimal:2',
        'attendance_incentive' => 'decimal:2',
        'adjustments' => 'decimal:2',
        'sss_contribution' => 'decimal:2',
        'phic_contribution' => 'decimal:2',
        'hdmf_contribution' => 'decimal:2',
    ];

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'employee_id', 'employee_id');
    }

    /**
     * Get total allowances
     */
    public function getTotalAllowancesAttribute(): float
    {
        return (float) (
            $this->clothing_allowance +
            $this->rice_allowance +
            $this->transportation_allowance +
            $this->program_allowance +
            $this->attendance_incentive
        );
    }

    /**
     * Get total deductions
     */
    public function getTotalDeductionsAttribute(): float
    {
        return (float) (
            $this->sss_contribution +
            $this->phic_contribution +
            $this->hdmf_contribution
        );
    }
}
