<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Position extends Model
{
    protected $primaryKey = 'position_id';
    protected $fillable = ['company_id', 'title'];

    public function company() { return $this->belongsTo(Company::class, 'company_id'); }
    public function employees() { return $this->hasMany(Employee::class, 'position_id'); }
}

