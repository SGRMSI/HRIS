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
            $table->string('file_name');
            $table->foreignId('uploaded_by')->constrained('users', 'id');
            $table->timestamp('uploaded_at');
            $table->integer('total_records');
            $table->string('status')->comment('e.g. "pending", "processed", "finalized"');
            $table->text('remarks')->nullable();
            $table->timestamps();
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
