<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class HRISSeeder extends Seeder
{
    public function run(): void
    {
        // --- Companies ---
        $companies = [
            ['name' => 'Tom N Toms', 'industry' => 'Coffee Shop'],        
            ['name' => 'TechHub', 'industry' => 'Call Center'],          
            ['name' => 'SteamTrain', 'industry' => 'Coffee Shop'],      
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

        // --- Employees (11 total) ---
        $employees = [
            // Tom N Toms (3 employees)
            [
                'id_number' => 'TNT001', 'last_name' => 'Cruz', 'first_name' => 'Maria',
                'middle_name' => 'L.', 'gender' => 'Female', 'birth_date' => '1996-05-10',
                'age' => 29, 'civil_status' => 'Single', 'address' => 'Davao City',
                'contact_number' => '09171234567', 'company_id' => $companyIds['Tom N Toms'],
                'department_id' => $departmentIds['Barista Team'],
                'position_id' => $positionIds['Barista'], 'account_id' => null,
                'sss_number' => '11-2222-3333', 'phic_number' => 'PH123456', 'hdmf_number' => 'HDMF123456',
                'tin_number' => 'TIN123456', 'date_hired' => '2022-01-15',
                'date_regularized' => '2022-07-15', 'employment_status' => 'Regular',
                'remarks' => null, 'date_separated' => null, 'profile_picture' => null,
                'created_at' => now(), 'updated_at' => now(),
            ],
            [
                'id_number' => 'TNT002', 'last_name' => 'Reyes', 'first_name' => 'Juan',
                'middle_name' => 'D.', 'gender' => 'Male', 'birth_date' => '1995-11-20',
                'age' => 30, 'civil_status' => 'Married', 'address' => 'Tagum City',
                'contact_number' => '09182345678', 'company_id' => $companyIds['Tom N Toms'],
                'department_id' => $departmentIds['Cashier Team'],
                'position_id' => $positionIds['Cashier'], 'account_id' => null,
                'sss_number' => '22-3333-4444', 'phic_number' => 'PH654321', 'hdmf_number' => 'HDMF654321',
                'tin_number' => 'TIN654321', 'date_hired' => '2021-06-01',
                'date_regularized' => '2021-12-01', 'employment_status' => 'Regular',
                'remarks' => null, 'date_separated' => null, 'profile_picture' => null,
                'created_at' => now(), 'updated_at' => now(),
            ],
            [
                'id_number' => 'TNT003', 'last_name' => 'Villanueva', 'first_name' => 'Ana',
                'middle_name' => 'C.', 'gender' => 'Female', 'birth_date' => '1998-09-12',
                'age' => 27, 'civil_status' => 'Single', 'address' => 'Digos City',
                'contact_number' => '09193456789', 'company_id' => $companyIds['Tom N Toms'],
                'department_id' => $departmentIds['Barista Team'],
                'position_id' => $positionIds['Barista'], 'account_id' => null,
                'sss_number' => '33-4444-5555', 'phic_number' => 'PH789123', 'hdmf_number' => 'HDMF789123',
                'tin_number' => 'TIN789123', 'date_hired' => '2023-03-01',
                'date_regularized' => null, 'employment_status' => 'Probationary',
                'remarks' => 'New hire', 'date_separated' => null, 'profile_picture' => null,
                'created_at' => now(), 'updated_at' => now(),
            ],

            // TechHub (5 employees)
            [
                'id_number' => 'TH001', 'last_name' => 'Torres', 'first_name' => 'Kimzie',
                'middle_name' => 'A.', 'gender' => 'Female', 'birth_date' => '1999-01-15',
                'age' => 26, 'civil_status' => 'Single', 'address' => 'Davao City',
                'contact_number' => '09998887777', 'company_id' => $companyIds['TechHub'],
                'department_id' => $departmentIds['Customer Support'],
                'position_id' => $positionIds['CSR'], 'account_id' => $accountIds['Amazon Support'],
                'sss_number' => '44-5555-6666', 'phic_number' => 'PH222333', 'hdmf_number' => 'HDMF222333',
                'tin_number' => 'TIN222333', 'date_hired' => '2022-09-01',
                'date_regularized' => '2023-03-01', 'employment_status' => 'Regular',
                'remarks' => null, 'date_separated' => null, 'profile_picture' => null,
                'created_at' => now(), 'updated_at' => now(),
            ],
            [
                'id_number' => 'TH002', 'last_name' => 'Santos', 'first_name' => 'Mark',
                'middle_name' => 'B.', 'gender' => 'Male', 'birth_date' => '1994-02-18',
                'age' => 31, 'civil_status' => 'Married', 'address' => 'Panabo City',
                'contact_number' => '09175551234', 'company_id' => $companyIds['TechHub'],
                'department_id' => $departmentIds['Customer Support'],
                'position_id' => $positionIds['CSR'], 'account_id' => $accountIds['eBay Escalations'],
                'sss_number' => '55-6666-7777', 'phic_number' => 'PH444555', 'hdmf_number' => 'HDMF444555',
                'tin_number' => 'TIN444555', 'date_hired' => '2020-05-01',
                'date_regularized' => '2020-11-01', 'employment_status' => 'Regular',
                'remarks' => null, 'date_separated' => null, 'profile_picture' => null,
                'created_at' => now(), 'updated_at' => now(),
            ],
            [
                'id_number' => 'TH003', 'last_name' => 'Lopez', 'first_name' => 'Catherine',
                'middle_name' => 'D.', 'gender' => 'Female', 'birth_date' => '1997-07-22',
                'age' => 28, 'civil_status' => 'Single', 'address' => 'Davao City',
                'contact_number' => '09176667890', 'company_id' => $companyIds['TechHub'],
                'department_id' => $departmentIds['IT'],
                'position_id' => $positionIds['Team Lead'], 'account_id' => null,
                'sss_number' => '66-7777-8888', 'phic_number' => 'PH666777', 'hdmf_number' => 'HDMF666777',
                'tin_number' => 'TIN666777', 'date_hired' => '2019-04-15',
                'date_regularized' => '2019-10-15', 'employment_status' => 'Regular',
                'remarks' => 'Promoted in 2022', 'date_separated' => null, 'profile_picture' => null,
                'created_at' => now(), 'updated_at' => now(),
            ],
            [
                'id_number' => 'TH004', 'last_name' => 'Garcia', 'first_name' => 'Paul',
                'middle_name' => 'E.', 'gender' => 'Male', 'birth_date' => '1992-12-05',
                'age' => 33, 'civil_status' => 'Married', 'address' => 'Davao del Sur',
                'contact_number' => '09177778888', 'company_id' => $companyIds['TechHub'],
                'department_id' => $departmentIds['Customer Support'],
                'position_id' => $positionIds['CSR'], 'account_id' => $accountIds['Amazon Support'],
                'sss_number' => '77-8888-9999', 'phic_number' => 'PH888999', 'hdmf_number' => 'HDMF888999',
                'tin_number' => 'TIN888999', 'date_hired' => '2021-02-01',
                'date_regularized' => '2021-08-01', 'employment_status' => 'Regular',
                'remarks' => null, 'date_separated' => null, 'profile_picture' => null,
                'created_at' => now(), 'updated_at' => now(),
            ],
            [
                'id_number' => 'TH005', 'last_name' => 'Martinez', 'first_name' => 'Ella',
                'middle_name' => 'F.', 'gender' => 'Female', 'birth_date' => '2000-06-17',
                'age' => 25, 'civil_status' => 'Single', 'address' => 'Davao City',
                'contact_number' => '09179990000', 'company_id' => $companyIds['TechHub'],
                'department_id' => $departmentIds['Customer Support'],
                'position_id' => $positionIds['CSR'], 'account_id' => $accountIds['eBay Escalations'],
                'sss_number' => '88-9999-0000', 'phic_number' => 'PH000111', 'hdmf_number' => 'HDMF000111',
                'tin_number' => 'TIN000111', 'date_hired' => '2024-01-05',
                'date_regularized' => null, 'employment_status' => 'Probationary',
                'remarks' => 'New trainee', 'date_separated' => null, 'profile_picture' => null,
                'created_at' => now(), 'updated_at' => now(),
            ],

            // SteamTrain (3 employees)
            [
                'id_number' => 'ST001', 'last_name' => 'Fernandez', 'first_name' => 'Luis',
                'middle_name' => 'G.', 'gender' => 'Male', 'birth_date' => '1993-03-08',
                'age' => 32, 'civil_status' => 'Married', 'address' => 'Davao City',
                'contact_number' => '09178889999', 'company_id' => $companyIds['SteamTrain'],
                'department_id' => $departmentIds['Barista Team'],
                'position_id' => $positionIds['Barista'], 'account_id' => null,
                'sss_number' => '99-0000-1111', 'phic_number' => 'PH333444', 'hdmf_number' => 'HDMF333444',
                'tin_number' => 'TIN333444', 'date_hired' => '2020-09-01',
                'date_regularized' => '2021-03-01', 'employment_status' => 'Regular',
                'remarks' => null, 'date_separated' => null, 'profile_picture' => null,
                'created_at' => now(), 'updated_at' => now(),
            ],
            [
                'id_number' => 'ST002', 'last_name' => 'Morales', 'first_name' => 'Jessa',
                'middle_name' => 'H.', 'gender' => 'Female', 'birth_date' => '1999-08-19',
                'age' => 26, 'civil_status' => 'Single', 'address' => 'Tagum City',
                'contact_number' => '09176665555', 'company_id' => $companyIds['SteamTrain'],
                'department_id' => $departmentIds['Barista Team'],
                'position_id' => $positionIds['Barista'], 'account_id' => null,
                'sss_number' => '10-1111-2222', 'phic_number' => 'PH555666', 'hdmf_number' => 'HDMF555666',
                'tin_number' => 'TIN555666', 'date_hired' => '2023-05-01',
                'date_regularized' => null, 'employment_status' => 'Probationary',
                'remarks' => 'New hire', 'date_separated' => null, 'profile_picture' => null,
                'created_at' => now(), 'updated_at' => now(),
            ],
            [
                'id_number' => 'ST003', 'last_name' => 'Ramos', 'first_name' => 'Kevin',
                'middle_name' => 'I.', 'gender' => 'Male', 'birth_date' => '1991-04-23',
                'age' => 34, 'civil_status' => 'Married', 'address' => 'Davao City',
                'contact_number' => '09171112222', 'company_id' => $companyIds['SteamTrain'],
                'department_id' => $departmentIds['Barista Team'],
                'position_id' => $positionIds['Barista'], 'account_id' => null,
                'sss_number' => '12-2222-3333', 'phic_number' => 'PH777888', 'hdmf_number' => 'HDMF777888',
                'tin_number' => 'TIN777888', 'date_hired' => '2018-07-01',
                'date_regularized' => '2019-01-01', 'employment_status' => 'Regular',
                'remarks' => 'Senior staff', 'date_separated' => null, 'profile_picture' => null,
                'created_at' => now(), 'updated_at' => now(),
            ],
        ];

        DB::table('employees')->insert($employees);
    }
}
