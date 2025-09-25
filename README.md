# HRIS - Human Resource Information System

## Document Storage Configuration

### Local Development Setup

Employee documents are stored in the `storage/app/public/employee_documents/{employee_id}` directory. To make these files accessible via the web, a symbolic link is created from `public/storage` to `storage/app/public`.

To set up document storage:

1. Run the storage:link command to create the symbolic link:
   ```bash
   php artisan storage:link
   ```

2. Make sure the storage directories are writable:
   ```bash
   chmod -R 775 storage
   chmod -R 775 public/storage
   ```

3. For Windows, ensure proper permissions on the directories.

### Production Configuration

For production environments, consider:

1. **Storage Configuration**: Update `config/filesystems.php` to use:
   - Local disk (default) - Files will be stored on the server's file system
   - S3/Azure/etc. - For cloud-based storage (requires additional configuration)

2. **File Size Limits**:
   - Update your PHP configuration (`php.ini`) settings for:
     - `upload_max_filesize` (default: 10MB for PDF documents)
     - `post_max_size` (should be larger than upload_max_filesize)
   - Update Nginx/Apache configuration if necessary

3. **Security**:
   - Documents are accessible via `/storage/employee_documents/{employee_id}/{filename}`
   - Access controls are handled at the application level

## Document Management Features

- Upload PDF documents for each employee
- Categorize documents (Government, Company, Infractions, Other)
- Download stored documents
- Track document upload metadata
- Automatic management of infractions count

## Maintenance

- Files are organized by employee ID to keep documents separate
- Regularly backup the `storage/app/public/employee_documents` directory
- Implement a cleanup policy for documents of former employees
