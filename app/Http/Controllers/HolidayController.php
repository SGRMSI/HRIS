<?php

namespace App\Http\Controllers;

use App\Models\Holiday;
use App\Models\Company;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;

class HolidayController extends Controller
{
    /**
     * Display a listing of holidays
     *
     * @param Request $request
     * @return \Inertia\Response
     */
    public function index(Request $request)
    {
        $year = $request->year ?? Carbon::now()->year;
        
        $query = Holiday::with('company:company_id,name')
            ->whereYear('date', $year)
            ->when($request->company_id, function ($q) use ($request) {
                $q->where('company_id', $request->company_id);
            })
            ->when($request->type, function ($q) use ($request) {
                $q->where('type', $request->type);
            })
            ->when($request->search, function ($q) use ($request) {
                $q->where('name', 'like', "%{$request->search}%");
            });

        $holidays = $query->orderBy('date')
            ->paginate($request->per_page ?? 50)
            ->through(function ($holiday) {
                return [
                    'id' => $holiday->holiday_id,
                    'name' => $holiday->name,
                    'date' => $holiday->date->format('Y-m-d'),
                    'formatted_date' => $holiday->date->format('F d, Y'),
                    'day_of_week' => $holiday->date->format('l'),
                    'type' => $holiday->type,
                    'pay_percentage' => $holiday->pay_percentage,
                    'company' => $holiday->company ? [
                        'id' => $holiday->company->company_id,
                        'name' => $holiday->company->name
                    ] : null,
                    'is_past' => $holiday->date->isPast(),
                    'is_upcoming' => $holiday->date->isFuture() && $holiday->date->diffInDays(now()) <= 30
                ];
            });

        // Get available years - SQLite compatible
        $availableYears = Holiday::selectRaw("DISTINCT strftime('%Y', date) as year")
            ->orderBy('year', 'desc')
            ->pluck('year')
            ->map(fn($year) => (int) $year)
            ->toArray();

        if (!in_array($year, $availableYears)) {
            $availableYears[] = $year;
        }
        sort($availableYears);

        return Inertia::render('Attendance/Holidays/Index', [
            'holidays' => $holidays,
            'filters' => $request->only(['year', 'company_id', 'type', 'search']),
            'companies' => Company::select(['company_id as id', 'name'])->get(),
            'types' => [
                ['value' => 'regular', 'label' => 'Regular Holiday'],
                ['value' => 'special', 'label' => 'Special Non-Working'],
                ['value' => 'company', 'label' => 'Company Specific']
            ],
            'availableYears' => $availableYears,
            'currentYear' => $year
        ]);
    }

    /**
     * Show the form for creating a new holiday
     *
     * @return \Inertia\Response
     */
    public function create()
    {
        return Inertia::render('Attendance/Holidays/Create', [
            'companies' => Company::select(['company_id as id', 'name'])->get(),
            'types' => [
                ['value' => 'regular', 'label' => 'Regular Holiday'],
                ['value' => 'special', 'label' => 'Special Non-Working'],
                ['value' => 'company', 'label' => 'Company Specific']
            ]
        ]);
    }

    /**
     * Store a newly created holiday
     *
     * @param Request $request
     * @return \Illuminate\Http\RedirectResponse
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'date' => ['required', 'date'],
            'type' => ['required', 'string', 'in:regular,special,company'],
            'company_id' => ['nullable', 'exists:companies,company_id'],
            'pay_percentage' => ['required', 'integer', 'in:0,30,100'],
            'description' => ['nullable', 'string', 'max:500']
        ]);

        // Additional validation: company_id required if type is 'company'
        if ($validated['type'] === 'company' && !isset($validated['company_id'])) {
            return back()->withErrors([
                'company_id' => 'Company is required for company-specific holidays.'
            ])->withInput();
        }

        try {
            DB::beginTransaction();

            // Check for duplicates - same date and type
            // For company-specific holidays, also check company_id
            $duplicateQuery = Holiday::where('date', $validated['date']);
            
            if ($validated['type'] === 'company' && isset($validated['company_id'])) {
                // Check for same company-specific holiday
                $duplicateQuery->where('company_id', $validated['company_id']);
            } elseif ($validated['type'] !== 'company') {
                // Check for regular/special holidays (should be unique by date regardless of company)
                $duplicateQuery->whereIn('type', ['regular', 'special']);
            }
            
            if ($duplicateQuery->exists()) {
                return back()->withErrors([
                    'date' => 'A holiday already exists for this date.'
                ])->withInput();
            }

            $holiday = Holiday::create([
                'name' => $validated['name'],
                'date' => $validated['date'],
                'type' => $validated['type'],
                'company_id' => $validated['company_id'] ?? null,
                'pay_percentage' => $validated['pay_percentage']
            ]);

            // Log the creation
            activity()
                ->performedOn($holiday)
                ->causedBy(Auth::user())
                ->log('holiday.created');

            DB::commit();

            return redirect()
                ->route('attendance.holidays.index')
                ->with('success', 'Holiday created successfully.');

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to create holiday', [
                'data' => $validated,
                'error' => $e->getMessage()
            ]);

            return back()->withErrors(['error' => 'Failed to create holiday.'])->withInput();
        }
    }

    /**
     * Show the form for editing the specified holiday
     *
     * @param Holiday $holiday
     * @return \Inertia\Response
     */
    public function edit(Holiday $holiday)
    {
        $holiday->load('company');

        return Inertia::render('Attendance/Holidays/Edit', [
            'holiday' => [
                'id' => $holiday->holiday_id,
                'name' => $holiday->name,
                'date' => $holiday->date->format('Y-m-d'),
                'type' => $holiday->type,
                'pay_percentage' => $holiday->pay_percentage,
                'company_id' => $holiday->company_id,
                'company' => $holiday->company ? [
                    'id' => $holiday->company->company_id,
                    'name' => $holiday->company->name
                ] : null
            ],
            'companies' => Company::select(['company_id as id', 'name'])->get(),
            'types' => [
                ['value' => 'regular', 'label' => 'Regular Holiday'],
                ['value' => 'special', 'label' => 'Special Non-Working'],
                ['value' => 'company', 'label' => 'Company Specific']
            ]
        ]);
    }

    /**
     * Update the specified holiday
     *
     * @param Request $request
     * @param Holiday $holiday
     * @return \Illuminate\Http\RedirectResponse
     */
    public function update(Request $request, Holiday $holiday)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'date' => ['required', 'date'],
            'type' => ['required', 'string', 'in:regular,special,company'],
            'company_id' => ['nullable', 'exists:companies,company_id'],
            'pay_percentage' => ['required', 'integer', 'in:0,30,100']
        ]);

        // Additional validation
        if ($validated['type'] === 'company' && !isset($validated['company_id'])) {
            return back()->withErrors([
                'company_id' => 'Company is required for company-specific holidays.'
            ])->withInput();
        }

        try {
            DB::beginTransaction();

            // Check for duplicates (excluding current holiday)
            $duplicateQuery = Holiday::where('date', $validated['date'])
                ->where('holiday_id', '!=', $holiday->holiday_id);
            
            if ($validated['type'] === 'company' && isset($validated['company_id'])) {
                // Check for same company-specific holiday
                $duplicateQuery->where('company_id', $validated['company_id']);
            } elseif ($validated['type'] !== 'company') {
                // Check for regular/special holidays (should be unique by date regardless of company)
                $duplicateQuery->whereIn('type', ['regular', 'special']);
            }
            
            if ($duplicateQuery->exists()) {
                return back()->withErrors([
                    'date' => 'A holiday already exists for this date.'
                ])->withInput();
            }

            // Record old state for audit
            $oldState = $holiday->getAttributes();

            $holiday->update([
                'name' => $validated['name'],
                'date' => $validated['date'],
                'type' => $validated['type'],
                'company_id' => $validated['company_id'] ?? null,
                'pay_percentage' => $validated['pay_percentage']
            ]);

            // Log the update with changes
            activity()
                ->performedOn($holiday)
                ->causedBy(Auth::user())
                ->withProperties([
                    'old' => $oldState,
                    'new' => $holiday->getAttributes()
                ])
                ->log('holiday.updated');

            DB::commit();

            return redirect()
                ->route('attendance.holidays.index')
                ->with('success', 'Holiday updated successfully.');

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to update holiday', [
                'holiday_id' => $holiday->holiday_id,
                'data' => $validated,
                'error' => $e->getMessage()
            ]);

            return back()->withErrors(['error' => 'Failed to update holiday.']);
        }
    }

    /**
     * Remove the specified holiday
     *
     * @param Holiday $holiday
     * @return \Illuminate\Http\RedirectResponse
     */
    public function destroy(Holiday $holiday)
    {
        try {
            DB::beginTransaction();

            // Log before deletion
            activity()
                ->performedOn($holiday)
                ->causedBy(Auth::user())
                ->withProperties([
                    'holiday' => $holiday->toArray()
                ])
                ->log('holiday.deleted');

            $holiday->delete();

            DB::commit();

            return back()->with('success', 'Holiday deleted successfully.');

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to delete holiday', [
                'holiday_id' => $holiday->holiday_id,
                'error' => $e->getMessage()
            ]);

            return back()->withErrors(['error' => 'Failed to delete holiday.']);
        }
    }

    /**
     * Bulk import holidays from Excel
     *
     * @param Request $request
     * @return \Illuminate\Http\RedirectResponse
     */
    public function bulkImport(Request $request)
    {
        $request->validate([
            'file' => ['required', 'file', 'mimes:xlsx,xls,csv', 'max:2048'],
            'skip_duplicates' => ['nullable', 'boolean']
        ]);

        try {
            DB::beginTransaction();

            $file = $request->file('file');
            $import = new \App\Imports\HolidayImport(
                null, // No default company - will be read from Excel
                $request->skip_duplicates ?? true
            );

            Excel::import($import, $file);

            DB::commit();

            $stats = $import->getStats();

            return back()->with('success', sprintf(
                'Import completed. Created: %d, Skipped: %d, Errors: %d',
                $stats['created'],
                $stats['skipped'],
                $stats['errors']
            ));

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to import holidays', [
                'error' => $e->getMessage()
            ]);

            return back()->withErrors(['file' => 'Failed to import holidays: ' . $e->getMessage()]);
        }
    }

    /**
     * Export holidays to Excel
     *
     * @param Request $request
     * @return mixed
     */
    public function export(Request $request)
    {
        $request->validate([
            'year' => ['nullable', 'integer', 'min:2020', 'max:2100'],
            'company_id' => ['nullable', 'exists:companies,company_id'],
            'type' => ['nullable', 'string', 'in:regular,special,company']
        ]);

        $year = $request->year ?? Carbon::now()->year;
        $filename = sprintf('holidays_%d.xlsx', $year);

        try {
            return Excel::download(
                new \App\Exports\HolidayExport([
                    'year' => $year,
                    'company_id' => $request->company_id,
                    'type' => $request->type
                ]),
                $filename
            );
        } catch (\Exception $e) {
            Log::error('Failed to export holidays', [
                'filters' => $request->all(),
                'error' => $e->getMessage()
            ]);

            throw $e;
        }
    }
}
