<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AttendanceProcessed extends Model
{
    protected $table = 'attendance_processed';
    protected $primaryKey = 'processed_id';
    public $timestamps = false;

    protected $fillable = [
        'batch_id',
        'employee_id',
        'date',
        'clock_in',
        'clock_out',
        'break_in',
        'break_out',
        'break_minutes',
        'total_hours',
        'status',
        'status_message',
        'remarks',
        'meta',
    ];

    protected $casts = [
        'date' => 'date',
        'clock_in' => 'datetime',
        'clock_out' => 'datetime',
        'break_in' => 'datetime',
        'break_out' => 'datetime',
        'break_minutes' => 'integer',
        'total_hours' => 'decimal:2',
        'meta' => 'array',
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
