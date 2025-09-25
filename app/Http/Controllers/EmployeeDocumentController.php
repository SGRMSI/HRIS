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
            
            // For local development, ensure the storage directory exists
            $storagePath = storage_path('app/public/' . $relativePath);
            if (!file_exists($storagePath)) {
                mkdir($storagePath, 0755, true);
            }
            
            // Store in the company/employee folder using the public disk
            $path = $file->storeAs(
                $relativePath, 
                $fileName, 
                'public'
            );

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
            // Get the file path
            $filePath = $document->file_path;
            
            // First delete the record from the database
            $document->delete();
            
            // Then try to delete the file if it exists
            if (Storage::disk('public')->exists($filePath)) {
                Storage::disk('public')->delete($filePath);
            }
            
            return Redirect::back()->with('success', 'Document deleted successfully.');
        } catch (\Exception $e) {
            return Redirect::back()->with('error', 'Error deleting document: ' . $e->getMessage());
        }
    }
    
    /**
     * Download a document
     */
    public function download(EmployeeDocument $document)
    {
        // Check if file exists using the public disk
        if (Storage::disk('public')->exists($document->file_path)) {
            // Generate file path for download
            $filePath = storage_path('app/public/' . $document->file_path);
            
            // Make sure the file exists on disk
            if (file_exists($filePath)) {
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
    }
    
    /**
     * View a document (display inline)
     */
    public function view(EmployeeDocument $document)
    {
        // Check if file exists using the public disk
        if (Storage::disk('public')->exists($document->file_path)) {
            // Generate file path for viewing
            $filePath = storage_path('app/public/' . $document->file_path);
            
            // Make sure the file exists on disk
            if (file_exists($filePath)) {
                return response()->file(
                    $filePath, 
                    [
                        'Content-Type' => 'application/pdf',
                        'Content-Disposition' => 'inline; filename="' . $document->file_name . '"',
                    ]
                );
            }
        } else {
            // Log error for debugging
            \Log::error('Document file not found', [
                'document_id' => $document->document_id,
                'file_path' => $document->file_path,
                'full_path' => storage_path('app/public/' . $document->file_path)
            ]);
        }
        
        return Redirect::back()->with('error', 'File not found.');
    }
}
