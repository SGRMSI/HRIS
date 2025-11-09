<?php

namespace Database\Seeders;

use App\Models\Employee;
use App\Models\EmployeeOvertime;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class EmployeeOvertimeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get all employees and users
        $employees = Employee::all();
        $users = User::all();

        if ($employees->isEmpty() || $users->isEmpty()) {
            $this->command->warn('No employees or users found. Please seed employees and users first.');
            return;
        }

        // Status distribution
        $statuses = [
            'pending' => 0.4,    // 40%
            'approved' => 0.3,   // 30%
            'rejected' => 0.2,   // 20%
            'cancelled' => 0.1,  // 10%
        ];

        // Reasons for overtime
        $reasons = [
            'Urgent project deadline completion',
            'System maintenance and updates',
            'Client meeting preparation',
            'End of month financial closing',
            'Emergency support for critical issue',
            'Inventory reconciliation',
            'Year-end report preparation',
            'Training session preparation',
            'Database migration and testing',
            'Product launch preparation',
        ];

        // Remarks for rejected/cancelled
        $rejectionRemarks = [
            'Not pre-approved by supervisor',
            'Insufficient justification provided',
            'Overtime cap reached for this period',
            'Should have been planned during regular hours',
        ];

        $cancellationRemarks = [
            'Employee request to cancel',
            'Project cancelled',
            'Timeline changed, overtime no longer needed',
            'Budget constraints',
        ];

        $totalRecords = 20;
        $recordsCreated = 0;

        foreach ($statuses as $status => $percentage) {
            $count = (int) round($totalRecords * $percentage);

            for ($i = 0; $i < $count; $i++) {
                $employee = $employees->random();
                $creator = $users->random();
                $approver = $users->random();

                // Random date within last 3 months to next month
                $daysOffset = rand(-90, 30);
                $overtimeDate = Carbon::now()->addDays($daysOffset);

                // Random duration (1-8 hours)
                $totalMinutes = rand(60, 480); // 1 to 8 hours
                $hours = (int) floor($totalMinutes / 60);
                $minutes = $totalMinutes % 60;

                $overtimeData = [
                    'employee_id' => $employee->employee_id,
                    'overtime_date' => $overtimeDate->format('Y-m-d'),
                    'duration_hours' => $hours,
                    'duration_minutes' => $minutes,
                    'reason' => $reasons[array_rand($reasons)],
                    'status' => $status,
                    'created_by' => $creator->user_id,
                    'created_at' => Carbon::now()->subDays(rand(1, 30)),
                    'updated_at' => Carbon::now()->subDays(rand(0, 5)),
                ];

                // Add approval-related fields for non-pending statuses
                if ($status !== 'pending') {
                    $overtimeData['approved_by'] = $approver->user_id;
                    $overtimeData['approved_at'] = Carbon::now()->subDays(rand(0, 5));

                    if ($status === 'rejected') {
                        $overtimeData['remarks'] = $rejectionRemarks[array_rand($rejectionRemarks)];
                    } elseif ($status === 'cancelled') {
                        $overtimeData['remarks'] = $cancellationRemarks[array_rand($cancellationRemarks)];
                    } elseif ($status === 'approved' && rand(0, 1)) {
                        // 50% chance of having approval remarks
                        $overtimeData['remarks'] = 'Approved as requested';
                    }
                }

                EmployeeOvertime::create($overtimeData);
                $recordsCreated++;
            }
        }

        $this->command->info("Created {$recordsCreated} overtime records.");
    }
}
