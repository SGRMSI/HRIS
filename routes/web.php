<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\UserController;
use App\Http\Controllers\EmployeeController;

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

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('employee', [EmployeeController::class, 'index'])->name('employee.index');
    Route::get('employee/create', [EmployeeController::class, 'create'])->name('employee.create');
    Route::post('employee', [EmployeeController::class, 'store'])->name('employee.store');
    Route::get('employee/{employee}', [EmployeeController::class, 'show'])->name('employee.show');
    Route::get('employee/{employee}/edit', [EmployeeController::class, 'edit'])->name('employee.edit');
    Route::put('employee/{employee}', [EmployeeController::class, 'update'])->name('employee.update');
    Route::delete('employee/{employee}', [EmployeeController::class, 'destroy'])->name('employee.destroy');
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('attendance', function () {
        return Inertia::render('attendance');
    })->name('attendance');
});
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('payroll', function () {
        return Inertia::render('payroll');
    })->name('payroll');
});
require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
