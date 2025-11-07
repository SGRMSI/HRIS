# Date and Time Format Refactor

## Overview
Moved date and time formatting logic from backend (Laravel) to frontend (React/TypeScript) for better separation of concerns and flexibility. Backend now relies on Eloquent model casts for automatic JSON serialization.

## Changes Made

### Backend (Laravel)

#### 1. Model Casts (Automatic Serialization)

**File: `app/Models/Shift.php`**
```php
protected $casts = [
    'time_in' => 'datetime:H:i',    // Serializes to "08:00"
    'time_out' => 'datetime:H:i',   // Serializes to "17:00"
    'break_start' => 'datetime:H:i',
    'break_end' => 'datetime:H:i',
];
```

**File: `app/Models/Employee.php`**
```php
protected $casts = [
    'birth_date' => 'date',         // Serializes to "2025-11-07"
    'date_hired' => 'date',         // Serializes to "2025-11-07"
    'date_regularized' => 'date',
];
```

**File: `app/Models/EmployeeSchedule.php`**
```php
protected $casts = [
    'date_start' => 'date',         // Serializes to "2025-11-07"
    'date_end' => 'date',           // Serializes to "2025-11-07"
];
```

#### 2. Controller Changes

**File: `app/Http/Controllers/EmployeeController.php`**

Removed all `.format()` calls - let model casts handle serialization:

```php
// Before (Manual formatting)
'current_shift' => [
    'time_in' => $currentSchedule->shift->time_in->format('H:i'),  // ❌ Manual
    'date_start' => $currentSchedule->date_start->format('Y-m-d'), // ❌ Manual
]

// After (Model casts handle it)
'current_shift' => [
    'time_in' => $currentSchedule->shift->time_in,    // ✅ Cast handles it
    'date_start' => $currentSchedule->date_start,     // ✅ Cast handles it
]
```

### Frontend (React/TypeScript)
**New File: `resources/js/lib/date-utils.ts`**

Created utility functions for formatting:

1. **`formatTime12Hour(time: string)`**
   - Converts 24-hour format to 12-hour with AM/PM
   - Example: `"08:00"` → `"8:00 AM"`

2. **`formatDate(date: string)`**
   - Formats date to readable format
   - Example: `"2025-11-07"` → `"Nov 07, 2025"`

3. **`formatDateShort(date: string)`**
   - Short date format without year
   - Example: `"2025-11-07"` → `"Nov 07"`

4. **`formatDateLong(date: string)`**
   - Long date format with full month name
   - Example: `"2025-11-07"` → `"November 07, 2025"`

**Updated Files:**
- `resources/js/pages/employee/show.tsx`
- `resources/js/pages/employee/edit.tsx`

## Benefits

### ✅ Separation of Concerns
- Backend focuses on data retrieval and business logic
- Eloquent model casts handle automatic serialization
- Frontend handles presentation and formatting

### ✅ Consistency
- Model casts ensure consistent format across all API responses
- Single source of truth for date/time formatting in frontend
- Reusable utility functions across the entire frontend

### ✅ No Redundant Formatting
- Removed manual `.format()` calls in controllers
- Laravel's model casts automatically serialize dates/times to JSON
- Less code to maintain

### ✅ Flexibility
- Easy to change display formats without touching backend
- Can display same data in different formats in different components
- Frontend utilities can be enhanced without backend changes

### ✅ Internationalization Ready
- Frontend formatting uses `Intl.DateTimeFormatOptions`
- Easy to add locale support in the future

### ✅ Performance
- Backend returns smaller payloads (shorter strings)
- Formatting happens on the client side

## Usage Examples

```typescript
import { formatTime12Hour, formatDate } from '@/lib/date-utils';

// Time formatting
const time = "08:00";
formatTime12Hour(time); // Output: "8:00 AM"

// Date formatting
const date = "2025-11-07";
formatDate(date);       // Output: "Nov 07, 2025"
formatDateShort(date);  // Output: "Nov 07"
formatDateLong(date);   // Output: "November 07, 2025"
```

## Migration Notes

### If you need to update other components:

1. Import the utility functions:
   ```typescript
   import { formatTime12Hour, formatDate } from '@/lib/date-utils';
   ```

2. Replace direct display with formatted values:
   ```typescript
   // Before
   <span>{employee.current_shift.time_in}</span>
   
   // After
   <span>{formatTime12Hour(employee.current_shift.time_in)}</span>
   ```

### API Response Format

Backend now returns:
```json
{
  "current_shift": {
    "name": "Morning Shift",
    "time_in": "08:00",        // 24-hour format
    "time_out": "17:00",       // 24-hour format
    "date_start": "2025-11-07", // ISO date format
    "date_end": "2025-12-31"    // ISO date format
  }
}
```

Frontend displays:
- Time In: **8:00 AM**
- Time Out: **5:00 PM**
- Period: **Nov 07, 2025 - Dec 31, 2025**

## Testing

Test the formatting in:
- ✅ Employee show page (schedule card)
- ✅ Employee edit page (current schedule display)
- 📝 Other pages using schedule data (add as needed)

## Future Enhancements

- Add timezone support
- Add relative time formatting (e.g., "2 days ago")
- Add date range formatting helpers
- Add localization support for different languages
