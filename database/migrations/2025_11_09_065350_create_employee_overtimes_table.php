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
        Schema::create('employee_overtimes', function (Blueprint $table) {
            $table->id('overtime_id');
            $table->foreignId('employee_id')->constrained('employees', 'employee_id')->cascadeOnDelete();
            $table->date('overtime_date');
            $table->integer('duration_hours')->default(0);
            $table->integer('duration_minutes')->default(0);
            $table->text('reason');
            $table->string('status')->default('pending')->comment('pending, approved, rejected, cancelled');
            $table->text('remarks')->nullable();
            $table->string('document_path')->nullable();
            
            // Track who created the request
            $table->unsignedBigInteger('created_by')->nullable();
            $table->foreign('created_by')->references('user_id')->on('users')->nullOnDelete();
            
            // Track who approved/rejected
            $table->unsignedBigInteger('approved_by')->nullable();
            $table->foreign('approved_by')->references('user_id')->on('users')->nullOnDelete();
            
            $table->timestamp('approved_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('employee_overtimes');
    }
};
