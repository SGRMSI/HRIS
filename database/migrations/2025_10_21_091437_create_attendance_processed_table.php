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
        Schema::create('attendance_processed', function (Blueprint $table) {
            $table->id('processed_id');
            $table->foreignId('batch_id')->constrained('attendance_upload_batches', 'batch_id');
            $table->foreignId('employee_id')->constrained('employees', 'id');
            $table->date('date');
            $table->time('clock_in');
            $table->time('clock_out');
            $table->time('break_in')->nullable();
            $table->time('break_out')->nullable();
            $table->decimal('total_hours', 5, 2)->comment('computed (hours minus break)');
            $table->string('status')->comment('e.g., "Present", "Absent", "Late", "Overtime"');
            $table->text('remarks')->nullable();
            $table->timestamp('created_at')->useCurrent();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('attendance_processed');
    }
};
