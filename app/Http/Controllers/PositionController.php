<?php

namespace App\Http\Controllers;

use App\Models\Company;
use App\Models\Position;
use Illuminate\Http\Request;

class PositionController extends Controller
{
    /**
     * Store a newly created position.
     */
    public function store(Request $request, Company $company)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
        ]);

        $position = new Position($validated);
        $position->company_id = $company->company_id;
        $position->save();

        return redirect()->back()->with('success', 'Position created successfully');
    }

    /**
     * Remove the specified position.
     */
    public function destroy(Company $company, Position $position)
    {
        // Check if position belongs to the company
        if ($position->company_id !== $company->company_id) {
            return redirect()->back()->with('error', 'Position does not belong to this company');
        }

        // Check if position has employees
        if ($position->employees()->count() > 0) {
            return redirect()->back()->with('error', 'Cannot delete position with employees');
        }

        $position->delete();
        
        return redirect()->back()->with('success', 'Position deleted successfully');
    }
}
