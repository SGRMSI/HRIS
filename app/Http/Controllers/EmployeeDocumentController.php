<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\EmployeeDocument;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;

class EmployeeDocumentController extends Controller
{
    /**
     * Upload a document for an employee
     */
    public function store(Request $request, Employee $employee)
    {
        $request->validate([
            'file' => 'required|mimes:pdf|max:10240', // Max 10MB, PDF only
            'category' => 'required|in:Government_Documents,Company_Documents,Infractions,Other',
            'remarks' => 'nullable|string|max:255',
        ]);
        
        // Load the company relationship
        $employee->load('company');

        if ($request->hasFile('file')) {
            $file = $request->file('file');
            
            // Get company name for folder organization
            $companyName = $employee->company ? str_replace(' ', '_', $employee->company->name) : 'No_Company';
            
            // Create a more organized filename with employee ID
            $fileName = 'EMP' . $employee->id_number . '_' . time() . '_' . $file->getClientOriginalName();
            
            // Create a more organized path structure: company/employee_id/
            $relativePath = 'employee_documents/' . $companyName . '/' . $employee->id_number;
            
            try {
                // First make sure the directory exists using Storage facade
                // This uses the local disk which is already configured to point to storage/app/private
                if (!Storage::disk('local')->exists($relativePath)) {
                    Storage::disk('local')->makeDirectory($relativePath);
                    \Log::info("Created directory using Storage facade: {$relativePath}");
                }
                
                // Store in the company/employee folder using the local disk
                $path = $file->storeAs(
                    $relativePath, 
                    $fileName, 
                    'local' // Using the local disk which points to private storage
                );
                
                \Log::info("File stored successfully at: {$path}");
            } catch (\Exception $e) {
                \Log::error("Error storing file: " . $e->getMessage());
                \Log::error("Exception trace: " . $e->getTraceAsString());
                return Redirect::back()->with('error', 'Failed to upload document: ' . $e->getMessage());
            }

            // Create document record
            $document = new EmployeeDocument([
                'employee_id' => $employee->employee_id,
                'file_name' => $file->getClientOriginalName(),
                'file_type' => $file->getClientMimeType(),
                'file_path' => $path,
                'category' => $request->category,
                'remarks' => $request->remarks,
                'uploaded_by' => Auth::id(),
                'uploaded_at' => now(),
            ]);

            $document->save();

            return Redirect::back()->with('success', 'Document uploaded successfully.');
        }

        return Redirect::back()->with('error', 'Failed to upload document.');
    }

    /**
     * Delete a document
     */
    public function destroy(EmployeeDocument $document)
    {
        try {
            \Log::info("Attempting to delete document: " . $document->document_id . ", Path: " . $document->file_path);
            
            // Get the file path
            $filePath = $document->file_path;
            
            // First delete the record from the database
            $document->delete();
            
            // Then try to delete the file if it exists
            if (Storage::disk('local')->exists($filePath)) {
                \Log::info("Deleting file: " . $filePath);
                Storage::disk('local')->delete($filePath);
            } else {
                \Log::warning("File not found for deletion: " . $filePath);
                
                // Check if the file exists in the old path format (with 'private/' prefix)
                $oldPath = str_replace('private/', '', $filePath);
                if (Storage::disk('local')->exists($oldPath)) {
                    \Log::info("Found file at old path, deleting: " . $oldPath);
                    Storage::disk('local')->delete($oldPath);
                }
            }
            
            return Redirect::back()->with('success', 'Document deleted successfully.');
        } catch (\Exception $e) {
            \Log::error("Error deleting document: " . $e->getMessage());
            \Log::error("Exception trace: " . $e->getTraceAsString());
            return Redirect::back()->with('error', 'Error deleting document: ' . $e->getMessage());
        }
    }
    
    /**
     * Download a document
     */
    public function download(EmployeeDocument $document)
    {
        try {
            \Log::info("Attempting to download document: " . $document->document_id . ", Path: " . $document->file_path);
            
            // Check if file exists using the local disk
            if (Storage::disk('local')->exists($document->file_path)) {
                // We can use the Storage::disk('local')->path() method to get the full path
                $filePath = Storage::disk('local')->path($document->file_path);
                
                \Log::info("File exists, serving for download: " . $filePath);
                
                return response()->download(
                    $filePath, 
                    $document->file_name, 
                    [
                        'Content-Type' => 'application/pdf',
                        'Content-Disposition' => 'attachment; filename="' . $document->file_name . '"',
                    ]
                );
            } else {
                \Log::warning("File not found on disk: " . $document->file_path);
                
                // Check if the file exists in the old path format (with 'private/' prefix)
                $oldPath = str_replace('private/', '', $document->file_path);
                if (Storage::disk('local')->exists($oldPath)) {
                    \Log::info("Found file at old path: " . $oldPath);
                    
                    $filePath = Storage::disk('local')->path($oldPath);
                    return response()->download(
                        $filePath, 
                        $document->file_name, 
                        [
                            'Content-Type' => 'application/pdf',
                            'Content-Disposition' => 'attachment; filename="' . $document->file_name . '"',
                        ]
                    );
                }
            }
            
            return Redirect::back()->with('error', 'File not found.');
        } catch (\Exception $e) {
            \Log::error("Error downloading file: " . $e->getMessage());
            \Log::error("Exception trace: " . $e->getTraceAsString());
            return Redirect::back()->with('error', 'Error downloading file: ' . $e->getMessage());
        }
    }
    
    /**
     * View a document (display inline)
     */
    public function view(EmployeeDocument $document)
    {
        try {
            \Log::info("Attempting to view document: " . $document->document_id . ", Path: " . $document->file_path);
            
            // Check if file exists using the local disk
            if (Storage::disk('local')->exists($document->file_path)) {
                // We can use the Storage::disk('local')->path() method to get the full path
                $filePath = Storage::disk('local')->path($document->file_path);
                
                \Log::info("File exists, serving for view: " . $filePath);
                
                return response()->file(
                    $filePath, 
                    [
                        'Content-Type' => 'application/pdf',
                        'Content-Disposition' => 'inline; filename="' . $document->file_name . '"',
                    ]
                );
            } else {
                // Log error for debugging
                \Log::warning("File not found at path: " . $document->file_path);
                
                // Check if the file exists in the old path format (with 'private/' prefix)
                $oldPath = str_replace('private/', '', $document->file_path);
                if (Storage::disk('local')->exists($oldPath)) {
                    \Log::info("Found file at old path: " . $oldPath);
                    
                    $filePath = Storage::disk('local')->path($oldPath);
                    return response()->file(
                        $filePath, 
                        [
                            'Content-Type' => 'application/pdf',
                            'Content-Disposition' => 'inline; filename="' . $document->file_name . '"',
                        ]
                    );
                }
                
                \Log::error('Document file not found', [
                    'document_id' => $document->document_id,
                    'file_path' => $document->file_path,
                    'storage_disk_root' => config('filesystems.disks.local.root')
                ]);
            }
            
            return Redirect::back()->with('error', 'File not found.');
        } catch (\Exception $e) {
            \Log::error("Error viewing file: " . $e->getMessage());
            \Log::error("Exception trace: " . $e->getTraceAsString());
            return Redirect::back()->with('error', 'Error viewing file: ' . $e->getMessage());
        }
    }
}
