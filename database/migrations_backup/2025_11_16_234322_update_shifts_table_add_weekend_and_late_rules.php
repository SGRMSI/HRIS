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
        Schema::table('shifts', function (Blueprint $table) {
            // Add weekend inclusion checkboxes
            $table->boolean('include_saturday')->default(false)->after('description');
            $table->boolean('include_sunday')->default(false)->after('include_saturday');
            
            // Add late rules JSON column
            // Format: [{"threshold_minutes": 15, "deduction_minutes": 30}, {"threshold_minutes": 60, "deduction_minutes": 120}]
            $table->json('late_rules')->nullable()->after('include_sunday');
        });
        
        // SQLite doesn't support dropping columns with foreign keys easily
        // We'll keep grace_period for backward compatibility but ignore it in the app
        // If you want to fully remove it, you'll need to recreate the table
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('shifts', function (Blueprint $table) {
            // Remove new columns
            $table->dropColumn(['include_saturday', 'include_sunday', 'late_rules']);
        });
    }
};
