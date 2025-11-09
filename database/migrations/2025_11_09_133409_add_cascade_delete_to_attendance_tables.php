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
        // Add foreign key constraints with cascade delete for attendance_raws
        Schema::table('attendance_raws', function (Blueprint $table) {
            $table->foreign('batch_id')
                  ->references('batch_id')
                  ->on('attendance_upload_batches')
                  ->onDelete('cascade');
        });

        // Add foreign key constraints with cascade delete for attendance_processed
        Schema::table('attendance_processed', function (Blueprint $table) {
            $table->foreign('batch_id')
                  ->references('batch_id')
                  ->on('attendance_upload_batches')
                  ->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('attendance_raws', function (Blueprint $table) {
            $table->dropForeign(['batch_id']);
        });

        Schema::table('attendance_processed', function (Blueprint $table) {
            $table->dropForeign(['batch_id']);
        });
    }
};
