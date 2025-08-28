<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Company extends Model
{
    use HasFactory;

    protected $primaryKey = 'company_id';

    protected $fillable = [
        'name',
        'industry',
    ];

    /**
     * Get the route key for the model.
     */
    public function getRouteKeyName(): string
    {
        return 'company_id';
    }

    /**
     * Get the departments for the company.
     */
    public function departments(): HasMany
    {
        return $this->hasMany(Department::class, 'company_id');
    }

    /**
     * Get the positions for the company.
     */
    public function positions(): HasMany
    {
        return $this->hasMany(Position::class, 'company_id');
    }

    /**
     * Get the accounts for the company.
     */
    public function accounts(): HasMany
    {
        return $this->hasMany(Account::class, 'company_id');
    }

    /**
     * Get the employees for the company.
     */
    public function employees(): HasMany
    {
        return $this->hasMany(Employee::class, 'company_id');
    }
}

