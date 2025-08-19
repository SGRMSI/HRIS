<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
        public function up()
{
    Schema::create('employee_documents', function (Blueprint $table) {
        $table->id('document_id');
        $table->foreignId('employee_id')->constrained('employees', 'employee_id')->onDelete('cascade');
        $table->string('file_name');
        $table->string('file_type');
        $table->text('file_path');
        $table->enum('category', ['Resume', 'NBI', 'SSS', 'PHIC', 'HDMF', 'TIN', 'Other']);
        $table->foreignId('uploaded_by')->nullable()->constrained('users', 'user_id')->nullOnDelete();
        $table->timestamp('uploaded_at')->useCurrent();
        $table->text('remarks')->nullable();
        $table->timestamps();
    });
}


    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('employee_documents');
    }
};
