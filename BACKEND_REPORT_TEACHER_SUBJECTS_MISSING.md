# 📌 BACKEND REPORT - Teacher Subjects Missing

**Date:** December 2, 2025  
**Endpoint:** `GET /api/Sessions/teachers/available`  
**Issue:** Teachers' subjects array is empty  
**Priority:** HIGH 🔴

---

## ❌ Current Problem

When fetching available teachers for session booking, the `subjects` field returns an empty array for **ALL teachers**, even though teachers should have assigned subjects.

---

## 🔍 API Response (Actual)

```json
{
    "data": [
        {
            "teacherId": 2,
            "teacherName": "john_smith",
            "email": "john.smith@naplan.edu",
            "subjects": [],  // ← EMPTY!
            "pricePerSession": 50.00,
            "sessionDurationMinutes": 60,
            "isAcceptingBookings": true,
            "description": ""
        },
        {
            "teacherId": 3,
            "teacherName": "sarah_jones",
            "email": "sarah.jones@naplan.edu",
            "subjects": [],  // ← EMPTY!
            "pricePerSession": 45.00,
            "sessionDurationMinutes": 60,
            "isAcceptingBookings": true
        }
    ],
    "success": true,
    "message": "Available teachers retrieved successfully"
}
```

---

## ✅ Expected Response

```json
{
    "data": [
        {
            "teacherId": 2,
            "teacherName": "john_smith",
            "email": "john.smith@naplan.edu",
            "subjects": [
                "Mathematics",
                "Physics"
            ],  // ← Should contain teacher's subjects
            "pricePerSession": 50.00,
            "sessionDurationMinutes": 60,
            "isAcceptingBookings": true,
            "description": "Experienced math and physics teacher"
        }
    ]
}
```

---

## 🎯 Required Backend Fix

The endpoint should:

1. **Join with `subjects` table** or teacher-subject relationship
2. **Include all subjects** assigned to each teacher
3. **Return subject names** in the `subjects` array field

### Possible Backend Code Fix (Laravel)

```php
// In SessionController or TeacherController

public function getAvailableTeachers()
{
    $teachers = User::role('teacher')
        ->where('is_accepting_bookings', true)
        ->with('subjects')  // ← Add this relationship
        ->get()
        ->map(function ($teacher) {
            return [
                'teacherId' => $teacher->id,
                'teacherName' => $teacher->username,
                'email' => $teacher->email,
                'subjects' => $teacher->subjects->pluck('name')->toArray(), // ← Map subject names
                'pricePerSession' => $teacher->price_per_session,
                'sessionDurationMinutes' => $teacher->session_duration_minutes,
                'isAcceptingBookings' => $teacher->is_accepting_bookings,
                'description' => $teacher->description ?? ''
            ];
        });

    return response()->json([
        'data' => $teachers,
        'success' => true,
        'message' => 'Available teachers retrieved successfully'
    ]);
}
```

---

## 📊 Database Relationship

Ensure the **User (Teacher)** model has the relationship:

```php
// In User.php model

public function subjects()
{
    return $this->belongsToMany(Subject::class, 'teacher_subjects', 'user_id', 'subject_id');
}
```

---

## 🚫 Frontend Impact

**Cannot continue with:**
- ❌ Displaying teacher subjects on browse page
- ❌ Filtering teachers by subject
- ❌ Showing what subjects a teacher can teach
- ❌ Proper teacher selection for students

**Current workaround:**
- ✅ Frontend shows "No subjects assigned yet" message
- ✅ Search by subject is disabled (won't find results)

---

## ✔️ Acceptance Criteria

- [ ] `subjects` field contains array of subject names for each teacher
- [ ] Teachers with no subjects show `subjects: []`
- [ ] Teachers with multiple subjects show all subjects
- [ ] Subject names are readable (e.g., "Mathematics", not IDs)

---

## 🔄 Request

**Please fix the backend endpoint to include teacher subjects in the response.**

Once fixed, confirm by testing:
```bash
GET /api/Sessions/teachers/available
```

And verify that `subjects` array is populated.

---

**Waiting for:** ✔ BACKEND FIX CONFIRMED
