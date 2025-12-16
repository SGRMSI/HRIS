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
            $table->unique('filename', 'attendance_batches_filename_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('attendance_upload_batches', function (Blueprint $table) {
            $table->dropUnique('attendance_batches_filename_unique');
        });
    }
};
