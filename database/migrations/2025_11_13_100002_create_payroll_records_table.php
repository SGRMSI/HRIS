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
        Schema::create('payroll_records', function (Blueprint $table) {
            $table->id('payroll_id');
            $table->foreignId('period_id')->constrained('payroll_periods', 'period_id')->cascadeOnDelete();
            $table->foreignId('employee_id')->constrained('employees', 'employee_id')->cascadeOnDelete();
            
            // Basic Pay: Daily Rate * Days Worked = Basic Pay
            $table->decimal('daily_rate', 10, 2)->default(0)->comment('From employee_payroll_settings');
            $table->decimal('days_worked', 5, 2)->default(0)->comment('From attendance count');
            $table->decimal('basic_pay', 10, 2)->default(0)->comment('Daily Rate * Days Worked');
            
            // Additional Earnings
            $table->decimal('overtime', 10, 2)->default(0);
            $table->decimal('night_differential', 10, 2)->default(0);
            $table->decimal('special_holiday', 10, 2)->default(0);
            $table->decimal('legal_holiday', 10, 2)->default(0);
            $table->decimal('holiday_pay', 10, 2)->default(0)->comment('Daily rate * 1 or * 2 if double pay');
            
            // Allowances
            $table->decimal('clothing_allowance', 10, 2)->default(0);
            $table->decimal('rice_allowance', 10, 2)->default(0);
            $table->decimal('transportation_allowance', 10, 2)->default(0);
            $table->decimal('program_allowance', 10, 2)->default(0);
            $table->decimal('attendance_incentive', 10, 2)->default(0);
            
            // Adjustments
            $table->decimal('adjustments', 10, 2)->default(0);
            $table->text('adjustment_notes')->nullable();
            
            // Gross Pay = Basic Pay + Overtime + Night Diff + Holidays + Allowances + Adjustments
            $table->decimal('gross_pay', 10, 2)->default(0);
            
            // Government Contributions
            $table->decimal('sss_contribution', 10, 2)->default(0);
            $table->decimal('phic_contribution', 10, 2)->default(0);
            $table->decimal('hdmf_contribution', 10, 2)->default(0);
            
            // Other Deductions
            $table->integer('late_undertime_minutes')->default(0)->comment('Total late minutes from attendance');
            $table->decimal('late_undertime_amount', 10, 2)->default(0)->comment('Calculated: (daily_rate / 480) * late_minutes');
            $table->decimal('cash_advance', 10, 2)->default(0);
            
            // Total Deductions = SSS + PHIC + HDMF + Late/Undertime + Cash Advance
            $table->decimal('total_deductions', 10, 2)->default(0);
            
            // Net Pay = Gross Pay - Total Deductions
            $table->decimal('net_pay', 10, 2)->default(0);
            
            // Status & Approval
            $table->enum('status', ['draft', 'for_approval', 'approved', 'paid'])->default('draft');
            $table->boolean('is_editable')->default(true);
            
            $table->timestamps();
            
            $table->index(['period_id', 'employee_id']);
            $table->index('status');
            $table->unique(['period_id', 'employee_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payroll_records');
    }
};
