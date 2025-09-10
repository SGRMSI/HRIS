<?php

namespace App\Http\Controllers;

use App\Models\Company;
use App\Models\Department;
use Illuminate\Http\Request;

class DepartmentController extends Controller
{
    /**
     * Store a newly created department.
     */
    public function store(Request $request, Company $company)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
        ]);

        $department = new Department($validated);
        $department->company_id = $company->company_id;
        $department->save();

        return redirect()->back()->with('success', 'Department created successfully');
    }

    /**
     * Remove the specified department.
     */
    public function destroy(Company $company, Department $department)
    {
        // Check if department belongs to the company
        if ($department->company_id !== $company->company_id) {
            return redirect()->back()->with('error', 'Department does not belong to this company');
        }

        // Check if department has employees
        if ($department->employees()->count() > 0) {
            return redirect()->back()->with('error', 'Cannot delete department with employees');
        }

        $department->delete();
        
        return redirect()->back()->with('success', 'Department deleted successfully');
    }
}