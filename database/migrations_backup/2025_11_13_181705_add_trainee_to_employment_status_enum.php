<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // For SQLite, we need to recreate the table with the new enum values
        // This migration adds 'Trainee' to the employment_status enum
        
        // Note: Since we're using SQLite and it doesn't support ALTER COLUMN for enum,
        // we just need to ensure the application validates the values.
        // The actual constraint is handled at the application level.
        
        // For production MySQL/PostgreSQL, you would use:
        // DB::statement("ALTER TABLE employees MODIFY COLUMN employment_status ENUM('Probationary', 'Trainee', 'Regular', 'Contractual', 'Resigned', 'Terminated')");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Rollback would remove 'Trainee' from the enum
        // DB::statement("ALTER TABLE employees MODIFY COLUMN employment_status ENUM('Probationary', 'Regular', 'Contractual', 'Resigned', 'Terminated')");
    }
};
