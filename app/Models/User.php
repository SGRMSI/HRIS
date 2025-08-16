<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class User extends Authenticatable
{
    protected $table = 'users';
    protected $primaryKey = 'user_id';
    
    protected $fillable = [
        'name',
        'email',
        'password',
        'employee_id',
        'role_id',
        'is_active',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
        'is_active' => 'boolean',
    ];
    
     public function getRouteKeyName()
    {
        return 'user_id';
    }
    /**
     * Get the role that belongs to the user.
     */
    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class, 'role_id', 'role_id');
    }
}