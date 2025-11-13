<?php

namespace App\Http\Controllers;

use App\Models\Company;
use App\Models\Employee;
use App\Models\EmployeePayrollSettings;
use Illuminate\Http\Request;
use Inertia\Inertia;

class EmployeePayrollSettingsController extends Controller
{
    public function index(Request $request)
    {
        $query = Employee::with(['company', 'department', 'position', 'payrollSettings'])
            ->whereIn('employment_status', ['Probationary', 'Regular', 'Contractual']);

        // Filter by company
        if ($request->filled('company_id')) {
            $query->where('company_id', $request->company_id);
        }

        // Search by name or ID
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('id_number', 'like', "%{$search}%")
                    ->orWhere('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%");
            });
        }

        $employees = $query->paginate(20)->withQueryString();

        // Map full_name and flatten payroll settings for each employee
        $employees->getCollection()->transform(function ($employee) {
            $employee->full_name = trim(
                $employee->first_name . ' ' .
                ($employee->middle_name ? $employee->middle_name . ' ' : '') .
                $employee->last_name
            );
            
            // Flatten payroll settings to employee level for easier access in frontend
            if ($employee->payrollSettings) {
                $employee->daily_rate = $employee->payrollSettings->daily_rate;
                $employee->clothing_allowance = $employee->payrollSettings->clothing_allowance;
                $employee->rice_allowance = $employee->payrollSettings->rice_allowance;
                $employee->transportation_allowance = $employee->payrollSettings->transportation_allowance;
                $employee->program_allowance = $employee->payrollSettings->program_allowance;
                $employee->attendance_incentive = $employee->payrollSettings->attendance_incentive;
                $employee->adjustments = $employee->payrollSettings->adjustments;
                $employee->sss_contribution = $employee->payrollSettings->sss_contribution;
                $employee->phic_contribution = $employee->payrollSettings->phic_contribution;
                $employee->hdmf_contribution = $employee->payrollSettings->hdmf_contribution;
            } else {
                // Default values if no settings exist
                $employee->daily_rate = 0;
                $employee->clothing_allowance = 0;
                $employee->rice_allowance = 0;
                $employee->transportation_allowance = 0;
                $employee->program_allowance = 0;
                $employee->attendance_incentive = 0;
                $employee->adjustments = 0;
                $employee->sss_contribution = 0;
                $employee->phic_contribution = 0;
                $employee->hdmf_contribution = 0;
            }
            
            return $employee;
        });

        $companies = Company::orderBy('name')->get();

        return Inertia::render('Payroll/EmployeeSettings/Index', [
            'employees' => $employees,
            'companies' => $companies,
            'filters' => $request->only(['search', 'company_id']),
        ]);
    }

    public function edit(Employee $employee)
    {
        $employee->load(['company', 'department', 'position', 'payrollSettings']);
        
        $employee->full_name = trim(
            $employee->first_name . ' ' .
            ($employee->middle_name ? $employee->middle_name . ' ' : '') .
            $employee->last_name
        );

        // Flatten payroll settings
        if ($employee->payrollSettings) {
            $employee->daily_rate = $employee->payrollSettings->daily_rate;
            $employee->clothing_allowance = $employee->payrollSettings->clothing_allowance;
            $employee->rice_allowance = $employee->payrollSettings->rice_allowance;
            $employee->transportation_allowance = $employee->payrollSettings->transportation_allowance;
            $employee->program_allowance = $employee->payrollSettings->program_allowance;
            $employee->attendance_incentive = $employee->payrollSettings->attendance_incentive;
            $employee->adjustments = $employee->payrollSettings->adjustments;
            $employee->sss_contribution = $employee->payrollSettings->sss_contribution;
            $employee->phic_contribution = $employee->payrollSettings->phic_contribution;
            $employee->hdmf_contribution = $employee->payrollSettings->hdmf_contribution;
        } else {
            // Default values
            $employee->daily_rate = 0;
            $employee->clothing_allowance = 0;
            $employee->rice_allowance = 0;
            $employee->transportation_allowance = 0;
            $employee->program_allowance = 0;
            $employee->attendance_incentive = 0;
            $employee->adjustments = 0;
            $employee->sss_contribution = 0;
            $employee->phic_contribution = 0;
            $employee->hdmf_contribution = 0;
        }

        return Inertia::render('Payroll/EmployeeSettings/Edit', [
            'employee' => $employee,
        ]);
    }

    public function update(Request $request, Employee $employee)
    {
        $validated = $request->validate([
            'daily_rate' => 'nullable|numeric|min:0',
            'clothing_allowance' => 'nullable|numeric|min:0',
            'rice_allowance' => 'nullable|numeric|min:0',
            'transportation_allowance' => 'nullable|numeric|min:0',
            'program_allowance' => 'nullable|numeric|min:0',
            'attendance_incentive' => 'nullable|numeric|min:0',
            'adjustments' => 'nullable|numeric',
            'sss_contribution' => 'nullable|numeric|min:0',
            'phic_contribution' => 'nullable|numeric|min:0',
            'hdmf_contribution' => 'nullable|numeric|min:0',
        ]);

        // Update or create payroll settings
        $settings = EmployeePayrollSettings::updateOrCreate(
            ['employee_id' => $employee->employee_id],
            $validated
        );

        activity()
            ->performedOn($settings)
            ->withProperties(['attributes' => $validated])
            ->log('Updated employee payroll settings');

        return redirect()->route('payroll.employee-settings.index')
            ->with('success', 'Employee payroll settings updated successfully.');
    }
}
