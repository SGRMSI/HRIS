<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EmployeeLeave extends Model
{
    protected $table = 'employee_leaves';
    protected $primaryKey = 'leave_id';

    protected $fillable = [
        'employee_id',
        'type',
        'date_from',
        'date_to',
        'days_count',
        'include_saturday',
        'include_sunday',
        'status',
        'remarks',
        'approved_by',
        'approved_at',
        'document_path',
    ];

    protected $casts = [
        'date_from' => 'datetime',
        'date_to' => 'datetime',
        'approved_at' => 'datetime',
        'days_count' => 'integer',
        'include_saturday' => 'boolean',
        'include_sunday' => 'boolean',
    ];

    /**
     * Get the route key for the model.
     *
     * @return string
     */
    public function getRouteKeyName()
    {
        return 'leave_id';
    }

    // Relationships
    public function employee()
    {
        return $this->belongsTo(Employee::class, 'employee_id');
    }

    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function approvedBy()
    {
        return $this->belongsTo(User::class, 'approved_by', 'user_id');
    }
}
