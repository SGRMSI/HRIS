<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CompanySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // // --- Companies ---
        $companies = [
            ['name' => 'Tom N Toms', 'industry' => 'Coffee Shop', 'has_account' => false],        
            ['name' => 'TechHub', 'industry' => 'Call Center', 'has_account' => true],          
            ['name' => 'SteamTrain', 'industry' => 'Coffee Shop', 'has_account' => false],      
        ];

        DB::table('companies')->insert($companies);

        $companyIds = DB::table('companies')->pluck('company_id', 'name');

        // --- Departments ---
        $departments = [
            ['company_id' => $companyIds['Tom N Toms'], 'name' => 'Barista Team'],
            ['company_id' => $companyIds['Tom N Toms'], 'name' => 'Cashier Team'],
            ['company_id' => $companyIds['TechHub'], 'name' => 'Customer Support'],
            ['company_id' => $companyIds['TechHub'], 'name' => 'IT'],
            ['company_id' => $companyIds['SteamTrain'], 'name' => 'Barista Team'],
        ];
        DB::table('departments')->insert($departments);

        $departmentIds = DB::table('departments')->pluck('department_id', 'name');

        // --- Positions ---
        $positions = [
            ['company_id' => $companyIds['Tom N Toms'], 'title' => 'Barista'],
            ['company_id' => $companyIds['Tom N Toms'], 'title' => 'Cashier'],
            ['company_id' => $companyIds['TechHub'], 'title' => 'CSR'],
            ['company_id' => $companyIds['TechHub'], 'title' => 'Team Lead'],
            ['company_id' => $companyIds['SteamTrain'], 'title' => 'Barista'],
        ];
        DB::table('positions')->insert($positions);

        $positionIds = DB::table('positions')->pluck('position_id', 'title');

        // --- Accounts (for TechHub only) ---
        $accounts = [
            ['company_id' => $companyIds['TechHub'], 'name' => 'Amazon Support', 'active' => true],
            ['company_id' => $companyIds['TechHub'], 'name' => 'eBay Escalations', 'active' => true],
        ];
        DB::table('accounts')->insert($accounts);

        $accountIds = DB::table('accounts')->pluck('account_id', 'name');
    }
}
