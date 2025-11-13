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
    public function handleProfilePictureUpload(?UploadedFile $file, ?string $employeeIdNumber = null, ?string $companyName = null): ?string
    {
        if (!$file) {
            return null;
        }

        // If employee ID and company provided, store in organized structure
        if ($employeeIdNumber && $companyName) {
            // Sanitize company name for folder
            $sanitizedCompany = str_replace(' ', '_', $companyName);
            
            // Store in private disk: employee_documents/{company}/{employee_id}/profile_picture/
            $relativePath = 'employee_documents/' . $sanitizedCompany . '/' . $employeeIdNumber . '/profile_picture';
            
            \Log::info('Creating profile picture directory structure', [
                'company' => $companyName,
                'sanitized_company' => $sanitizedCompany,
                'employee_id' => $employeeIdNumber,
                'relative_path' => $relativePath,
                'storage_path' => storage_path('app/' . $relativePath),
            ]);
            
            // Create directory if it doesn't exist
            if (!Storage::disk('local')->exists($relativePath)) {
                \Log::info('Directory does not exist, creating it');
                Storage::disk('local')->makeDirectory($relativePath);
            } else {
                \Log::info('Directory already exists');
            }
            
            // Generate unique filename
            $extension = $file->getClientOriginalExtension();
            $filename = 'profile_' . time() . '.' . $extension;
            
            \Log::info('Storing file', ['filename' => $filename]);
            
            // Store the file
            $path = $file->storeAs($relativePath, $filename, 'local');
            
            \Log::info('File stored successfully', [
                'path' => $path,
                'full_path' => storage_path('app/' . $path),
            ]);
            
            return $path;
        }
        
        // Fallback: Generate unique filename and store in public disk
        $filename = time() . '_' . $file->getClientOriginalName();
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

        // Check if path is in private storage (contains 'employee_documents')
        if (strpos($picturePath, 'employee_documents') !== false) {
            return Storage::disk('local')->delete($picturePath);
        }

        // Otherwise, assume it's in public storage
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
        // If empty, return null
        if (empty($contactNumber)) {
            return null;
        }
        
        // Remove all non-numeric characters
        $cleaned = preg_replace('/[^0-9]/', '', $contactNumber);
        
        // If empty after cleaning, return null
        if (empty($cleaned)) {
            return null;
        }
        
        // Handle different length scenarios
        $length = strlen($cleaned);
        
        // If it's 10 digits (local number without country code)
        if ($length == 10) {
            // Format as +63 XXX XXX XXXX
            return '+63 ' . substr($cleaned, 0, 3) . ' ' . substr($cleaned, 3, 3) . ' ' . substr($cleaned, 6);
        }
        
        
        // If it's 11 digits and starts with 0 (local format with leading zero)
        if ($length == 11 && $cleaned[0] == '0') {
            // Remove leading zero and format as +63 XXX XXX XXXX
            return '+63 ' . substr($cleaned, 1, 3) . ' ' . substr($cleaned, 4, 3) . ' ' . substr($cleaned, 7);
        }
        
        // If it's 12 digits and starts with 63 (already has country code without +)
        if ($length == 12 && substr($cleaned, 0, 2) == '63') {
            // Format as +63 XXX XXX XXXX
            return '+63 ' . substr($cleaned, 2, 3) . ' ' . substr($cleaned, 5, 3) . ' ' . substr($cleaned, 8);
        }
        
        // If none of the above patterns match, try a generic approach
        if ($length >= 9) {
            // Take the last 10 digits and format them
            $lastTen = substr($cleaned, -10);
            if (strlen($lastTen) == 10) {
                return '+63 ' . substr($lastTen, 0, 3) . ' ' . substr($lastTen, 3, 3) . ' ' . substr($lastTen, 6);
            }
        }
        
        // If all else fails, just add +63 prefix to whatever number we have
        return '+63 ' . $cleaned;
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

    /**
     * Generate company prefix from company name
     * This creates a 2-3 letter prefix based on the company name
     */
    public function generateCompanyPrefix(string $companyName): string
    {
        // Remove special characters and extra spaces
        $cleanName = preg_replace('/[^a-zA-Z0-9\s]/', '', $companyName);
        $cleanName = trim(preg_replace('/\s+/', ' ', $cleanName));
        
        if (empty($cleanName)) {
            return 'EMP';
        }

        // Split into words
        $words = explode(' ', $cleanName);
        
        // Strategy 1: If single word, take first 2-3 letters
        if (count($words) === 1) {
            $prefix = strtoupper(substr($words[0], 0, 3));
            return strlen($prefix) >= 2 ? $prefix : $prefix . 'X';
        }
        
        // Strategy 2: If multiple words, take first letter of each word (up to 3)
        $prefix = '';
        foreach ($words as $word) {
            if (strlen($prefix) < 3 && !empty($word)) {
                $prefix .= strtoupper($word[0]);
            }
        }
        
        // If prefix is less than 2 characters, add first letters from first word
        if (strlen($prefix) < 2 && !empty($words[0])) {
            $prefix = strtoupper(substr($words[0], 0, 3 - strlen($prefix))) . $prefix;
        }
        
        return $prefix ?: 'EMP';
    }
}
