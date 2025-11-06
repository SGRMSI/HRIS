<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * @property int $holiday_id
 * @property string $name
 * @property \Carbon\Carbon $date
 * @property string $type
 * @property int|null $company_id
 * @property \Carbon\Carbon $created_at
 * @property \Carbon\Carbon $updated_at
 */
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
        return $this->belongsTo(Company::class, 'company_id', 'company_id');
    }
}
