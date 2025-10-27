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
            // Rename columns for consistency
            $table->renameColumn('batch_id', 'id');
            $table->renameColumn('file_name', 'filename');
            $table->renameColumn('uploaded_by', 'created_by');
            $table->renameColumn('uploaded_at', 'created_at');
            $table->renameColumn('total_records', 'total_rows');

            // Add missing columns
            $table->string('file_path')->after('filename');
            $table->integer('processed_rows')->default(0)->after('total_rows');
            
            // Add proper indexes
            $table->index('status');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('attendance_upload_batches', function (Blueprint $table) {
            // Reverse column renames
            $table->renameColumn('id', 'batch_id');
            $table->renameColumn('filename', 'file_name');
            $table->renameColumn('created_by', 'uploaded_by');
            $table->renameColumn('created_at', 'uploaded_at');
            $table->renameColumn('total_rows', 'total_records');

            // Drop added columns
            $table->dropColumn('file_path');
            $table->dropColumn('processed_rows');

            // Drop added indexes
            $table->dropIndex(['status']);
            $table->dropIndex(['created_at']);
        });
    }
};