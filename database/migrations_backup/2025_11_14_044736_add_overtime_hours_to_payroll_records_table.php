<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('payroll_records', function (Blueprint $table) {
            $table->decimal('overtime_hours', 8, 2)->default(0)->after('overtime')->comment('Total overtime hours worked');
        });

        // Backfill overtime_hours for existing records
        // Formula: overtime_hours = overtime / (hourly_rate * 1.25)
        // Where hourly_rate = daily_rate / 8
        DB::statement('
            UPDATE payroll_records 
            SET overtime_hours = CASE 
                WHEN daily_rate > 0 AND overtime > 0 
                THEN ROUND(overtime / ((daily_rate / 8) * 1.25), 2)
                ELSE 0 
            END
            WHERE overtime > 0 AND overtime_hours = 0
        ');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('payroll_records', function (Blueprint $table) {
            $table->dropColumn('overtime_hours');
        });
    }
};
