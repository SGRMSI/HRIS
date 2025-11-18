<?php

namespace App\Services;

use App\Models\Attendance;
use App\Models\Employee;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class AttendanceCalculationService
{
    /**
     * Calculate total rendered hours, overtime, and undertime for an attendance record
     * 
     * Logic:
     * 1. Get employee's shift schedule for the date
     * 2. Calculate total rendered hours (capped by shift duration, excluding breaks)
     * 3. Calculate overtime for display (time worked past shift end)
     * 4. Calculate undertime if clocked out before shift end time
     */
    public function calculateAttendance(Attendance $attendance): void
    {
        // Load relationships
        $attendance->load(['employee', 'shift']);
        
        if (!$attendance->shift || !$attendance->clock_in || !$attendance->clock_out) {
            // Cannot calculate without shift or clock times
            return;
        }

        $shift = $attendance->shift;
        $clockIn = Carbon::parse($attendance->clock_in);
        $clockOut = Carbon::parse($attendance->clock_out);
        
        // Get shift times for the attendance date (use raw attributes to avoid datetime casting)
        $attendanceDate = Carbon::parse($attendance->date)->format('Y-m-d');
        $shiftStart = Carbon::parse($attendanceDate . ' ' . $shift->getAttributes()['time_in']);
        $shiftEnd = Carbon::parse($attendanceDate . ' ' . $shift->getAttributes()['time_out']);
        
        // Handle overnight shifts
        if ($shift->isOvernight()) {
            $shiftEnd->addDay();
            // If clock_out appears to be before clock_in, it's actually next day
            if ($clockOut->lt($clockIn)) {
                $clockOut->addDay();
            }
        }
        
        // Get shift's scheduled break duration (always use shift break, not actual)
        $shiftBreakMinutes = 0;
        if ($shift->getAttributes()['break_start'] && $shift->getAttributes()['break_end']) {
            $breakStart = Carbon::parse($shift->getAttributes()['break_start']);
            $breakEnd = Carbon::parse($shift->getAttributes()['break_end']);
            $shiftBreakMinutes = $breakStart->diffInMinutes($breakEnd);
        }
        
        // Calculate actual break taken (for break_minutes field only)
        $actualBreakMinutes = 0;
        if ($attendance->break_out && $attendance->break_in) {
            $breakOut = Carbon::parse($attendance->break_out);
            $breakIn = Carbon::parse($attendance->break_in);
            // Handle overnight: if break times cross midnight
            if ($breakIn->lt($breakOut)) {
                $breakIn->addDay();
            }
            $actualBreakMinutes = $breakOut->diffInMinutes($breakIn);
        } else {
            $actualBreakMinutes = $shiftBreakMinutes;
        }
        
        // Calculate actual start time (don't count early arrivals)
        $actualStart = $clockIn->lt($shiftStart) ? $shiftStart : $clockIn;
        
        // Calculate actual end time for regular hours (capped at shift end)
        $actualEnd = $clockOut->gt($shiftEnd) ? $shiftEnd : $clockOut;
        
        // Calculate shift duration in minutes
        $shiftDurationMinutes = $shiftStart->diffInMinutes($shiftEnd);
        
        // Calculate actual worked minutes (from actual start to actual end, minus break)
        $actualWorkedMinutes = $actualStart->diffInMinutes($actualEnd) - $shiftBreakMinutes;
        
        // Total rendered hours = actual worked (capped at 8 hours)
        $totalRenderedMinutes = min($actualWorkedMinutes, 8 * 60);
        $totalRenderedHours = round($totalRenderedMinutes / 60, 2);
        
        // Calculate late minutes (no grace period - late is late)
        $lateMinutes = 0;
        if ($clockIn->gt($shiftStart)) {
            $lateMinutes = $shiftStart->diffInMinutes($clockIn);
        }
        
        // Check if should be marked as absent (2+ hours late)
        if ($shift->shouldBeAbsent($lateMinutes)) {
            // Mark as absent by setting status
            $attendance->update([
                'status' => 'absent',
                'late_minutes' => $lateMinutes,
                'remarks' => 'Auto-marked absent: ' . ($lateMinutes) . ' minutes late (2+ hours)',
            ]);
            return; // Don't continue with other calculations
        }
        
        // Calculate overtime
        $overtimeHours = $this->calculateOvertime($attendance, $clockOut, $shiftEnd);
        
        // Calculate night differential hours (10pm - 6am)
        // Use actual work period (shift start to shift end, minus break) + approved overtime
        $nightDiffHours = $this->calculateNightDifferential(
            $actualStart, 
            $actualEnd, 
            $shiftBreakMinutes,
            $overtimeHours,
            $shiftEnd
        );
        
        // Calculate undertime
        $undertimeHours = 0;
        if ($clockOut->lt($shiftEnd)) {
            $undertimeMinutes = $clockOut->diffInMinutes($shiftEnd);
            $undertimeHours = round($undertimeMinutes / 60, 2);
        }
        
        // Calculate total hours worked (from clock in to clock out, including breaks)
        $totalMinutesWorkedWithBreaks = $clockIn->diffInMinutes($clockOut);
        $totalHours = floor($totalMinutesWorkedWithBreaks / 60);
        $totalMinutes = $totalMinutesWorkedWithBreaks % 60;
        
        // Update attendance record with skip flag to prevent infinite loop
        Attendance::$skipCalculation = true;
        $attendance->update([
            'total_hours' => $totalHours,
            'total_minutes' => $totalMinutes,
            'total_rendered_hours' => $totalRenderedHours,
            'break_minutes' => $actualBreakMinutes,
            'late_minutes' => $lateMinutes,
            'overtime_hours' => $overtimeHours,
            'night_diff_hours' => $nightDiffHours,
            'undertime_hours' => $undertimeHours,
        ]);
        Attendance::$skipCalculation = false;
    }
    
    /**
     * Calculate overtime based on approved overtime request
     * 
     * Overtime is only calculated if:
     * 1. There is an approved overtime request for this date
     * 2. Employee actually worked past shift end time
     * 
     * The overtime hours returned is the minimum of:
     * - Approved overtime hours
     * - Actual overtime worked (clock_out - shift_end)
     */
    private function calculateOvertime(Attendance $attendance, Carbon $clockOut, Carbon $shiftEnd): float
    {
        // Check if there's an approved overtime request
        $approvedOvertime = DB::table('employee_overtimes')
            ->where('employee_id', $attendance->employee_id)
            ->whereDate('overtime_date', $attendance->date)
            ->where('status', 'approved')
            ->first();
        
        // No approved overtime = no overtime hours
        if (!$approvedOvertime) {
            return 0;
        }
        
        // Check if employee actually worked past shift end time
        if ($clockOut->lte($shiftEnd)) {
            return 0;
        }
        
        // Calculate actual overtime worked (time worked beyond shift end)
        $actualOvertimeMinutes = $shiftEnd->diffInMinutes($clockOut);
        $actualOvertimeHours = $actualOvertimeMinutes / 60;
        
        // Get approved overtime hours
        $approvedHours = $approvedOvertime->duration_hours + ($approvedOvertime->duration_minutes / 60);
        
        // Return minimum of actual worked or approved
        $overtimeHours = min($actualOvertimeHours, $approvedHours);
        
        return round($overtimeHours, 2);
    }
    
    /**
     * Calculate night differential hours (10 PM to 6 AM)
     * 
     * Logic:
     * 1. Calculate night hours within regular shift (actualStart to actualEnd)
     * 2. Subtract break time proportionally from night hours
     * 3. Add approved overtime hours that fall in night period
     * 
     * This ensures night diff aligns with total rendered hours calculation
     */
    private function calculateNightDifferential(
        Carbon $actualStart, 
        Carbon $actualEnd, 
        int $breakMinutes,
        float $approvedOvertimeHours,
        Carbon $shiftEnd
    ): float {
        $nightDiffMinutes = 0;
        
        // Define night period: 10:00 PM to 6:00 AM
        $nightStartHour = 22; // 10 PM
        $nightEndHour = 6;    // 6 AM
        
        // Make copies to avoid modifying original times
        $workStart = $actualStart->copy();
        $workEnd = $actualEnd->copy();
        
        // Handle case where work_end appears before work_start (overnight shift)
        if ($workEnd->lt($workStart)) {
            $workEnd->addDay();
        }
        
        // === STEP 1: Calculate night hours for regular shift (actualStart to actualEnd) ===
        $currentDate = $workStart->copy()->startOfDay();
        $endDate = $workEnd->copy()->startOfDay();
        
        // Check each 24-hour period
        while ($currentDate->lte($endDate)) {
            // Night period for this date: 10 PM to 6 AM next day
            $nightStart = $currentDate->copy()->setTime($nightStartHour, 0, 0);
            $nightEnd = $currentDate->copy()->addDay()->setTime($nightEndHour, 0, 0);
            
            // Calculate overlap between work period and night period
            if ($workEnd->gt($nightStart) && $workStart->lt($nightEnd)) {
                $overlapStart = $workStart->gt($nightStart) ? $workStart : $nightStart;
                $overlapEnd = $workEnd->lt($nightEnd) ? $workEnd : $nightEnd;
                
                if ($overlapEnd->gt($overlapStart)) {
                    $nightDiffMinutes += $overlapStart->diffInMinutes($overlapEnd);
                }
            }
            
            $currentDate->addDay();
        }
        
        // === STEP 2: Subtract break time ===
        // Night differential should only count hours WORKED, not break time
        // Simply subtract the break minutes from night differential
        // This assumes break is taken uniformly across the shift
        $nightDiffMinutes = max(0, $nightDiffMinutes - $breakMinutes);
        
        // === STEP 3: Add approved overtime hours that fall in night period ===
        if ($approvedOvertimeHours > 0) {
            // Overtime starts after shift end
            $overtimeStart = $shiftEnd->copy();
            $overtimeEnd = $overtimeStart->copy()->addMinutes($approvedOvertimeHours * 60);
            
            // Handle overnight: if overtime_end appears before overtime_start, add a day
            if ($overtimeEnd->lt($overtimeStart)) {
                $overtimeEnd->addDay();
            }
            
            // Check if overtime falls within night period
            // For overnight shifts, we need to check night periods that could overlap with OT
            // Night period: 22:00 to 06:00 next day
            // If OT is at 04:00-06:00, that's part of the previous day's night period
            // So we need to start checking from the previous day
            $currentDate = $overtimeStart->copy()->startOfDay()->subDay(); // Start from previous day
            $endDate = $overtimeEnd->copy()->startOfDay()->addDay(); // Check one more day to be safe
            
            while ($currentDate->lte($endDate)) {
                // Night period for this date: 10 PM to 6 AM next day
                $nightStart = $currentDate->copy()->setTime($nightStartHour, 0, 0);
                $nightEnd = $currentDate->copy()->addDay()->setTime($nightEndHour, 0, 0);
                
                if ($overtimeEnd->gt($nightStart) && $overtimeStart->lt($nightEnd)) {
                    $overlapStart = $overtimeStart->gt($nightStart) ? $overtimeStart : $nightStart;
                    $overlapEnd = $overtimeEnd->lt($nightEnd) ? $overtimeEnd : $nightEnd;
                    
                    if ($overlapEnd->gt($overlapStart)) {
                        $nightDiffMinutes += $overlapStart->diffInMinutes($overlapEnd);
                    }
                }
                
                $currentDate->addDay();
            }
        }
        
        return round($nightDiffMinutes / 60, 2);
    }
    
    /**
     * Recalculate all attendance records for a specific date range
     */
    public function recalculateAttendanceRange(string $dateFrom, string $dateTo): int
    {
        $attendances = Attendance::where(DB::raw('DATE(date)'), '>=', $dateFrom)
            ->where(DB::raw('DATE(date)'), '<=', $dateTo)
            ->whereNotNull('shift_id')
            ->whereNotNull('clock_in')
            ->whereNotNull('clock_out')
            ->get();
        
        $count = 0;
        foreach ($attendances as $attendance) {
            $this->calculateAttendance($attendance);
            $count++;
        }
        
        return $count;
    }
    
    /**
     * Calculate attendance for a single attendance ID
     */
    public function recalculateById(int $attendanceId): bool
    {
        $attendance = Attendance::find($attendanceId);
        
        if (!$attendance) {
            return false;
        }
        
        $this->calculateAttendance($attendance);
        return true;
    }
}
