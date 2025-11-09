<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        // Get employee counts by employment status
        $employeeStats = [
            'total' => Employee::count(),
            'probationary' => Employee::where('employment_status', 'Probationary')->count(),
            'regular' => Employee::where('employment_status', 'Regular')->count(),
            'contractual' => Employee::where('employment_status', 'Contractual')->count(),
        ];

        // Alternative: More efficient single query approach
        // $statusCounts = Employee::select('employment_status', DB::raw('count(*) as count'))
        //     ->groupBy('employment_status')
        //     ->pluck('count', 'employment_status')
        //     ->toArray();
        //
        // $employeeStats = [
        //     'total' => Employee::count(),
        //     'probationary' => $statusCounts['Probationary'] ?? 0,
        //     'regular' => $statusCounts['Regular'] ?? 0,
        //     'contractual' => $statusCounts['Contractual'] ?? 0,
        // ];

        return Inertia::render('dashboard', [
            'employeeStats' => $employeeStats,
        ]);
    }
}