# Document Management System Documentation

## Overview

The Document Management System allows HR staff to upload, view, and manage employee documents. The system organizes documents by company and employee ID, displays them in a well-formatted table, and provides easy access to view or delete documents.

## Features

- **Document Upload**: Upload PDF files up to 10MB
- **Document Organization**: Files stored by company and employee ID
- **Document Categorization**: Documents categorized as Government Documents, Company Documents, Infractions, or Other
- **Document Viewing**: View PDFs directly in browser
- **Document Management**: Delete documents with confirmation

## Storage Structure

Documents are stored securely in a structured format in private storage:
```
storage/app/private/employee_documents/{CompanyName}/{EmployeeID}/EMP{id}_{timestamp}_{filename}
```

For example:
```
storage/app/private/employee_documents/Tom_N_Toms/TNT002/EMPTNT002_1758795678_employee_contract.pdf
```

This private storage location is not directly accessible via URLs, adding an important layer of security for sensitive employee documents.

### Important Storage Configuration Note

The system uses Laravel's filesystem with the 'local' disk configured to point directly to the private storage area:

```php
// config/filesystems.php
'local' => [
    'driver' => 'local',
    'root' => storage_path('app/private'),  // Points directly to private folder
    'serve' => true,
    'throw' => false,
    'report' => false,
],
```

This means that when using `Storage::disk('local')`, the root is already set to `storage/app/private`. 
When storing or retrieving files, you don't need to include 'private/' in the path.

### Document Directory Structure

All documents are now exclusively stored in the private storage area. We no longer use the public storage area for documents, ensuring better security for sensitive employee files.

## Technical Implementation

### Database

The `employee_documents` table stores document metadata with these key fields:
- `document_id`: Primary key
- `employee_id`: Foreign key to employees table
- `file_name`: Original filename
- `file_path`: Path to stored file
- `category`: Document category (enum)
- `uploaded_by`: User ID who uploaded the document
- `remarks`: Optional notes about the document

### File Types

Currently, the system only accepts PDF files to ensure consistency and security.

### User Interface

The document system is integrated into two main pages:
- **Employee Profile View**: View documents and infraction count
- **Employee Edit View**: Upload, view, and manage documents

## Usage Instructions

### Uploading Documents

1. Navigate to an employee's profile
2. Click "Upload Document" button
3. Drag and drop a PDF or click to select
4. Select a category
5. Add optional remarks
6. Click "Upload File"

### Viewing Documents

1. Click the "View Document" icon next to any document in the list
2. The PDF will open in a new browser tab

### Deleting Documents

1. Click the trash icon next to any document
2. Confirm deletion when prompted

## Security

Files are stored securely in Laravel's private storage area (`storage/app/private`), ensuring they are not directly accessible via public URLs. All document access is controlled through proper authentication and authorization:

1. Files can only be accessed through specific controller routes
2. All document routes require authenticated users
3. Authorization checks ensure users can only access documents they are permitted to see
4. Files are served programmatically after permission checks rather than via direct URL access

## Important Notes

- The infraction counter on employee profiles will automatically update based on documents in the "Infractions" category
- Storage directories are created automatically when uploading the first document for a company or employee
- CSRF protection is implemented for secure document operations

## Troubleshooting

If document uploads fail:
1. Check storage permissions (should be at least 755)
2. Make sure the PDF is less than 10MB
3. Ensure the `storage/app/private` directory exists and is writable
4. Check Laravel logs at `storage/logs/laravel.log` for specific errors

If document viewing doesn't work:
1. Check browser PDF settings
2. Verify file exists in storage path
3. Run the diagnostic route at `/test-storage` to verify storage functionality
4. Check the file_path in the database to ensure it doesn't have duplicate 'private/' prefix
5. For Windows environments, check that path separators are handled correctly

### Path Troubleshooting

If you're having issues with file paths, verify:

1. The file_path stored in the database is relative to the disk root (`employee_documents/...`)
2. The system can properly resolve the full path with `Storage::disk('local')->path($relativePath)`
3. Permissions are set correctly on all directories in the path
4. The disk configuration in `config/filesystems.php` points to the correct location

## Future Enhancements

Planned improvements:
- Additional document types beyond PDF
- Document expiration tracking
- Advanced search and filtering
- Batch upload functionality
