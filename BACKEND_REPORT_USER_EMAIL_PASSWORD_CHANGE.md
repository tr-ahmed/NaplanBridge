# 📌 BACKEND REPORT - User Email & Password Change Endpoints

**Date:** December 1, 2025  
**Status:** 🔴 MISSING ENDPOINTS  
**Priority:** HIGH  
**Impact:** User Management - Admin Panel

---

## 📋 Summary

The frontend User Management component is attempting to call two endpoints for changing user email and password, but these endpoints return **404 Not Found** errors.

**Error Log:**
```
naplan2.runasp.net/api/Admin/change-user-email/24:1   Failed to load resource: the server responded with a status of 404 ()
error.interceptor.ts:61  404 Resource not found: https://naplan2.runasp.net/api/Admin/change-user-email/24
```

**Required Endpoints:**
1. `PUT /api/Admin/change-user-email/{userId}` - Change any user's email (Admin only)
2. `PUT /api/Admin/change-user-password/{userId}` - Change any user's password (Admin only)

---

## 🎯 Required Endpoint #1: Change User Email

### **PUT** `/api/Admin/change-user-email/{userId}`

**Description:** Allows admin to change any user's email address

**Authorization:** Admin role required

---

### 📝 Request Specification

**Route Parameters:**
- `userId` (int, required) - The ID of the user

**Request Body:**

```json
{
  "newEmail": "newemail@example.com"
}
```

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
Accept: application/json
```

---

### ✅ Response Specification

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Email updated successfully",
  "data": {
    "userId": 24,
    "userName": "teacher_john",
    "email": "newemail@example.com",
    "updatedAt": "2025-12-01T14:30:00Z"
  }
}
```

**Error Response - Not Found (404):**

```json
{
  "success": false,
  "message": "User not found",
  "errors": null
}
```

**Error Response - Duplicate Email (400):**

```json
{
  "success": false,
  "message": "Email is already in use",
  "errors": [
    {
      "code": "DuplicateEmail",
      "description": "Email 'newemail@example.com' is already taken."
    }
  ]
}
```

**Error Response - Invalid Email (400):**

```json
{
  "success": false,
  "message": "Invalid email format",
  "errors": [
    {
      "code": "InvalidEmail",
      "description": "The email format is invalid."
    }
  ]
}
```

**Error Response - Unauthorized (401):**

```json
{
  "success": false,
  "message": "Unauthorized",
  "errors": null
}
```

**Error Response - Forbidden (403):**

```json
{
  "success": false,
  "message": "Access denied. Admin role required.",
  "errors": null
}
```

---

## 🎯 Required Endpoint #2: Change User Password

### **PUT** `/api/Admin/change-user-password/{userId}`

**Description:** Allows admin to change any user's password

**Authorization:** Admin role required

---

### 📝 Request Specification

**Route Parameters:**
- `userId` (int, required) - The ID of the user

**Request Body:**

```json
{
  "newPassword": "NewSecurePassword123"
}
```

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
Accept: application/json
```

---

### ✅ Response Specification

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Password updated successfully",
  "data": {
    "userId": 24,
    "userName": "teacher_john",
    "updatedAt": "2025-12-01T14:30:00Z"
  }
}
```

**Error Response - Not Found (404):**

```json
{
  "success": false,
  "message": "User not found",
  "errors": null
}
```

**Error Response - Weak Password (400):**

```json
{
  "success": false,
  "message": "Password does not meet requirements",
  "errors": [
    {
      "code": "PasswordTooShort",
      "description": "Passwords must be at least 6 characters."
    },
    {
      "code": "PasswordRequiresNonAlphanumeric",
      "description": "Passwords must have at least one non alphanumeric character."
    },
    {
      "code": "PasswordRequiresDigit",
      "description": "Passwords must have at least one digit ('0'-'9')."
    },
    {
      "code": "PasswordRequiresUpper",
      "description": "Passwords must have at least one uppercase ('A'-'Z')."
    }
  ]
}
```

**Error Response - Unauthorized (401):**

```json
{
  "success": false,
  "message": "Unauthorized",
  "errors": null
}
```

**Error Response - Forbidden (403):**

```json
{
  "success": false,
  "message": "Access denied. Admin role required.",
  "errors": null
}
```

---

## 💻 Backend Implementation Guide

### Controller: `AdminController.cs`

```csharp
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;

namespace NaplanBridge.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class AdminController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _userManager;

        public AdminController(UserManager<ApplicationUser> userManager)
        {
            _userManager = userManager;
        }

        /// <summary>
        /// Change user email (Admin only)
        /// </summary>
        [HttpPut("change-user-email/{userId}")]
        public async Task<IActionResult> ChangeUserEmail(int userId, [FromBody] ChangeEmailDto dto)
        {
            // Find user by ID
            var user = await _userManager.FindByIdAsync(userId.ToString());
            if (user == null)
            {
                return NotFound(new
                {
                    success = false,
                    message = "User not found",
                    errors = (object?)null
                });
            }

            // Validate email format
            if (string.IsNullOrWhiteSpace(dto.NewEmail) || !IsValidEmail(dto.NewEmail))
            {
                return BadRequest(new
                {
                    success = false,
                    message = "Invalid email format",
                    errors = new[]
                    {
                        new { code = "InvalidEmail", description = "The email format is invalid." }
                    }
                });
            }

            // Check if email is already in use
            var existingUser = await _userManager.FindByEmailAsync(dto.NewEmail);
            if (existingUser != null && existingUser.Id != user.Id)
            {
                return BadRequest(new
                {
                    success = false,
                    message = "Email is already in use",
                    errors = new[]
                    {
                        new { code = "DuplicateEmail", description = $"Email '{dto.NewEmail}' is already taken." }
                    }
                });
            }

            // Update email
            var token = await _userManager.GenerateChangeEmailTokenAsync(user, dto.NewEmail);
            var result = await _userManager.ChangeEmailAsync(user, dto.NewEmail, token);

            if (!result.Succeeded)
            {
                return BadRequest(new
                {
                    success = false,
                    message = "Failed to update email",
                    errors = result.Errors.Select(e => new { code = e.Code, description = e.Description })
                });
            }

            // Also update UserName to match email (if your system uses email as username)
            user.UserName = dto.NewEmail;
            await _userManager.UpdateAsync(user);

            return Ok(new
            {
                success = true,
                message = "Email updated successfully",
                data = new
                {
                    userId = user.Id,
                    userName = user.UserName,
                    email = user.Email,
                    updatedAt = DateTime.UtcNow
                }
            });
        }

        /// <summary>
        /// Change user password (Admin only)
        /// </summary>
        [HttpPut("change-user-password/{userId}")]
        public async Task<IActionResult> ChangeUserPassword(int userId, [FromBody] ChangePasswordDto dto)
        {
            // Find user by ID
            var user = await _userManager.FindByIdAsync(userId.ToString());
            if (user == null)
            {
                return NotFound(new
                {
                    success = false,
                    message = "User not found",
                    errors = (object?)null
                });
            }

            // Validate password
            var passwordValidators = _userManager.PasswordValidators;
            foreach (var validator in passwordValidators)
            {
                var validationResult = await validator.ValidateAsync(_userManager, user, dto.NewPassword);
                if (!validationResult.Succeeded)
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "Password does not meet requirements",
                        errors = validationResult.Errors.Select(e => new { code = e.Code, description = e.Description })
                    });
                }
            }

            // Remove old password and set new one
            var removePasswordResult = await _userManager.RemovePasswordAsync(user);
            if (!removePasswordResult.Succeeded)
            {
                return BadRequest(new
                {
                    success = false,
                    message = "Failed to remove old password",
                    errors = removePasswordResult.Errors.Select(e => new { code = e.Code, description = e.Description })
                });
            }

            var addPasswordResult = await _userManager.AddPasswordAsync(user, dto.NewPassword);
            if (!addPasswordResult.Succeeded)
            {
                return BadRequest(new
                {
                    success = false,
                    message = "Failed to set new password",
                    errors = addPasswordResult.Errors.Select(e => new { code = e.Code, description = e.Description })
                });
            }

            return Ok(new
            {
                success = true,
                message = "Password updated successfully",
                data = new
                {
                    userId = user.Id,
                    userName = user.UserName,
                    updatedAt = DateTime.UtcNow
                }
            });
        }

        private bool IsValidEmail(string email)
        {
            try
            {
                var addr = new System.Net.Mail.MailAddress(email);
                return addr.Address == email;
            }
            catch
            {
                return false;
            }
        }
    }
}
```

---

### DTOs

**ChangeEmailDto.cs:**

```csharp
using System.ComponentModel.DataAnnotations;

namespace NaplanBridge.API.DTOs
{
    public class ChangeEmailDto
    {
        [Required]
        [EmailAddress]
        public string NewEmail { get; set; } = string.Empty;
    }
}
```

**ChangePasswordDto.cs:**

```csharp
using System.ComponentModel.DataAnnotations;

namespace NaplanBridge.API.DTOs
{
    public class ChangePasswordDto
    {
        [Required]
        [MinLength(6)]
        public string NewPassword { get; set; } = string.Empty;
    }
}
```

---

## 🧪 Testing Guide

### Test Case 1: Change User Email (Success)

```http
PUT https://naplan2.runasp.net/api/Admin/change-user-email/24
Authorization: Bearer <ADMIN_TOKEN>
Content-Type: application/json

{
  "newEmail": "newemail@example.com"
}
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Email updated successfully",
  "data": {
    "userId": 24,
    "userName": "teacher_john",
    "email": "newemail@example.com",
    "updatedAt": "2025-12-01T14:30:00Z"
  }
}
```

---

### Test Case 2: Change User Email (Duplicate)

```http
PUT https://naplan2.runasp.net/api/Admin/change-user-email/24
Authorization: Bearer <ADMIN_TOKEN>
Content-Type: application/json

{
  "newEmail": "existing@example.com"
}
```

**Expected Response (400):**
```json
{
  "success": false,
  "message": "Email is already in use",
  "errors": [
    {
      "code": "DuplicateEmail",
      "description": "Email 'existing@example.com' is already taken."
    }
  ]
}
```

---

### Test Case 3: Change User Password (Success)

```http
PUT https://naplan2.runasp.net/api/Admin/change-user-password/24
Authorization: Bearer <ADMIN_TOKEN>
Content-Type: application/json

{
  "newPassword": "NewSecurePassword123!"
}
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Password updated successfully",
  "data": {
    "userId": 24,
    "userName": "teacher_john",
    "updatedAt": "2025-12-01T14:30:00Z"
  }
}
```

---

### Test Case 4: Change User Password (Weak Password)

```http
PUT https://naplan2.runasp.net/api/Admin/change-user-password/24
Authorization: Bearer <ADMIN_TOKEN>
Content-Type: application/json

{
  "newPassword": "123"
}
```

**Expected Response (400):**
```json
{
  "success": false,
  "message": "Password does not meet requirements",
  "errors": [
    {
      "code": "PasswordTooShort",
      "description": "Passwords must be at least 6 characters."
    }
  ]
}
```

---

### Test Case 5: Unauthorized Access (Non-Admin User)

```http
PUT https://naplan2.runasp.net/api/Admin/change-user-email/24
Authorization: Bearer <TEACHER_TOKEN>
Content-Type: application/json

{
  "newEmail": "test@example.com"
}
```

**Expected Response (403):**
```json
{
  "success": false,
  "message": "Access denied. Admin role required.",
  "errors": null
}
```

---

## 📋 Frontend Integration Checklist

- [x] Frontend calls `PUT /api/Admin/change-user-email/{userId}`
- [x] Frontend calls `PUT /api/Admin/change-user-password/{userId}`
- [ ] Backend endpoint `/api/Admin/change-user-email/{userId}` created
- [ ] Backend endpoint `/api/Admin/change-user-password/{userId}` created
- [ ] Email validation implemented
- [ ] Duplicate email check implemented
- [ ] Password strength validation implemented
- [ ] Admin role authorization implemented
- [ ] Error handling implemented
- [ ] Testing completed

---

## 🔐 Security Considerations

1. **Authorization:** Both endpoints require Admin role
2. **Email Validation:** Proper email format validation
3. **Duplicate Check:** Prevent duplicate emails
4. **Password Policy:** Enforce strong password requirements
5. **Audit Logging:** Log all email/password changes for security audit
6. **Rate Limiting:** Apply rate limiting to prevent abuse

---

## 📝 Implementation Notes

1. **Email Change:**
   - Use `UserManager.GenerateChangeEmailTokenAsync()` and `UserManager.ChangeEmailAsync()`
   - Update both `Email` and `UserName` fields if your system uses email as username
   - Check for duplicate emails before changing

2. **Password Change:**
   - Use `UserManager.RemovePasswordAsync()` then `UserManager.AddPasswordAsync()`
   - Validate password against configured password policy
   - Do NOT return old password or new password in response

3. **Response Format:**
   - Always return consistent JSON structure with `success`, `message`, and `data/errors`
   - Include updated timestamp for audit purposes

---

## ✅ Success Criteria

- [ ] Both endpoints return 200 OK on success
- [ ] Both endpoints return 404 when user not found
- [ ] Email endpoint returns 400 for duplicate email
- [ ] Email endpoint returns 400 for invalid email format
- [ ] Password endpoint returns 400 for weak password
- [ ] Both endpoints return 401/403 for unauthorized access
- [ ] Frontend successfully updates user email
- [ ] Frontend successfully updates user password
- [ ] Error messages are clear and user-friendly

---

## 🔗 Related Files

**Frontend:**
- `src/app/admin/user-managment/user-managment.ts` - Line 312 (changeUserEmail)
- `src/app/admin/user-managment/user-managment.ts` - Line 400 (changeUserPassword)

**Backend (To Be Created):**
- `Controllers/AdminController.cs` - Add new endpoints
- `DTOs/ChangeEmailDto.cs` - Create DTO
- `DTOs/ChangePasswordDto.cs` - Create DTO

---

**Report Generated:** December 1, 2025  
**Frontend File:** `user-managment.ts`  
**Error:** 404 Not Found for `/api/Admin/change-user-email/{userId}`
