<?php

use App\Models\Employee;
use App\Models\Attendance;
use Carbon\Carbon;

// Get the first employee
$employee = Employee::first();

if (!$employee) {
    echo "No employee found. Please create an employee first.\n";
    exit;
}

echo "Creating test absents for: {$employee->first_name} {$employee->last_name} (ID: {$employee->employee_id})\n\n";

// Create some absent records for current month
$absentsToCreate = [
    ['date' => Carbon::now()->startOfMonth()->addDays(2), 'remarks' => 'Sick leave'],
    ['date' => Carbon::now()->startOfMonth()->addDays(5), 'remarks' => 'Personal matter'],
    ['date' => Carbon::now()->startOfMonth()->addDays(10), 'remarks' => 'Emergency'],
    ['date' => Carbon::now()->startOfMonth()->addDays(15), 'remarks' => null],
];

foreach ($absentsToCreate as $index => $absentData) {
    $attendance = Attendance::create([
        'employee_id' => $employee->employee_id,
        'date' => $absentData['date'],
        'status' => 'Absent',
        'remarks' => $absentData['remarks'],
        'approved_at' => Carbon::now(), // Finalized
        'approved_by' => 1,
    ]);
    
    echo "✓ Created absent record for: {$absentData['date']->format('Y-m-d')}\n";
}

// Create one for last month
$lastMonthAbsent = Attendance::create([
    'employee_id' => $employee->employee_id,
    'date' => Carbon::now()->subMonth()->startOfMonth()->addDays(7),
    'status' => 'Absent',
    'remarks' => 'Last month absent',
    'approved_at' => Carbon::now(),
    'approved_by' => 1,
]);

echo "✓ Created absent record for last month: " . $lastMonthAbsent->date->format('Y-m-d') . "\n\n";

// Summary
$currentMonth = Carbon::now()->month;
$currentYear = Carbon::now()->year;

$currentMonthCount = Attendance::where('employee_id', $employee->employee_id)
    ->whereYear('date', $currentYear)
    ->whereMonth('date', $currentMonth)
    ->where('status', 'Absent')
    ->whereNotNull('approved_at')
    ->count();

echo "Summary:\n";
echo "- Current month absents: {$currentMonthCount}\n";
echo "- Employee ID: {$employee->employee_id}\n";
echo "\nYou can now visit: http://127.0.0.1:8000/employee/{$employee->employee_id}\n";
