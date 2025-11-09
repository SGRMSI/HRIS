# Overtime Module - Layout Improvements

## Overview
Improved the Overtime module's UI/UX to match the Leaves module pattern for consistency across the attendance system.

## Changes Implemented

### 1. Show Page Layout Refactoring (`resources/js/Pages/Attendance/Overtimes/Show.tsx`)

#### Previous Layout
- Action buttons scattered in a separate "Actions" card at the bottom
- Single column layout
- Audit information in a separate card
- No timeline visualization

#### New Layout (Matching Leaves Pattern)
- **Action Buttons in Upper Right**: All action buttons (Edit, Approve, Reject, Delete, Cancel) now grouped in the header area next to the back button
- **3-Column Grid Layout**: 
  - 2 columns for main content (Employee Info, Overtime Details, Document)
  - 1 column for sidebar (Status, Approval Info, Timeline)
- **Timeline Component**: Visual timeline showing:
  - Submission event with blue dot
  - Status change events (approved/rejected/cancelled) with color-coded dots
  - Timestamps and user information for each event
- **Cleaner Information Display**: Removed redundant "Audit Information" card, moved info to timeline
- **Status Badge in Sidebar**: Status now displayed in a dedicated card in the sidebar

#### Layout Structure
```
Header (Breadcrumbs + Title + Action Buttons)
  └─ Grid (3 columns: md:grid-cols-3)
      ├─ Main Content (md:col-span-2)
      │   ├─ Employee Information Card
      │   ├─ Overtime Details Card
      │   └─ Document Card (if exists)
      └─ Sidebar (1 column)
          ├─ Status Card
          ├─ Approval Information Card (if approved/rejected/cancelled)
          └─ Timeline Card
```

### 2. Create Page - Company Filtering (`resources/js/Pages/Attendance/Overtimes/Create.tsx`)

#### Previous Behavior
- Displayed all employees from all companies in a single dropdown
- No filtering capability
- Potentially overwhelming for large organizations

#### New Behavior (Matching Leaves Pattern)
- **Company Selection First**: User selects company from dropdown before employee selection
- **Dynamic Employee Loading**: Employees are fetched via API based on selected company
- **Loading States**: Shows "Loading employees..." while fetching
- **Disabled State**: Employee dropdown disabled until company is selected
- **Helpful Placeholders**: Context-aware placeholder messages

#### Form Flow
1. User selects company
2. System fetches employees for that company via AJAX
3. Employee dropdown populates with filtered list
4. User completes rest of the form

### 3. Backend Updates (`app/Http/Controllers/EmployeeOvertimeController.php`)

#### Modified Methods

**`create()` Method**
- **Before**: Loaded all employees
- **After**: Loads all companies instead
```php
public function create()
{
    $companies = DB::table('companies')
        ->select(['company_id as id', 'company_name as name'])
        ->orderBy('company_name')
        ->get();

    return Inertia::render('Attendance/Overtimes/Create', [
        'companies' => $companies,
    ]);
}
```

**New `getEmployeesByCompany()` Method**
- API endpoint to fetch employees by company
- Filters employees using department relationship
- Returns JSON response for AJAX consumption
```php
public function getEmployeesByCompany($companyId)
{
    $employees = Employee::with('department')
        ->whereHas('department', function ($q) use ($companyId) {
            $q->where('company_id', $companyId);
        })
        ->select(['employee_id', 'first_name', 'last_name', 'id_number', 'department_id'])
        ->orderBy('first_name')
        ->get()
        ->map(fn($emp) => [
            'id' => $emp->employee_id,
            'name' => $emp->first_name . ' ' . $emp->last_name,
            'id_number' => $emp->id_number,
            'department' => $emp->department->name ?? 'N/A',
        ]);

    return response()->json($employees);
}
```

### 4. Routes Update (`routes/attendance.php`)

Added new route for fetching employees by company:
```php
Route::get('employees/{company}', [EmployeeOvertimeController::class, 'getEmployeesByCompany'])
    ->name('employees');
```

Route name: `attendance.overtimes.employees`

## TypeScript Updates

### Props Interface Changes

**Create.tsx**
```typescript
// Before
interface Props {
    employees: Employee[];
}

// After
interface Company {
    id: number;
    name: string;
}

interface Props {
    companies: Company[];
}
```

### State Management

Added new state variables for company filtering:
```typescript
const [selectedCompany, setSelectedCompany] = useState<string>('');
const [employees, setEmployees] = useState<Employee[]>([]);
const [loadingEmployees, setLoadingEmployees] = useState(false);
```

Added useEffect hook for dynamic employee loading:
```typescript
useEffect(() => {
    if (selectedCompany) {
        setLoadingEmployees(true);
        axios.get(route('attendance.overtimes.employees', selectedCompany))
            .then(response => {
                setEmployees(response.data);
                setLoadingEmployees(false);
            })
            .catch(error => {
                console.error('Error fetching employees:', error);
                setLoadingEmployees(false);
            });
    } else {
        setEmployees([]);
        setData('employee_id', '');
        setSelectedEmployee(null);
    }
}, [selectedCompany]);
```

## UI Components Used

### Show Page
- `Card`, `CardHeader`, `CardTitle`, `CardContent` - Content containers
- `Button` - Action buttons with variants
- `Badge` - Status indicators
- `Dialog`, `AlertDialog` - Confirmation modals
- Timeline custom component with color-coded dots

### Create Page
- `Select`, `SelectTrigger`, `SelectValue`, `SelectContent`, `SelectItem` - Dropdown components
- Dynamic placeholder text based on state
- Disabled state for conditional interactions

## Benefits

### User Experience
1. **Consistency**: Both Leaves and Overtimes modules now have identical UI patterns
2. **Better Organization**: Timeline provides clear visual history of the request
3. **Easier Navigation**: Action buttons are prominently displayed in the header
4. **Reduced Clutter**: Company filtering reduces the number of employees shown at once
5. **Progressive Disclosure**: Company selection → Employee selection flow guides the user

### Code Quality
1. **DRY Principle**: Reuses patterns from Leaves module
2. **Type Safety**: Proper TypeScript interfaces throughout
3. **Error Handling**: Graceful handling of loading and error states
4. **Accessibility**: Clear labels and disabled states

## Testing Checklist

- [ ] Show page displays action buttons in upper right corner
- [ ] Show page has 3-column grid layout on desktop (md breakpoint)
- [ ] Timeline displays submission event correctly
- [ ] Timeline displays approval/rejection/cancellation events with correct colors
- [ ] Status badge appears in sidebar
- [ ] Create page requires company selection before employee selection
- [ ] Employee dropdown shows "Select a company first" when no company selected
- [ ] Employee dropdown shows "Loading employees..." while fetching
- [ ] Employees are filtered correctly by selected company
- [ ] All action buttons work correctly (approve, reject, cancel, delete)
- [ ] Responsive layout works on mobile devices

## Future Enhancements

1. **Search in Employee Dropdown**: Add search functionality for large employee lists
2. **Department Filtering**: Add optional department filter after company selection
3. **Bulk Actions**: Add ability to approve/reject multiple overtimes at once
4. **Export Timeline**: Option to export timeline as PDF for reporting
5. **Email Notifications**: Send emails when overtime status changes

## Related Files

### Frontend
- `resources/js/Pages/Attendance/Overtimes/Show.tsx`
- `resources/js/Pages/Attendance/Overtimes/Create.tsx`
- `resources/js/Pages/Attendance/Leaves/Show.tsx` (reference)
- `resources/js/Pages/Attendance/Leaves/Create.tsx` (reference)

### Backend
- `app/Http/Controllers/EmployeeOvertimeController.php`
- `routes/attendance.php`

### Models
- `app/Models/EmployeeOvertime.php`
- `app/Models/Employee.php`
- `app/Models/Company.php`

## Migration Notes

No database migrations required for these changes - all improvements are UI/UX focused.

## Conclusion

The Overtime module now provides a consistent, user-friendly experience that matches the established patterns in the Leaves module. The company filtering feature improves usability for large organizations, while the timeline component provides better visibility into the approval workflow.
