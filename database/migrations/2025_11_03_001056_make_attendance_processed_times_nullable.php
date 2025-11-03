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
        Schema::table('attendance_processed', function (Blueprint $table) {
            $table->time('clock_in')->nullable()->change();
            $table->time('clock_out')->nullable()->change();
            $table->time('break_out')->nullable()->change();
            $table->time('break_in')->nullable()->change();
            $table->decimal('total_hours', 5, 2)->nullable()->change();
            $table->integer('break_minutes')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('attendance_processed', function (Blueprint $table) {
            $table->time('clock_in')->nullable(false)->change();
            $table->time('clock_out')->nullable(false)->change();
            $table->time('break_out')->nullable(false)->change();
            $table->time('break_in')->nullable(false)->change();
            $table->decimal('total_hours', 5, 2)->nullable(false)->change();
            $table->integer('break_minutes')->nullable(false)->change();
        });
    }
};
