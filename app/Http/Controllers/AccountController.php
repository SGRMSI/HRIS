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

    /**
     * Toggle the status of the specified account.
     */
    public function toggleStatus(Request $request, Company $company, Account $account)
    {
        // Check if account belongs to the company
        if ($account->company_id !== $company->company_id) {
            return redirect()->back()->with('error', 'Account does not belong to this company');
        }

        // Log the request data to debug
        \Log::info('Toggle status request', [
            'request_data' => $request->all(),
            'account_id' => $account->account_id,
            'current_active' => $account->active
        ]);

        // Use a default value if active is null
        $newStatus = $request->has('active') ? (bool)$request->active : !$account->active;
        
        // Update with the new status
        $account->active = $newStatus;
        $account->save();

        return redirect()->back()->with('success', 'Account status updated successfully');
    }
}
