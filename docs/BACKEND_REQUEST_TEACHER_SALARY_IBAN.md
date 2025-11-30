# 📌 BACKEND REPORT - Teacher Salary & IBAN Fields

**Date:** November 27, 2025  
**Status:** 🔴 REQUIRED CHANGES  
**Priority:** HIGH  
**Impact:** Teacher Registration CRUD

---

## 📋 Summary

تم إضافة حقلين جديدين لـ **Teacher Registration** في الـ Frontend:
- `salary` (Decimal/Double - Optional)
- `iban` (String - Optional)

**المطلوب من الـ Backend:** تحديث Database Schema + API Endpoints + DTOs

---

## 🎯 Required Changes

### 1️⃣ Database Schema Update

#### Table: `Teachers` or `AspNetUsers`

إضافة الـ Columns التالية:

```sql
ALTER TABLE Teachers
ADD COLUMN Salary DECIMAL(18, 2) NULL,
ADD COLUMN IBAN NVARCHAR(34) NULL;
```

**أو إذا كانت البيانات في جدول الـ Users:**

```sql
ALTER TABLE AspNetUsers
ADD COLUMN Salary DECIMAL(18, 2) NULL,
ADD COLUMN IBAN NVARCHAR(34) NULL;
```

**ملاحظة:**
- `Salary`: نوع `DECIMAL(18, 2)` لدعم الأرقام العشرية (مثل 5000.50)
- `IBAN`: نوع `NVARCHAR(34)` لأن الـ IBAN عادة يصل طوله إلى 34 حرف/رقم
- **كلاهما `NULL`** لأنهما اختياريين (Optional)

---

### 2️⃣ Update DTOs

#### File: `TeacherRegisterDto.cs`

```csharp
public class TeacherRegisterDto
{
    [Required]
    public string UserName { get; set; }
    
    [Required]
    [EmailAddress]
    public string Email { get; set; }
    
    [Required]
    [MinLength(6)]
    public string Password { get; set; }
    
    [Required]
    [Range(18, 100)]
    public int Age { get; set; }
    
    [Required]
    [Phone]
    public string PhoneNumber { get; set; }
    
    // ✅ NEW FIELDS
    [Range(0, double.MaxValue)]
    public decimal? Salary { get; set; }
    
    [RegularExpression(@"^[A-Z]{2}[0-9]{2}[A-Z0-9]+$")]
    [MaxLength(34)]
    public string? IBAN { get; set; }
}
```

**Validation Rules:**
- `Salary`: يجب أن يكون رقم موجب أو `null`
- `IBAN`: يجب أن يكون بصيغة IBAN صحيحة (مثال: `SA0380000000608010167519`) أو `null`
- كلاهما **Optional** (`?` في C#)

---

### 3️⃣ Update Entity Model

#### File: `Teacher.cs` or `ApplicationUser.cs`

```csharp
public class Teacher // or ApplicationUser if extending Identity
{
    // ... existing properties
    
    public decimal? Salary { get; set; }
    
    [MaxLength(34)]
    public string? IBAN { get; set; }
}
```

---

### 4️⃣ Update API Endpoint

#### Endpoint: `POST /api/Account/register-teacher`

**Request Body (Expected):**

```json
{
  "userName": "teacher_john",
  "email": "john@example.com",
  "password": "SecurePassword123!",
  "age": 35,
  "phoneNumber": "+966501234567",
  "salary": 8500.00,
  "iban": "SA0380000000608010167519"
}
```

**Response (Success - 200 OK):**

```json
{
  "success": true,
  "message": "Teacher registered successfully",
  "data": {
    "userId": 123,
    "userName": "teacher_john",
    "email": "john@example.com",
    "salary": 8500.00,
    "iban": "SA0380000000608010167519",
    "createdAt": "2025-11-27T10:30:00Z"
  }
}
```

**Response (Validation Error - 400 Bad Request):**

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "Salary": ["Salary must be a positive number"],
    "IBAN": ["Invalid IBAN format"]
  }
}
```

---

### 5️⃣ Update Service Layer

#### File: `AccountService.cs` or `TeacherService.cs`

```csharp
public async Task<ApiResponse<object>> RegisterTeacherAsync(TeacherRegisterDto dto)
{
    // Validate IBAN if provided
    if (!string.IsNullOrEmpty(dto.IBAN) && !IsValidIBAN(dto.IBAN))
    {
        return ApiResponse<object>.Failure("Invalid IBAN format");
    }

    var user = new ApplicationUser
    {
        UserName = dto.UserName,
        Email = dto.Email,
        Age = dto.Age,
        PhoneNumber = dto.PhoneNumber,
        Salary = dto.Salary, // ✅ NEW
        IBAN = dto.IBAN      // ✅ NEW
    };

    var result = await _userManager.CreateAsync(user, dto.Password);
    
    if (result.Succeeded)
    {
        await _userManager.AddToRoleAsync(user, "Teacher");
        return ApiResponse<object>.Success(new
        {
            UserId = user.Id,
            UserName = user.UserName,
            Email = user.Email,
            Salary = user.Salary,
            IBAN = user.IBAN,
            CreatedAt = DateTime.UtcNow
        });
    }

    return ApiResponse<object>.Failure("Failed to register teacher");
}

// Helper method for IBAN validation
private bool IsValidIBAN(string iban)
{
    // Basic IBAN validation (2 letters + 2 digits + up to 30 alphanumeric)
    return Regex.IsMatch(iban, @"^[A-Z]{2}[0-9]{2}[A-Z0-9]{1,30}$");
}
```

---

## 🔄 Full CRUD Operations

### **GET** - Retrieve Teacher Details

#### Endpoint: `GET /api/Teachers/{id}`

**Response:**

```json
{
  "id": 123,
  "userName": "teacher_john",
  "email": "john@example.com",
  "age": 35,
  "phoneNumber": "+966501234567",
  "salary": 8500.00,
  "iban": "SA0380000000608010167519",
  "createdAt": "2025-11-27T10:30:00Z"
}
```

---

### **PUT** - Update Teacher Information

#### Endpoint: `PUT /api/Teachers/{id}`

**Request Body:**

```json
{
  "userName": "teacher_john_updated",
  "email": "john_new@example.com",
  "age": 36,
  "phoneNumber": "+966509876543",
  "salary": 9000.00,
  "iban": "SA0380000000608010167520"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Teacher updated successfully"
}
```

---

### **DELETE** - Remove Teacher

#### Endpoint: `DELETE /api/Teachers/{id}`

**Response:**

```json
{
  "success": true,
  "message": "Teacher deleted successfully"
}
```

---

## ✅ Testing Checklist

بعد تطبيق التغييرات، تأكد من:

- [ ] يمكن إنشاء Teacher **بدون** Salary و IBAN (Optional)
- [ ] يمكن إنشاء Teacher **مع** Salary و IBAN
- [ ] Validation للـ Salary (يجب أن يكون موجب أو null)
- [ ] Validation للـ IBAN (صيغة صحيحة أو null)
- [ ] GET /api/Teachers/{id} يُرجع الحقول الجديدة
- [ ] PUT /api/Teachers/{id} يُحدّث الحقول الجديدة
- [ ] DELETE /api/Teachers/{id} يعمل بدون مشاكل
- [ ] Database migration تمت بنجاح

---

## 🧪 Sample Test Data

### Test Case 1: Teacher مع Salary و IBAN

```json
{
  "userName": "ahmed_teacher",
  "email": "ahmed@school.com",
  "password": "Ahmed@123",
  "age": 30,
  "phoneNumber": "+966501111111",
  "salary": 7500.50,
  "iban": "SA0380000000608010167519"
}
```

### Test Case 2: Teacher بدون Salary و IBAN

```json
{
  "userName": "fatima_teacher",
  "email": "fatima@school.com",
  "password": "Fatima@456",
  "age": 28,
  "phoneNumber": "+966502222222"
}
```

### Test Case 3: Validation Error - Invalid IBAN

```json
{
  "userName": "invalid_test",
  "email": "test@school.com",
  "password": "Test@789",
  "age": 32,
  "phoneNumber": "+966503333333",
  "salary": 6000.00,
  "iban": "INVALID_IBAN_123"  // ❌ Should fail validation
}
```

### Test Case 4: Validation Error - Negative Salary

```json
{
  "userName": "negative_test",
  "email": "negative@school.com",
  "password": "Negative@999",
  "age": 40,
  "phoneNumber": "+966504444444",
  "salary": -5000.00  // ❌ Should fail validation
}
```

---

## 🔒 Security Considerations

1. **Access Control:**
   - فقط `Admin` يستطيع إنشاء Teachers
   - Teachers يمكنهم رؤية salary و IBAN **الخاص بهم فقط**
   - Admin يمكنه رؤية جميع البيانات

2. **IBAN Encryption (Recommended):**
   - يفضل تخزين IBAN **مشفر** في Database
   - استخدام encryption مثل AES-256

```csharp
// Example encryption
public string EncryptIBAN(string iban)
{
    // Use AES or similar encryption
    return _encryptionService.Encrypt(iban);
}

public string DecryptIBAN(string encryptedIban)
{
    return _encryptionService.Decrypt(encryptedIban);
}
```

3. **Audit Log:**
   - تسجيل جميع التغييرات على Salary و IBAN
   - من قام بالتعديل + متى + القيمة القديمة والجديدة

---

## 📊 Database Migration

### Using Entity Framework Core

```bash
# Create migration
dotnet ef migrations add AddTeacherSalaryAndIBAN

# Update database
dotnet ef database update
```

### Migration File Example:

```csharp
public partial class AddTeacherSalaryAndIBAN : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<decimal>(
            name: "Salary",
            table: "AspNetUsers",
            type: "decimal(18,2)",
            nullable: true);

        migrationBuilder.AddColumn<string>(
            name: "IBAN",
            table: "AspNetUsers",
            type: "nvarchar(34)",
            maxLength: 34,
            nullable: true);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(
            name: "Salary",
            table: "AspNetUsers");

        migrationBuilder.DropColumn(
            name: "IBAN",
            table: "AspNetUsers");
    }
}
```

---

## ✔ BACKEND FIX CONFIRMATION

**بعد تطبيق التعديلات، يرجى الرد بـ:**

```
✔ BACKEND FIX CONFIRMED
- Database schema updated ✅
- DTOs updated ✅
- API endpoints working ✅
- Validation tested ✅
- Migration applied ✅
```

---

## 📞 Support

إذا واجهت أي مشكلة في التطبيق، يرجى التواصل مع فريق Frontend.

**Frontend Team:**
- File: `src/app/models/user.models.ts` (Updated ✅)
- File: `src/app/admin/add-user-modal/add-user-modal.ts` (Updated ✅)
- File: `src/app/admin/add-user-modal/add-user-modal.html` (Updated ✅)

---

**End of Report** 🎯
