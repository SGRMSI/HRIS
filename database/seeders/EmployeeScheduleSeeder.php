<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\EmployeeSchedule;
use App\Models\Employee;
use App\Models\Shift;
use Carbon\Carbon;

class EmployeeScheduleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get all employees and shifts
        $employees = Employee::all();
        $shifts = Shift::all();

        if ($employees->isEmpty() || $shifts->isEmpty()) {
            $this->command->warn('No employees or shifts found. Please run HRISSeeder and ShiftSeeder first.');
            return;
        }

        $schedules = [];

        // Assign schedules to employees
        foreach ($employees as $index => $employee) {
            // Assign different shift patterns based on employee index
            $shiftIndex = $index % $shifts->count();
            $shift = $shifts[$shiftIndex];

            // Create ongoing schedule (no end date) for most employees
            if ($index % 3 !== 0) {
                $schedules[] = [
                    'employee_id' => $employee->employee_id,
                    'shift_id' => $shift->shift_id,
                    'date_start' => Carbon::now()->subMonths(rand(1, 6))->startOfMonth(),
                    'date_end' => null,
                    'is_holiday' => false,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            } else {
                // Create schedules with end dates for some employees
                $startDate = Carbon::now()->subMonths(3);
                $endDate = Carbon::now()->subMonth();
                
                // Old schedule (completed)
                $schedules[] = [
                    'employee_id' => $employee->employee_id,
                    'shift_id' => $shift->shift_id,
                    'date_start' => $startDate,
                    'date_end' => $endDate,
                    'is_holiday' => false,
                    'created_at' => $startDate,
                    'updated_at' => $endDate,
                ];

                // New schedule (current)
                $newShiftIndex = ($shiftIndex + 1) % $shifts->count();
                $newShift = $shifts[$newShiftIndex];
                
                $schedules[] = [
                    'employee_id' => $employee->employee_id,
                    'shift_id' => $newShift->shift_id,
                    'date_start' => $endDate->copy()->addDay(),
                    'date_end' => null,
                    'is_holiday' => false,
                    'created_at' => $endDate->copy()->addDay(),
                    'updated_at' => $endDate->copy()->addDay(),
                ];
            }
        }

        // Add some future schedules
        $futureEmployee = $employees->random();
        $futureShift = $shifts->random();
        $schedules[] = [
            'employee_id' => $futureEmployee->employee_id,
            'shift_id' => $futureShift->shift_id,
            'date_start' => Carbon::now()->addMonth()->startOfMonth(),
            'date_end' => Carbon::now()->addMonths(3)->endOfMonth(),
            'is_holiday' => false,
            'created_at' => now(),
            'updated_at' => now(),
        ];

        // Bulk insert all schedules
        EmployeeSchedule::insert($schedules);

        $totalSchedules = count($schedules);
        $activeSchedules = collect($schedules)->where('date_end', null)->count();
        $completedSchedules = collect($schedules)->where('date_end', '!=', null)->count();

        $this->command->info('Employee schedules seeded successfully!');
        $this->command->info("Total: {$totalSchedules} | Active: {$activeSchedules} | Completed: {$completedSchedules}");
    }
}
