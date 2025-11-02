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
        Schema::create('employee_leaves', function (Blueprint $table) {
            $table->id('leave_id');
            $table->foreignId('employee_id')->constrained('employees', 'employee_id');
            $table->string('type')->comment('"Vacation", "Sick", "Emergency", Personal, Other');
            $table->date('date_from');
            $table->date('date_to');
            $table->string('status')->comment('"Pending", "Approved", "Rejected"');
            $table->text('remarks')->nullable();
            $table->foreignId('approved_by')->nullable()->constrained('users', 'id');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('employee_leaves');
    }
};
