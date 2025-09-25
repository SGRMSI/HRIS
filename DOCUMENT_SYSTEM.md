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

Documents are stored in a structured format:
```
storage/app/public/employee_documents/{CompanyName}/{EmployeeID}/EMP{id}_{timestamp}_{filename}
```

For example:
```
storage/app/public/employee_documents/TomNToms/1001/EMP1001_1758795678_employee_contract.pdf
```

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

## Important Notes

- The infraction counter on employee profiles will automatically update based on documents in the "Infractions" category
- Storage directories are created automatically when uploading the first document for a company or employee
- CSRF protection is implemented for secure document operations

## Troubleshooting

If document uploads fail:
1. Check storage permissions
2. Verify symbolic link is created (`php artisan storage:link`)
3. Make sure the PDF is less than 10MB

If document viewing doesn't work:
1. Check browser PDF settings
2. Verify file exists in storage path

## Future Enhancements

Planned improvements:
- Additional document types beyond PDF
- Document expiration tracking
- Advanced search and filtering
- Batch upload functionality
