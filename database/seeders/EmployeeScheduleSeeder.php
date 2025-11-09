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
        // Get Night Shift
        $nightShift = Shift::where('name', 'Night Shift')->first();

        if (!$nightShift) {
            $this->command->warn('Night Shift not found. Please run ShiftSeeder first.');
            return;
        }

        // Get specific employees by name (first name and last name pairs)
        $employeeNames = [
            ['first' => 'Neil Vincent', 'last' => 'Romero'],
            ['first' => 'Maverick', 'last' => 'Yap'],
            ['first' => 'Junnel', 'last' => 'Baynosa'],
            ['first' => 'Rochelle Mae', 'last' => 'Pogoy'],
            ['first' => 'Akira', 'last' => 'Mallari'],
        ];

        $schedules = [];

        foreach ($employeeNames as $nameData) {
            // Handle both array format and string format
            if (is_array($nameData)) {
                $firstName = $nameData['first'];
                $lastName = $nameData['last'];
            } else {
                // For string format, split name to search
                $nameParts = explode(' ', $nameData);
                $firstName = $nameParts[0];
                $lastName = end($nameParts);
            }

            // Find employee
            $employee = Employee::where('first_name', $firstName)
                ->where('last_name', $lastName)
                ->first();

            if ($employee) {
                // Create ongoing schedule (no end date) with Night Shift
                $schedules[] = [
                    'employee_id' => $employee->employee_id,
                    'shift_id' => $nightShift->shift_id,
                    'date_start' => Carbon::now()->subMonths(2)->startOfMonth(),
                    'date_end' => null, // Ongoing schedule
                    'is_holiday' => false,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];

                $this->command->info("Added schedule for: {$employee->first_name} {$employee->last_name}");
            } else {
                $this->command->warn("Employee not found: {$firstName} {$lastName}");
            }
        }

        if (!empty($schedules)) {
            // Bulk insert all schedules
            EmployeeSchedule::insert($schedules);

            $this->command->info('Employee schedules seeded successfully!');
            $this->command->info("Total schedules created: " . count($schedules));
        } else {
            $this->command->warn('No schedules created. Please check employee names.');
        }
    }
}
