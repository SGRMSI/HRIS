<?php

namespace Database\Seeders;

use App\Models\Employee;
use App\Models\EmployeePayrollSettings;
use Illuminate\Database\Seeder;

class EmployeePayrollSettingsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $employees = Employee::all();

        if ($employees->isEmpty()) {
            $this->command->warn('No employees found. Please run EmployeeSeeder first.');
            return;
        }

        $settings = [
            // Entry level - lower rates
            [
                'daily_rate' => 500.00,
                'clothing_allowance' => 300.00,
                'rice_allowance' => 1500.00,
                'transportation_allowance' => 500.00,
                'program_allowance' => 0.00,
                'attendance_incentive' => 200.00,
                'adjustments' => 0.00,
                'sss_contribution' => 180.00,
                'phic_contribution' => 200.00,
                'hdmf_contribution' => 100.00,
            ],
            // Mid level - moderate rates
            [
                'daily_rate' => 750.00,
                'clothing_allowance' => 500.00,
                'rice_allowance' => 1500.00,
                'transportation_allowance' => 750.00,
                'program_allowance' => 200.00,
                'attendance_incentive' => 300.00,
                'adjustments' => 0.00,
                'sss_contribution' => 270.00,
                'phic_contribution' => 300.00,
                'hdmf_contribution' => 100.00,
            ],
            // Senior level - higher rates
            [
                'daily_rate' => 1000.00,
                'clothing_allowance' => 800.00,
                'rice_allowance' => 2000.00,
                'transportation_allowance' => 1000.00,
                'program_allowance' => 500.00,
                'attendance_incentive' => 500.00,
                'adjustments' => 0.00,
                'sss_contribution' => 360.00,
                'phic_contribution' => 400.00,
                'hdmf_contribution' => 100.00,
            ],
            // Management level - premium rates
            [
                'daily_rate' => 1500.00,
                'clothing_allowance' => 1000.00,
                'rice_allowance' => 2500.00,
                'transportation_allowance' => 1500.00,
                'program_allowance' => 1000.00,
                'attendance_incentive' => 800.00,
                'adjustments' => 0.00,
                'sss_contribution' => 540.00,
                'phic_contribution' => 600.00,
                'hdmf_contribution' => 100.00,
            ],
        ];

        foreach ($employees as $index => $employee) {
            // Cycle through the settings array
            $settingIndex = $index % count($settings);
            $settingData = $settings[$settingIndex];

            // Check if settings already exist
            $existing = EmployeePayrollSettings::where('employee_id', $employee->employee_id)->first();
            
            if ($existing) {
                // Update existing settings
                $existing->update($settingData);
                $this->command->info("Updated payroll settings for: {$employee->first_name} {$employee->last_name}");
            } else {
                // Create new settings
                EmployeePayrollSettings::create([
                    'employee_id' => $employee->employee_id,
                    ...$settingData,
                ]);
                $this->command->info("Created payroll settings for: {$employee->first_name} {$employee->last_name}");
            }
        }

        $totalSettings = EmployeePayrollSettings::count();
        $this->command->info("Employee payroll settings seeded successfully!");
        $this->command->info("Total settings: {$totalSettings}");
        $this->command->table(
            ['Setting Level', 'Daily Rate', 'Total Allowances', 'Total Contributions'],
            [
                ['Entry Level', '₱500.00', '₱2,500.00', '₱480.00'],
                ['Mid Level', '₱750.00', '₱3,450.00', '₱670.00'],
                ['Senior Level', '₱1,000.00', '₱4,800.00', '₱860.00'],
                ['Management', '₱1,500.00', '₱6,800.00', '₱1,240.00'],
            ]
        );
    }
}
