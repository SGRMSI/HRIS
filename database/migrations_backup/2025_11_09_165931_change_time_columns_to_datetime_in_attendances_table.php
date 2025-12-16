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
        Schema::table('attendances', function (Blueprint $table) {
            $table->dateTime('clock_in')->nullable()->change();
            $table->dateTime('break_out')->nullable()->change();
            $table->dateTime('break_in')->nullable()->change();
            $table->dateTime('clock_out')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('attendances', function (Blueprint $table) {
            $table->time('clock_in')->nullable()->change();
            $table->time('break_out')->nullable()->change();
            $table->time('break_in')->nullable()->change();
            $table->time('clock_out')->nullable()->change();
        });
    }
};
