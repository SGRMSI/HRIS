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
        // Change enum columns to string to remove CHECK constraints
        Schema::table('employees', function (Blueprint $table) {
            // Change gender from enum to string
            $table->string('gender', 50)->change();
            
            // Change civil_status from enum to string
            $table->string('civil_status', 50)->change();
            
            // Change employment_status from enum to string
            $table->string('employment_status', 50)->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            // Revert back to enum (will recreate CHECK constraints)
            $table->enum('gender', ['Male', 'Female', 'Other'])->change();
            $table->enum('civil_status', ['Single', 'Married', 'Separated', 'Widowed'])->change();
            $table->enum('employment_status', ['Probationary', 'Regular', 'Contractual', 'Resigned', 'Terminated'])->change();
        });
    }
};
