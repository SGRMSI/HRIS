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
            $table->decimal('days_count', 5, 1)->comment('Number of leave days (can be decimal for half days)');
            $table->boolean('include_saturday')->default(false);
            $table->boolean('include_sunday')->default(false);
            $table->string('status')->comment('"Pending", "Approved", "Rejected"');
            $table->text('remarks')->nullable();
            $table->string('document_path')->nullable();
            $table->foreignId('approved_by')->nullable()->constrained('users', 'user_id');
            $table->timestamp('approved_at')->nullable();
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
