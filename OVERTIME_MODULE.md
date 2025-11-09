# Employee Overtime Module

## Overview
Complete overtime management module for tracking and approving employee overtime requests within the HRIS attendance system.

## Features Implemented

### Backend
- **Database Schema**: `employee_overtimes` table with full tracking
- **Model**: `EmployeeOvertime` with relationships and helper methods
- **Controller**: `EmployeeOvertimeController` with complete CRUD and workflow
- **Routes**: 11 routes for all operations
- **File Storage**: Private storage for overtime documents
- **Validation**: Comprehensive server-side validation
- **Activity Logging**: Audit trail for all actions

### Frontend
- **Index Page**: List with filters, search, pagination, and action dialogs
- **Create Page**: Form with validation and file upload
- **Show Page**: Detailed view with approval workflow
- **Edit Page**: Update form for pending requests
- **Navigation**: Menu item added under Attendance section

### Workflow
1. **Create**: Employee/HR creates overtime request (status: pending)
2. **Review**: Supervisor views details and can:
   - Approve (status: approved)
   - Reject (status: rejected, requires remarks)
3. **Post-Approval**: For approved overtimes:
   - Can be cancelled (status: cancelled, requires remarks)
4. **Edit**: Only pending requests can be edited
5. **Delete**: Only pending or cancelled can be deleted

## Database Schema

### `employee_overtimes` Table
```
- overtime_id (PK)
- employee_id (FK → employees)
- overtime_date (date)
- duration_hours (integer)
- duration_minutes (integer)
- reason (text)
- status (string: pending/approved/rejected/cancelled)
- remarks (text, nullable)
- document_path (string, nullable)
- created_by (FK → users)
- approved_by (FK → users, nullable)
- approved_at (timestamp, nullable)
- created_at
- updated_at
```

## Routes

### Display Routes
- `GET /attendance/overtimes` → Index (list with filters)
- `GET /attendance/overtimes/create` → Create form
- `GET /attendance/overtimes/{overtime}` → Show details
- `GET /attendance/overtimes/{overtime}/edit` → Edit form

### Action Routes
- `POST /attendance/overtimes` → Store new overtime
- `PUT /attendance/overtimes/{overtime}` → Update overtime
- `DELETE /attendance/overtimes/{overtime}` → Delete overtime

### Workflow Routes
- `POST /attendance/overtimes/{overtime}/approve` → Approve request
- `POST /attendance/overtimes/{overtime}/reject` → Reject request (requires remarks)
- `POST /attendance/overtimes/{overtime}/cancel` → Cancel approved (requires remarks)

### Utility Routes
- `GET /attendance/overtimes/{overtime}/download` → Download document

## File Storage
- **Location**: `storage/app/overtime-documents/`
- **Access**: Private (not publicly accessible)
- **Formats**: PDF, JPG, PNG
- **Max Size**: 10MB
- **Naming**: `overtime_{overtime_id}_{timestamp}.{extension}`

## Model Relationships

### EmployeeOvertime
- `belongsTo(Employee::class, 'employee_id')` - The employee
- `belongsTo(User::class, 'created_by')` - Creator
- `belongsTo(User::class, 'approved_by')` - Approver

### Employee
- `hasMany(EmployeeOvertime::class)` - Employee's overtimes

## Helper Methods

### EmployeeOvertime Model
```php
getTotalMinutes(): int
// Returns total duration in minutes

getFormattedDuration(): string
// Returns formatted duration (e.g., "2h 30m")
```

## UI Components

### Status Badges
- **Pending**: Yellow with Clock icon
- **Approved**: Green with CheckCircle2 icon
- **Rejected**: Red with XCircle icon
- **Cancelled**: Gray with Ban icon

### Action Buttons (Status-based)
- **Pending**: View, Edit, Approve, Reject, Delete
- **Approved**: View, Cancel
- **Rejected**: View only
- **Cancelled**: View, Delete

### Dialogs
- **Approve Dialog**: Optional remarks
- **Reject Dialog**: Required remarks
- **Cancel Dialog**: Required remarks
- **Delete Dialog**: Confirmation only

## Filters Available
- Search (employee name, ID, or reason)
- Status filter (all/pending/approved/rejected/cancelled)
- Date range (from/to)
- Employee filter (for specific employee view)

## Test Data
- **Seeder**: `EmployeeOvertimeSeeder`
- **Records**: 20 test records
- **Distribution**:
  - 40% Pending
  - 30% Approved
  - 20% Rejected
  - 10% Cancelled
- **Date Range**: Last 3 months to next month
- **Duration**: 1-8 hours random

## Security Considerations
1. Only pending requests can be edited
2. Only pending/cancelled can be deleted
3. Approval requires valid user authentication
4. Documents stored in private storage
5. Activity logging for audit trail
6. Validation on both client and server

## Future Enhancements (Optional)
- [ ] Email notifications for approvals/rejections
- [ ] Overtime hours reporting/analytics
- [ ] Integration with payroll module
- [ ] Bulk approval functionality
- [ ] Export to Excel
- [ ] Employee self-service portal

## Usage Examples

### Creating Overtime
1. Navigate to Attendance → Overtimes
2. Click "Create Overtime"
3. Select employee, date, duration
4. Enter reason and optionally upload document
5. Submit (status: pending)

### Approving Overtime
1. View overtime details
2. Click "Approve" button
3. Optionally add remarks
4. Confirm approval

### Rejecting Overtime
1. View overtime details
2. Click "Reject" button
3. Enter required rejection reason
4. Confirm rejection

### Cancelling Approved Overtime
1. View approved overtime
2. Click "Cancel Approval"
3. Enter required cancellation reason
4. Confirm cancellation

## Files Created/Modified

### Backend
- `database/migrations/2025_11_09_065350_create_employee_overtimes_table.php`
- `app/Models/EmployeeOvertime.php`
- `app/Models/Employee.php` (modified)
- `app/Http/Controllers/EmployeeOvertimeController.php`
- `routes/attendance.php` (modified)
- `database/seeders/EmployeeOvertimeSeeder.php`

### Frontend
- `resources/js/Pages/Attendance/Overtimes/Index.tsx`
- `resources/js/Pages/Attendance/Overtimes/Create.tsx`
- `resources/js/Pages/Attendance/Overtimes/Show.tsx`
- `resources/js/Pages/Attendance/Overtimes/Edit.tsx`
- `resources/js/components/app-sidebar.tsx` (modified)

## Notes
- Follows the same architectural pattern as the Leaves module
- TypeScript-based React components with full type safety
- Uses ShadcnUI components for consistent UI/UX
- Inertia.js for seamless server-client communication
- Activity logging via Spatie Activity Log package
