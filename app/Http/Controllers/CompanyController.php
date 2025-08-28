<?php

namespace App\Http\Controllers;

use App\Models\Company;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CompanyController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): Response
    {
        $companies = Company::withCount([
            'departments', 
            'positions', 
            'employees', 
            'accounts'
        ])->get();
        
        return Inertia::render('company-management', [
            'companies' => $companies,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        return Inertia::render('company/create-company');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:companies,name',
            'industry' => 'required|string|max:255',
        ]);

        Company::create($validated);

        return redirect()->route('company.index')
            ->with('success', 'Company created successfully!');
    }

    /**
     * Display the specified resource.
     */
    public function show(Company $company): Response
    {
        // Load relationships for the company view
        $company->load([
            'departments' => function ($query) {
                $query->withCount('employees');
            },
            'positions' => function ($query) {
                $query->withCount('employees');
            },
            'accounts',
            'employees' => function ($query) {
                $query->with(['department', 'position'])->latest()->limit(10);
            }
        ]);

        return Inertia::render('company/view-company', [
            'company' => $company,
            'departments' => $company->departments,
            'positions' => $company->positions,
            'accounts' => $company->accounts,
            'employees' => $company->employees,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Company $company): Response
    {
        return Inertia::render('company/edit-company', [
            'company' => $company,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Company $company)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:companies,name,' . $company->company_id . ',company_id',
            'industry' => 'required|string|max:255',
        ]);

        $company->update($validated);

        return redirect()->route('company.index')
            ->with('success', 'Company updated successfully!');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Company $company)
    {
        // Check if company has employees
        if ($company->employees()->exists()) {
            return redirect()->route('company.index')
                ->with('error', 'Cannot delete company with existing employees.');
        }

        // Delete related data first
        $company->departments()->delete();
        $company->positions()->delete();
        $company->accounts()->delete();
        
        // Delete the company
        $company->delete();

        return redirect()->route('company.index')
            ->with('success', 'Company deleted successfully!');
    }
}
