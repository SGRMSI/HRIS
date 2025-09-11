<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Company;  
use App\Models\Account;  
use Inertia\Inertia;    

class AccountController extends Controller
{
    /**
     * Store a newly created account.
     */
    public function store(Request $request, Company $company)
    {
        $validated = $request->validate([
        'name' => 'required|string|max:255',
        'active' => 'boolean',
        ]);

        $account = new Account($validated);
        $account->company_id = $company->company_id;
        $account->save();

        return redirect()->back()->with('success', 'Account created successfully');
    }

    /**
     * Remove the specified account.
     */
    public function destroy(Company $company, Account $account)
    {
        // Check if account belongs to the company
        if ($account->company_id !== $company->company_id) {
            return redirect()->back()->with('error', 'Account does not belong to this company');
        }

        // Check if account has employees
        if ($account->employees()->count() > 0) {
            return redirect()->back()->with('error', 'Cannot delete account with employees');
        }

        $account->delete();

        return redirect()->back()->with('success', 'Account deleted successfully');
    }
}
