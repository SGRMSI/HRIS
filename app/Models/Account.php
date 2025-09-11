<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;


class Account extends Model
{
     use HasFactory;

    protected $primaryKey = 'account_id';

    protected $fillable = [
        'name',
        'active',
    ];

    public function company()
    {
        return $this->belongsTo(Company::class, 'company_id');
    }

    public function employees()
    {
        return $this->hasMany(Employee::class, 'account_id');
    }
}

