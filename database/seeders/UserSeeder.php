<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeder.
     */
    public function run(): void
    {
        // Get role IDs
        $adminRole = DB::table('roles')->where('name', 'admin')->first();
        $hrRole = DB::table('roles')->where('name', 'hr')->first();
        $managerRole = DB::table('roles')->where('name', 'manager')->first();
        // $employeeRole = DB::table('roles')->where('name', 'employee')->first();

        // Create default users
        $users = [
            [
                'name' => 'Admin',
                'email' => 'admin@hris.local',
                'password' => Hash::make('password123'),
                'role_id' => $adminRole->role_id,
                'is_active' => true,
                'email_verified_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'HR Manager',
                'email' => 'hr@hris.local',
                'password' => Hash::make('password123'),
                'role_id' => $hrRole->role_id,
                'is_active' => true,
                'email_verified_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ],  
        ];

        foreach ($users as $user) {
            DB::table('users')->updateOrInsert(
                ['email' => $user['email']],
                $user
            );
        }
    }
}