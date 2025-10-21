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
        Schema::create('attendance_raws', function (Blueprint $table) {
            $table->id('raw_id');
            $table->foreignId('batch_id')->constrained('attendance_upload_batches', 'batch_id');
            $table->foreignId('employee_id')->nullable()->constrained('employees', 'employee_id');
            $table->string('ac_no');
            $table->string('name');
            $table->dateTime('time_log');
            $table->string('state')->comment('e.g., "C/In", "C/Out", "OverTime In"');
            $table->string('new_state');
            $table->string('exception')->comment('e.g., "FOT", "OT"');
            $table->string('operation');
            $table->timestamp('created_at')->useCurrent();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('attendance_raws');
    }
};
