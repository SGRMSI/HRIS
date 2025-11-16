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
        Schema::table('payroll_records', function (Blueprint $table) {
            $table->integer('undertime_minutes')->default(0)->after('late_undertime_amount')->comment('Total undertime minutes');
            $table->decimal('undertime_amount', 10, 2)->default(0)->after('undertime_minutes')->comment('Undertime deduction amount');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('payroll_records', function (Blueprint $table) {
            $table->dropColumn(['undertime_minutes', 'undertime_amount']);
        });
    }
};
