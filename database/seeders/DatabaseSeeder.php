<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
public function run(): void
{
    $this->call([
        HRISSeeder::class,
        UserSeeder::class,
        ShiftSeeder::class,
        EmployeeScheduleSeeder::class,
        HolidaySeeder::class,
        EmployeeLeaveSeeder::class,
        EmployeeOvertimeSeeder::class,
        EmployeePayrollSettingsSeeder::class,
    ]);
    
    // Recalculate all attendance records after seeding
    $this->command->info('Recalculating attendance records...');
    \Artisan::call('attendance:recalculate', ['--all' => true]);
    $this->command->info('Attendance recalculation complete.');
}
}
