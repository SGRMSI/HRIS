<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EmployeeDocument extends Model
{
    protected $primaryKey = 'document_id';
    protected $fillable = [
        'employee_id','file_name','file_type','file_path','category',
        'uploaded_by','uploaded_at','remarks'
    ];

    public function employee() { return $this->belongsTo(Employee::class, 'employee_id'); }
    public function uploader() { return $this->belongsTo(User::class, 'uploaded_by'); }
}

