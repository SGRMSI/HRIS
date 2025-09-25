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
        Schema::table('employee_documents', function (Blueprint $table) {
            // Add the uploaded_by column without foreign key constraint
            $table->unsignedBigInteger('uploaded_by')->nullable();
            
            // Update the enum values to match the application categories
            // First drop the existing column
            $table->dropColumn('category');
        });
        
        // Add the new column with updated enum values
        Schema::table('employee_documents', function (Blueprint $table) {
            $table->enum('category', ['Government_Documents', 'Company_Documents', 'Infractions', 'Other'])->after('file_path');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('employee_documents', function (Blueprint $table) {
            // Drop the added column
            $table->dropColumn('uploaded_by');
            
            // Revert the enum changes
            $table->dropColumn('category');
        });
        
        Schema::table('employee_documents', function (Blueprint $table) {
            $table->enum('category', ['Resume', 'NBI', 'SSS', 'PHIC', 'HDMF', 'TIN', 'Other'])->after('file_path');
        });
    }
};
