<?php

use App\Http\Controllers\PayrollController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified'])->prefix('payroll')->name('payroll.')->group(function () {
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
    
    // Payroll actions
    Route::post('/{period}/approve', [PayrollController::class, 'approve'])->name('approve');
    Route::post('/{period}/mark-paid', [PayrollController::class, 'markPaid'])->name('mark-paid');
    Route::get('/{period}/export', [PayrollController::class, 'export'])->name('export');
});
