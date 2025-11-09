<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EmployeeOvertime extends Model
{
    use HasFactory;

    protected $primaryKey = 'overtime_id';

    protected $fillable = [
        'employee_id',
        'overtime_date',
        'duration_hours',
        'duration_minutes',
        'reason',
        'status',
        'remarks',
        'document_path',
        'created_by',
        'approved_by',
        'approved_at',
    ];

    protected $casts = [
        'overtime_date' => 'date',
        'approved_at' => 'datetime',
        'duration_hours' => 'integer',
        'duration_minutes' => 'integer',
    ];

    /**
     * Get the route key name for Laravel.
     */
    public function getRouteKeyName(): string
    {
        return 'overtime_id';
    }

    /**
     * Get the employee that owns the overtime.
     */
    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'employee_id', 'employee_id');
    }

    /**
     * Get the user who created the overtime request.
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by', 'user_id');
    }

    /**
     * Get the user who approved/rejected the overtime.
     */
    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by', 'user_id');
    }

    /**
     * Get total duration in minutes
     */
    public function getTotalMinutes(): int
    {
        return ($this->duration_hours * 60) + $this->duration_minutes;
    }

    /**
     * Get formatted duration
     */
    public function getFormattedDuration(): string
    {
        if ($this->duration_hours > 0 && $this->duration_minutes > 0) {
            return "{$this->duration_hours}h {$this->duration_minutes}m";
        } elseif ($this->duration_hours > 0) {
            return "{$this->duration_hours}h";
        } else {
            return "{$this->duration_minutes}m";
        }
    }
}