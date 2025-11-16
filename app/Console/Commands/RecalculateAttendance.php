<?php

namespace App\Console\Commands;

use App\Services\AttendanceCalculationService;
use Illuminate\Console\Command;

class RecalculateAttendance extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'attendance:recalculate 
                            {--from= : Start date (Y-m-d format)}
                            {--to= : End date (Y-m-d format)}
                            {--all : Recalculate all attendance records}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Recalculate attendance total rendered hours, overtime, and undertime';

    /**
     * Execute the console command.
     */
    public function handle(AttendanceCalculationService $service)
    {
        if ($this->option('all')) {
            $this->info('Recalculating all attendance records...');
            $count = $service->recalculateAttendanceRange('2000-01-01', '2099-12-31');
            $this->info("Recalculated {$count} attendance records.");
            return 0;
        }
        
        $from = $this->option('from');
        $to = $this->option('to');
        
        if (!$from || !$to) {
            $this->error('Please provide both --from and --to dates, or use --all flag.');
            return 1;
        }
        
        $this->info("Recalculating attendance from {$from} to {$to}...");
        $count = $service->recalculateAttendanceRange($from, $to);
        $this->info("Recalculated {$count} attendance records.");
        
        return 0;
    }
}
