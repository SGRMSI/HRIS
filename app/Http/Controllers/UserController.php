<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
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
}
