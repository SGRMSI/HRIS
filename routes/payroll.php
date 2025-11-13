<?php

use App\Http\Controllers\EmployeePayrollSettingsController;
use App\Http\Controllers\PayrollController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified'])->prefix('payroll')->name('payroll.')->group(function () {
    // Employee payroll settings (must be before /{period} route)
    Route::get('/employee-settings', [EmployeePayrollSettingsController::class, 'index'])->name('employee-settings.index');
    Route::get('/employee-settings/{employee:employee_id}/edit', [EmployeePayrollSettingsController::class, 'edit'])->name('employee-settings.edit');
    Route::put('/employee-settings/{employee:employee_id}', [EmployeePayrollSettingsController::class, 'update'])->name('employee-settings.update');
    
    // Payroll periods
    Route::get('/', [PayrollController::class, 'index'])->name('index');
    Route::get('/create', [PayrollController::class, 'create'])->name('create');
    Route::post('/', [PayrollController::class, 'store'])->name('store');
    Route::get('/{period}', [PayrollController::class, 'show'])->name('show');
    Route::delete('/{period}', [PayrollController::class, 'destroy'])->name('destroy');
    
    // Individual employee payroll
    Route::get('/{period}/records/{record}/edit', [PayrollController::class, 'edit'])->name('records.edit');
    Route::put('/{period}/records/{record}', [PayrollController::class, 'update'])->name('records.update');
    Route::post('/{period}/records/{record}/recalculate', [PayrollController::class, 'recalculate'])->name('records.recalculate');
    Route::get('/{period}/records/{record}/export-pdf', [PayrollController::class, 'exportPdf'])->name('records.export-pdf');
    
    // Payroll actions
    Route::post('/{period}/approve', [PayrollController::class, 'approve'])->name('approve');
    Route::post('/{period}/mark-paid', [PayrollController::class, 'markPaid'])->name('mark-paid');
    Route::get('/{period}/export', [PayrollController::class, 'export'])->name('export');
});
