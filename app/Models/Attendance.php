<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Attendance extends Model
{
    protected $primaryKey = 'attendance_id';

    protected $fillable = [
        'employee_id',
        'date',
        'shift_id',
        'clock_in',
        'break_out',
        'break_in',
        'clock_out',
        'total_hours',
        'total_minutes',
        'break_minutes',
        'late_minutes',
        'overtime_hours',
        'undertime_hours',
        'status',
        'remarks',
        'created_by',
        'approved_by',
        'approved_at',
        'holiday_id',
        'leave_id',
        'requires_approval',
    ];

    protected $casts = [
        'date' => 'date',
        'clock_in' => 'datetime',
        'clock_out' => 'datetime',
        'break_in' => 'datetime',
        'break_out' => 'datetime',
        'approved_at' => 'datetime',
        'total_hours' => 'integer',
        'total_minutes' => 'integer',
        'overtime_hours' => 'decimal:2',
        'undertime_hours' => 'decimal:2',
        'break_minutes' => 'integer',
        'late_minutes' => 'integer',
        'requires_approval' => 'boolean',
    ];

    // Relationships
    public function employee()
    {
        return $this->belongsTo(Employee::class, 'employee_id');
    }

    public function shift()
    {
        return $this->belongsTo(Shift::class, 'shift_id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function approvedBy()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function holiday()
    {
        return $this->belongsTo(Holiday::class, 'holiday_id');
    }

    public function leave()
    {
        return $this->belongsTo(EmployeeLeave::class, 'leave_id');
    }
}
