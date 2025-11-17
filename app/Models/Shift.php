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
        'include_saturday',
        'include_sunday',
        'late_rules',
        'description',
    ];

    protected $casts = [
        'time_in' => 'datetime:H:i',
        'time_out' => 'datetime:H:i',
        'break_start' => 'datetime:H:i',
        'break_end' => 'datetime:H:i',
        'include_saturday' => 'boolean',
        'include_sunday' => 'boolean',
        'late_rules' => 'array',
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

    public function getBreakDurationMinutes(): int
    {
        if (!$this->break_start || !$this->break_end) {
            return 0;
        }

        $breakStart = \Carbon\Carbon::parse($this->break_start->format('H:i:s'));
        $breakEnd = \Carbon\Carbon::parse($this->break_end->format('H:i:s'));
        
        if ($breakEnd < $breakStart) {
            $breakEnd->addDay();
        }
        
        return $breakEnd->diffInMinutes($breakStart);
    }

    /**
     * Get working hours duration (shift duration minus break)
     */
    public function getWorkingHours(): float
    {
        return round(($this->getDurationMinutes() - $this->getBreakDurationMinutes()) / 60, 2);
    }

    /**
     * Calculate late deduction based on late rules
     * 
     * @param int $lateMinutes The number of minutes the employee is late
     * @return int The deduction in minutes
     */
    public function calculateLateDeduction(int $lateMinutes): int
    {
        if ($lateMinutes <= 0 || !$this->late_rules) {
            return 0;
        }

        // Sort rules by threshold ascending to apply the correct rule
        $rules = collect($this->late_rules)->sortBy('threshold_minutes');
        
        $deduction = 0;
        foreach ($rules as $rule) {
            if ($lateMinutes >= ($rule['threshold_minutes'] ?? 0)) {
                $deduction = $rule['deduction_minutes'] ?? 0;
            }
        }
        
        return $deduction;
    }

    /**
     * Check if employee should be marked absent based on late minutes
     * 
     * @param int $lateMinutes
     * @return bool
     */
    public function shouldBeAbsent(int $lateMinutes): bool
    {
        // If 2 hours or more late, mark as absent
        return $lateMinutes >= 120;
    }
}
