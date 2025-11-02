<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\UserController;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\CompanyController;
use App\Http\Controllers\DepartmentController;
use App\Http\Controllers\PositionController;
use App\Http\Controllers\AccountController;

Route::get('/', function () {
    return Inertia::render('auth/login' );
})->name('home');

Route::middleware(['auth', 'verified',])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');
});

Route::middleware(['auth', 'verified', 'admin'])->group(function () {
    Route::get('user', [UserController::class, 'index'])->name('user.index');
    Route::get('user/create', [UserController::class, 'create'])->name('user.create');
    Route::post('user', [UserController::class, 'store'])->name('user.store');
    Route::get('user/{user}/edit', [UserController::class, 'edit'])->name('user.edit');
    Route::put('user/{user}', [UserController::class, 'update'])->name('user.update');
    Route::delete('user/{user}', [UserController::class, 'destroy'])->name('user.destroy');
});

Route::middleware(['auth', 'verified', 'admin'])->group(function () {
    Route::get('company', [CompanyController::class, 'index'])->name('company.index');
    Route::get('company/create', [CompanyController::class, 'create'])->name('company.create');
    Route::post('company', [CompanyController::class, 'store'])->name('company.store');
    Route::get('company/{company}', [CompanyController::class, 'show'])->name('company.show');
    Route::get('company/{company}/edit', [  CompanyController::class, 'edit'])->name('company.edit');
    Route::put('company/{company}', [CompanyController::class, 'update'])->name('company.update');
    Route::delete('company/{company}', [CompanyController::class, 'destroy'])->name('company.destroy');
});

Route::middleware(['auth', 'verified', 'admin'])->group(function () {
    // Department management
    Route::prefix('company/{company}')->group(function () {
        Route::post('/department', [DepartmentController::class, 'store'])
            ->name('company.department.store');
        Route::delete('/department/{department}', [DepartmentController::class, 'destroy'])
            ->name('company.department.destroy');
    });
});

Route::middleware(['auth', 'verified', 'admin'])->group(function () {
    // Position management
    Route::prefix('company/{company}')->group(function () {
        Route::post('/position', [PositionController::class, 'store'])
            ->name('company.position.store');
        Route::delete('/position/{position}', [PositionController::class, 'destroy'])
            ->name('company.position.destroy');
    });
});

Route::middleware(['auth', 'verified', 'admin'])->group(function () {
    // Account management
    Route::prefix('company/{company}')->group(function () {
        // Add this new route
        Route::put('/account/{account}/toggle-status', [AccountController::class, 'toggleStatus'])
            ->name('company.account.toggle-status');
        
        // Existing routes
        Route::post('/account', [AccountController::class, 'store'])
            ->name('company.account.store');
        Route::delete('/account/{account}', [AccountController::class, 'destroy'])
            ->name('company.account.destroy');
    });
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('employee', [EmployeeController::class, 'index'])->name('employee.index');
    Route::get('employee/create', [EmployeeController::class, 'create'])->name('employee.create');
    Route::post('employee', [EmployeeController::class, 'store'])->name('employee.store');
    Route::get('employee/{employee}', [EmployeeController::class, 'show'])->name('employee.show');
    Route::get('employee/{employee}/edit', [EmployeeController::class, 'edit'])->name('employee.edit');
    Route::put('employee/{employee}', [EmployeeController::class, 'update'])->name('employee.update');
    Route::delete('employee/{employee}', [EmployeeController::class, 'destroy'])->name('employee.destroy');
    
    // Import CSV route
Route::post('/employee/import', [EmployeeController::class, 'importCsv'])->name('employee.import');
    // Employee Documents routes with additional authorization
    Route::middleware(['auth', 'verified'])->group(function () {
        // Only authenticated users can upload, delete, download, or view documents
        Route::post('employee/{employee}/documents', [\App\Http\Controllers\EmployeeDocumentController::class, 'store'])->name('employee.documents.store');
        Route::delete('employee/documents/{document}', [\App\Http\Controllers\EmployeeDocumentController::class, 'destroy'])->name('employee.documents.destroy');
        Route::get('employee/documents/{document}/download', [\App\Http\Controllers\EmployeeDocumentController::class, 'download'])->name('employee.documents.download');
        Route::get('employee/documents/{document}/view', [\App\Http\Controllers\EmployeeDocumentController::class, 'view'])->name('employee.documents.view');
    });
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('payroll', function () {
        return Inertia::render('payroll');
    })->name('payroll');
});

require __DIR__.'/attendance.php';
require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
