<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Employee extends Model
{
    use HasFactory;

    protected $primaryKey = 'employee_id';

    protected $fillable = [
        'id_number',
        'first_name',
        'middle_name', 
        'last_name',
        'gender',
        'birth_date',
        'age',
        'civil_status',
        'address',
        'contact_number',
        'company_id',
        'department_id',
        'position_id',
        'account_id',
        'sss_number',
        'phic_number',
        'hdmf_number',
        'tin_number',
        'date_hired',
        'evaluation_start_date',
        'evaluation_end_date',
        'date_regularized',
        'work_shift',
        'employment_status',
        'remarks',
        'infractions',
        'profile_picture',
    ];

    protected $casts = [
        'birth_date' => 'date',
        'date_hired' => 'date',
        'evaluation_start_date' => 'date',
        'evaluation_end_date' => 'date',
        'date_regularized' => 'date',
        'infractions_last_reset_at' => 'datetime',
    ];


    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class, 'company_id', 'company_id');
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class, 'department_id', 'department_id');
    }

    public function position(): BelongsTo
    {
        return $this->belongsTo(Position::class, 'position_id', 'position_id');
    }

    public function account(): BelongsTo
    {
        return $this->belongsTo(Account::class, 'account_id', 'account_id');
    }
    
    public function documents()
    {
        return $this->hasMany(EmployeeDocument::class, 'employee_id', 'employee_id');
    }

    public function schedules()
    {
        return $this->hasMany(EmployeeSchedule::class, 'employee_id', 'employee_id');
    }

    public function currentSchedule()
    {
        return $this->hasOne(EmployeeSchedule::class, 'employee_id', 'employee_id')
            ->where(function ($query) {
                $query->where(function ($q) {
                    // Currently active schedules (started and not ended)
                    $q->where('date_start', '<=', now())
                      ->where(function ($q2) {
                          $q2->whereNull('date_end')
                             ->orWhere('date_end', '>=', now());
                      });
                })
                ->orWhere(function ($q) {
                    // Upcoming schedules (will start soon, within 30 days)
                    $q->where('date_start', '>', now())
                      ->where('date_start', '<=', now()->addDays(30));
                });
            })
            ->with('shift')
            ->latest('date_start');
    }

    public function attendances()
    {
        return $this->hasMany(Attendance::class, 'employee_id', 'employee_id');
    }

    public function leaves()
    {
        return $this->hasMany(EmployeeLeave::class, 'employee_id', 'employee_id');
    }

    public function overtimes()
    {
        return $this->hasMany(EmployeeOvertime::class, 'employee_id', 'employee_id');
    }

    public function payrollSettings()
    {
        return $this->hasOne(EmployeePayrollSettings::class, 'employee_id', 'employee_id');
    }

    /**
     * Check if employee's evaluation period is ending soon (within 3 days)
     */
    public function isEvaluationDueSoon(): bool
    {
        if (!$this->evaluation_end_date) {
            return false;
        }

        $daysUntilEvaluation = now()->diffInDays($this->evaluation_end_date, false);
        return $daysUntilEvaluation >= 0 && $daysUntilEvaluation <= 3;
    }

    /**
     * Check if employee's evaluation period is overdue
     */
    public function isEvaluationOverdue(): bool
    {
        if (!$this->evaluation_end_date) {
            return false;
        }

        return now()->isAfter($this->evaluation_end_date);
    }

    /**
     * Get days until evaluation
     */
    public function getDaysUntilEvaluation(): ?int
    {
        if (!$this->evaluation_end_date) {
            return null;
        }

        return now()->diffInDays($this->evaluation_end_date, false);
    }

    /**
     * Check if employee requires evaluation tracking
     */
    public function requiresEvaluationTracking(): bool
    {
        return in_array($this->employment_status, ['Probationary', 'Trainee']);
    }

    /**
     * Get absents count for a specific month
     */
    public function getAbsentsForMonth($year, $month)
    {
        return $this->attendances()
            ->whereYear('date', $year)
            ->whereMonth('date', $month)
            ->whereRaw('LOWER(status) = ?', ['absent'])
            ->whereNotNull('approved_at') // Only count finalized/approved absents
            ->count();
    }
}

