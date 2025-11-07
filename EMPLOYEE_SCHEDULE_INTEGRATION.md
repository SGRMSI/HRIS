# Employee Schedule Integration Guide

## Overview
Integrated the attendance module's schedule system with the Employee model. Employees now fetch their work shifts from the `EmployeeSchedule` and `Shift` tables instead of the hardcoded `work_shift` field.

## Changes Made

### 1. Employee Model (`app/Models/Employee.php`)

Added new relationships to integrate with the attendance/schedule system:

```php
// Get all schedules for an employee
public function schedules()
{
    return $this->hasMany(EmployeeSchedule::class, 'employee_id', 'employee_id');
}

// Get current active schedule
public function currentSchedule()
{
    return $this->hasOne(EmployeeSchedule::class, 'employee_id', 'employee_id')
        ->where('date_start', '<=', now())
        ->where(function ($query) {
            $query->whereNull('date_end')
                ->orWhere('date_end', '>=', now());
        })
        ->latest('date_start');
}

// Get all attendance records
public function attendances()
{
    return $this->hasMany(Attendance::class, 'employee_id', 'employee_id');
}

// Get all leave records
public function leaves()
{
    return $this->hasMany(EmployeeLeave::class, 'employee_id', 'employee_id');
}
```

### 2. EmployeeController (`app/Http/Controllers/EmployeeController.php`)

Updated three main methods:

#### a) `index()` Method
- Now loads `currentSchedule.shift` relationship
- Displays current shift name or falls back to legacy `work_shift` field
- Shows "Not Assigned" if no schedule exists

```php
'current_shift' => $currentSchedule && $currentSchedule->shift 
    ? $currentSchedule->shift->name 
    : ($employee->work_shift ?? 'Not Assigned')
```

#### b) `show()` Method
- Loads current schedule with shift details
- Provides detailed shift information including:
  - Shift name
  - Clock in/out times
  - Schedule start/end dates
- Maintains backward compatibility with `work_shift` field

```php
'current_shift' => $currentSchedule && $currentSchedule->shift ? [
    'name' => $currentSchedule->shift->name,
    'time_in' => $currentSchedule->shift->time_in->format('H:i'),
    'time_out' => $currentSchedule->shift->time_out->format('H:i'),
    'date_start' => $currentSchedule->date_start->format('Y-m-d'),
    'date_end' => $currentSchedule->date_end ? $currentSchedule->date_end->format('Y-m-d') : null,
] : null
```

#### c) `edit()` Method
- Same as `show()` but also includes `shift_id` for dropdown selection
- Allows editing/assigning new schedules in the future

## How It Works

### Current Schedule Logic
The `currentSchedule()` relationship finds the active schedule for an employee based on:

1. **Start Date**: Schedule has started (`date_start <= today`)
2. **End Date**: Either:
   - No end date (`date_end IS NULL`) - ongoing schedule
   - OR end date is in the future (`date_end >= today`)
3. **Latest**: If multiple schedules match, takes the most recent one

### Data Flow
```
Employee
  ↓
EmployeeSchedule (current active one)
  ↓
Shift (actual shift details: times, break, grace period)
```

## Backward Compatibility

✅ **The `work_shift` field is retained** for:
- Legacy data support
- Fallback when no schedule is assigned
- Transition period

## Next Steps

### 1. Assign Schedules to Employees
Use the **Attendance > Schedules** module to assign shifts to employees:
```
POST /attendance/schedules
- employee_id
- shift_id
- date_start
- date_end (optional)
```

### 2. Frontend Updates (If Needed)
Update employee pages to:
- Display shift details (time in/out)
- Show schedule date range
- Link to attendance schedule management
- Show "Not Assigned" state with action button

### 3. Migration Path
```bash
# 1. Pull latest changes
git pull origin main

# 2. Run migrations (if any new ones)
php artisan migrate

# 3. Run seeders to populate shifts
php artisan db:seed --class=ShiftSeeder

# 4. Assign schedules to existing employees via UI or seeder
php artisan db:seed --class=EmployeeScheduleSeeder
```

## Example Usage

### Get Employee's Current Shift in Code
```php
$employee = Employee::with('currentSchedule.shift')->find($id);

if ($employee->currentSchedule) {
    $shift = $employee->currentSchedule->shift;
    echo "Clock In: " . $shift->time_in->format('h:i A');
    echo "Clock Out: " . $shift->time_out->format('h:i A');
} else {
    echo "No schedule assigned";
}
```

### Check All Employee Schedules
```php
$schedules = $employee->schedules()
    ->with('shift')
    ->orderBy('date_start', 'desc')
    ->get();
```

## Validation Rules
The hardcoded validation in EmployeeController still allows:
```php
'work_shift' => 'nullable|in:Dayshift,Graveyard'
```

This can be **removed** once all employees are assigned schedules via the new system.

## Benefits

✅ **Flexible Scheduling**: Employees can have different shifts over time
✅ **Detailed Shift Data**: Grace periods, break times, exact clock in/out times
✅ **Integration Ready**: Works with attendance processing system
✅ **Audit Trail**: Track schedule changes over time
✅ **Multi-shift Support**: Employees can transition between shifts

## Related Models & Tables

- `employees` - Employee master data
- `employee_schedules` - Schedule assignments
- `shifts` - Shift definitions (time in/out, breaks, etc.)
- `attendance` - Final attendance records
- `attendance_processed` - Processed attendance logs
- `attendance_raw` - Raw clock in/out logs

---

**Last Updated**: November 7, 2025
**Status**: ✅ Implemented and Ready for Testing
