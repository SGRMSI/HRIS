<?php

namespace App\Services;

use Carbon\Carbon;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class EmployeeService
{
    /**
     * Create a new class instance.
     */
    public function __construct()
    {
        //
    }

    /**
     * Calculate age from birth date
     */
    public function calculateAge(string $birthDate): int
    {
        return Carbon::parse($birthDate)->age;
    }

    /**
     * Handle profile picture upload
     */
    public function handleProfilePictureUpload(?UploadedFile $file): ?string
    {
        if (!$file) {
            return null;
        }

        // Generate unique filename
        $filename = time() . '_' . $file->getClientOriginalName();
        
        // Store in public disk under employee_profiles directory
        $path = $file->storeAs('employee_profiles', $filename, 'public');
        
        return $path;
    }

    /**
     * Delete profile picture file
     */
    public function deleteProfilePicture(?string $picturePath): bool
    {
        if (!$picturePath) {
            return true;
        }

        return Storage::disk('public')->delete($picturePath);
    }

    /**
     * Prepare employee data for creation/update
     */
    public function prepareEmployeeData(array $validatedData): array
    {
        // Calculate age from birth_date
        if (isset($validatedData['birth_date'])) {
            $validatedData['age'] = $this->calculateAge($validatedData['birth_date']);
        }

        return $validatedData;
    }

    /**
     * Generate employee full name
     */
    public function generateFullName(string $firstName, ?string $middleName, string $lastName): string
    {
        return trim($firstName . ' ' . ($middleName ? $middleName . ' ' : '') . $lastName);
    }

    /**
     * Validate and format contact number
     */
    public function formatContactNumber(string $contactNumber): string
    {
        // Remove all non-numeric characters
        $cleaned = preg_replace('/[^0-9]/', '', $contactNumber);
        
        // Add +63 prefix if it's a Philippine number starting with 9
        if (strlen($cleaned) === 10 && substr($cleaned, 0, 1) === '9') {
            return '+63' . $cleaned;
        }
        
        // Add +63 prefix if it starts with 09
        if (strlen($cleaned) === 11 && substr($cleaned, 0, 2) === '09') {
            return '+63' . substr($cleaned, 1);
        }
        
        return $contactNumber; // Return original if doesn't match patterns
    }

    /**
     * Generate unique employee ID number
     */
    public function generateEmployeeId(string $companyPrefix): string
    {
        $lastEmployee = \App\Models\Employee::where('id_number', 'LIKE', $companyPrefix . '%')
            ->orderBy('id_number', 'desc')
            ->first();

        if (!$lastEmployee) {
            return $companyPrefix . '001';
        }

        // Extract the number part and increment
        $lastNumber = (int) substr($lastEmployee->id_number, strlen($companyPrefix));
        $newNumber = str_pad($lastNumber + 1, 3, '0', STR_PAD_LEFT);

        return $companyPrefix . $newNumber;
    }
}
