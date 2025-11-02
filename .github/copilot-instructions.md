# AI Agent Instructions for HRIS

## Project Overview
This is a Human Resource Information System built with Laravel and React (Inertia.js), focusing on employee document management, attendance tracking, and HR workflows.

## Architecture & Patterns

### Tech Stack
- Backend: Laravel 12.x (PHP 8.2+)
- Frontend: React with Inertia.js
- UI: TailwindCSS with ShadcnUI components
- Testing: Pest PHP
- Excel Handling: Laravel Excel
- Activity Logging: Spatie Activity Log

### Key Components
- `app/Models/` - Core domain models with relationship definitions
  - Base models: Employee, Document, Department, etc.
  - Attendance models: AttendanceUploadBatch, AttendanceRaw, AttendanceProcessed, etc.
  - Schedule models: Shift, EmployeeSchedule, Holiday, EmployeeLeave
- `app/Services/` - Business logic layer for complex operations
  - `EmployeeService` - Document and employee data handling
  - `AttendanceService` - Attendance processing and calculations
  - `ScheduleResolver` - Schedule and leave resolution

### Frontend Components Organization

#### Base UI Components (`resources/js/Components/ui/`)
- Based on ShadcnUI components
- Common patterns: button, card, input, table, etc.
- Should be reusable across all modules

#### Module Components (`resources/js/Components/{Module}/`)
- Module-specific reusable components
- Example for Attendance:
  - AttendanceRow - Common row display
  - StatusBadge - Status indicator badges
  - DateRangePicker - Date filtering
  - BatchCard - Upload batch display

#### Page Components (`resources/js/Pages/{Module}/`)
- Main page components following route structure
- Example for Attendance:
  - UploadPage.jsx - Upload form + batch list
  - RawIndex.jsx - Raw data display
  - ProcessedIndex.jsx - Processing interface
  - FinalIndex.jsx - Final attendance records
- `app/Http/Controllers/` - Request handlers following RESTful patterns
- `resources/js/` - React components and frontend logic

### File Storage Patterns

#### Employee Documents
- **Location:** `storage/app/public/employee_documents/{employee_id}/`
- **Access:** Public via symlink (requires `php artisan storage:link`)
- **Handler:** EmployeeService with standard categories
- **Security:** Application-level access control

#### Attendance Excel Files
- **Location:** `storage/app/attendance-imports/`
- **Access:** Private (not publicly accessible)
- **Handler:** AttendanceController with Laravel Excel
- **Retention:** Files stored with batch records for audit trail
- **Naming:** `{timestamp}_{original_filename}.xlsx`

## Development Workflow

### Setup Steps
1. Install PHP dependencies: `composer install`
2. Install Node dependencies: `npm install`
3. Setup storage symlink: `php artisan storage:link`
4. Set storage permissions: `chmod -R 775 storage public/storage`

### Development Commands
- `npm run dev` - Start Vite dev server
- `php artisan serve` - Start Laravel dev server
- `npm run lint` - Run ESLint
- `npm run format` - Run Prettier
- `npm run types` - TypeScript type checking

### Testing
- Uses Pest PHP for testing
- Run tests with `./vendor/bin/pest`
- Place feature tests in `tests/Feature/`
- Place unit tests in `tests/Unit/`

## Important Conventions
1. Document file size limits: 10MB max for PDFs
2. Service Layer Pattern: Complex business logic goes in Services/
3. TypeScript is enforced for all new React components
4. Use Radix UI components for consistent UI/UX

## Module Patterns

### Controllers Architecture

#### Implemented Controllers

1. **AttendanceController** (`app/Http/Controllers/AttendanceController.php`)
   - **Purpose:** Handle attendance file uploads and imports
   - **Methods:**
     - `upload()` - Display upload form with batch history
     - `import()` - Process Excel file upload, create batch, import raw data
   - **Features:**
     - File validation (Excel only, max 10MB)
     - Batch creation with metadata
     - Excel import via Laravel Excel
     - Activity logging
     - Transaction management

2. **AttendanceRawController** (`app/Http/Controllers/AttendanceRawController.php`)
   - **Purpose:** Manage raw attendance logs from uploads
   - **Methods:**
     - `index()` - List all upload batches with statistics
     - `show()` - Display raw logs for a specific batch
     - `export()` - Export raw logs to Excel
   - **Features:**
     - Batch filtering and pagination
     - Employee matching status
     - Export functionality

3. **AttendanceProcessedController** (`app/Http/Controllers/AttendanceProcessedController.php`)
   - **Purpose:** Process raw logs into structured attendance records
   - **Methods:**
     - `index()` - List batches ready for processing
     - `process()` - Process a batch (group logs, match employees, calculate hours)
     - `reprocess()` - Reprocess failed records in a batch
   - **Features:**
     - Automatic employee matching via employee_number
     - Clock in/out grouping by date
     - Work hours calculation
     - Error tracking and recovery
     - Progress tracking

4. **AttendanceFinalController** (`app/Http/Controllers/AttendanceFinalController.php`)
   - **Purpose:** Manage final attendance records with approval workflow
   - **Methods:**
     - `index()` - List final attendance with filters
     - `show()` - Display detailed attendance record
     - `update()` - Manual adjustment of attendance
     - `approve()` - Approve single attendance
     - `bulkApprove()` - Approve multiple attendances
     - `export()` - Export to Excel
   - **Features:**
     - Schedule integration via ScheduleResolver
     - Approval workflow with tracking
     - Manual adjustments
     - Bulk operations
     - Comprehensive filtering
     - Activity logging

5. **ShiftController** (`app/Http/Controllers/ShiftController.php`)
   - **Purpose:** Manage work shifts
   - **Methods:** Standard CRUD
   - **Features:**
     - Time validation (clock_in < clock_out)
     - Overnight shift detection
     - Break time management
     - Usage validation before deletion
     - Active/inactive status

6. **EmployeeScheduleController** (`app/Http/Controllers/EmployeeScheduleController.php`)
   - **Purpose:** Assign shifts to employees
   - **Methods:**
     - Standard CRUD
     - `bulkUpdate()` - Bulk schedule assignment
   - **Features:**
     - Conflict detection (overlapping schedules)
     - Department-based grouping
     - Bulk assignment with error collection
     - Date range validation

7. **HolidayController** (`app/Http/Controllers/HolidayController.php`)
   - **Purpose:** Manage company holidays
   - **Methods:**
     - Standard CRUD
     - `bulkImport()` - Import holidays from Excel
     - `export()` - Export holidays to Excel
   - **Features:**
     - Company-specific holidays
     - Type categorization (regular, special, floating)
     - Year-based filtering
     - Bulk import/export
     - Duplicate detection

8. **EmployeeLeaveController** (`app/Http/Controllers/EmployeeLeaveController.php`)
   - **Purpose:** Manage employee leave requests
   - **Methods:**
     - Standard CRUD
     - `approve()` - Approve leave request
     - `cancel()` - Cancel approved leave
   - **Features:**
     - Leave balance checking
     - Overlap validation
     - Approval workflow with email notifications
     - Document attachment support
     - Balance restoration on cancellation
     - Type-based categorization

### Service Layer Architecture

#### Attendance Services
1. **ScheduleResolver** (`app/Services/ScheduleResolver.php`)
   - **Purpose:** Resolve employee schedules for specific dates
   - **Methods:**
     - `getScheduleForDate()` - Get shift for employee on date
     - `isHoliday()` - Check if date is a holiday
     - `isOnLeave()` - Check if employee is on leave
   - **Features:**
     - Company calendar integration
     - Holiday checking
     - Leave validation
     - Schedule conflict resolution

#### Import/Export Handlers
1. **AttendanceRawImport** (`app/Imports/AttendanceRawImport.php`)
   - Imports raw attendance from Excel
   - Required columns: employee_number, timestamp, device_id
   - Creates AttendanceRaw records linked to batch

2. **AttendanceRawExport** (`app/Exports/AttendanceRawExport.php`)
   - Exports raw attendance logs to Excel
   - Includes batch info, employee details, timestamps

3. **HolidayImport** (`app/Imports/HolidayImport.php`)
   - Bulk import holidays from Excel
   - Handles date parsing (Excel serial numbers and strings)
   - Duplicate detection
   - Statistics tracking

4. **HolidayExport** (`app/Exports/HolidayExport.php`)
   - Exports holidays to Excel with filtering
   - Supports year, company, type filters

5. **AttendanceExport** (`app/Exports/AttendanceExport.php`)
   - Exports final attendance records
   - Comprehensive filtering options
   - Includes employee details and calculations

### Attendance Processing Flow

#### 1. Upload Phase (AttendanceController)
- User uploads Excel file via web interface
- File validated (type, size, required columns)
- `AttendanceUploadBatch` created with metadata:
  - Original filename
  - File path in private storage
  - Upload timestamp
  - Uploaded by user
  - Status: 'uploaded'
- Excel rows imported into `AttendanceRaw` table
- Each raw record linked to batch via `batch_id`
- Activity logged for audit trail

#### 2. Processing Phase (AttendanceProcessedController)
- User triggers processing for a specific batch
- Raw logs grouped by employee and date
- Employee matching via `employee_number`:
  - Matched: Links to Employee record
  - Unmatched: Flags for manual review
- Clock in/out pairing:
  - Groups timestamps by day
  - Identifies first in, last out
  - Handles multiple entries
- Work hours calculation:
  - Total hours = clock_out - clock_in
  - Break time deduction (if configured)
  - Overtime calculation
- Results stored in `AttendanceProcessed`
- Batch status updated to 'processed'
- Errors tracked for reprocessing

#### 3. Finalization Phase (AttendanceFinalController)
- Processed records pushed to `Attendance` table
- For each record:
  - Schedule lookup via ScheduleResolver
  - Holiday/Leave checking
  - Attendance status determination:
    - Present: Clocked in on working day
    - Late: Clocked in after shift start + grace period
    - Absent: No clock in on working day
    - On Leave: Approved leave exists
    - Holiday: Date is company holiday
  - Late minutes calculation
  - Undertime/Overtime calculation
- Manual adjustments allowed:
  - Time corrections
  - Status overrides
  - Remarks addition
- Approval workflow:
  - Single approval
  - Bulk approval
  - Approval tracking (approved_by, approved_at)
- Activity logging for all changes
- Export capability for reporting

### Key Model Relationships

#### Attendance Flow
```php
// Batch management
AttendanceUploadBatch -> hasMany(AttendanceRaw::class, 'batch_id')
AttendanceUploadBatch -> hasMany(AttendanceProcessed::class, 'batch_id')
AttendanceUploadBatch -> belongsTo(User::class, 'uploaded_by')

// Raw data
AttendanceRaw -> belongsTo(AttendanceUploadBatch::class, 'batch_id')
AttendanceRaw -> belongsTo(Employee::class, 'employee_id')

// Processed data
AttendanceProcessed -> belongsTo(AttendanceUploadBatch::class, 'batch_id')
AttendanceProcessed -> belongsTo(Employee::class, 'employee_id')

// Final attendance
Attendance -> belongsTo(Employee::class, 'employee_id')
Attendance -> belongsTo(Shift::class, 'shift_id')
Attendance -> belongsTo(User::class, 'approved_by')
```

#### Schedule Management
```php
// Shifts
Shift -> hasMany(EmployeeSchedule::class, 'shift_id')
Shift -> hasMany(Attendance::class, 'shift_id')

// Employee schedules
EmployeeSchedule -> belongsTo(Employee::class, 'employee_id')
EmployeeSchedule -> belongsTo(Shift::class, 'shift_id')
Employee -> hasMany(EmployeeSchedule::class, 'employee_id')

// Holidays
Holiday -> belongsTo(Company::class, 'company_id')
Company -> hasMany(Holiday::class, 'company_id')

// Leaves
EmployeeLeave -> belongsTo(Employee::class, 'employee_id')
EmployeeLeave -> belongsTo(User::class, 'approved_by')
Employee -> hasMany(EmployeeLeave::class, 'employee_id')
```

#### Model Properties & Casts

**AttendanceUploadBatch:**
- `$fillable`: filename, file_path, total_records, uploaded_by, status
- `$casts`: uploaded_at (datetime)

**AttendanceRaw:**
- `$fillable`: batch_id, employee_id, employee_number, timestamp, device_id, raw_data
- `$casts`: timestamp (datetime), raw_data (array)

**AttendanceProcessed:**
- `$fillable`: batch_id, employee_id, employee_number, date, clock_in, clock_out, work_hours, status, errors
- `$casts`: date (date), clock_in (datetime), clock_out (datetime), work_hours (decimal:2), errors (array)

**Attendance:**
- `$fillable`: employee_id, shift_id, date, clock_in, clock_out, work_hours, break_minutes, late_minutes, status, remarks, approved_by, approved_at
- `$casts`: date (date), clock_in (datetime), clock_out (datetime), approved_at (datetime), work_hours (decimal:2)

**Shift:**
- `$fillable`: name, code, clock_in, clock_out, break_start, break_end, grace_period_minutes, is_active
- `$casts`: clock_in (datetime:H:i), clock_out (datetime:H:i), is_active (boolean)

**EmployeeSchedule:**
- `$fillable`: employee_id, shift_id, date_start, date_end, is_recurring, days_of_week
- `$casts`: date_start (date), date_end (date), is_recurring (boolean), days_of_week (array)

**Holiday:**
- `$fillable`: company_id, name, date, type, description, is_recurring
- `$casts`: date (date), is_recurring (boolean)

**EmployeeLeave:**
- `$fillable`: employee_id, leave_type, date_start, date_end, days_count, reason, status, approved_by, approved_at, document_path
- `$casts`: date_start (datetime), date_end (datetime), approved_at (datetime), days_count (decimal:1)

### Route Organization
All attendance routes are defined in `routes/attendance.php` and included in `routes/web.php`.

**Route Structure:**
- Prefix: `/attendance`
- Middleware: `auth`, `verified`
- Naming convention: `attendance.{module}.{action}`

**Implemented Routes:**
1. **Upload & Import**
   - GET `/attendance/upload` → `attendance.upload`
   - POST `/attendance/import` → `attendance.import`

2. **Raw Attendance**
   - GET `/attendance/raw` → `attendance.raw.index`
   - GET `/attendance/raw/{batch}` → `attendance.raw.show`
   - GET `/attendance/raw/export/{batch}` → `attendance.raw.export`

3. **Processed Attendance**
   - GET `/attendance/processed` → `attendance.processed.index`
   - POST `/attendance/process/{batch}` → `attendance.processed.process`
   - POST `/attendance/reprocess/{batch}` → `attendance.processed.reprocess`

4. **Final Attendance**
   - GET `/attendance/final` → `attendance.final.index`
   - GET `/attendance/final/{attendance}` → `attendance.final.show`
   - PUT `/attendance/final/{attendance}` → `attendance.final.update`
   - POST `/attendance/final/{attendance}/approve` → `attendance.final.approve`
   - POST `/attendance/final/bulk-approve` → `attendance.final.bulk-approve`
   - GET `/attendance/final/export` → `attendance.final.export`

5. **Shifts** (Resource routes)
   - Standard CRUD operations via `attendance.shifts.*`

6. **Schedules**
   - Standard CRUD operations via `attendance.schedules.*`
   - POST `/attendance/schedules/bulk` → `attendance.schedules.bulk`

7. **Holidays**
   - Standard CRUD operations via `attendance.holidays.*`
   - POST `/attendance/holidays/import` → `attendance.holidays.import`
   - GET `/attendance/holidays/export` → `attendance.holidays.export`

8. **Leaves**
   - Standard CRUD operations via `attendance.leaves.*`
   - POST `/attendance/leaves/{leave}/approve` → `attendance.leaves.approve`
   - POST `/attendance/leaves/{leave}/cancel` → `attendance.leaves.cancel`

### Code Style & Conventions

#### TypeScript Types
```typescript
// Use interfaces for component props
interface ComponentProps {
  data: {
    id: number;
    name: string;
    // ...
  };
  onAction: (id: number) => void;
}

// Use type for enums and unions
type Status = 'pending' | 'processing' | 'completed' | 'failed';
```

#### Component Structure
```tsx
// Functional components with TypeScript
export default function ComponentName({ prop1, prop2 }: ComponentProps) {
  // State hooks at the top
  const [state, setState] = useState<StateType>(initial);

  // Event handlers and effects next
  const handleAction = () => {
    // ...
  };

  // Return JSX last
  return (
    <div>
      {/* Components */}
    </div>
  );
}
```

#### Data Table Pattern
- Use ShadcnUI Table components
- Include standard features:
  - Column sorting
  - Pagination
  - Filters
  - Bulk actions

#### Form Handling
- Use Inertia form helpers
- Validate both client and server side
- Show loading states during submission

### Important Conventions
1. Always use TypeScript for new components
2. Prefer controlled components over uncontrolled
3. Use ShadcnUI components for consistency
4. Keep pages focused - extract complex logic to services
5. Follow atomic design patterns for components
6. Use proper form validation
7. Include loading states for better UX

## Common Integration Points
1. Authentication & Authorization
2. File Upload & Storage
3. Excel Processing
4. Schedule Resolution
5. Activity Logging

## Common Gotchas

### Storage & Files
1. Always ensure proper storage permissions in development: `chmod -R 775 storage`
2. Remember to run `php artisan storage:link` after fresh setup
3. Excel files stored in private storage (`storage/app/attendance-imports/`)
4. Employee documents in public storage (`storage/app/public/employee_documents/`)
5. Validate Excel file format and required columns before processing

### Data Handling
6. Use proper type annotations for Inertia page props
7. Handle both individual and batch attendance records appropriately
8. Consider timezone settings for attendance timestamps (use Carbon for consistency)
9. Always wrap database operations in transactions for data integrity
10. Use activity logging for audit trails on critical operations

### Model & Database
11. Model casts: Use 'datetime' for date fields that need Carbon methods (e.g., diffInDays())
12. Foreign keys: Always validate relationships before deletion
13. Batch operations: Collect errors instead of failing fast for better UX
14. Status enums: Use consistent status values across related models

### Frontend
15. Check file paths casing when importing components (Components vs components)
16. Ensure consistent component naming and organization
17. Use TypeScript interfaces for all component props
18. Prefer Inertia form helpers over raw fetch for better UX

### Validation
19. Validate time ranges: clock_in must be before clock_out
20. Check for schedule conflicts before assignment
21. Verify leave balance before approval
22. Validate date overlaps for schedules and leaves

### Performance
23. Eager load relationships to avoid N+1 queries
24. Use pagination for large datasets
25. Index frequently queried columns (employee_number, date, batch_id)
26. Consider chunking for bulk operations on large batches