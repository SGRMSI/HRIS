# Employee Schedule Integration - Bug Fixes

## Date: November 7, 2025

### Issues Fixed

#### 1. ⚠️ **Schedule Not Showing in Employee View**
**Problem**: Employee schedules were not appearing in the employee profile even though they existed in the database.

**Root Cause**: The `currentSchedule()` relationship only looked for schedules where `date_start <= now()`. Since Catherine Lopez's schedule starts on Nov 25, 2025 (future date), it wasn't being retrieved.

**Solution**: Updated the `currentSchedule()` relationship to include:
- **Currently active schedules**: `date_start <= today AND (date_end is NULL OR date_end >= today)`
- **Upcoming schedules**: Schedules starting within the next 30 days

**File Modified**: `app/Models/Employee.php`

```php
public function currentSchedule()
{
    return $this->hasOne(EmployeeSchedule::class, 'employee_id', 'employee_id')
        ->where(function ($query) {
            $query->where(function ($q) {
                // Currently active schedules
                $q->where('date_start', '<=', now())
                  ->where(function ($q2) {
                      $q2->whereNull('date_end')
                         ->orWhere('date_end', '>=', now());
                  });
            })
            ->orWhere(function ($q) {
                // Upcoming schedules (within 30 days)
                $q->where('date_start', '>', now())
                  ->where('date_start', '<=', now()->addDays(30));
            });
        })
        ->with('shift')
        ->latest('date_start');
}
```

#### 2. ✅ **Assign Schedule Button Not Pre-filled**
**Problem**: When clicking "Assign Schedule" from an employee profile, the form didn't pre-fill the employee and company information.

**Solution**: 
1. Updated `EmployeeController::show()` to include `company_id` in employee data
2. Updated "Assign Schedule" link to pass query parameters: `?employee_id=X&company_id=Y`
3. Updated `EmployeeScheduleController::create()` to accept and process query parameters
4. Updated `Create.tsx` component to handle prefilled employee and company data

**Files Modified**:
- `app/Http/Controllers/EmployeeController.php`
- `app/Http/Controllers/EmployeeScheduleController.php`  
- `resources/js/pages/employee/show.tsx`
- `resources/js/pages/Attendance/Schedules/Create.tsx`

---

## Changes Summary

### Backend Changes

#### EmployeeController.php
```php
// Added company_id to employee data
'company_id' => $employee->company_id,

// Added eager loading for company relationship
$employee->load(['currentSchedule.shift', 'company', 'department', 'position']);
```

#### EmployeeScheduleController.php
```php
public function create(Request $request)
{
    // ... existing code ...
    
    // Get pre-filled employee data if provided
    $prefilledEmployee = null;
    if ($request->employee_id) {
        $employee = Employee::with('company')->find($request->employee_id);
        if ($employee) {
            $prefilledEmployee = [
                'employee_id' => $employee->employee_id,
                'full_name' => trim($employee->first_name . ' ' . ...),
                'id_number' => $employee->id_number,
                'company_id' => $employee->company_id,
                'company_name' => $employee->company ? $employee->company->name : null,
            ];
        }
    }

    return Inertia::render('Attendance/Schedules/Create', [
        'companies' => $companies,
        'shifts' => $shifts,
        'prefilledEmployee' => $prefilledEmployee,
        'prefilledCompanyId' => $request->company_id ? (int)$request->company_id : null,
    ]);
}
```

### Frontend Changes

#### show.tsx
```tsx
// Added company_id to Employee interface
interface Employee {
    // ... other fields
    company_id?: number;
    // ...
}

// Updated link to pass query parameters
<Link 
    href={`/attendance/schedules/create?employee_id=${employee.employee_id}&company_id=${employee.company_id || ''}`}
    className="text-blue-600 hover:underline dark:text-blue-400"
>
    Assign Schedule
</Link>
```

#### Create.tsx
```tsx
interface PrefilledEmployee {
    employee_id: number;
    full_name: string;
    id_number: string;
    company_id: number;
    company_name: string;
}

interface Props {
    // ... existing props
    prefilledEmployee?: PrefilledEmployee | null;
    prefilledCompanyId?: number | null;
}

// Initialize form with prefilled data
const { data, setData, post, processing, errors } = useForm({
    employee_id: prefilledEmployee ? prefilledEmployee.employee_id.toString() : '',
    // ... rest of form
});

// Initialize selected company
const [selectedCompanyId, setSelectedCompanyId] = useState(
    prefilledCompanyId ? prefilledCompanyId.toString() : 
    (prefilledEmployee ? prefilledEmployee.company_id.toString() : '')
);

// Pre-populate employees list if prefilled
useEffect(() => {
    if (prefilledEmployee) {
        setEmployees([{
            id: prefilledEmployee.employee_id,
            name: prefilledEmployee.full_name,
            employee_number: prefilledEmployee.id_number,
            department: prefilledEmployee.company_name || '',
        }]);
    }
}, [prefilledEmployee]);
```

---

## Testing Results

✅ **Schedule Fetching**: Employee schedules now appear correctly
- Active schedules (date_start in past, date_end in future or null)
- Upcoming schedules (date_start within next 30 days)

✅ **Pre-filled Forms**: Assign Schedule button now pre-fills:
- Employee selection (locked to current employee)
- Company selection (locked to employee's company)

---

## User Experience Improvements

### Before:
1. Employee profile showed "No schedule assigned" even though schedule existed
2. Clicking "Assign Schedule" opened empty form
3. User had to manually search for employee and select company

### After:
1. Employee profile shows upcoming schedule with all details
2. Clicking "Assign Schedule" opens form with employee pre-selected
3. Company is automatically selected
4. User only needs to:
   - Select shift
   - Choose start/end dates
   - Click save

---

## Database Schema Reference

### employee_schedules table:
- `schedule_id` (PK)
- `employee_id` (FK → employees.employee_id)
- `shift_id` (FK → shifts.shift_id)
- `date_start` (date)
- `date_end` (date, nullable)
- `is_holiday` (boolean)

### Status Calculation:
Status is **calculated**, not stored:
- **Active**: `date_start <= today AND (date_end is NULL OR date_end >= today)`
- **Upcoming**: `date_start > today`
- **Expired**: `date_end < today`

---

## API Endpoints Updated

### GET `/employee/{id}`
**Added to response**:
```json
{
    "company_id": 1,
    "current_shift": {
        "name": "Morning Shift",
        "time_in": "06:00",
        "time_out": "14:00",
        "date_start": "2025-11-25",
        "date_end": "2026-01-01"
    }
}
```

### GET `/attendance/schedules/create?employee_id={id}&company_id={id}`
**Added to response**:
```json
{
    "prefilledEmployee": {
        "employee_id": 6,
        "full_name": "Catherine Lopez",
        "id_number": "TH003",
        "company_id": 1,
        "company_name": "TechHub"
    },
    "prefilledCompanyId": 1
}
```

---

## Future Considerations

### 1. Schedule Status Badge
Consider adding a visual indicator for schedule status:
- 🟢 **Active** - Schedule is currently in effect
- 🔵 **Upcoming** - Schedule will start soon
- ⚪ **Future** - Schedule starts more than 30 days from now

### 2. Multiple Schedules
Currently shows only one "current" schedule. Consider:
- Showing transition between schedules
- Displaying schedule history
- Warning when no schedule will be active after current one ends

### 3. Validation Enhancement
When assigning schedules:
- Check for gaps between schedules
- Warn about overlapping schedules
- Suggest scheduling based on existing patterns

---

**Status**: ✅ Complete and Tested  
**Breaking Changes**: None  
**Deployment Notes**: No database migrations needed

