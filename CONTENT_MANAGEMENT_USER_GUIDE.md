# Content Management System - Quick Reference Guide

## 🎯 User Guide for Content Management

### Accessing the System
Navigate to `/admin/content` to access the Content Management dashboard.

---

## 📚 Managing Content Hierarchy

### Content Structure:
```
Years (7, 8, 9, etc.)
  └── Subjects (Math, English, Science)
      └── Terms (Term 1, 2, 3, 4)
          └── Weeks (Week 1-52)
              └── Lessons (Video lessons)
                  └── Resources (PDF, docs, etc.)
```

---

## 🔧 Operations Guide

### 1. Managing Years

**Create Year:**
1. Click "Years" tab
2. Click "+ Add Year" button
3. Enter year number (1-12)
4. Click "Add Year"

**Edit Year:**
1. Find year in the list
2. Click edit icon (pencil)
3. Update year number
4. Click "Update Year"

**Delete Year:**
1. Find year in the list
2. Click delete icon (trash)
3. Confirm deletion

---

### 2. Managing Categories

**Create Category:**
1. Click "Categories" tab
2. Click "+ Add Category" button
3. Enter:
   - Name (required)
   - Description (required)
   - Color (optional: Blue, Green, Orange, Red, Cyan)
4. Click "Add Category"

**Edit Category:**
1. Find category
2. Click edit icon
3. Update fields
4. Click "Update Category"

**Preview Category:**
1. Find category
2. Click eye icon to view details

---

### 3. Managing Subject Names

**Create Subject Name:**
1. Click "Subject Names" tab
2. Click "+ Add Subject Name"
3. Enter:
   - Name (required)
   - Select Category (required)
4. Click "Add Subject Name"

**Filter by Category:**
- Use the category dropdown to filter subject names

---

### 4. Managing Subjects (Most Complex)

**Create Subject:**
1. Click "Subjects" tab
2. Click "+ Add Subject"
3. Fill in all required fields:
   - **Year**: Select from dropdown
   - **Subject Name**: Select from dropdown
   - **Original Price**: Enter price (≥ 0)
   - **Discount %**: Enter 0-100
   - **Level**: Select Beginner/Intermediate/Advanced
   - **Duration**: Enter hours (> 0)
   - **Teacher**: Select teacher from list
   - **Start Date**: Pick date
   - **Poster Image**: Upload image file
4. Click "Add Subject"

**Validation Notes:**
- Price must be 0 or greater
- Discount must be between 0-100
- Duration must be greater than 0
- All fields are required
- Only image files accepted for poster

**Edit Subject:**
- Same as create, but poster image is optional
- If no new poster selected, existing poster is kept

---

### 5. Managing Terms

**Create Term:**
1. Click "Terms" tab
2. Click "+ Add Term"
3. Fill in:
   - **Subject**: Select from dropdown (shows full hierarchy)
   - **Term Number**: Enter 1-4 (typically)
   - **Start Date**: Pick date
4. Click "Add Term"

**Filter by Subject:**
- Use subject dropdown to filter terms

---

### 6. Managing Weeks

**Create Week:**
1. Click "Weeks" tab
2. Click "+ Add Week"
3. Fill in:
   - **Term**: Select from dropdown (shows full hierarchy)
   - **Week Number**: Enter 1-52
4. Click "Add Week"

**Filter by Term:**
- Use term dropdown to filter weeks

---

### 7. Managing Lessons

**Create Lesson:**
1. Click "Lessons" tab
2. Click "+ Add Lesson"
3. Fill in all required fields:
   - **Title**: Enter lesson title
   - **Description**: Enter detailed description
   - **Week**: Select from dropdown (shows full hierarchy)
   - **Poster Image**: Upload image file
   - **Video File**: Upload video file
4. Click "Add Lesson"

**File Upload Notes:**
- Poster: Only image files (.jpg, .png, etc.)
- Video: Only video files (.mp4, .mov, etc.)
- File name appears after successful selection
- In edit mode, files are optional (keeps existing if not replaced)

**Preview Lesson:**
1. Find lesson in list
2. Click eye icon to preview video and details

**Manage Resources:**
1. Find lesson in list
2. Click "Resources" button
3. In Resources modal:
   - Click "+ Add Resource"
   - Enter resource title
   - Upload file
   - Click "Save"
4. View/Delete resources in the list

**Filter Lessons:**
- Filter by Week using dropdown
- Filter by Subject using dropdown
- Use search bar for text search

---

## 🔍 Search and Filtering

### Global Search:
- Use the search bar at the top
- Searches across all relevant fields
- Works on active tab only

### Filters:
- **Years**: Search by year number
- **Categories**: Search by name or description
- **Subject Names**: Filter by category + search
- **Subjects**: Filter by year, category + search
- **Terms**: Filter by subject + search
- **Weeks**: Filter by term + search
- **Lessons**: Filter by week, subject + search

### Clear Filters:
Click "Clear Filters" button to reset all filters

---

## 📊 Statistics Dashboard

At the top of the page, you'll see cards showing:
- Total Years
- Total Categories
- Total Subjects
- Total Terms
- Total Weeks
- Total Lessons

Each card shows count and icon with gradient background.

---

## 💡 Tips and Best Practices

### Creating Content in Order:
1. **First**: Create Years (7, 8, 9, etc.)
2. **Second**: Create Categories (Math, Science, etc.)
3. **Third**: Create Subject Names (Algebra, Geometry, etc.)
4. **Fourth**: Create Subjects (connect Year + Subject Name + Teacher)
5. **Fifth**: Create Terms for each Subject
6. **Sixth**: Create Weeks for each Term
7. **Last**: Create Lessons for each Week

### File Uploads:
- ✅ Prepare images and videos before starting
- ✅ Use appropriate file sizes (not too large)
- ✅ Check file type before upload
- ✅ Watch for success message after selection

### Form Validation:
- 🔴 Red border = invalid field
- 🟢 Green border = valid field
- ⚠️ Error messages appear below invalid fields
- Required fields marked with red asterisk (*)

### Error Handling:
- If operation fails, error message shows in alert
- Check error message for details
- Common issues:
  - Missing required fields
  - Invalid file type
  - Network connection problems
  - Duplicate entries

---

## 🎨 User Interface Guide

### Navigation:
- **Sidebar**: Access different admin sections
- **Tabs**: Switch between content types
- **Search Bar**: Filter current tab content
- **Action Buttons**: Create new entries

### Table Actions:
- 👁️ **Eye Icon**: Preview/View details
- ✏️ **Pencil Icon**: Edit entry
- 🗑️ **Trash Icon**: Delete entry (with confirmation)

### Pagination:
- Shows "X-Y of Z entries"
- 5 items per page
- Use Previous/Next buttons
- Or click page numbers

---

## ⚠️ Common Issues and Solutions

### Issue: Can't create Subject
**Solution**: Ensure you have:
- Created Years first
- Created Categories first
- Created Subject Names first
- Created Teacher users

### Issue: File upload fails
**Solution**: Check that:
- File is correct type (image for poster, video for video)
- File size is reasonable
- Browser allows file upload

### Issue: Form won't submit
**Solution**: 
- Look for red error messages
- Fill all required fields (marked with *)
- Fix validation errors before submitting

### Issue: Can't find created item
**Solution**:
- Check current page (pagination)
- Clear search/filters
- Refresh page (click Refresh button)

### Issue: Delete doesn't work
**Solution**:
- Check if item has dependent items (e.g., Year with Subjects)
- Look at error message for details
- May need to delete children first

---

## 🔐 Permissions

Only **Super Admin** role can:
- Create, Edit, Delete Years
- Create, Edit, Delete Categories
- Create, Edit, Delete Subject Names
- Create, Edit, Delete Subjects
- Create, Edit, Delete Terms
- Create, Edit, Delete Weeks
- Create, Edit, Delete Lessons
- Manage Resources

---

## 📞 Support

If you encounter issues:
1. Check this guide first
2. Verify your internet connection
3. Try refreshing the page
4. Clear browser cache
5. Check console for error details
6. Contact technical support

---

**Last Updated:** 2025
**Version:** 2.0 Enhanced
