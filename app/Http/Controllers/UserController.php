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

    public function destroy(User $user)
    {
        try {
            // Prevent deleting yourself
            if ($user->user_id === auth()->user()->user_id) {
                return back()->with('error', 'You cannot delete yourself!');
            }

            $user->delete();

            return back()->with('success', 'User deleted successfully!');
        } catch (\Exception $e) {
            return back()->with('error', 'Failed to delete user. Please try again.');
        }
    }

public function edit(User $user)
    {
        $roles = Role::all()->map(function ($role) {
            return [
                'value' => $role->role_id,
                'label' => $role->label,
            ];
        });

        return Inertia::render('user/edit-user', [
            'user' => [
                'id' => $user->user_id,
                'name' => $user->name,
                'email' => $user->email,
                'role_id' => $user->role_id,
                'is_active' => $user->is_active,
            ],
            'roles' => $roles
        ]);
    }

    public function update(Request $request, User $user)
{
    try {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users')->ignore($user->user_id, 'user_id')],
            'password' => 'nullable|string|min:8|confirmed',
            'role_id' => 'required|exists:roles,role_id',
            'is_active' => 'boolean',
        ]);

        $updateData = [
            'name' => $validated['name'],
            'email' => $validated['email'],
            'role_id' => $validated['role_id'],
            'is_active' => $validated['is_active'] ?? $user->is_active,
        ];

        if (!empty($validated['password'])) {
            $updateData['password'] = Hash::make($validated['password']);
        }

        $user->update($updateData);

        return redirect()->route('user.index')->with('success', 'User updated successfully!');

    } catch (\Exception $e) {
        return back()->with('error', 'Failed to update user. Please try again.');
    }
}
}
