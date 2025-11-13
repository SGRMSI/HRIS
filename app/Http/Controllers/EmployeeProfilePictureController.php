<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Services\EmployeeService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Facades\Storage;

class EmployeeProfilePictureController extends Controller
{
    protected $employeeService;

    public function __construct(EmployeeService $employeeService)
    {
        $this->employeeService = $employeeService;
    }

    /**
     * Upload or update employee profile picture
     */
    public function store(Request $request, Employee $employee)
    {
        $request->validate([
            'profile_picture' => 'required|image|mimes:png,jpg,jpeg|max:2048', // Max 2MB
        ]);

        // Load the company relationship
        $employee->load('company');

        if ($request->hasFile('profile_picture')) {
            // Delete old profile picture if exists
            if ($employee->profile_picture) {
                $this->employeeService->deleteProfilePicture($employee->profile_picture);
            }

            // Get company name for folder organization
            $companyName = $employee->company ? $employee->company->name : 'No_Company';
            
            \Log::info('Uploading profile picture for employee', [
                'employee_id' => $employee->employee_id,
                'id_number' => $employee->id_number,
                'company' => $companyName,
            ]);

            // Upload new profile picture to private storage
            $path = $this->employeeService->handleProfilePictureUpload(
                $request->file('profile_picture'),
                $employee->id_number,
                $companyName
            );
            
            \Log::info('Profile picture uploaded', ['path' => $path]);

            // Update employee record
            $employee->update([
                'profile_picture' => $path,
            ]);

            return Redirect::back()->with('success', 'Profile picture uploaded successfully.');
        }

        return Redirect::back()->with('error', 'Failed to upload profile picture.');
    }

    /**
     * View profile picture
     */
    public function view(Employee $employee)
    {
        if (!$employee->profile_picture) {
            abort(404, 'No profile picture found');
        }

        // Check if file exists in private storage
        if (Storage::disk('local')->exists($employee->profile_picture)) {
            $filePath = Storage::disk('local')->path($employee->profile_picture);
            
            return response()->file($filePath, [
                'Content-Type' => mime_content_type($filePath),
                'Content-Disposition' => 'inline',
            ]);
        }
        
        // Fallback: Check public storage
        if (Storage::disk('public')->exists($employee->profile_picture)) {
            $filePath = Storage::disk('public')->path($employee->profile_picture);
            
            return response()->file($filePath, [
                'Content-Type' => mime_content_type($filePath),
                'Content-Disposition' => 'inline',
            ]);
        }

        abort(404, 'Profile picture file not found');
    }

    /**
     * Delete profile picture
     */
    public function destroy(Employee $employee)
    {
        try {
            if (!$employee->profile_picture) {
                return Redirect::back()->with('error', 'No profile picture to delete.');
            }

            // Delete the file
            $this->employeeService->deleteProfilePicture($employee->profile_picture);

            // Update employee record
            $employee->update([
                'profile_picture' => null,
            ]);

            return Redirect::back()->with('success', 'Profile picture deleted successfully.');
        } catch (\Exception $e) {
            \Log::error("Error deleting profile picture: " . $e->getMessage());
            return Redirect::back()->with('error', 'Failed to delete profile picture.');
        }
    }
}
