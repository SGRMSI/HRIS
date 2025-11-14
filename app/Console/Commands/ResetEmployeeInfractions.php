<?php

namespace App\Console\Commands;

use App\Models\Employee;
use Illuminate\Console\Command;
use Carbon\Carbon;

class ResetEmployeeInfractions extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'employees:reset-infractions';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Reset employee infractions that are 30 days or older';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting infractions reset process...');
        
        $thirtyDaysAgo = Carbon::now()->subDays(30);
        
        // Find employees who have infractions and either:
        // 1. Have never had infractions reset (infractions_last_reset_at is null)
        // 2. Had their last reset more than 30 days ago
        $employees = Employee::where('infractions', '>', 0)
            ->where(function ($query) use ($thirtyDaysAgo) {
                $query->whereNull('infractions_last_reset_at')
                    ->orWhere('infractions_last_reset_at', '<=', $thirtyDaysAgo);
            })
            ->get();
        
        if ($employees->isEmpty()) {
            $this->info('No employees found with infractions older than 30 days.');
            return Command::SUCCESS;
        }
        
        $resetCount = 0;
        
        foreach ($employees as $employee) {
            $oldInfractions = $employee->infractions;
            $employee->infractions = 0;
            $employee->infractions_last_reset_at = Carbon::now();
            $employee->save();
            
            $resetCount++;
            
            $this->line("Reset infractions for {$employee->first_name} {$employee->last_name} (ID: {$employee->employee_id}): {$oldInfractions} → 0");
        }
        
        $this->info("Successfully reset infractions for {$resetCount} employee(s).");
        
        return Command::SUCCESS;
    }
}
