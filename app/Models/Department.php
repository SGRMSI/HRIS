<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Department extends Model
{
    protected $primaryKey = 'department_id';
    protected $fillable = ['company_id', 'name'];

    public function company() { return $this->belongsTo(Company::class, 'company_id'); }
    public function employees() { return $this->hasMany(Employee::class, 'department_id'); }
}

