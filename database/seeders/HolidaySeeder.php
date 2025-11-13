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
        $nationalHolidays = [
            ['name' => 'New Year\'s Day', 'date' => '2025-01-01', 'type' => 'regular', 'is_double_pay' => true],
            ['name' => 'EDSA Revolution Anniversary', 'date' => '2025-02-25', 'type' => 'special', 'is_double_pay' => false],
            ['name' => 'Araw ng Kagitingan', 'date' => '2025-04-09', 'type' => 'regular', 'is_double_pay' => true],
            ['name' => 'Maundy Thursday', 'date' => '2025-04-17', 'type' => 'regular', 'is_double_pay' => true],
            ['name' => 'Good Friday', 'date' => '2025-04-18', 'type' => 'regular', 'is_double_pay' => true],
            ['name' => 'Black Saturday', 'date' => '2025-04-19', 'type' => 'special', 'is_double_pay' => false],
            ['name' => 'Labor Day', 'date' => '2025-05-01', 'type' => 'regular', 'is_double_pay' => true],
            ['name' => 'Independence Day', 'date' => '2025-06-12', 'type' => 'regular', 'is_double_pay' => true],
            ['name' => 'Ninoy Aquino Day', 'date' => '2025-08-21', 'type' => 'special', 'is_double_pay' => false],
            ['name' => 'National Heroes Day', 'date' => '2025-08-25', 'type' => 'regular', 'is_double_pay' => true],
            ['name' => 'All Saints\' Day', 'date' => '2025-11-01', 'type' => 'special', 'is_double_pay' => false],
            ['name' => 'All Souls\' Day', 'date' => '2025-11-02', 'type' => 'special', 'is_double_pay' => false],
            ['name' => 'Bonifacio Day', 'date' => '2025-11-30', 'type' => 'regular', 'is_double_pay' => true],
            ['name' => 'Feast of the Immaculate Conception', 'date' => '2025-12-08', 'type' => 'special', 'is_double_pay' => false],
            ['name' => 'Christmas Eve', 'date' => '2025-12-24', 'type' => 'special', 'is_double_pay' => false],
            ['name' => 'Christmas Day', 'date' => '2025-12-25', 'type' => 'regular', 'is_double_pay' => true],
            ['name' => 'Rizal Day', 'date' => '2025-12-30', 'type' => 'regular', 'is_double_pay' => true],
            ['name' => 'New Year\'s Eve', 'date' => '2025-12-31', 'type' => 'special', 'is_double_pay' => false],
        ];

        // Add national holidays with NULL company_id (applies to all companies)
        foreach ($nationalHolidays as $holiday) {
            Holiday::create([
                'company_id' => null,
                'name' => $holiday['name'],
                'date' => $holiday['date'],
                'type' => $holiday['type'],
                'is_double_pay' => $holiday['is_double_pay'],
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
                'is_double_pay' => true,
            ]);

            Holiday::create([
                'company_id' => $firstCompany->company_id,
                'name' => 'Annual Company Outing',
                'date' => '2025-07-15',
                'type' => 'company',
                'is_double_pay' => false,
            ]);

            Holiday::create([
                'company_id' => $firstCompany->company_id,
                'name' => 'Year End Party',
                'date' => '2025-12-20',
                'type' => 'company',
                'is_double_pay' => false,
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
                'is_double_pay' => true,
            ]);

            Holiday::create([
                'company_id' => $secondCompany->company_id,
                'name' => 'Innovation Day',
                'date' => '2025-09-10',
                'type' => 'company',
                'is_double_pay' => false,
            ]);

            Holiday::create([
                'company_id' => $secondCompany->company_id,
                'name' => 'Company Wellness Day',
                'date' => '2025-10-15',
                'type' => 'company',
                'is_double_pay' => false,
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
                'is_double_pay' => true,
            ]);

            Holiday::create([
                'company_id' => $thirdCompany->company_id,
                'name' => 'Mid-Year Team Building',
                'date' => '2025-08-15',
                'type' => 'company',
                'is_double_pay' => false,
            ]);

            Holiday::create([
                'company_id' => $thirdCompany->company_id,
                'name' => 'Holiday Celebration',
                'date' => '2025-12-23',
                'type' => 'company',
                'is_double_pay' => false,
            ]);
        }

        // Add holidays for next year too (national holidays with NULL company_id)
        $nextYearHolidays = [
            ['name' => 'New Year\'s Day', 'date' => '2026-01-01', 'type' => 'regular', 'is_double_pay' => true],
            ['name' => 'Chinese New Year', 'date' => '2026-02-17', 'type' => 'special', 'is_double_pay' => false],
            ['name' => 'EDSA Revolution Anniversary', 'date' => '2026-02-25', 'type' => 'special', 'is_double_pay' => false],
            ['name' => 'Araw ng Kagitingan', 'date' => '2026-04-09', 'type' => 'regular', 'is_double_pay' => true],
        ];

        foreach ($nextYearHolidays as $holiday) {
            Holiday::create([
                'company_id' => null,
                'name' => $holiday['name'],
                'date' => $holiday['date'],
                'type' => $holiday['type'],
                'is_double_pay' => $holiday['is_double_pay'],
            ]);
        }

        $totalHolidays = Holiday::count();
        $national = Holiday::whereNull('company_id')->count();
        $companySpecific = Holiday::whereNotNull('company_id')->count();
        $this->command->info("Holidays seeded successfully!");
        $this->command->info("Total: {$totalHolidays} | National: {$national} | Company-specific: {$companySpecific}");
    }
}
