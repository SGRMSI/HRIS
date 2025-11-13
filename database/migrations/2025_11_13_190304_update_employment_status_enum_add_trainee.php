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
        // SQLite doesn't support ALTER COLUMN for enum changes
        // We need to recreate the table with the new enum values
        
        // Check if we're using SQLite
        if (DB::connection()->getDriverName() === 'sqlite') {
            // Disable foreign key constraints temporarily
            DB::statement('PRAGMA foreign_keys = OFF');
            
            // Begin transaction to ensure atomicity
            DB::beginTransaction();
            
            try {
                // Drop the table if it exists from a previous failed migration
                Schema::dropIfExists('employees_new');
                
                // Create a new table with the updated enum
                Schema::create('employees_new', function (Blueprint $table) {
                    $table->id('employee_id');
                    $table->string('id_number')->unique();
                    $table->string('last_name');
                    $table->string('first_name');
                    $table->string('middle_name')->nullable();
                    $table->enum('gender', ['Male', 'Female', 'Other']);
                    $table->date('birth_date');
                    $table->integer('age');
                    $table->enum('civil_status', ['Single', 'Married', 'Separated', 'Widowed']);
                    $table->text('address');
                    $table->string('contact_number')->nullable();

                    $table->foreignId('company_id')->nullable()->constrained('companies', 'company_id')->onDelete('cascade');
                    $table->foreignId('department_id')->nullable()->constrained('departments', 'department_id')->nullOnDelete();
                    $table->foreignId('position_id')->nullable()->constrained('positions', 'position_id')->onDelete('cascade');
                    $table->foreignId('account_id')->nullable()->constrained('accounts', 'account_id')->nullOnDelete();

                    $table->string('sss_number')->nullable();
                    $table->string('phic_number')->nullable();
                    $table->string('hdmf_number')->nullable();
                    $table->string('tin_number')->nullable();

                    $table->date('date_hired');
                    $table->date('evaluation_start_date')->nullable();
                    $table->date('evaluation_end_date')->nullable();
                    $table->date('date_regularized')->nullable();
                    $table->enum('work_shift', ['Dayshift', 'Graveyard'])->nullable();
                    $table->enum('employment_status', ['Probationary', 'Trainee', 'Regular', 'Contractual', 'Resigned', 'Terminated']);
                    $table->text('remarks')->nullable();
                    $table->date('date_separated')->nullable();
                    $table->text('profile_picture')->nullable();

                    $table->timestamps();
                });

                // Copy data from old table to new table with explicit column mapping
                DB::statement('INSERT INTO employees_new (
                    employee_id, id_number, last_name, first_name, middle_name,
                    gender, birth_date, age, civil_status, address, contact_number,
                    company_id, department_id, position_id, account_id,
                    sss_number, phic_number, hdmf_number, tin_number,
                    date_hired, evaluation_start_date, evaluation_end_date, date_regularized, work_shift,
                    employment_status, remarks, date_separated, profile_picture,
                    created_at, updated_at
                ) SELECT 
                    employee_id, id_number, last_name, first_name, middle_name,
                    gender, birth_date, age, civil_status, address, contact_number,
                    company_id, department_id, position_id, account_id,
                    sss_number, phic_number, hdmf_number, tin_number,
                    date_hired, evaluation_start_date, evaluation_end_date, date_regularized, work_shift,
                    employment_status, remarks, date_separated, profile_picture,
                    created_at, updated_at
                FROM employees');

                // Drop old table
                Schema::dropIfExists('employees');

                // Rename new table to employees
                Schema::rename('employees_new', 'employees');
                
                // Commit transaction
                DB::commit();
                
                // Re-enable foreign key constraints
                DB::statement('PRAGMA foreign_keys = ON');
                
            } catch (\Exception $e) {
                // Rollback on error
                DB::rollback();
                DB::statement('PRAGMA foreign_keys = ON');
                throw $e;
            }
        } else {
            // For MySQL/PostgreSQL
            DB::statement("ALTER TABLE employees MODIFY COLUMN employment_status ENUM('Probationary', 'Trainee', 'Regular', 'Contractual', 'Resigned', 'Terminated')");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (DB::connection()->getDriverName() === 'sqlite') {
            // Create table without Trainee
            Schema::create('employees_old', function (Blueprint $table) {
                $table->id('employee_id');
                $table->string('id_number')->unique();
                $table->string('last_name');
                $table->string('first_name');
                $table->string('middle_name')->nullable();
                $table->enum('gender', ['Male', 'Female', 'Other']);
                $table->date('birth_date');
                $table->integer('age');
                $table->enum('civil_status', ['Single', 'Married', 'Separated', 'Widowed']);
                $table->text('address');
                $table->string('contact_number')->nullable();

                $table->foreignId('company_id')->nullable()->constrained('companies', 'company_id')->onDelete('cascade');
                $table->foreignId('department_id')->nullable()->constrained('departments', 'department_id')->nullOnDelete();
                $table->foreignId('position_id')->nullable()->constrained('positions', 'position_id')->onDelete('cascade');
                $table->foreignId('account_id')->nullable()->constrained('accounts', 'account_id')->nullOnDelete();

                $table->string('sss_number')->nullable();
                $table->string('phic_number')->nullable();
                $table->string('hdmf_number')->nullable();
                $table->string('tin_number')->nullable();

                $table->date('date_hired');
                $table->date('evaluation_end_date')->nullable();
                $table->date('date_regularized')->nullable();
                $table->enum('work_shift', ['Dayshift', 'Graveyard'])->nullable();
                $table->enum('employment_status', ['Probationary', 'Regular', 'Contractual', 'Resigned', 'Terminated']);
                $table->text('remarks')->nullable();
                $table->date('date_separated')->nullable();
                $table->text('profile_picture')->nullable();

                $table->timestamps();
            });

            DB::statement('INSERT INTO employees_old SELECT * FROM employees WHERE employment_status != "Trainee"');
            Schema::dropIfExists('employees');
            Schema::rename('employees_old', 'employees');
        } else {
            DB::statement("ALTER TABLE employees MODIFY COLUMN employment_status ENUM('Probationary', 'Regular', 'Contractual', 'Resigned', 'Terminated')");
        }
    }
};
