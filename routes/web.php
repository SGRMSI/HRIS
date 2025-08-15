<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\UserController;

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
    Route::delete('user/{user}', [UserController::class, 'destroy'])->name('user.destroy');
});
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('employee', function () {
        return Inertia::render('employee');
    })->name('employee');
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
