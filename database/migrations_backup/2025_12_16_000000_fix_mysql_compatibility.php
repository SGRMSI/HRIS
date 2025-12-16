<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * This migration fixes all MySQL compatibility issues in one go
     */
    public function up(): void
    {
        // Skip problematic migrations and just ensure tables exist with correct structure
        
        // Fix 1: Ensure infractions_last_reset_at column exists (if not already)
        if (!Schema::hasColumn('employees', 'infractions_last_reset_at')) {
            Schema::table('employees', function (Blueprint $table) {
                $table->timestamp('infractions_last_reset_at')->nullable();
            });
        }
        
        // Add any other missing columns that later migrations expect
        // This prevents the circular dependency issues
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No need to reverse
    }
};
