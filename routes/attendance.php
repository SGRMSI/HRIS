<?php

use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\AttendanceFinalController;
use App\Http\Controllers\AttendanceRawController;
use App\Http\Controllers\AttendanceProcessedController;
use App\Http\Controllers\ShiftController;
use App\Http\Controllers\EmployeeScheduleController;
use App\Http\Controllers\HolidayController;
use App\Http\Controllers\EmployeeLeaveController;
use Illuminate\Support\Facades\Route;

// Attendance Management Routes
Route::middleware(['auth', 'verified'])->prefix('attendance')->name('attendance.')->group(function () {
    
    // Upload & Import
    Route::get('upload', [AttendanceController::class, 'upload'])->name('upload');
    Route::post('import', [AttendanceController::class, 'import'])->name('import');
    
    // Raw Attendance Records
    Route::prefix('raw')->name('raw.')->group(function () {
        Route::get('/', [AttendanceRawController::class, 'index'])->name('index');
        Route::get('export', [AttendanceRawController::class, 'export'])->name('export');
    });
    
    // Processed Attendance
    Route::prefix('processed')->name('processed.')->group(function () {
        Route::get('/', [AttendanceProcessedController::class, 'index'])->name('index');
        Route::post('process/{batch}', [AttendanceProcessedController::class, 'process'])->name('process');
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
        Route::get('{leave}', [EmployeeLeaveController::class, 'show'])->name('show');
        Route::get('{leave}/edit', [EmployeeLeaveController::class, 'edit'])->name('edit');
        Route::put('{leave}', [EmployeeLeaveController::class, 'update'])->name('update');
        Route::delete('{leave}', [EmployeeLeaveController::class, 'destroy'])->name('destroy');
        Route::post('{leave}/approve', [EmployeeLeaveController::class, 'approve'])->name('approve');
        Route::post('{leave}/cancel', [EmployeeLeaveController::class, 'cancel'])->name('cancel');
    });
});