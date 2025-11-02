<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AttendanceUploadBatch extends Model
{
    protected $table = 'attendance_upload_batches';
    protected $primaryKey = 'batch_id';

    protected $fillable = [
        'filename',
        'file_path',
        'total_rows',
        'processed_rows',
        'status',
        'remarks',
        'created_by',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // Relationships
    public function raws()
    {
        return $this->hasMany(AttendanceRaw::class, 'batch_id');
    }

    public function processed()
    {
        return $this->hasMany(AttendanceProcessed::class, 'batch_id');
    }

    public function uploadedBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
