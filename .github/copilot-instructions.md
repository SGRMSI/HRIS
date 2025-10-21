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

### Document Management Pattern
- Employee documents are stored in `storage/app/public/employee_documents/{employee_id}/`
- Must run `php artisan storage:link` for public access
- Document uploads handled by EmployeeService with standard categories
- Access control enforced at application level

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

### Service Layer Architecture

#### Attendance Services
1. `AttendanceImportService`
   - Handles Excel file import using Laravel Excel
   - Creates and manages `AttendanceUploadBatch` records
   - Validates raw attendance data
   - Located in `app/Services/Attendance/`

2. `AttendanceProcessService`
   - Processes raw logs into structured format
   - Groups records by employee and date
   - Matches employees via employee number
   - Calculates work hours and breaks

3. `AttendanceFinalizeService`
   - Finalizes processed records into attendance entries
   - Integrates with ScheduleResolver for validation
   - Determines attendance status (present, late, etc.)
   - Updates batch status on completion

4. `ScheduleResolver`
   - Resolves employee schedules for specific dates
   - Handles holiday and leave checking
   - Determines working status
   - Supports company-specific calendars

### Attendance Processing Flow
1. Upload Phase:
   - Excel files uploaded via `AttendanceUploadBatch`
   - Raw data stored in `AttendanceRaw` without modifications
   - Each batch tracked with status and metadata

2. Processing Phase:
   - Raw logs processed into `AttendanceProcessed`
   - Auto-matching of employees via employee number
   - Grouping of in/out records by day
   - Break time calculations

3. Finalization Phase:
   - Processed records pushed to `Attendance` table
   - Manual adjustments possible by HR
   - Approval workflow with tracking

### Key Model Relationships
1. Attendance Flow:
   ```php
   AttendanceUploadBatch -> hasMany(AttendanceRaw::class)
   AttendanceUploadBatch -> hasMany(AttendanceProcessed::class)
   AttendanceRaw -> belongsTo(Employee::class)
   Attendance -> belongsTo(Employee::class, Shift::class)
   ```

2. Schedule Management:
   ```php
   Employee -> belongsToMany(Shift::class, 'employee_schedules')
   EmployeeSchedule -> belongsTo(Employee::class, Shift::class)
   Holiday -> belongsTo(Company::class)
   EmployeeLeave -> belongsTo(Employee::class)
   ```

### Route Organization
- All attendance routes under `/attendance` prefix
- Protected by `auth` and `can:attendance.manage` middleware
- Resource routes for shifts, schedules, holidays, leaves
- Custom routes for upload/process workflow
- Batch operations where applicable

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
1. Always ensure proper storage permissions in development
2. Remember to run storage:link after fresh setup
3. Use proper type annotations for Inertia page props
4. Handle both individual and batch attendance records appropriately
5. Consider timezone settings for attendance timestamps
6. Validate Excel file format and required columns before processing
7. Check file paths casing when importing components (Components vs components)
8. Ensure consistent component naming and organization