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
        Schema::create('attendances', function (Blueprint $table) {
            $table->id('attendance_id');
            $table->foreignId('employee_id')->constrained('employees', 'employee_id');
            $table->date('date');
            $table->foreignId('shift_id')->nullable()->constrained('shifts', 'shift_id');
            $table->time('clock_in')->nullable();
            $table->time('break_out')->nullable();
            $table->time('break_in')->nullable();
            $table->time('clock_out')->nullable();
            $table->decimal('total_hours', 5, 2)->nullable();
            $table->integer('late_minutes')->default(0);
            $table->decimal('overtime_hours', 5, 2)->default(0.00);
            $table->decimal('undertime_hours', 5, 2)->default(0.00);
            $table->string('status')->comment('"Present", "Absent", "On Leave", "Holiday"');
            $table->text('remarks')->nullable();
            $table->string('created_by')->nullable();
            $table->foreign('created_by')->references('id')->on('users');
            $table->string('approved_by')->nullable();
            $table->foreign('approved_by')->references('id')->on('users');
            $table->foreignId('holiday_id')->nullable()->constrained('holidays', 'holiday_id');
            $table->foreignId('leave_id')->nullable()->constrained('employee_leaves', 'leave_id');
            $table->boolean('requires_approval')->default(false);
            $table->timestamp('approved_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('attendances');
    }
};
