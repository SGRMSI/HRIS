<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Rename id to user_id
            $table->renameColumn('id', 'user_id');
            
            // Add new columns
            $table->unsignedBigInteger('employee_id')->nullable()->unique()->after('user_id');
            $table->foreignId('role_id')->after('password')->constrained('roles', 'role_id')->onDelete('restrict');
            $table->boolean('is_active')->default(true)->after('role_id');
            
            // Add foreign key for employee_id if employees table exists
            // $table->foreign('employee_id')->references('employee_id')->on('employees')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Drop foreign keys first
            $table->dropForeign(['role_id']);
            // $table->dropForeign(['employee_id']); // if employees table exists
            
            // Drop columns
            $table->dropColumn(['employee_id', 'role_id', 'is_active']);
            
            // Rename back
            $table->renameColumn('user_id', 'id');
        });
    }
};