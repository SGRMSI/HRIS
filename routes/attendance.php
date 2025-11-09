<?php

use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\AttendanceFinalController;
use App\Http\Controllers\AttendanceRawController;
use App\Http\Controllers\AttendanceProcessedController;
use App\Http\Controllers\ShiftController;
use App\Http\Controllers\EmployeeScheduleController;
use App\Http\Controllers\HolidayController;
use App\Http\Controllers\EmployeeLeaveController;
use App\Http\Controllers\EmployeeOvertimeController;
use Illuminate\Support\Facades\Route;

// Attendance Management Routes
Route::middleware(['auth', 'verified'])->prefix('attendance')->name('attendance.')->group(function () {
    
    // Upload & Import (moved to AttendanceRawController)
    Route::post('import', [AttendanceRawController::class, 'import'])->name('import');
    
    // Raw Attendance Records
    Route::prefix('raw')->name('raw.')->group(function () {
        Route::get('/', [AttendanceRawController::class, 'index'])->name('index');
        Route::get('{batch}', [AttendanceRawController::class, 'show'])->name('show');
        Route::get('{batch}/export', [AttendanceRawController::class, 'export'])->name('export');
        Route::delete('{batch}', [AttendanceRawController::class, 'destroy'])->name('destroy');
    });
    
        // Processed Attendance
    Route::prefix('processed')->name('processed.')->group(function () {
        Route::get('/', [AttendanceProcessedController::class, 'index'])->name('index');
        Route::post('process/{batch:batch_id}', [AttendanceProcessedController::class, 'process'])->name('process');
        Route::post('reprocess', [AttendanceProcessedController::class, 'reprocess'])->name('reprocess');
        Route::post('finalize/{batch:batch_id}', [AttendanceProcessedController::class, 'finalize'])->name('finalize');
    });
    
    // Final Attendance Records
    Route::prefix('final')->name('final.')->group(function () {
        Route::get('/', [AttendanceFinalController::class, 'index'])->name('index');
        Route::get('{attendance}', [AttendanceFinalController::class, 'show'])->name('show');
        Route::put('{attendance}', [AttendanceFinalController::class, 'update'])->name('update');
        Route::post('bulk-approve', [AttendanceFinalController::class, 'bulkApprove'])->name('bulk-approve');
        Route::get('export', [AttendanceFinalController::class, 'export'])->name('export');
    });
    
    // Shifts Management
    Route::resource('shifts', ShiftController::class)->except(['show']);
    
    // Employee Schedules
    Route::prefix('schedules')->name('schedules.')->group(function () {
        Route::get('/', [EmployeeScheduleController::class, 'index'])->name('index');
        Route::get('create', [EmployeeScheduleController::class, 'create'])->name('create');
        Route::post('/', [EmployeeScheduleController::class, 'store'])->name('store');
        Route::get('employees/{company}', [EmployeeScheduleController::class, 'getEmployeesByCompany'])->name('employees');
        Route::get('{schedule}/edit', [EmployeeScheduleController::class, 'edit'])->name('edit');
        Route::put('{schedule}', [EmployeeScheduleController::class, 'update'])->name('update');
        Route::delete('{schedule}', [EmployeeScheduleController::class, 'destroy'])->name('destroy');
        Route::post('bulk', [EmployeeScheduleController::class, 'bulkUpdate'])->name('bulk');
    });
    
    // Holidays Management
    Route::prefix('holidays')->name('holidays.')->group(function () {
        Route::get('/', [HolidayController::class, 'index'])->name('index');
        Route::get('create', [HolidayController::class, 'create'])->name('create');
        Route::post('/', [HolidayController::class, 'store'])->name('store');
        Route::get('{holiday}/edit', [HolidayController::class, 'edit'])->name('edit');
        Route::put('{holiday}', [HolidayController::class, 'update'])->name('update');
        Route::delete('{holiday}', [HolidayController::class, 'destroy'])->name('destroy');
        Route::post('import', [HolidayController::class, 'bulkImport'])->name('import');
        Route::get('export', [HolidayController::class, 'export'])->name('export');
    });
    
    // Leave Management
    Route::prefix('leaves')->name('leaves.')->group(function () {
        Route::get('/', [EmployeeLeaveController::class, 'index'])->name('index');
        Route::get('create', [EmployeeLeaveController::class, 'create'])->name('create');
        Route::post('/', [EmployeeLeaveController::class, 'store'])->name('store');
        Route::get('employees/{company}', [EmployeeLeaveController::class, 'getEmployeesByCompany'])->name('employees');
        Route::get('{leave}', [EmployeeLeaveController::class, 'show'])->name('show');
        Route::get('{leave}/download', [EmployeeLeaveController::class, 'downloadDocument'])->name('download');
        Route::get('{leave}/edit', [EmployeeLeaveController::class, 'edit'])->name('edit');
        Route::put('{leave}', [EmployeeLeaveController::class, 'update'])->name('update');
        Route::delete('{leave}', [EmployeeLeaveController::class, 'destroy'])->name('destroy');
        Route::post('approve', [EmployeeLeaveController::class, 'approve'])->name('approve');
        Route::post('cancel', [EmployeeLeaveController::class, 'cancel'])->name('cancel');
    });

    // Overtime Management
    Route::prefix('overtimes')->name('overtimes.')->group(function () {
        Route::get('/', [EmployeeOvertimeController::class, 'index'])->name('index');
        Route::get('create', [EmployeeOvertimeController::class, 'create'])->name('create');
        Route::post('/', [EmployeeOvertimeController::class, 'store'])->name('store');
        Route::get('employees/{company}', [EmployeeOvertimeController::class, 'getEmployeesByCompany'])->name('employees');
        Route::get('{overtime}', [EmployeeOvertimeController::class, 'show'])->name('show');
        Route::get('{overtime}/download', [EmployeeOvertimeController::class, 'downloadDocument'])->name('download');
        Route::get('{overtime}/edit', [EmployeeOvertimeController::class, 'edit'])->name('edit');
        Route::put('{overtime}', [EmployeeOvertimeController::class, 'update'])->name('update');
        Route::delete('{overtime}', [EmployeeOvertimeController::class, 'destroy'])->name('destroy');
        Route::post('{overtime}/approve', [EmployeeOvertimeController::class, 'approve'])->name('approve');
        Route::post('{overtime}/reject', [EmployeeOvertimeController::class, 'reject'])->name('reject');
        Route::post('{overtime}/cancel', [EmployeeOvertimeController::class, 'cancel'])->name('cancel');
    });
});