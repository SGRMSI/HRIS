<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Shift extends Model
{
    protected $primaryKey = 'shift_id';

    protected $fillable = [
        'name',
        'time_in',
        'time_out',
        'break_start',
        'break_end',
        'grace_period',
        'description',
    ];

    protected $casts = [
        'time_in' => 'datetime',
        'time_out' => 'datetime',
        'break_start' => 'datetime',
        'break_end' => 'datetime',
        'grace_period' => 'integer',
    ];

    // Relationships
    public function schedules()
    {
        return $this->hasMany(EmployeeSchedule::class, 'shift_id');
    }

    public function attendances()
    {
        return $this->hasMany(Attendance::class, 'shift_id');
    }

    public function employees()
    {
        return $this->belongsToMany(Employee::class, 'employee_schedules', 'shift_id', 'employee_id')
            ->withPivot(['date_start', 'date_end', 'is_holiday'])
            ->withTimestamps();
    }

    /**
     * Check if shift crosses midnight
     * 
     * @return bool
     */
    public function isOvernight(): bool
    {
        $timeIn = $this->time_in?->format('H:i:s');
        $timeOut = $this->time_out?->format('H:i:s');
        return $timeIn && $timeOut && $timeOut < $timeIn;
    }

    /**
     * Calculate expected duration in minutes
     * 
     * @return int
     */
    public function getDurationMinutes(): int
    {
        if (!$this->time_in || !$this->time_out) {
            return 0;
        }

        $timeIn = \Carbon\Carbon::parse($this->time_in->format('H:i:s'));
        $timeOut = \Carbon\Carbon::parse($this->time_out->format('H:i:s'));
        
        if ($this->isOvernight()) {
            $timeOut->addDay();
        }
        
        return $timeOut->diffInMinutes($timeIn);
    }
}
