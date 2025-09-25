# HRIS Setup Guide

This document provides step-by-step instructions for setting up the Human Resource Information System (HRIS) on your local development environment.

## Prerequisites

- PHP 8.1 or higher
- Composer
- Node.js and npm
- SQLite (or MySQL/PostgreSQL if configured differently)
- XAMPP, WAMP, or similar local server environment
- Git

## Step 1: Clone the Repository

```bash
git clone https://github.com/SGRMSI/HRIS.git
cd HRIS
```

## Step 2: Install PHP Dependencies

```bash
composer install
```

## Step 3: Set Up Environment Variables

Create a `.env` file by copying the example:

```bash
cp .env.example .env
```

Generate an application key:

```bash
php artisan key:generate
```

## Step 4: Configure Database

The project is currently configured to use SQLite. Make sure the database file exists:

```bash
touch database/database.sqlite
```

Update your `.env` file with the database configuration:

```
DB_CONNECTION=sqlite
DB_DATABASE=/absolute/path/to/HRIS/database/database.sqlite
```

## Step 5: Run Migrations

Apply database migrations to create the necessary tables:

```bash
php artisan migrate
```

Optionally, seed the database with sample data:

```bash
php artisan db:seed
```

## Step 6: Set Up Storage

### Private File Storage

Create required directories with proper permissions:

```bash
mkdir -p storage/app/private/employee_documents
chmod -R 755 storage/app/private
chmod -R 755 storage bootstrap/cache
```

On Windows, ensure these directories exist and have proper permissions through File Explorer.

### Storage Configuration

Verify that your `config/filesystems.php` has the correct configuration for the 'local' disk:

```php
'local' => [
    'driver' => 'local',
    'root' => storage_path('app/private'),  // Points directly to private folder
    'serve' => true,
    'throw' => false,
    'report' => false,
],
```

### Important Notes

- Employee documents are stored EXCLUSIVELY in the private storage area
- DO NOT use the public storage area for any document files
- No symbolic link is required for document storage since we don't use public URLs
- When storing or retrieving files, the path should be relative to the disk root (without 'private/' prefix)
- Example file path: `employee_documents/CompanyName/EmployeeID/FileName.pdf`

### Diagnostics

To verify your storage setup is working correctly, try uploading a test document through the application interface. 

You can also check the Laravel logs in `storage/logs/laravel.log` for any errors related to file storage operations.

## Step 7: Install Frontend Dependencies

```bash
npm install
```

## Step 8: Build Frontend Assets

For development:

```bash
npm run dev
```

For production:

```bash
npm run build
```

## Step 9: Serve the Application

Using Laravel's built-in server:

```bash
php artisan serve
```

Using XAMPP/WAMP:
- Place the project in the `htdocs` or `www` folder
- Access via `http://localhost/HRIS/public`

## Key Features and Usage

### Document Management System

The system includes a document management feature that:
- Organizes files by company and employee ID
- Supports PDF uploads with categorization
- Allows viewing documents directly in the browser
- Provides document deletion with confirmation

Files are stored in:
```
storage/app/public/employee_documents/{CompanyName}/{EmployeeID}/
```

### Database Structure

Key models:
- `User`: System users with authentication
- `Employee`: Employee records with personal and employment details
- `Company`, `Department`, `Position`: Organizational structure
- `EmployeeDocument`: Document records linked to employees

### Recent Updates

1. **Improved Document Storage Organization**:
   - Files organized by company name and employee ID
   - Filenames include employee ID for better tracking

2. **Enhanced Document Management UI**:
   - View documents in browser instead of downloading
   - Confirmation dialogs for document deletion
   - Improved table display with proper formatting

3. **Fixed Issues**:
   - Infraction counter now starts from 0
   - Document deletion properly handles file removal
   - CSRF token protection added for secure operations

## Troubleshooting

### Storage Issues

If uploaded files are not accessible:
- Check private directory exists: `mkdir -p storage/app/private`
- Check directory permissions: `chmod -R 755 storage`
- For development, you may need: `chmod -R 775 storage/app/private` 
- Make sure your web server has the proper permissions to write to the storage directory

### Database Issues

If you encounter database errors:
- Check database connection in `.env`
- Ensure SQLite file has write permissions
- Run `php artisan migrate:fresh` to reset and rebuild the database (warning: this removes all data)

### Server Configuration

For XAMPP/WAMP users:
- Update `httpd-vhosts.conf` to add a virtual host for easier access
- Ensure `mod_rewrite` is enabled for proper URL routing

## Contributors

- Original development: SGRMSI team
- Document management system: Added in September 2025

## Contact

For any issues or questions, contact the development team via your internal communication channels.
