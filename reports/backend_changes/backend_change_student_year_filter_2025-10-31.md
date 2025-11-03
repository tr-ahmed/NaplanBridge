# 🔧 Backend Change Report - Student Year Filtering

## Report Date: October 31, 2025
## Feature: Auto-filter subjects by student's year level

---

## 1. Reason for Change

**Problem:** 
The frontend currently shows all subjects from all years to students, causing confusion. Students should only see subjects for their enrolled year level.

**Root Cause:**
The JWT token returned by `/api/Account/login` does not include the student's `yearId` claim, preventing the frontend from auto-filtering subjects.

**Current Token Payload:**
```json
{
  "nameid": "8",
  "unique_name": "ali_ahmed",
  "role": ["Student", "Member"],
  "nbf": 1761935355,
  "exp": 1762540155,
  "iat": 1761935355
}
```

**Required Token Payload:**
```json
{
  "nameid": "8",
  "unique_name": "ali_ahmed",
  "role": ["Student", "Member"],
  "yearId": "1",  // ⚠️ MISSING - Must be added
  "nbf": 1761935355,
  "exp": 1762540155,
  "iat": 1761935355
}
```

---

## 2. Required or Modified Endpoint

### **Endpoint 1: Login**
* **URL:** `/api/Account/login`
* **Method:** `POST`
* **Controller:** `AccountController`
* **Action:** `Login`
* **Description:** Must include `yearId` claim in JWT token for students

### **Endpoint 2: Get User Profile (Optional)**
* **URL:** `/api/Account/profile`
* **Method:** `GET`
* **Controller:** `AccountController`
* **Action:** `GetProfile`
* **Description:** Return complete user profile including `yearId`

---

## 3. Suggested Backend Implementation

### **Step 1: Add YearId to JWT Claims**

**File:** `Services/AuthService.cs` or wherever JWT is generated

```csharp
private string GenerateJwtToken(User user)
{
    var claims = new List<Claim>
    {
        new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
        new Claim(ClaimTypes.Name, user.UserName),
        new Claim(ClaimTypes.Email, user.Email),
    };

    // Add roles
    var roles = await _userManager.GetRolesAsync(user);
    foreach (var role in roles)
    {
        claims.Add(new Claim(ClaimTypes.Role, role));
    }

    // ⚠️ NEW: Add YearId for students
    if (roles.Contains("Student") && user.YearId.HasValue)
    {
        claims.Add(new Claim("yearId", user.YearId.Value.ToString()));
    }

    var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]));
    var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha512);

    var token = new JwtSecurityToken(
        issuer: _configuration["Jwt:Issuer"],
        audience: _configuration["Jwt:Audience"],
        claims: claims,
        expires: DateTime.Now.AddDays(7),
        signingCredentials: creds
    );

    return new JwtSecurityTokenHandler().WriteToken(token);
}
```

### **Step 2: Ensure User Model Has YearId**

**File:** `Models/User.cs`

```csharp
public class User : IdentityUser<int>
{
    public string FirstName { get; set; }
    public string LastName { get; set; }
    public DateTime? DateOfBirth { get; set; }
    
    // ⚠️ Verify this exists
    public int? YearId { get; set; }
    
    [ForeignKey("YearId")]
    public virtual Year Year { get; set; }
    
    // Other properties...
}
```

### **Step 3: Return Enhanced Response (Optional)**

**File:** `Controllers/AccountController.cs`

```csharp
[HttpPost("login")]
public async Task<IActionResult> Login([FromBody] LoginDto loginDto)
{
    var user = await _userManager.FindByEmailAsync(loginDto.Email);
    
    if (user == null || !await _userManager.CheckPasswordAsync(user, loginDto.Password))
    {
        return Unauthorized(new { message = "Invalid credentials" });
    }

    var roles = await _userManager.GetRolesAsync(user);
    var token = GenerateJwtToken(user);

    return Ok(new
    {
        userName = user.UserName,
        token = token,
        roles = roles,
        yearId = user.YearId,  // ⚠️ NEW: Include in response
        yearName = user.Year?.Name  // Optional: Include year name
    });
}
```

---

## 4. Database Impact

### **Verify Existing Schema:**

```sql
-- Check if YearId exists in AspNetUsers or Students table
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'AspNetUsers' 
  AND COLUMN_NAME = 'YearId';
```

### **If Column Doesn't Exist:**

```sql
-- Add YearId to Users table
ALTER TABLE AspNetUsers
ADD YearId INT NULL;

-- Add foreign key constraint
ALTER TABLE AspNetUsers
ADD CONSTRAINT FK_AspNetUsers_Years 
FOREIGN KEY (YearId) REFERENCES Years(Id);

-- Create index for performance
CREATE INDEX IX_AspNetUsers_YearId 
ON AspNetUsers(YearId);
```

### **Update Existing Student Records:**

```sql
-- Example: Set YearId for existing students based on age or enrollment
UPDATE AspNetUsers
SET YearId = CASE
    WHEN YEAR(GETDATE()) - YEAR(DateOfBirth) = 13 THEN 1  -- Year 7
    WHEN YEAR(GETDATE()) - YEAR(DateOfBirth) = 14 THEN 2  -- Year 8
    WHEN YEAR(GETDATE()) - YEAR(DateOfBirth) = 15 THEN 3  -- Year 9
    ELSE NULL
END
WHERE EXISTS (
    SELECT 1 FROM AspNetUserRoles ur
    INNER JOIN AspNetRoles r ON ur.RoleId = r.Id
    WHERE ur.UserId = AspNetUsers.Id AND r.Name = 'Student'
);
```

---

## 5. Files to Modify or Create

### **Required Modifications:**
1. ✅ `Services/AuthService.cs` or `Services/TokenService.cs`
   - Add `yearId` claim to JWT generation

2. ✅ `Controllers/AccountController.cs`
   - Include `yearId` in login response

3. ⚠️ `Models/User.cs` (if YearId doesn't exist)
   - Add `YearId` property

4. ⚠️ `Migrations/2025xxxx_AddYearIdToUsers.cs` (if needed)
   - Add migration for YearId column

### **Optional Enhancements:**
5. 🔄 `Controllers/SubjectsController.cs`
   - Add server-side filtering by yearId for students

6. 🔄 `DTOs/UserDto.cs`
   - Include yearId in user DTOs

---

## 6. Request and Response Examples

### **Login Request:**
```http
POST /api/Account/login
Content-Type: application/json

{
  "email": "ali_ahmed@naplan.edu",
  "password": "Student@123"
}
```

### **Current Response (Incomplete):**
```json
{
  "userName": "ali_ahmed",
  "token": "eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9...",
  "roles": ["Student", "Member"]
}
```

### **Required Response (Enhanced):**
```json
{
  "userName": "ali_ahmed",
  "token": "eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9...",
  "roles": ["Student", "Member"],
  "yearId": 1,  // ⚠️ NEW
  "yearName": "Year 7"  // Optional but helpful
}
```

### **Decoded Token (After Fix):**
```json
{
  "nameid": "8",
  "unique_name": "ali_ahmed",
  "email": "ali_ahmed@naplan.edu",
  "role": ["Student", "Member"],
  "yearId": "1",  // ✅ NOW INCLUDED
  "nbf": 1761935355,
  "exp": 1762540155,
  "iat": 1761935355
}
```

---

## 7. Frontend Impact (Already Implemented)

The frontend is ready to handle `yearId`:

```typescript
// auth.service.ts - Token decoder
private decodeToken(token: string): any {
  const parsed = JSON.parse(atob(token.split('.')[1]));
  return {
    id: parsed.nameid,
    userName: parsed.unique_name,
    role: Array.isArray(parsed.role) ? parsed.role : [parsed.role],
    yearId: parsed.yearId ? parseInt(parsed.yearId) : null  // ✅ Ready
  };
}

// courses.component.ts - Auto-filter for students
if (isStudent && user.yearId) {
  this.selectedYearId.set(user.yearId);  // ✅ Auto-filter
}
```

---

## 8. Testing Checklist

### **Backend Testing:**
- [ ] JWT token includes `yearId` claim for students
- [ ] Login response includes `yearId` field
- [ ] Token decodes correctly with yearId
- [ ] Non-student users don't get yearId claim
- [ ] Database has YearId column populated

### **Frontend Testing:**
- [ ] Student logs in successfully
- [ ] Console shows: `🎓 Student detected - Auto-filtering for Year: 1`
- [ ] Only subjects for student's year are displayed
- [ ] Year selector is hidden for students
- [ ] Parent/Admin/Teacher still see year selector

### **Integration Testing:**
- [ ] Student with Year 7 sees only Year 7 subjects (3 subjects)
- [ ] Student with Year 8 sees only Year 8 subjects (3 subjects)
- [ ] Year filter persists after page reload
- [ ] No errors in console or network tab

---

## 9. Priority & Timeline

| Task | Priority | Estimated Time | Complexity |
|------|----------|----------------|------------|
| Add yearId to JWT claims | 🔴 Critical | 30 min | Low |
| Update login response | 🔴 Critical | 15 min | Low |
| Database migration (if needed) | 🟡 High | 45 min | Medium |
| Update existing records | 🟡 High | 30 min | Low |
| Testing & verification | 🟢 Medium | 1 hour | Low |

**Total Estimated Time:** 2-3 hours

---

## 10. Rollback Plan

If issues occur:

1. **Remove yearId claim from JWT:**
   ```csharp
   // Comment out or remove
   // claims.Add(new Claim("yearId", user.YearId.Value.ToString()));
   ```

2. **Frontend will fallback gracefully:**
   ```typescript
   // Frontend already handles missing yearId
   yearId: parsed.yearId ? parseInt(parsed.yearId) : null
   ```

3. **Database rollback (if migration applied):**
   ```sql
   ALTER TABLE AspNetUsers DROP CONSTRAINT FK_AspNetUsers_Years;
   ALTER TABLE AspNetUsers DROP COLUMN YearId;
   ```

---

## 11. Success Criteria

✅ **Backend is ready when:**
1. JWT token contains `yearId` claim for students
2. Login API returns `yearId` in response body
3. All existing students have YearId populated in database
4. Token can be decoded and yearId extracted

✅ **Integration is successful when:**
1. Student logs in and sees only their year's subjects
2. Year selector hidden for students
3. No JavaScript errors
4. Cart and all features work normally

---

## 12. Additional Notes

### **Security Considerations:**
- ✅ YearId in JWT is read-only (user can't modify)
- ✅ Server should still validate yearId on API calls
- ✅ Students shouldn't be able to access other years' data via API

### **Performance Optimization:**
- Add database index on `YearId` column
- Cache user profile data in frontend
- Consider adding yearId to all student-related DTOs

### **Future Enhancements:**
- Add year promotion feature (move students to next year)
- Track year history (student's progress through years)
- Allow admins to bulk assign years to students

---

**Report Status:** ✅ Complete & Ready for Backend Team  
**Next Action:** Backend team to implement JWT token enhancement  
**Frontend Status:** ✅ Already implemented and waiting for backend changes  
**Blocking Issue:** Yes - Students currently see all years until this is fixed
