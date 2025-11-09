<?php

namespace Database\Seeders;

use App\Models\Employee;
use App\Models\EmployeeLeave;
use App\Models\User;
use Illuminate\Database\Seeder;
use Carbon\Carbon;
use Illuminate\Support\Facades\Storage;

class EmployeeLeaveSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get employees and users
        $employees = Employee::with('company')->get();
        $users = User::all();
        
        if ($employees->isEmpty()) {
            $this->command->warn('No employees found. Please run EmployeeSeeder first.');
            return;
        }

        if ($users->isEmpty()) {
            $this->command->warn('No users found. Please run UserSeeder first.');
            return;
        }

        $approver = $users->first();
        $leaveTypes = ['sick', 'vacation', 'emergency', 'unpaid', 'parental', 'personal', 'paid', 'other'];
        $statuses = ['pending', 'approved', 'rejected', 'cancelled'];

        // Create sample leaves for each employee
        foreach ($employees->take(8) as $index => $employee) {
            // Create 2-4 leaves per employee
            $leavesCount = rand(2, 4);
            
            for ($i = 0; $i < $leavesCount; $i++) {
                $type = $leaveTypes[array_rand($leaveTypes)];
                $status = $statuses[array_rand($statuses)];
                
                // Random date in the past 3 months or next 2 months
                $daysOffset = rand(-90, 60);
                $dateFrom = Carbon::now()->addDays($daysOffset);
                $duration = rand(1, 5); // 1-5 days leave
                $dateTo = $dateFrom->copy()->addDays($duration - 1);
                
                // Calculate days_count (excluding weekends if appropriate)
                $daysCount = $dateFrom->diffInDaysFiltered(function(Carbon $date) {
                    return !$date->isWeekend();
                }, $dateTo) + 1;
                
                // If weekend-only period, just use the raw count
                if ($daysCount == 0) {
                    $daysCount = $dateFrom->diffInDays($dateTo) + 1;
                }

                $leave = EmployeeLeave::create([
                    'employee_id' => $employee->employee_id,
                    'type' => $type,
                    'date_from' => $dateFrom,
                    'date_to' => $dateTo,
                    'days_count' => $daysCount,
                    'include_saturday' => false,
                    'include_sunday' => false,
                    'status' => $status,
                    'remarks' => $status === 'approved' ? 'Approved by HR. ' . $this->getReasonByType($type) : 
                                ($status === 'rejected' ? 'Rejected: Insufficient leave balance' : 
                                ($status === 'cancelled' ? 'Cancelled by employee. Reason: ' . $this->getReasonByType($type) :
                                $this->getReasonByType($type))),
                    'approved_by' => in_array($status, ['approved', 'rejected']) ? $approver->user_id : null,
                    'approved_at' => in_array($status, ['approved', 'rejected']) ? Carbon::now()->subDays(rand(1, 5)) : null,
                    'document_path' => null, // We won't create actual files for seeding
                    'created_at' => Carbon::now()->subDays(rand(1, 30)),
                ]);
            }
        }

        // Create some specific scenario leaves for demonstration
        if ($employees->count() > 0) {
            $firstEmployee = $employees->first();
            
            // Pending leave (awaiting approval)
            EmployeeLeave::create([
                'employee_id' => $firstEmployee->employee_id,
                'type' => 'vacation',
                'date_from' => Carbon::now()->addDays(14),
                'date_to' => Carbon::now()->addDays(18),
                'days_count' => 5,
                'include_saturday' => false,
                'include_sunday' => false,
                'status' => 'pending',
                'remarks' => 'Family vacation trip to Boracay',
                'approved_by' => null,
                'approved_at' => null,
                'document_path' => null,
                'created_at' => Carbon::now()->subDays(2),
            ]);

            // Approved leave (upcoming)
            EmployeeLeave::create([
                'employee_id' => $firstEmployee->employee_id,
                'type' => 'sick',
                'date_from' => Carbon::now()->addDays(7),
                'date_to' => Carbon::now()->addDays(8),
                'days_count' => 2,
                'include_saturday' => false,
                'include_sunday' => false,
                'status' => 'approved',
                'remarks' => 'Medical check-up appointment. Approved. Please submit medical certificate upon return.',
                'approved_by' => $approver->user_id,
                'approved_at' => Carbon::now()->subDays(1),
                'document_path' => null,
            ]);

            // Cancelled leave
            EmployeeLeave::create([
                'employee_id' => $firstEmployee->employee_id,
                'type' => 'vacation',
                'date_from' => Carbon::now()->addDays(30),
                'date_to' => Carbon::now()->addDays(32),
                'days_count' => 3,
                'include_saturday' => false,
                'include_sunday' => false,
                'status' => 'cancelled',
                'remarks' => 'Personal matters. Cancelled: Plans changed',
                'approved_by' => null,
                'approved_at' => null,
                'document_path' => null,
            ]);

            // Rejected leave
            EmployeeLeave::create([
                'employee_id' => $firstEmployee->employee_id,
                'type' => 'vacation',
                'date_from' => Carbon::now()->subDays(10),
                'date_to' => Carbon::now()->subDays(7),
                'days_count' => 4,
                'include_saturday' => false,
                'include_sunday' => false,
                'status' => 'rejected',
                'remarks' => 'Rest and relaxation. Rejected: Insufficient vacation leave credits',
                'approved_by' => $approver->user_id,
                'approved_at' => Carbon::now()->subDays(12),
                'document_path' => null,
            ]);
        }

        $totalLeaves = EmployeeLeave::count();
        $pending = EmployeeLeave::where('status', 'pending')->count();
        $approved = EmployeeLeave::where('status', 'approved')->count();
        $rejected = EmployeeLeave::where('status', 'rejected')->count();
        $cancelled = EmployeeLeave::where('status', 'cancelled')->count();

        $this->command->info("Employee leaves seeded successfully!");
        $this->command->info("Total: {$totalLeaves} | Pending: {$pending} | Approved: {$approved} | Rejected: {$rejected} | Cancelled: {$cancelled}");
    }

    /**
     * Get a sample reason based on leave type
     */
    private function getReasonByType(string $type): string
    {
        $reasons = [
            'sick' => [
                'Flu and fever',
                'Medical check-up',
                'Dental appointment',
                'Not feeling well',
                'Doctor\'s appointment',
                'Recovery from illness',
            ],
            'vacation' => [
                'Family vacation',
                'Rest and relaxation',
                'Personal matters',
                'Travel plans',
                'Visit family in province',
                'Attend family event',
            ],
            'emergency' => [
                'Family emergency',
                'Urgent personal matter',
                'Home emergency',
                'Unforeseen circumstances',
                'Critical family situation',
            ],
            'unpaid' => [
                'Extended personal leave',
                'Personal reasons',
                'Additional time off needed',
            ],
            'parental' => [
                'Parental leave',
                'Care for newborn',
                'Support spouse during childbirth',
                'Adoption leave',
                'Childcare responsibilities',
            ],
            'personal' => [
                'Personal matters',
                'Family obligations',
                'Personal appointment',
                'Handle personal affairs',
            ],
            'paid' => [
                'Scheduled time off',
                'Rest and recuperation',
                'Personal vacation',
                'Annual leave',
            ],
            'other' => [
                'Other reasons',
                'Miscellaneous leave',
                'Special circumstances',
            ],
        ];

        $typeReasons = $reasons[$type] ?? ['Personal leave'];
        return $typeReasons[array_rand($typeReasons)];
    }
}
