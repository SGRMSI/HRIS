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
        Schema::table('attendance_upload_batches', function (Blueprint $table) {
            // Note: status, created_at, and created_by already have indexes from original migration
            // Only add indexes that don't exist yet
            
            // Composite index for common query patterns (status + date)
            $table->index(['status', 'created_at'], 'idx_batch_status_created');
            
            // Index for filename searching
            $table->index('filename', 'idx_batch_filename');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('attendance_upload_batches', function (Blueprint $table) {
            $table->dropIndex('idx_batch_status_created');
            $table->dropIndex('idx_batch_filename');
        });
    }
};
