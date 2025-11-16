<?php

use App\Models\Holiday;
use Carbon\Carbon;
use Illuminate\Support\Facades\Route;

Route::get('/test-holidays', function () {
    $today = Carbon::today();
    $next30Days = Carbon::today()->addDays(30);

    $holidays = Holiday::whereDate('date', '>=', $today)
        ->whereDate('date', '<=', $next30Days)
        ->with('company')
        ->orderBy('date', 'asc')
        ->get()
        ->map(function ($holiday) {
            return [
                'id' => $holiday->holiday_id,
                'type' => 'holiday',
                'title' => $holiday->name ?? 'Holiday',
                'date' => $holiday->date ? $holiday->date->toDateString() : today()->toDateString(),
                'description' => $holiday->type . ($holiday->company ? ' - ' . $holiday->company->name : ' - All Companies'),
                'company' => $holiday->company ? [
                    'name' => $holiday->company->name,
                ] : [
                    'name' => 'All Companies',
                ],
            ];
        });

    return response()->json([
        'today' => $today->toDateString(),
        'next30Days' => $next30Days->toDateString(),
        'count' => $holidays->count(),
        'holidays' => $holidays
    ]);
});
