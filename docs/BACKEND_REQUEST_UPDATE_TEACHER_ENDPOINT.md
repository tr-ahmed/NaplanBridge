# 📌 BACKEND REPORT - Update Teacher Details Endpoint

**Date:** November 27, 2025  
**Status:** 🔴 NEW ENDPOINT REQUIRED  
**Priority:** HIGH  
**Impact:** Teacher Management - Admin Panel

---

## 📋 Summary

تم إضافة واجهة جديدة في الـ Frontend لتعديل بيانات المدرس (Teacher Details) من صفحة User Management.

**المطلوب من الـ Backend:** إنشاء endpoint جديد لتحديث بيانات المدرس.

---

## 🎯 Required Endpoint

### **PUT** `/api/Admin/update-teacher/{username}`

**Description:** Updates teacher details including salary and IBAN (Admin only)

**Authorization:** Admin role required

---

## 📝 Request Specification

### **Route Parameters:**
- `username` (string, required) - The username of the teacher to update

### **Request Body:**

```json
{
  "userName": "teacher_john",
  "email": "john_new@example.com",
  "phoneNumber": "+966509876543",
  "age": 36,
  "salary": 9000.00,
  "iban": "SA0380000000608010167520"
}
```

### **Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
Accept: application/json
```

---

## ✅ Response Specification

### **Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Teacher updated successfully",
  "data": {
    "userId": 123,
    "userName": "teacher_john",
    "email": "john_new@example.com",
    "phoneNumber": "+966509876543",
    "age": 36,
    "salary": 9000.00,
    "iban": "SA0380000000608010167520",
    "updatedAt": "2025-11-27T14:30:00Z"
  }
}
```

### **Error Response - Not Found (404):**

```json
{
  "success": false,
  "message": "Teacher not found",
  "errors": null
}
```

### **Error Response - Validation Error (400):**

```json
[
  {
    "code": "InvalidEmail",
    "description": "Email format is invalid."
  },
  {
    "code": "DuplicateEmail",
    "description": "Email 'test@example.com' is already taken."
  }
]
```

### **Error Response - Unauthorized (401):**

```json
{
  "success": false,
  "message": "Unauthorized access. Admin role required."
}
```

---

## 🔧 Implementation Guide

### 1️⃣ DTO (Data Transfer Object)

**File:** `UpdateTeacherDto.cs`

```csharp
public class UpdateTeacherDto
{
    [Required]
    public string UserName { get; set; }
    
    [Required]
    [EmailAddress]
    public string Email { get; set; }
    
    [Required]
    [Phone]
    public string PhoneNumber { get; set; }
    
    [Required]
    [Range(18, 100)]
    public int Age { get; set; }
    
    [Range(0, double.MaxValue)]
    public decimal? Salary { get; set; }
    
    [RegularExpression(@"^[A-Z]{2}[0-9]{2}[A-Z0-9]+$")]
    [MaxLength(34)]
    public string? IBAN { get; set; }
}
```

---

### 2️⃣ Controller

**File:** `AdminController.cs`

```csharp
[HttpPut("update-teacher/{username}")]
[Authorize(Roles = "Admin")]
public async Task<IActionResult> UpdateTeacher(string username, [FromBody] UpdateTeacherDto dto)
{
    try
    {
        // Find teacher by username
        var teacher = await _userManager.FindByNameAsync(username);
        
        if (teacher == null)
        {
            return NotFound(new { success = false, message = "Teacher not found" });
        }
        
        // Check if user has Teacher role
        var roles = await _userManager.GetRolesAsync(teacher);
        if (!roles.Contains("Teacher"))
        {
            return BadRequest(new { success = false, message = "User is not a teacher" });
        }
        
        // Update basic info
        teacher.Email = dto.Email;
        teacher.PhoneNumber = dto.PhoneNumber;
        teacher.Age = dto.Age;
        teacher.Salary = dto.Salary;
        teacher.IBAN = dto.IBAN;
        
        var result = await _userManager.UpdateAsync(teacher);
        
        if (result.Succeeded)
        {
            return Ok(new
            {
                success = true,
                message = "Teacher updated successfully",
                data = new
                {
                    userId = teacher.Id,
                    userName = teacher.UserName,
                    email = teacher.Email,
                    phoneNumber = teacher.PhoneNumber,
                    age = teacher.Age,
                    salary = teacher.Salary,
                    iban = teacher.IBAN,
                    updatedAt = DateTime.UtcNow
                }
            });
        }
        
        // Return validation errors
        return BadRequest(result.Errors.Select(e => new
        {
            code = e.Code,
            description = e.Description
        }).ToList());
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Error updating teacher {Username}", username);
        return StatusCode(500, new { success = false, message = "Internal server error" });
    }
}
```

---

### 3️⃣ Service Layer (Optional - if using service pattern)

**File:** `TeacherService.cs` or `AdminService.cs`

```csharp
public async Task<ServiceResult<TeacherDto>> UpdateTeacherAsync(string username, UpdateTeacherDto dto)
{
    var teacher = await _userManager.FindByNameAsync(username);
    
    if (teacher == null)
    {
        return ServiceResult<TeacherDto>.Failure("Teacher not found");
    }
    
    // Validate teacher role
    var roles = await _userManager.GetRolesAsync(teacher);
    if (!roles.Contains("Teacher"))
    {
        return ServiceResult<TeacherDto>.Failure("User is not a teacher");
    }
    
    // Check if email is changing and if it's already taken
    if (teacher.Email != dto.Email)
    {
        var existingUser = await _userManager.FindByEmailAsync(dto.Email);
        if (existingUser != null && existingUser.Id != teacher.Id)
        {
            return ServiceResult<TeacherDto>.Failure("Email is already taken");
        }
    }
    
    // Update properties
    teacher.Email = dto.Email;
    teacher.PhoneNumber = dto.PhoneNumber;
    teacher.Age = dto.Age;
    teacher.Salary = dto.Salary;
    teacher.IBAN = dto.IBAN;
    
    var result = await _userManager.UpdateAsync(teacher);
    
    if (!result.Succeeded)
    {
        return ServiceResult<TeacherDto>.Failure(result.Errors);
    }
    
    var teacherDto = new TeacherDto
    {
        UserId = teacher.Id,
        UserName = teacher.UserName,
        Email = teacher.Email,
        PhoneNumber = teacher.PhoneNumber,
        Age = teacher.Age,
        Salary = teacher.Salary,
        IBAN = teacher.IBAN
    };
    
    return ServiceResult<TeacherDto>.Success(teacherDto, "Teacher updated successfully");
}
```

---

## 🔒 Security & Validation

### 1️⃣ **Authorization**
- ✅ Endpoint accessible **only by Admin** role
- ✅ JWT token required in Authorization header

### 2️⃣ **Validation Rules**
- `userName`: Cannot be changed (read-only in frontend)
- `email`: Required, valid email format, must be unique
- `phoneNumber`: Required, valid phone format
- `age`: Required, minimum 18
- `salary`: Optional, must be ≥ 0 if provided
- `iban`: Optional, must match IBAN format if provided

### 3️⃣ **Data Protection**
- IBAN should be encrypted in database (recommended)
- Salary is sensitive data - log all changes
- Audit trail for who updated what and when

---

## 🧪 Test Cases

### Test Case 1: Successful Update

**Request:**
```bash
PUT /api/Admin/update-teacher/teacher_john
Authorization: Bearer <ADMIN_TOKEN>
Content-Type: application/json

{
  "userName": "teacher_john",
  "email": "john_updated@example.com",
  "phoneNumber": "+966509876543",
  "age": 36,
  "salary": 9500.00,
  "iban": "SA0380000000608010167520"
}
```

**Expected Response:** `200 OK`
```json
{
  "success": true,
  "message": "Teacher updated successfully",
  "data": { ... }
}
```

---

### Test Case 2: Teacher Not Found

**Request:**
```bash
PUT /api/Admin/update-teacher/nonexistent_teacher
```

**Expected Response:** `404 Not Found`
```json
{
  "success": false,
  "message": "Teacher not found"
}
```

---

### Test Case 3: Duplicate Email

**Request:**
```bash
PUT /api/Admin/update-teacher/teacher_john

{
  ...
  "email": "existing@example.com"  // Already used by another user
}
```

**Expected Response:** `400 Bad Request`
```json
[
  {
    "code": "DuplicateEmail",
    "description": "Email 'existing@example.com' is already taken."
  }
]
```

---

### Test Case 4: Invalid IBAN

**Request:**
```bash
PUT /api/Admin/update-teacher/teacher_john

{
  ...
  "iban": "INVALID123"
}
```

**Expected Response:** `400 Bad Request`
```json
[
  {
    "code": "InvalidIBAN",
    "description": "IBAN format is invalid."
  }
]
```

---

### Test Case 5: Unauthorized Access

**Request:**
```bash
PUT /api/Admin/update-teacher/teacher_john
Authorization: Bearer <TEACHER_TOKEN>  // Not Admin
```

**Expected Response:** `401 Unauthorized`
```json
{
  "success": false,
  "message": "Unauthorized access. Admin role required."
}
```

---

## 📊 Database Changes

**No new migrations required** - fields already exist from previous update:
- `Salary` (DECIMAL(18,2) NULL)
- `IBAN` (NVARCHAR(34) NULL)

---

## 🔄 Integration Points

### Frontend Files Updated:
1. ✅ `edit-teacher-modal.ts` - Component
2. ✅ `edit-teacher-modal.html` - Template
3. ✅ `user-managment.ts` - Parent component
4. ✅ `user-managment.html` - UI with edit button

### API Call:
```typescript
this.http.put(
  `${environment.apiBaseUrl}/Admin/update-teacher/${teacher.userName}`,
  payload,
  { headers }
)
```

---

## ✔ BACKEND FIX CONFIRMATION

**بعد تطبيق التعديلات، يرجى الرد بـ:**

```
✔ BACKEND FIX CONFIRMED
- Endpoint created: PUT /api/Admin/update-teacher/{username} ✅
- Authorization working (Admin only) ✅
- Validation implemented ✅
- Error handling correct ✅
- Tested all cases ✅
```

---

## 📞 Support

إذا واجهت أي مشكلة في التطبيق، يرجى التواصل مع فريق Frontend.

**Frontend Team:**
- File: `src/app/admin/edit-teacher-modal/edit-teacher-modal.ts` (Created ✅)
- File: `src/app/admin/edit-teacher-modal/edit-teacher-modal.html` (Created ✅)
- File: `src/app/admin/user-managment/user-managment.ts` (Updated ✅)
- File: `src/app/admin/user-managment/user-managment.html` (Updated ✅)

---

**End of Report** 🎯
