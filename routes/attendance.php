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

Route::middleware(['auth', 'verified'])->group(function () {
    // Attendance Upload
    Route::get('/attendance/upload', [AttendanceController::class, 'upload'])->name('attendance.upload');
    Route::post('/attendance/import', [AttendanceController::class, 'import'])->name('attendance.import');

    // Raw Attendance Records
    Route::get('/attendance/raw', [AttendanceRawController::class, 'index'])->name('attendance.raw.index');
    
    // Processed Attendance
    Route::get('/attendance/processed', [AttendanceProcessedController::class, 'index'])->name('attendance.processed.index');
    Route::post('/attendance/process/{batch}', [AttendanceProcessedController::class, 'process'])->name('attendance.processed.process');

    // Final Attendance
    Route::get('/attendance', [AttendanceFinalController::class, 'index'])->name('attendance.index');
    Route::put('/attendance/{attendance}', [AttendanceFinalController::class, 'update'])
        ->name('attendance.update')
        ->middleware('can:edit attendances');
    Route::post('/attendance/{attendance}/approve', [AttendanceFinalController::class, 'approve'])
        ->name('attendance.approve')
        ->middleware('can:approve attendances');
    Route::post('/attendance/bulk-approve', [AttendanceFinalController::class, 'bulkApprove'])
        ->name('attendance.bulk-approve')
        ->middleware('can:approve attendances');

    // Shifts
    Route::resource('shifts', ShiftController::class);

    // Schedules
    Route::resource('schedules', EmployeeScheduleController::class);
    Route::post('/schedules/bulk', [EmployeeScheduleController::class, 'bulkAssign'])->name('schedules.bulk');

    // Holidays
    Route::resource('holidays', HolidayController::class);

    // Leaves
    Route::resource('leaves', EmployeeLeaveController::class);
    Route::patch('/leaves/{leave}/status', [EmployeeLeaveController::class, 'updateStatus'])->name('leaves.status');
});