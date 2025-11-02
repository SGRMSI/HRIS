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
        Schema::create('attendance_upload_batches', function (Blueprint $table) {
            $table->id('batch_id');
            $table->string('filename');
            $table->string('file_path');
            $table->integer('total_rows')->default(0);
            $table->integer('processed_rows')->default(0);
            $table->string('status')->comment('pending, processing, completed, failed');
            $table->text('remarks')->nullable();
            $table->unsignedBigInteger('created_by'); // Just store the user ID without foreign key
            $table->timestamps();

            // Add indexes for performance
            $table->index('status');
            $table->index('created_at');
            $table->index('created_by');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('attendance_upload_batches');
    }
};
