# API Data Verification Guide - Teacher Content Management

## Overview
This guide helps verify that the **Subject dropdown** in the "Create New Content" modal is properly fetching data from the API.

---

## How to Test

### Step 1: Navigate to Teacher Content Management
1. Login as a **Teacher** user
2. Go to **Teacher Content Management** page
3. Click the **"➕ Create"** button in the header or **"Create Content"** tab
4. Click **"➕ Start Creating"** button

### Step 2: Open Browser Developer Tools
1. Press **F12** to open Developer Tools
2. Go to the **"Console"** tab
3. Keep the console open while proceeding

### Step 3: Watch for API Call Logs
When the "Create New Content" modal opens, you should see the following in the console:

#### Expected Console Output:
```
🔗 API Endpoint: https://naplan2.runasp.net/api/TeacherContent/my-subjects
📡 Calling API to fetch teacher subjects...
✅ API Response received: {success: true, message: "...", data: [...]}
📦 Data payload: X subjects
✅ SUCCESS: Subjects loaded from API
📊 Total subjects: X
📋 Subjects data: [...]
```

---

## Expected API Response Format

### API Endpoint
```
GET https://naplan2.runasp.net/api/TeacherContent/my-subjects
```

### Required Headers
- `Authorization: Bearer {authToken}` (added automatically by auth interceptor)
- `Content-Type: application/json`

### Expected Response Structure
```json
{
  "success": true,
  "message": "Subjects retrieved successfully",
  "data": [
    {
      "subjectId": 1,
      "subjectName": "Mathematics",
      "yearId": 1,
      "yearName": "Year 10",
      "canCreate": true,
      "canEdit": true,
      "canDelete": false,
      "stats": {
        "total": 5,
        "approved": 3,
        "pending": 1,
        "rejected": 0,
        "revisionRequested": 1
      }
    },
    {
      "subjectId": 2,
      "subjectName": "English",
      "yearId": 2,
      "yearName": "Year 11",
      "canCreate": true,
      "canEdit": true,
      "canDelete": false,
      "stats": {
        "total": 3,
        "approved": 2,
        "pending": 1,
        "rejected": 0,
        "revisionRequested": 0
      }
    }
  ]
}
```

---

## Verification Checklist

### ✅ Console Logs
- [ ] See "📡 Calling API to fetch teacher subjects..." log
- [ ] See API endpoint logged correctly
- [ ] See "✅ API Response received:" with response object
- [ ] See "📊 Total subjects:" with number count
- [ ] See "✅ SUCCESS: Subjects loaded from API" message

### ✅ Network Tab
1. Open **Network** tab in Developer Tools
2. Look for request to `my-subjects`
3. Verify:
   - [ ] Status: **200 OK**
   - [ ] Method: **GET**
   - [ ] URL: `https://naplan2.runasp.net/api/TeacherContent/my-subjects`
   - [ ] Headers include: `Authorization: Bearer {token}`
   - [ ] Response has `success: true` and `data: [...]`

### ✅ UI Elements
When modal opens and data loads:
- [ ] Header shows **"➕ Create New Content"** with optional **"Loading data..."** badge during load
- [ ] In Step 2 (Content Information), Subject dropdown:
  - [ ] Shows placeholder text or "Select a subject" when no data
  - [ ] Shows "Loading subjects..." while data is being fetched
  - [ ] Displays all returned subjects as options once loaded
  - [ ] Each option shows the subject name (e.g., "Mathematics", "English")

---

## Troubleshooting

### Issue: Subjects Not Loading
**Check in Console:**
1. Look for error messages starting with "❌ ERROR:"
2. Check if the API endpoint is correct:
   ```
   https://naplan2.runasp.net/api/TeacherContent/my-subjects
   ```
3. Verify authentication token is being sent:
   - Open Network tab
   - Look at "my-subjects" request headers
   - Should have: `Authorization: Bearer {token}`

### Issue: "Loading subjects..." Shows Forever
**Causes:**
- API endpoint is not responding
- Authentication token is invalid/expired
- Network connectivity issue

**Check:**
1. Open Network tab
2. Look for `my-subjects` request
3. Check response status (should be 200, not 401, 403, or 500)
4. If 401/403: Token may be invalid, try logging in again

### Issue: Empty Subjects List
**Possible Reasons:**
1. Teacher user has no subjects assigned
2. API returns empty array (valid response)
3. Permission issue - teacher doesn't have access to any subjects

**Verification:**
- Check the console for `📊 Total subjects: 0`
- This is valid - teacher may not have any subjects yet
- Contact admin to assign subjects to teacher

### Issue: API Error (Status 500)
**Check:**
1. Backend API server is running
2. Verify API is accessible: `https://naplan2.runasp.net/api/health`
3. Check application logs on backend

---

## Component Details

### Files Involved
1. **Component:** `src/app/features/teacher/content-management/content-creation-wizard/content-creation-wizard.component.ts`
   - Manages the modal UI and form
   - Calls `loadSubjects()` on component init
   - Updates `subjects` signal with API data
   - Updates `loadingSubjects` signal during loading

2. **Service:** `src/app/features/teacher/services/teacher-content-management.service.ts`
   - Method: `getMySubjects()` 
   - Calls: `GET /TeacherContent/my-subjects`
   - Returns: `Observable<TeacherSubject[]>`
   - Includes error handling with fallback empty array

3. **Auth Interceptor:** `src/app/core/interceptors/auth.interceptor.ts`
   - Automatically adds `Authorization: Bearer {token}` header
   - Required for authenticated API calls

### Data Flow
```
1. User clicks "➕ Create" button
   ↓
2. Modal opens → ngOnInit() called
   ↓
3. loadSubjects() method executes
   ↓
4. Service calls: getMySubjects()
   ↓
5. HTTP GET request sent to API with auth token
   ↓
6. API processes request and returns subjects list
   ↓
7. Console logs show request and response
   ↓
8. Signal updated: subjects.set(data)
   ↓
9. Template reactively updates dropdown with subject options
```

---

## Expected User Experience

### Loading State (0-1 seconds)
- Header shows blue badge: **"Loading data..."**
- Subject dropdown shows placeholder: **"Loading subjects..."**
- Dropdown is disabled (cannot select)

### Loaded State (After API response)
- Blue "Loading data..." badge disappears
- Subject dropdown becomes enabled
- Subject dropdown shows all available subjects:
  - "Select a subject" (placeholder)
  - "Mathematics"
  - "English"
  - ... (other subjects)
- User can select a subject

### Error State (If API fails)
- Loading badge disappears
- Dropdown shows: **"Select a subject"** (empty state)
- Console shows error message with details
- User can still proceed but without subject data

---

## Quick Debug Commands

Run these in browser console to verify:

```javascript
// Check if subjects signal has data
console.log('Current subjects:', JSON.parse(localStorage.getItem('subjects') || '[]'));

// Check auth token
console.log('Auth token:', localStorage.getItem('authToken'));

// Manual API test
fetch('https://naplan2.runasp.net/api/TeacherContent/my-subjects', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
  }
}).then(r => r.json()).then(d => console.log('API Response:', d));
```

---

## Success Indicators

✅ **Data is returning from API when you see:**
1. Console shows "✅ API Response received: ..."
2. Console shows subject count > 0
3. Subject dropdown populates with options
4. Network tab shows 200 OK response
5. Dropdown is not disabled and shows subjects

---

## Contact & Support

If data is not loading:
1. Verify you're logged in as a Teacher
2. Check browser console for error messages
3. Open Network tab and check API response
4. Verify API server is running at: `https://naplan2.runasp.net/api`
5. Check authentication token validity

