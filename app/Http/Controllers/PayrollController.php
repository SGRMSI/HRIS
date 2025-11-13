<?php

namespace App\Http\Controllers;

use App\Models\PayrollPeriod;
use App\Models\PayrollRecord;
use App\Models\Employee;
use App\Models\Company;
use App\Services\PayrollService;
use App\Exports\PayrollExport;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;
use Barryvdh\DomPDF\Facade\Pdf;

class PayrollController extends Controller
{
    protected $payrollService;

    public function __construct(PayrollService $payrollService)
    {
        $this->payrollService = $payrollService;
    }

    /**
     * Display all payroll periods
     */
    public function index(Request $request)
    {
        $query = PayrollPeriod::with(['creator', 'approver'])
            ->withCount('payrollRecords');

        // Filter by status
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Filter by date range
        if ($request->filled('from_date')) {
            $query->where('date_from', '>=', $request->from_date);
        }
        if ($request->filled('to_date')) {
            $query->where('date_to', '<=', $request->to_date);
        }

        // Search by period name
        if ($request->filled('search')) {
            $query->where('period_name', 'like', '%' . $request->search . '%');
        }

        $periods = $query->orderBy('date_from', 'desc')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Payroll/Index', [
            'periods' => $periods,
            'filters' => $request->only(['status', 'from_date', 'to_date', 'search']),
        ]);
    }

    /**
     * Show create form
     */
    public function create()
    {
        $companies = Company::orderBy('name')
            ->get(['company_id', 'name']);

        return Inertia::render('Payroll/Create', [
            'companies' => $companies,
        ]);
    }

    /**
     * Store new payroll period
     */
    public function store(Request $request)
    {
        $request->validate([
            'period_name' => 'required|string|max:255',
            'date_from' => 'required|date',
            'date_to' => 'required|date|after_or_equal:date_from',
            'payment_date' => 'nullable|date',
            'employee_ids' => 'required|array|min:1',
            'employee_ids.*' => 'exists:employees,employee_id',
            'notes' => 'nullable|string',
        ]);

        DB::beginTransaction();
        try {
            // Create payroll period
            $period = PayrollPeriod::create([
                'period_name' => $request->period_name,
                'date_from' => $request->date_from,
                'date_to' => $request->date_to,
                'payment_date' => $request->payment_date,
                'status' => 'draft',
                'notes' => $request->notes,
                'created_by' => auth()->id(),
            ]);

            // Add employees to payroll
            $result = $this->payrollService->addEmployeesToPeriod($period, $request->employee_ids);

            DB::commit();

            if ($result['created'] > 0) {
                return redirect()->route('payroll.show', $period->period_id)
                    ->with('success', "Payroll period created with {$result['created']} employees. " . 
                           ($result['skipped'] > 0 ? "{$result['skipped']} skipped." : ""));
            } else {
                return back()->with('error', 'Failed to add any employees to payroll period.');
            }
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Failed to create payroll period: ' . $e->getMessage());
        }
    }

    /**
     * Show payroll period with all employee records
     */
    public function show(PayrollPeriod $period)
    {
        $period->load([
            'creator:user_id,name',
            'approver:user_id,name',
        ]);

        $records = $period->payrollRecords()
            ->with(['employee.company', 'employee.department', 'employee.position'])
            ->get()
            ->map(function ($record) {
                if ($record->employee) {
                    $record->employee->full_name = trim(
                        $record->employee->first_name . ' ' . 
                        ($record->employee->middle_name ? $record->employee->middle_name . ' ' : '') . 
                        $record->employee->last_name
                    );
                }
                return $record;
            })
            ->groupBy('employee.company.name');

        return Inertia::render('Payroll/Show', [
            'period' => $period,
            'records' => $records,
        ]);
    }

    /**
     * Show edit form for individual employee payroll
     */
    public function edit(PayrollPeriod $period, PayrollRecord $record)
    {
        if ($record->period_id !== $period->period_id) {
            return redirect()->route('payroll.show', $period->period_id)
                ->with('error', 'Record not found in this payroll period.');
        }

        if (!$record->is_editable) {
            return redirect()->route('payroll.show', $period->period_id)
                ->with('error', 'This payroll record is locked and cannot be edited.');
        }

        $record->load(['employee.department', 'employee.position', 'employee.company']);

        // Construct full name
        if ($record->employee) {
            $record->employee->full_name = trim(
                $record->employee->first_name . ' ' . 
                ($record->employee->middle_name ? $record->employee->middle_name . ' ' : '') . 
                $record->employee->last_name
            );
        }

        return Inertia::render('Payroll/Edit', [
            'period' => $period,
            'record' => $record,
        ]);
    }

    /**
     * Update individual employee payroll
     */
    public function update(Request $request, PayrollPeriod $period, PayrollRecord $record)
    {
        if ($record->period_id !== $period->period_id) {
            return back()->with('error', 'Record not found in this payroll period.');
        }

        if (!$record->is_editable) {
            return back()->with('error', 'This payroll record is locked and cannot be edited.');
        }

        $request->validate([
            'daily_rate' => 'required|numeric|min:0',
            'days_worked' => 'required|numeric|min:0|max:31',
            'overtime' => 'nullable|numeric|min:0',
            'night_differential' => 'nullable|numeric|min:0',
            'special_holiday' => 'nullable|numeric|min:0',
            'legal_holiday' => 'nullable|numeric|min:0',
            'clothing_allowance' => 'nullable|numeric|min:0',
            'rice_allowance' => 'nullable|numeric|min:0',
            'transportation_allowance' => 'nullable|numeric|min:0',
            'program_allowance' => 'nullable|numeric|min:0',
            'attendance_incentive' => 'nullable|numeric|min:0',
            'adjustments' => 'nullable|numeric',
            'adjustment_notes' => 'nullable|string',
            'sss_contribution' => 'nullable|numeric|min:0',
            'phic_contribution' => 'nullable|numeric|min:0',
            'hdmf_contribution' => 'nullable|numeric|min:0',
            'late_undertime_minutes' => 'nullable|integer|min:0',
            'late_undertime_amount' => 'nullable|numeric|min:0',
            'cash_advance' => 'nullable|numeric|min:0',
        ]);

        DB::beginTransaction();
        try {
            $record->update($request->all());
            $record->calculateAll();
            $record->save();

            // Recalculate period totals
            $period->calculateTotals();

            DB::commit();

            activity()
                ->performedOn($record)
                ->causedBy(auth()->user())
                ->withProperties([
                    'period_id' => $period->period_id,
                    'period_name' => $period->period_name,
                    'employee' => $record->employee->full_name,
                ])
                ->log('payroll_updated');

            return redirect()->route('payroll.show', $period->period_id)
                ->with('success', 'Payroll record updated successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Failed to update payroll: ' . $e->getMessage());
        }
    }

    /**
     * Recalculate single employee payroll
     */
    public function recalculate(PayrollPeriod $period, PayrollRecord $record)
    {
        if ($record->period_id !== $period->period_id) {
            return back()->with('error', 'Record not found in this payroll period.');
        }

        if (!$record->is_editable) {
            return back()->with('error', 'This payroll record is locked.');
        }

        DB::beginTransaction();
        try {
            $this->payrollService->recalculateRecord($record);
            $period->calculateTotals();

            DB::commit();

            activity()
                ->performedOn($record)
                ->causedBy(auth()->user())
                ->withProperties([
                    'period_id' => $period->period_id,
                    'employee' => $record->employee->full_name,
                ])
                ->log('payroll_recalculated');

            return back()->with('success', 'Payroll recalculated from attendance data.');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Failed to recalculate: ' . $e->getMessage());
        }
    }

    /**
     * Approve payroll period
     */
    public function approve(PayrollPeriod $period)
    {
        if ($period->status !== 'draft') {
            return back()->with('error', 'Only draft payrolls can be approved.');
        }

        DB::beginTransaction();
        try {
            $period->update([
                'status' => 'approved',
                'approved_by' => auth()->id(),
                'approved_at' => now(),
            ]);

            // Lock all records
            $period->payrollRecords()->update([
                'is_editable' => false,
                'status' => 'approved',
            ]);

            DB::commit();

            activity()
                ->performedOn($period)
                ->causedBy(auth()->user())
                ->withProperties([
                    'period_name' => $period->period_name,
                    'total_employees' => $period->total_employees,
                    'total_net' => $period->total_net,
                ])
                ->log('payroll_approved');

            return back()->with('success', 'Payroll approved successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Failed to approve payroll: ' . $e->getMessage());
        }
    }

    /**
     * Mark payroll as paid
     */
    public function markPaid(PayrollPeriod $period)
    {
        if ($period->status !== 'approved') {
            return back()->with('error', 'Only approved payrolls can be marked as paid.');
        }

        DB::beginTransaction();
        try {
            $period->update([
                'status' => 'paid',
                'payment_date' => now(),
            ]);

            $period->payrollRecords()->update([
                'status' => 'paid',
            ]);

            DB::commit();

            activity()
                ->performedOn($period)
                ->causedBy(auth()->user())
                ->withProperties([
                    'period_name' => $period->period_name,
                    'payment_date' => $period->payment_date->format('Y-m-d'),
                ])
                ->log('payroll_paid');

            return back()->with('success', 'Payroll marked as paid.');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Failed to mark as paid: ' . $e->getMessage());
        }
    }

    /**
     * Export payroll data as CSV
     */
    public function export(PayrollPeriod $period)
    {
        $filename = 'payroll_' . str_replace(' ', '_', $period->period_name) . '_' . now()->format('Y-m-d') . '.csv';
        return Excel::download(new PayrollExport($period), $filename, \Maatwebsite\Excel\Excel::CSV);
    }

    /**
     * Export all employee payslips as ZIP
     */
    public function exportPayslips(PayrollPeriod $period)
    {
        // Get all payroll records with employee details
        $records = $period->payrollRecords()
            ->with(['employee.company', 'employee.department', 'employee.position'])
            ->get();

        if ($records->isEmpty()) {
            return back()->with('error', 'No payroll records found for this period.');
        }

        // Create a temporary directory for PDFs
        $tempDir = storage_path('app/temp/payslips_' . time());
        if (!file_exists($tempDir)) {
            mkdir($tempDir, 0755, true);
        }

        // Generate PDF for each employee
        foreach ($records as $record) {
            // Construct full name
            if ($record->employee) {
                $record->employee->full_name = trim(
                    $record->employee->first_name . ' ' . 
                    ($record->employee->middle_name ? $record->employee->middle_name . ' ' : '') . 
                    $record->employee->last_name
                );
            }

            $pdf = Pdf::loadView('payslips.payslip', [
                'period' => $period,
                'record' => $record,
            ]);

            $filename = str_replace(' ', '_', $record->employee->full_name) . '.pdf';
            $pdf->save($tempDir . '/' . $filename);
        }

        // Create ZIP file
        $zipFilename = 'Payslips_' . str_replace(' ', '_', $period->period_name) . '_' . now()->format('Y-m-d') . '.zip';
        $zipPath = storage_path('app/temp/' . $zipFilename);

        $zip = new \ZipArchive();
        if ($zip->open($zipPath, \ZipArchive::CREATE | \ZipArchive::OVERWRITE) === TRUE) {
            // Add all PDF files to ZIP
            $files = glob($tempDir . '/*.pdf');
            foreach ($files as $file) {
                $zip->addFile($file, basename($file));
            }
            $zip->close();
        }

        // Clean up temporary PDF files
        array_map('unlink', glob($tempDir . '/*.pdf'));
        rmdir($tempDir);

        // Download ZIP file and then delete it
        return response()->download($zipPath)->deleteFileAfterSend(true);
    }

    /**
     * Export individual payslip as PDF
     */
    public function exportPdf($periodId, $recordId)
    {
        $period = PayrollPeriod::findOrFail($periodId);
        
        // Get PayrollRecord
        $record = PayrollRecord::with(['employee.company', 'employee.department', 'employee.position'])
            ->findOrFail($recordId);

        // Construct full name
        if ($record->employee) {
            $record->employee->full_name = trim(
                $record->employee->first_name . ' ' . 
                ($record->employee->middle_name ? $record->employee->middle_name . ' ' : '') . 
                $record->employee->last_name
            );
        }

        $pdf = Pdf::loadView('payslips.payslip', [
            'period' => $period,
            'record' => $record,
        ]);

        $filename = 'Payslip_' . str_replace(' ', '_', $record->employee->full_name) . '_' . str_replace(' ', '_', $period->period_name) . '.pdf';
        
        return $pdf->download($filename);
    }

    /**
     * Delete payroll period
     */
    public function destroy(PayrollPeriod $period)
    {
        if ($period->status !== 'draft') {
            return back()->with('error', 'Only draft payrolls can be deleted.');
        }

        DB::beginTransaction();
        try {
            $periodName = $period->period_name;
            $period->delete();

            DB::commit();

            activity()
                ->causedBy(auth()->user())
                ->withProperties([
                    'period_name' => $periodName,
                ])
                ->log('payroll_deleted');

            return redirect()->route('payroll.index')
                ->with('success', 'Payroll period deleted successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Failed to delete payroll: ' . $e->getMessage());
        }
    }

    /**
     * Get payroll periods as JSON (for API/AJAX requests)
     */
    public function getPeriods(Request $request)
    {
        $periods = PayrollPeriod::query()
            ->select(['period_id', 'period_name', 'date_from', 'date_to', 'payment_date', 'status'])
            ->when($request->status, function ($query, $status) {
                $query->where('status', $status);
            })
            ->orderBy('date_from', 'desc')
            ->get();

        return response()->json([
            'periods' => $periods,
        ]);
    }
}
