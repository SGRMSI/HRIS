<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('auth/login' );
})->name('home');

Route::middleware(['auth', 'verified',])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');
});

Route::middleware(['auth', 'verified', 'admin'])->group(function () {
    Route::get('user', function () {
        return Inertia::render('user');
    })->name('user');
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
