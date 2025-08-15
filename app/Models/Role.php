<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Role extends Model
{
    protected $table = 'roles';
    protected $primaryKey = 'role_id';
    
    protected $fillable = [
        'name',
        'label',
    ];

    /**
     * Get the users for the role.
     */
    public function users(): HasMany
    {
        return $this->hasMany(User::class, 'role_id', 'role_id');
    }
}
