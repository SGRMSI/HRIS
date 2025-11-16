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
        // For SQLite, we need to recreate the table due to limitations with dropping columns
        if (DB::getDriverName() === 'sqlite') {
            // Get existing data
            $holidays = DB::table('holidays')->get();
            
            // Drop and recreate table
            Schema::dropIfExists('holidays');
            
            Schema::create('holidays', function (Blueprint $table) {
                $table->id('holiday_id');
                $table->string('name');
                $table->date('date');
                $table->string('type')->comment('"Regular", "Special"');
                $table->integer('pay_percentage')->default(0)->comment('0% = no extra pay, 30% = 30% increase, 100% = 100% increase (double pay)');
                $table->foreignId('company_id')->nullable()->constrained('companies', 'company_id');
                $table->timestamps();
            });
            
            // Restore data with converted values
            foreach ($holidays as $holiday) {
                DB::table('holidays')->insert([
                    'holiday_id' => $holiday->holiday_id,
                    'name' => $holiday->name,
                    'date' => $holiday->date,
                    'type' => $holiday->type,
                    'pay_percentage' => $holiday->is_double_pay ? 100 : 0,
                    'company_id' => $holiday->company_id,
                    'created_at' => $holiday->created_at,
                    'updated_at' => $holiday->updated_at,
                ]);
            }
        } else {
            // For MySQL/PostgreSQL
            Schema::table('holidays', function (Blueprint $table) {
                $table->integer('pay_percentage')->default(0)->after('type')->comment('0% = no extra pay, 30% = 30% increase, 100% = 100% increase (double pay)');
            });

            DB::statement('UPDATE holidays SET pay_percentage = CASE WHEN is_double_pay = 1 THEN 100 ELSE 0 END');

            Schema::table('holidays', function (Blueprint $table) {
                $table->dropColumn('is_double_pay');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (DB::getDriverName() === 'sqlite') {
            // Get existing data
            $holidays = DB::table('holidays')->get();
            
            // Drop and recreate table with old structure
            Schema::dropIfExists('holidays');
            
            Schema::create('holidays', function (Blueprint $table) {
                $table->id('holiday_id');
                $table->string('name');
                $table->date('date');
                $table->string('type')->comment('"Regular", "Special"');
                $table->boolean('is_double_pay')->default(false)->comment('If true, pay is daily_rate * 2');
                $table->foreignId('company_id')->nullable()->constrained('companies', 'company_id');
                $table->timestamps();
            });
            
            // Restore data with converted values
            foreach ($holidays as $holiday) {
                DB::table('holidays')->insert([
                    'holiday_id' => $holiday->holiday_id,
                    'name' => $holiday->name,
                    'date' => $holiday->date,
                    'type' => $holiday->type,
                    'is_double_pay' => $holiday->pay_percentage == 100 ? 1 : 0,
                    'company_id' => $holiday->company_id,
                    'created_at' => $holiday->created_at,
                    'updated_at' => $holiday->updated_at,
                ]);
            }
        } else {
            Schema::table('holidays', function (Blueprint $table) {
                $table->boolean('is_double_pay')->default(false)->after('type');
            });

            DB::statement('UPDATE holidays SET is_double_pay = CASE WHEN pay_percentage = 100 THEN 1 ELSE 0 END');

            Schema::table('holidays', function (Blueprint $table) {
                $table->dropColumn('pay_percentage');
            });
        }
    }
};
