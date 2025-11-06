<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Holiday extends Model
{
    protected $primaryKey = 'holiday_id';
    public $timestamps = true;

    protected $fillable = [
        'name',
        'date',
        'type',
        'company_id',
    ];

    protected $casts = [
        'date' => 'date',
        'created_at' => 'datetime',
    ];

    /**
     * Get the route key for the model.
     *
     * @return string
     */
    public function getRouteKeyName()
    {
        return 'holiday_id';
    }

    // Relationships
    public function company()
    {
        return $this->belongsTo(Company::class, 'company_id');
    }
}
