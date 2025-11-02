<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AttendanceUploadBatch extends Model
{
    protected $table = 'attendance_upload_batches';
    protected $primaryKey = 'batch_id';

    protected $fillable = [
        'file_name',
        'uploaded_by',
        'uploaded_at',
        'total_records',
        'status',
        'remarks',
    ];

    protected $casts = [
        'uploaded_at' => 'datetime',
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

    public function uploader()
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }
}
