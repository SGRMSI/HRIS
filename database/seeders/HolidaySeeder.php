<?php

namespace Database\Seeders;

use App\Models\Company;
use App\Models\Holiday;
use Illuminate\Database\Seeder;
use Carbon\Carbon;

class HolidaySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get all companies
        $companies = Company::all();
        
        if ($companies->isEmpty()) {
            $this->command->warn('No companies found. Please run CompanySeeder first.');
            return;
        }

        // National holidays (for all companies)
        // pay_percentage: 0 = no extra pay, 30 = 30% increase, 100 = 100% increase (double pay)
        $nationalHolidays = [
            ['name' => 'New Year\'s Day', 'date' => '2025-01-01', 'type' => 'regular', 'pay_percentage' => 100],
            ['name' => 'EDSA Revolution Anniversary', 'date' => '2025-02-25', 'type' => 'special', 'pay_percentage' => 30],
            ['name' => 'Araw ng Kagitingan', 'date' => '2025-04-09', 'type' => 'regular', 'pay_percentage' => 100],
            ['name' => 'Maundy Thursday', 'date' => '2025-04-17', 'type' => 'regular', 'pay_percentage' => 100],
            ['name' => 'Good Friday', 'date' => '2025-04-18', 'type' => 'regular', 'pay_percentage' => 100],
            ['name' => 'Black Saturday', 'date' => '2025-04-19', 'type' => 'special', 'pay_percentage' => 30],
            ['name' => 'Labor Day', 'date' => '2025-05-01', 'type' => 'regular', 'pay_percentage' => 100],
            ['name' => 'Independence Day', 'date' => '2025-06-12', 'type' => 'regular', 'pay_percentage' => 100],
            ['name' => 'Ninoy Aquino Day', 'date' => '2025-08-21', 'type' => 'special', 'pay_percentage' => 30],
            ['name' => 'National Heroes Day', 'date' => '2025-08-25', 'type' => 'regular', 'pay_percentage' => 100],
            ['name' => 'All Saints\' Day', 'date' => '2025-11-01', 'type' => 'special', 'pay_percentage' => 30],
            ['name' => 'All Souls\' Day', 'date' => '2025-11-02', 'type' => 'special', 'pay_percentage' => 30],
            ['name' => 'Bonifacio Day', 'date' => '2025-11-30', 'type' => 'regular', 'pay_percentage' => 100],
            ['name' => 'Feast of the Immaculate Conception', 'date' => '2025-12-08', 'type' => 'special', 'pay_percentage' => 30],
            ['name' => 'Christmas Eve', 'date' => '2025-12-24', 'type' => 'special', 'pay_percentage' => 30],
            ['name' => 'Christmas Day', 'date' => '2025-12-25', 'type' => 'regular', 'pay_percentage' => 100],
            ['name' => 'Rizal Day', 'date' => '2025-12-30', 'type' => 'regular', 'pay_percentage' => 100],
            ['name' => 'New Year\'s Eve', 'date' => '2025-12-31', 'type' => 'special', 'pay_percentage' => 30],
        ];

        // Add national holidays with NULL company_id (applies to all companies)
        foreach ($nationalHolidays as $holiday) {
            Holiday::create([
                'company_id' => null,
                'name' => $holiday['name'],
                'date' => $holiday['date'],
                'type' => $holiday['type'],
                'pay_percentage' => $holiday['pay_percentage'],
            ]);
        }

        // Add some company-specific holidays
        $firstCompany = $companies->first();
        if ($firstCompany) {
            // Tom N Toms company holidays
            Holiday::create([
                'company_id' => $firstCompany->company_id,
                'name' => 'Company Foundation Day',
                'date' => '2025-03-15',
                'type' => 'company',
                'pay_percentage' => 100,
            ]);

            Holiday::create([
                'company_id' => $firstCompany->company_id,
                'name' => 'Annual Company Outing',
                'date' => '2025-07-15',
                'type' => 'company',
                'pay_percentage' => 0,
            ]);

            Holiday::create([
                'company_id' => $firstCompany->company_id,
                'name' => 'Year End Party',
                'date' => '2025-12-20',
                'type' => 'company',
                'pay_percentage' => 0,
            ]);
        }

        // Add holidays for second company (TechHub)
        $secondCompany = $companies->skip(1)->first();
        if ($secondCompany) {
            Holiday::create([
                'company_id' => $secondCompany->company_id,
                'name' => 'TechHub Anniversary',
                'date' => '2025-05-20',
                'type' => 'company',
                'pay_percentage' => 100,
            ]);

            Holiday::create([
                'company_id' => $secondCompany->company_id,
                'name' => 'Innovation Day',
                'date' => '2025-09-10',
                'type' => 'company',
                'pay_percentage' => 0,
            ]);

            Holiday::create([
                'company_id' => $secondCompany->company_id,
                'name' => 'Company Wellness Day',
                'date' => '2025-10-15',
                'type' => 'company',
                'pay_percentage' => 0,
            ]);
        }

        // Add holidays for third company (SteamTrain)
        $thirdCompany = $companies->skip(2)->first();
        if ($thirdCompany) {
            Holiday::create([
                'company_id' => $thirdCompany->company_id,
                'name' => 'SteamTrain Foundation Day',
                'date' => '2025-06-01',
                'type' => 'company',
                'pay_percentage' => 100,
            ]);

            Holiday::create([
                'company_id' => $thirdCompany->company_id,
                'name' => 'Mid-Year Team Building',
                'date' => '2025-08-15',
                'type' => 'company',
                'pay_percentage' => 0,
            ]);

            Holiday::create([
                'company_id' => $thirdCompany->company_id,
                'name' => 'Holiday Celebration',
                'date' => '2025-12-23',
                'type' => 'company',
                'pay_percentage' => 0,
            ]);
        }

        // Add holidays for next year too (national holidays with NULL company_id)
        $nextYearHolidays = [
            ['name' => 'New Year\'s Day', 'date' => '2026-01-01', 'type' => 'regular', 'pay_percentage' => 100],
            ['name' => 'Chinese New Year', 'date' => '2026-02-17', 'type' => 'special', 'pay_percentage' => 30],
            ['name' => 'EDSA Revolution Anniversary', 'date' => '2026-02-25', 'type' => 'special', 'pay_percentage' => 30],
            ['name' => 'Araw ng Kagitingan', 'date' => '2026-04-09', 'type' => 'regular', 'pay_percentage' => 100],
        ];

        foreach ($nextYearHolidays as $holiday) {
            Holiday::create([
                'company_id' => null,
                'name' => $holiday['name'],
                'date' => $holiday['date'],
                'type' => $holiday['type'],
                'pay_percentage' => $holiday['pay_percentage'],
            ]);
        }

        $totalHolidays = Holiday::count();
        $national = Holiday::whereNull('company_id')->count();
        $companySpecific = Holiday::whereNotNull('company_id')->count();
        $this->command->info("Holidays seeded successfully!");
        $this->command->info("Total: {$totalHolidays} | National: {$national} | Company-specific: {$companySpecific}");
    }
}
