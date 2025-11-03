<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EmployeeSchedule extends Model
{
    protected $table = 'employee_schedules';
    protected $primaryKey = 'schedule_id';

    protected $fillable = [
        'employee_id',
        'shift_id',
        'date_start',
        'date_end',
        'is_holiday',
    ];

    protected $casts = [
        'date_start' => 'date',
        'date_end' => 'date',
        'is_holiday' => 'boolean',
    ];

    /**
     * Get the route key for the model.
     *
     * @return string
     */
    public function getRouteKeyName()
    {
        return 'schedule_id';
    }

    // Relationships
    public function employee()
    {
        return $this->belongsTo(Employee::class, 'employee_id');
    }

    public function shift()
    {
        return $this->belongsTo(Shift::class, 'shift_id');
    }
}
