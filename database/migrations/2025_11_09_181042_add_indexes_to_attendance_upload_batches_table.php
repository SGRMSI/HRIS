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
            // Index for status filtering
            $table->index('status', 'idx_batch_status');
            
            // Index for date sorting and filtering
            $table->index('created_at', 'idx_batch_created_at');
            
            // Index for uploaded_by filtering
            $table->index('uploaded_by', 'idx_batch_uploaded_by');
            
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
            $table->dropIndex('idx_batch_status');
            $table->dropIndex('idx_batch_created_at');
            $table->dropIndex('idx_batch_uploaded_by');
            $table->dropIndex('idx_batch_status_created');
            $table->dropIndex('idx_batch_filename');
        });
    }
};
