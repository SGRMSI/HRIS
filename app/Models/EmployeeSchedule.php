<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * @property int $schedule_id
 * @property int $employee_id
 * @property int $shift_id
 * @property \Carbon\Carbon $date_start
 * @property \Carbon\Carbon|null $date_end
 * @property bool $is_holiday
 * @property \Carbon\Carbon $created_at
 * @property \Carbon\Carbon $updated_at
 */
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
