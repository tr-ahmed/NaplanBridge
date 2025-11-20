# 🔧 Backend Change Report

**Date:** November 21, 2025  
**Feature:** JWT Token - Add Missing Claims for Cart Functionality  
**Priority:** 🔴 **HIGH** - Blocking parent users from using cart  
**Reported By:** Frontend Development Team

---

## 1. Reason for Change

### Current Issue:
The JWT token generated during login **does not include** `studentId` and `yearId` claims, which are **required** for:
1. ✅ Cart functionality (adding subscription plans)
2. ✅ Student-specific data filtering
3. ✅ Year-based course filtering
4. ✅ Parent accessing their children's data

### Console Evidence:
```javascript
🔐 Decoded JWT Token: {
  userId: '1',
  userName: 'admin',
  studentId: undefined,     // ❌ MISSING
  yearId: undefined,        // ❌ MISSING
  roles: ['Admin', 'Teacher', 'Parent', 'Student', 'Member']
}

⚠️ studentId NOT found in token! Cart will not work.
⚠️ yearId NOT found in token! Year filtering disabled.
```

### Impact:
- ❌ **Parents cannot add items to cart** (blocking critical functionality)
- ❌ Students cannot see their personalized content
- ❌ Year filtering doesn't work automatically
- ❌ Frontend has to make additional API calls to get this data

---

## 2. Required Backend Implementation

### A. Add Claims to JWT Token Generation

**File to modify:** `Services/TokenService.cs` (or wherever JWT tokens are generated)

**Current implementation (assumed):**
```csharp
private string GenerateJwtToken(ApplicationUser user)
{
    var claims = new List<Claim>
    {
        new Claim("userId", user.Id),
        new Claim("userName", user.UserName),
        new Claim(ClaimTypes.Name, user.UserName),
        // Add roles...
    };
    
    // Missing studentId and yearId claims!
    
    var token = new JwtSecurityToken(...);
    return new JwtSecurityTokenHandler().WriteToken(token);
}
```

**Required changes:**

```csharp
private async Task<string> GenerateJwtToken(ApplicationUser user)
{
    var claims = new List<Claim>
    {
        new Claim("userId", user.Id),
        new Claim("userName", user.UserName),
        new Claim(ClaimTypes.Name, user.UserName)
    };
    
    // ✅ ADD: Check if user is a Student
    var roles = await _userManager.GetRolesAsync(user);
    
    if (roles.Contains("Student"))
    {
        // User IS a student - add their studentId and yearId
        var student = await _context.Students
            .FirstOrDefaultAsync(s => s.UserId == user.Id);
            
        if (student != null)
        {
            claims.Add(new Claim("studentId", student.Id.ToString()));
            
            if (student.YearId.HasValue)
            {
                claims.Add(new Claim("yearId", student.YearId.Value.ToString()));
            }
        }
    }
    else if (roles.Contains("Parent"))
    {
        // ✅ ADD: For Parents - add their PRIMARY child's studentId
        var parent = await _context.Parents
            .Include(p => p.Students)
            .FirstOrDefaultAsync(p => p.UserId == user.Id);
            
        if (parent != null && parent.Students.Any())
        {
            // Use the first/primary student
            var primaryStudent = parent.Students
                .OrderBy(s => s.Id)
                .FirstOrDefault();
                
            if (primaryStudent != null)
            {
                claims.Add(new Claim("studentId", primaryStudent.Id.ToString()));
                
                if (primaryStudent.YearId.HasValue)
                {
                    claims.Add(new Claim("yearId", primaryStudent.YearId.Value.ToString()));
                }
            }
        }
    }
    
    // Add roles to claims
    foreach (var role in roles)
    {
        claims.Add(new Claim(ClaimTypes.Role, role));
    }
    
    var token = new JwtSecurityToken(
        issuer: _configuration["Jwt:Issuer"],
        audience: _configuration["Jwt:Audience"],
        claims: claims,
        expires: DateTime.UtcNow.AddHours(24),
        signingCredentials: credentials
    );
    
    return new JwtSecurityTokenHandler().WriteToken(token);
}
```

### B. Alternative Approach (If Parent has Multiple Students)

If a parent has **multiple children**, consider:

**Option 1:** Return array of student IDs
```csharp
// Add all student IDs as comma-separated string
var studentIds = string.Join(",", parent.Students.Select(s => s.Id));
claims.Add(new Claim("studentIds", studentIds));
```

**Option 2:** Add endpoint for switching active student
```csharp
// POST /api/Account/switch-student/{studentId}
// Returns new JWT token with the selected studentId
```

---

## 3. Database Impact

**No database changes required** - only modification to JWT token generation logic.

---

## 4. Files to Modify

### Required:
1. ✅ `Services/TokenService.cs` or `Controllers/AccountController.cs`
   - Modify `GenerateJwtToken()` method
   - Add logic to include `studentId` and `yearId` claims

### Optional (for better parent support):
2. ✅ `Controllers/AccountController.cs`
   - Add `SwitchStudent(int studentId)` endpoint
   - Allow parents to switch between their children

3. ✅ `DTOs/LoginResponseDto.cs`
   - Add `StudentId` and `YearId` to response (optional, for debugging)

---

## 5. API Endpoint Changes

### Modified Endpoint:

**POST `/api/Account/login`**

**Current Response:**
```json
{
  "token": "eyJhbGc...",
  "userId": "1",
  "userName": "admin",
  "roles": ["Parent", "Student"]
}
```

**Updated Response (same, but token includes new claims):**
```json
{
  "token": "eyJhbGc...",  // ✅ Now includes studentId & yearId
  "userId": "1",
  "userName": "admin",
  "roles": ["Parent", "Student"],
  "studentId": 5,         // ✅ Optional: add to response
  "yearId": 2             // ✅ Optional: add to response
}
```

**Decoded JWT Token (new structure):**
```json
{
  "userId": "1",
  "userName": "admin",
  "studentId": "5",      // ✅ NEW
  "yearId": "2",         // ✅ NEW
  "role": ["Parent", "Student"],
  "exp": 1732233600
}
```

---

## 6. Testing Checklist

### Test Case 1: Student Login
```
1. Login as Student
2. Decode JWT token
3. ✅ Verify: studentId = student's own ID
4. ✅ Verify: yearId = student's year
```

### Test Case 2: Parent Login (Single Child)
```
1. Login as Parent with 1 child
2. Decode JWT token
3. ✅ Verify: studentId = child's ID
4. ✅ Verify: yearId = child's year
```

### Test Case 3: Parent Login (Multiple Children)
```
1. Login as Parent with multiple children
2. Decode JWT token
3. ✅ Verify: studentId = first/primary child's ID
4. ✅ Verify: can switch to another child (if endpoint added)
```

### Test Case 4: Admin/Teacher Login
```
1. Login as Admin or Teacher
2. Decode JWT token
3. ✅ Verify: studentId = undefined (expected)
4. ✅ Verify: yearId = undefined (expected)
```

### Test Case 5: Cart Functionality
```
1. Login as Parent
2. Navigate to Courses
3. Add subscription plan to cart
4. ✅ Verify: No console errors
5. ✅ Verify: Item added successfully
```

---

## 7. Expected Frontend Behavior After Fix

**Before (Current):**
```javascript
🔐 Decoded JWT Token: {
  userId: '1',
  userName: 'admin',
  studentId: undefined,     // ❌ Missing
  yearId: undefined         // ❌ Missing
}
⚠️ studentId NOT found in token! Cart will not work.
❌ Cannot add to cart - User role is not Student or Parent
```

**After (Fixed):**
```javascript
🔐 Decoded JWT Token: {
  userId: '1',
  userName: 'parent1',
  studentId: '5',           // ✅ Present
  yearId: '2',              // ✅ Present
  roles: ['Parent']
}
✅ studentId found in token: 5
✅ yearId found in token: 2
✅ Added to cart successfully
```

---

## 8. Migration Notes

### For Existing Users:
- ✅ No database migration needed
- ✅ Users need to **re-login** to get new token with claims
- ✅ Consider: Auto-refresh tokens on next API call (optional)

### For Frontend:
- ✅ No changes needed - already checking for `studentId` and `yearId`
- ✅ Will automatically work when backend deploys the fix

---

## 9. Related Issues

This fix will also resolve:
1. ✅ Cart not working for parents
2. ✅ Year filtering not working automatically
3. ✅ Student-specific content not loading
4. ✅ Extra API calls to fetch student data

---

## 10. Priority & Timeline

**Priority:** 🔴 **CRITICAL**  
**Reason:** Blocks core functionality (purchasing subscriptions)  
**Recommended Timeline:** Immediate (today if possible)

---

## 11. Additional Recommendations

### Consider Adding:
1. **Refresh Token Mechanism**
   - Allow tokens to be refreshed without re-login
   - Update claims when student data changes

2. **Parent-Specific Endpoint**
   ```csharp
   // POST /api/Account/select-student/{studentId}
   // Returns new JWT with selected student's ID
   ```

3. **Token Validation Endpoint**
   ```csharp
   // GET /api/Account/validate-token
   // Returns current token claims for debugging
   ```

---

## 12. Questions for Backend Team

1. ❓ **Parent with multiple students:**  
   Should we add all student IDs or just the primary one?

2. ❓ **Student switching:**  
   Do we need an endpoint for parents to switch between children?

3. ❓ **Token expiration:**  
   Should we implement token refresh to update claims dynamically?

4. ❓ **Backward compatibility:**  
   Should we maintain compatibility with old tokens (without claims)?

---

## 13. Summary

### What needs to be done:
1. ✅ Modify JWT token generation to include `studentId` claim
2. ✅ Modify JWT token generation to include `yearId` claim
3. ✅ Add logic for Parent users (use their child's studentId)
4. ✅ Test all user roles (Student, Parent, Admin, Teacher)

### Expected Result:
- ✅ Parents can add items to cart
- ✅ Students see personalized content
- ✅ Year filtering works automatically
- ✅ No frontend changes required

---

**Status:** 🟡 **Awaiting Backend Implementation**  
**Blocking:** Cart functionality for all Parent users  
**Next Step:** Backend team to implement and deploy fix

---

**Contact:** Frontend Development Team  
**Report Date:** November 21, 2025
