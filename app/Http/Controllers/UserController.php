<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class UserController extends Controller
{
    public function index()
    {
        $users = User::with('role')->get()->map(function ($user) {
            return [
                'id' => $user->user_id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role ? $user->role->label : 'No Role',
                'is_active' => $user->is_active,
                'created_at' => $user->created_at->format('M d, Y'),
            ];
        });

        return Inertia::render('user', [
            'users' => $users
        ]);
    }

    public function create()
    {
        $roles = Role::all()->map(function ($role) {
            return [
                'value' => $role->role_id,
                'label' => $role->label,
            ];
        });

        return Inertia::render('user/create', [
            'roles' => $roles
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
            'role_id' => 'required|exists:roles,role_id',
            'is_active' => 'boolean',
        ]);

        User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role_id' => $validated['role_id'],
            'is_active' => $validated['is_active'] ?? true,
        ]);

        return redirect()->route('user.index')->with('success', 'User created successfully!');
    }
}
