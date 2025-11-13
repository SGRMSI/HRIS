<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            // Add payroll-related fields if they don't exist
            if (!Schema::hasColumn('employees', 'daily_rate')) {
                $table->decimal('daily_rate', 10, 2)->default(0)->after('salary');
            }
            if (!Schema::hasColumn('employees', 'clothing_allowance')) {
                $table->decimal('clothing_allowance', 10, 2)->default(0)->after('daily_rate');
            }
            if (!Schema::hasColumn('employees', 'rice_allowance')) {
                $table->decimal('rice_allowance', 10, 2)->default(0)->after('clothing_allowance');
            }
            if (!Schema::hasColumn('employees', 'transportation_allowance')) {
                $table->decimal('transportation_allowance', 10, 2)->default(0)->after('rice_allowance');
            }
            if (!Schema::hasColumn('employees', 'program_allowance')) {
                $table->decimal('program_allowance', 10, 2)->default(0)->after('transportation_allowance');
            }
            if (!Schema::hasColumn('employees', 'attendance_incentive')) {
                $table->decimal('attendance_incentive', 10, 2)->default(0)->after('program_allowance');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            $columns = [
                'daily_rate',
                'clothing_allowance',
                'rice_allowance',
                'transportation_allowance',
                'program_allowance',
                'attendance_incentive'
            ];
            
            foreach ($columns as $column) {
                if (Schema::hasColumn('employees', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
