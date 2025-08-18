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
    Schema::create('employees', function (Blueprint $table) {
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

        $table->foreignId('company_id')->constrained('companies', 'company_id')->onDelete('cascade');
        $table->foreignId('department_id')->nullable()->constrained('departments', 'department_id')->nullOnDelete();
        $table->foreignId('position_id')->constrained('positions', 'position_id')->onDelete('cascade');
        $table->foreignId('account_id')->nullable()->constrained('accounts', 'account_id')->nullOnDelete();

        $table->string('sss_number')->nullable();
        $table->string('phic_number')->nullable();
        $table->string('hdmf_number')->nullable();
        $table->string('tin_number')->nullable();

        $table->date('date_hired');
        $table->date('date_regularized')->nullable();
        $table->enum('employment_status', ['Probationary', 'Regular', 'Contractual', 'Resigned', 'Terminated']);
        $table->text('remarks')->nullable();
        $table->date('date_separated')->nullable();
        $table->text('profile_picture')->nullable();

        $table->timestamps();
    });
}



    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('employees');
    }
};
