<?php

namespace Database\Seeders;

use App\Models\Shift;
use Illuminate\Database\Seeder;

class ShiftSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $shifts = [
            [
                'name' => 'Day Shift',
                'time_in' => '08:00',
                'time_out' => '17:00',
                'break_start' => '12:00',
                'break_end' => '13:00',
                'grace_period' => 15,
                'description' => 'Regular day shift from 8 AM to 5 PM',
            ],
            [
                'name' => 'Morning Shift',
                'time_in' => '06:00',
                'time_out' => '14:00',
                'break_start' => '10:00',
                'break_end' => '10:30',
                'grace_period' => 10,
                'description' => 'Early morning shift from 6 AM to 2 PM',
            ],
            [
                'name' => 'Afternoon Shift',
                'time_in' => '14:00',
                'time_out' => '22:00',
                'break_start' => '18:00',
                'break_end' => '19:00',
                'grace_period' => 10,
                'description' => 'Afternoon shift from 2 PM to 10 PM',
            ],
            [
                'name' => 'Night Shift',
                'time_in' => '19:00',
                'time_out' => '04:00',
                'break_start' => '01:00',
                'break_end' => '01:30',
                'grace_period' => 0,
                'description' => 'Night shift from 7 PM to 4 AM (overnight)',
            ],
            [
                'name' => 'Flexible Shift',
                'time_in' => '09:00',
                'time_out' => '18:00',
                'break_start' => '12:00',
                'break_end' => '13:00',
                'grace_period' => 30,
                'description' => 'Flexible schedule with 30-minute grace period',
            ],
            [
                'name' => 'Half Day AM',
                'time_in' => '08:00',
                'time_out' => '12:00',
                'break_start' => null,
                'break_end' => null,
                'grace_period' => 10,
                'description' => 'Half day morning shift',
            ],
            [
                'name' => 'Half Day PM',
                'time_in' => '13:00',
                'time_out' => '17:00',
                'break_start' => null,
                'break_end' => null,
                'grace_period' => 10,
                'description' => 'Half day afternoon shift',
            ],
        ];

        foreach ($shifts as $shift) {
            Shift::create($shift);
        }

        $this->command->info('Shifts seeded successfully!');
    }
}
