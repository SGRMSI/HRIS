<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AttendanceRaw extends Model
{
    protected $table = 'attendance_raws';
    protected $primaryKey = 'raw_id';
    public $timestamps = false;

    protected $fillable = [
        'batch_id',
        'employee_id',
        'ac_no',
        'name',
        'time_log',
        'state',
        'new_state',
        'exception',
        'operation',
    ];

    protected $casts = [
        'time_log' => 'datetime',
        'created_at' => 'datetime',
    ];

    // Relationships
    public function batch()
    {
        return $this->belongsTo(AttendanceUploadBatch::class, 'batch_id');
    }

    public function employee()
    {
        return $this->belongsTo(Employee::class, 'employee_id');
    }
}
