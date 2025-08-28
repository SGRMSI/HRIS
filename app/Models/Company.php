<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Company extends Model
{
    protected $primaryKey = 'company_id';
    protected $fillable = ['name', 'industry']; 

    public function departments() { return $this->hasMany(Department::class, 'company_id'); }
    public function positions() { return $this->hasMany(Position::class, 'company_id'); }
    public function accounts() { return $this->hasMany(Account::class, 'company_id'); }
    public function employees() { return $this->hasMany(Employee::class, 'company_id'); }
}

