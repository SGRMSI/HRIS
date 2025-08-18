<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Account extends Model
{
    protected $primaryKey = 'account_id';
    protected $fillable = ['company_id', 'name', 'active'];

    public function company() { return $this->belongsTo(Company::class, 'company_id'); }
    public function employees() { return $this->hasMany(Employee::class, 'account_id'); }
}

