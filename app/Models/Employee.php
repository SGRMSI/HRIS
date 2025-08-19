<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Employee extends Model
{
    use HasFactory;

    protected $primaryKey = 'employee_id';

    protected $fillable = [
        'id_number', 'first_name', 'last_name', 'middle_name', 'gender',
        'birth_date', 'age', 'civil_status', 'address', 'contact_number',
        'company_id', 'department_id', 'position_id', 'account_id',
        'sss_number', 'phic_number', 'hdmf_number', 'tin_number',
        'date_hired', 'date_regularized', 'employment_status',
        'remarks', 'profile_picture'
    ];

    protected $casts = [
        'birth_date' => 'date',
        'date_hired' => 'date',
        'date_regularized' => 'date',
        'date_separated' => 'date',
    ];

    public function company()
    {
        return $this->belongsTo(Company::class, 'company_id', 'company_id');
    }

    public function department()
    {
        return $this->belongsTo(Department::class, 'department_id', 'department_id');
    }

    public function position()
    {
        return $this->belongsTo(Position::class, 'position_id', 'position_id');
    }

    public function account()
    {
        return $this->belongsTo(Account::class, 'account_id', 'account_id');
    }

    public function getFullNameAttribute()
    {
        return trim($this->first_name . ' ' . ($this->middle_name ? $this->middle_name . ' ' : '') . $this->last_name);
    }
}

