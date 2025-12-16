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
        Schema::create('employee_payroll_settings', function (Blueprint $table) {
            $table->id('setting_id');
            $table->unsignedBigInteger('employee_id');
            
            // Daily Rate
            $table->decimal('daily_rate', 10, 2)->default(0);
            
            // Allowances
            $table->decimal('clothing_allowance', 10, 2)->default(0);
            $table->decimal('rice_allowance', 10, 2)->default(0);
            $table->decimal('transportation_allowance', 10, 2)->default(0);
            $table->decimal('program_allowance', 10, 2)->default(0);
            $table->decimal('attendance_incentive', 10, 2)->default(0);
            
            // Adjustments (can be positive or negative)
            $table->decimal('adjustments', 10, 2)->default(0);
            
            // Government Contributions (Deductions)
            $table->decimal('sss_contribution', 10, 2)->default(0);
            $table->decimal('phic_contribution', 10, 2)->default(0);
            $table->decimal('hdmf_contribution', 10, 2)->default(0);
            
            $table->timestamps();
            
            // Foreign key
            $table->foreign('employee_id')
                ->references('employee_id')
                ->on('employees')
                ->onDelete('cascade');
            
            // Ensure one settings record per employee
            $table->unique('employee_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('employee_payroll_settings');
    }
};
