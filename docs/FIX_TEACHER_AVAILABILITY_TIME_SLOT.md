# Fix: Teacher Availability Time Slot Creation

## Problem
Teachers were unable to add new time slots, receiving a 400 validation error:
```json
{
  "errors": {
    "dto": ["The dto field is required."],
    "$.startTime": ["The JSON value could not be converted to System.TimeSpan. Path: $.startTime | LineNumber: 0 | BytePositionInLine: 34."]
  }
}
```

**Request URL:** `POST https://naplan2.runasp.net/api/Sessions/teacher/availability`

## Root Cause
Two type mismatches between frontend and backend API:

1. **Day of Week Format**
   - Frontend was sending: `number` (0-6)
   - Backend expects: `string` ("Sunday", "Monday", etc.)

2. **Time Format**
   - Frontend was sending: `"HH:mm"` (e.g., "09:00")
   - Backend expects: `"HH:mm:ss"` (TimeSpan format, e.g., "09:00:00")

## Solution

### 1. Updated Component Logic
**File:** `src/app/features/sessions/teacher-availability/teacher-availability.component.ts`

Changed the `addAvailability()` method to:
- Convert day number to day name string
- Append `:00` to time values to match TimeSpan format

```typescript
const formValue = this.availabilityForm.value;

// Convert day number to day name string
const dayNumber = parseInt(formValue.dayOfWeek);
const dayName = this.daysOfWeek.find(d => d.value === dayNumber)?.label || 'Sunday';

const dto: CreateAvailabilityDto = {
  dayOfWeek: dayName, // Send as string: "Sunday", "Monday", etc.
  startTime: formValue.startTime + ':00', // Convert HH:mm to HH:mm:ss
  endTime: formValue.endTime + ':00' // Convert HH:mm to HH:mm:ss
};
```

### 2. Updated TypeScript Model
**File:** `src/app/models/session.models.ts`

```typescript
export interface CreateAvailabilityDto {
  dayOfWeek: string; // Day name: "Sunday", "Monday", etc.
  startTime: string; // Format: "HH:mm:ss" (TimeSpan format)
  endTime: string;   // Format: "HH:mm:ss" (TimeSpan format)
}
```

### 3. Fixed Conflict Detection
Updated the `checkTimeSlotConflict()` method to properly compare string day names:

```typescript
const existingSlots = this.availabilities().filter(slot => {
  // Compare day of week - both are now strings
  return slot.dayOfWeek.toString().toLowerCase() === newSlot.dayOfWeek.toLowerCase();
});
```

## API Contract (from Swagger)
```json
{
  "dayOfWeek": {
    "enum": ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    "type": "string"
  },
  "startTime": {
    "type": "string",
    "format": "date-span"
  },
  "endTime": {
    "type": "string",
    "format": "date-span"
  }
}
```

## Testing
After this fix, teachers should be able to:
1. Select a day from the dropdown
2. Enter start and end times
3. Successfully create time slots without validation errors

## Example Request (After Fix)
```json
{
  "dayOfWeek": "Monday",
  "startTime": "09:00:00",
  "endTime": "17:00:00"
}
```

## Files Modified
1. `src/app/features/sessions/teacher-availability/teacher-availability.component.ts`
2. `src/app/models/session.models.ts`

---
**Fixed:** November 21, 2025
**Issue:** Type mismatch between frontend and backend API expectations
