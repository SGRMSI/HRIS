<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PayrollPeriod extends Model
{
    use HasFactory;

    protected $table = 'payroll_periods';
    protected $primaryKey = 'period_id';

    protected $fillable = [
        'period_name',
        'date_from',
        'date_to',
        'payment_date',
        'status',
        'total_employees',
        'total_gross',
        'total_deductions',
        'total_net',
        'notes',
        'created_by',
        'approved_by',
        'approved_at',
    ];

    protected $casts = [
        'date_from' => 'date',
        'date_to' => 'date',
        'payment_date' => 'date',
        'total_gross' => 'decimal:2',
        'total_deductions' => 'decimal:2',
        'total_net' => 'decimal:2',
        'approved_at' => 'datetime',
    ];

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by', 'user_id');
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by', 'user_id');
    }

    public function payrollRecords(): HasMany
    {
        return $this->hasMany(PayrollRecord::class, 'period_id', 'period_id');
    }

    public function calculateTotals(): void
    {
        $this->total_employees = $this->payrollRecords()->count();
        $this->total_gross = $this->payrollRecords()->sum('gross_pay');
        $this->total_deductions = $this->payrollRecords()->sum('total_deductions');
        $this->total_net = $this->payrollRecords()->sum('net_pay');
        $this->save();
    }
}
