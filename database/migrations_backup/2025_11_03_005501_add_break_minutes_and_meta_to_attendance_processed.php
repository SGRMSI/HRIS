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
            $table->integer('break_minutes')->nullable()->after('total_hours');
            $table->json('meta')->nullable()->after('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('attendance_processed', function (Blueprint $table) {
            $table->dropColumn(['break_minutes', 'meta']);
        });
    }
};
