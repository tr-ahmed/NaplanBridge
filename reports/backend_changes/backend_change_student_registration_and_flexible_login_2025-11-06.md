# 🔧 Backend Change Report

**Date:** November 6, 2025  
**Feature:** Student Registration Enhancement & Flexible Login System  
**Priority:** High  
**Affected Modules:** Authentication, User Registration

---

## 1. Reason for Change

### Current Issues:
1. **Student Registration (StudentRegisterDto)** currently only accepts:
   - `userName` (required)
   - `password` (required)
   - `year` (optional)
   - `age` (optional)

   **Missing critical fields:**
   - ❌ `firstName` - Required for proper user identification
   - ❌ `email` - Required for login and communication (currently frontend requires it but backend doesn't accept it)
   - ❌ `phoneNumber` - Optional but useful for contact

2. **Login System (LoginDto)** currently only accepts:
   - `email` (required)
   - `password` (required)

   **Problem:** Users cannot login with their username or phone number, which limits flexibility and user experience.

### User Requirements:
- Parents want to register their children with **first name** for better identification
- Students should be able to login using **email OR username OR phone number** for convenience
- Current frontend already collects `email` during registration but backend doesn't accept it

---

## 2. Required Backend Modifications

### 2.1 Student Registration Endpoint
**Endpoint:** `/api/Account/register-student`  
**Method:** `POST`  
**Action Required:** Modify `StudentRegisterDto` to include additional fields

### 2.2 Login Endpoint
**Endpoint:** `/api/Account/login`  
**Method:** `POST`  
**Action Required:** Modify `LoginDto` and authentication logic to support multiple login identifiers

---

## 3. Suggested Backend Implementation

### 3.1 Update StudentRegisterDto

**File:** `API/DTOs/StudentRegisterDto.cs`

```csharp
public class StudentRegisterDto
{
    [Required]
    [MinLength(3)]
    public string UserName { get; set; }
    
    [Required]
    [MinLength(2)]
    public string FirstName { get; set; }  // NEW FIELD
    
    [Required]
    [EmailAddress]
    public string Email { get; set; }  // NEW FIELD - Make it required
    
    [Phone]
    public string PhoneNumber { get; set; }  // NEW FIELD - Optional
    
    [Required]
    [MinLength(4)]
    [MaxLength(8)]
    public string Password { get; set; }
    
    public int Year { get; set; }
    
    public int Age { get; set; }
    
    public int? ParentId { get; set; }  // For linking to parent account
}
```

### 3.2 Update LoginDto

**File:** `API/DTOs/LoginDto.cs`

**Current:**
```csharp
public class LoginDto
{
    [Required]
    [EmailAddress]
    public string Email { get; set; }
    
    [Required]
    public string Password { get; set; }
}
```

**Proposed:**
```csharp
public class LoginDto
{
    [Required]
    public string Identifier { get; set; }  // Can be Email, Username, or Phone
    
    [Required]
    public string Password { get; set; }
}
```

### 3.3 Update Account Controller

**File:** `Controllers/AccountController.cs`

#### Register Student Action:
```csharp
[HttpPost("register-student")]
public async Task<ActionResult<UserDto>> RegisterStudent(StudentRegisterDto registerDto)
{
    // Check if email already exists
    if (await _userManager.Users.AnyAsync(x => x.Email == registerDto.Email.ToLower()))
        return BadRequest("Email is already taken");
    
    // Check if username already exists
    if (await _userManager.Users.AnyAsync(x => x.UserName == registerDto.UserName.ToLower()))
        return BadRequest("Username is already taken");
    
    // Check if phone number already exists (if provided)
    if (!string.IsNullOrEmpty(registerDto.PhoneNumber) && 
        await _userManager.Users.AnyAsync(x => x.PhoneNumber == registerDto.PhoneNumber))
        return BadRequest("Phone number is already registered");
    
    var user = new AppUser
    {
        UserName = registerDto.UserName.ToLower(),
        FirstName = registerDto.FirstName,
        Email = registerDto.Email.ToLower(),
        PhoneNumber = registerDto.PhoneNumber,
        Year = registerDto.Year,
        Age = registerDto.Age,
        ParentId = registerDto.ParentId
    };
    
    var result = await _userManager.CreateAsync(user, registerDto.Password);
    
    if (!result.Succeeded) return BadRequest(result.Errors);
    
    var roleResult = await _userManager.AddToRoleAsync(user, "Student");
    
    if (!roleResult.Succeeded) return BadRequest(result.Errors);
    
    return new UserDto
    {
        Id = user.Id,
        UserName = user.UserName,
        FirstName = user.FirstName,
        Email = user.Email,
        Token = await _tokenService.CreateToken(user)
    };
}
```

#### Login Action:
```csharp
[HttpPost("login")]
public async Task<ActionResult<UserDto>> Login(LoginDto loginDto)
{
    AppUser user = null;
    
    // Try to find user by Email, Username, or Phone
    if (loginDto.Identifier.Contains("@"))
    {
        // Looks like email
        user = await _userManager.Users
            .Include(u => u.Parent)
            .FirstOrDefaultAsync(x => x.Email == loginDto.Identifier.ToLower());
    }
    else if (loginDto.Identifier.All(char.IsDigit) || loginDto.Identifier.StartsWith("+"))
    {
        // Looks like phone number
        user = await _userManager.Users
            .Include(u => u.Parent)
            .FirstOrDefaultAsync(x => x.PhoneNumber == loginDto.Identifier);
    }
    else
    {
        // Treat as username
        user = await _userManager.Users
            .Include(u => u.Parent)
            .FirstOrDefaultAsync(x => x.UserName == loginDto.Identifier.ToLower());
    }
    
    if (user == null) return Unauthorized("Invalid credentials");
    
    var result = await _signInManager.CheckPasswordSignInAsync(user, loginDto.Password, false);
    
    if (!result.Succeeded) return Unauthorized("Invalid credentials");
    
    return new UserDto
    {
        Id = user.Id,
        UserName = user.UserName,
        FirstName = user.FirstName,
        Email = user.Email,
        Token = await _tokenService.CreateToken(user),
        Role = (await _userManager.GetRolesAsync(user)).FirstOrDefault()
    };
}
```

---

## 4. Database Impact

### 4.1 AppUser Entity Update

**File:** `Models/AppUser.cs`

Ensure the following properties exist:

```csharp
public class AppUser : IdentityUser<int>
{
    public string FirstName { get; set; }  // Should already exist or needs to be added
    public string Email { get; set; }      // Already exists in IdentityUser
    public string PhoneNumber { get; set; } // Already exists in IdentityUser
    public string UserName { get; set; }    // Already exists in IdentityUser
    public int Year { get; set; }
    public int Age { get; set; }
    public int? ParentId { get; set; }
    public AppUser Parent { get; set; }
    // ... other properties
}
```

### 4.2 Migration (if FirstName doesn't exist)

If `FirstName` column doesn't exist in `AspNetUsers` table:

```csharp
public partial class AddFirstNameToUsers : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<string>(
            name: "FirstName",
            table: "AspNetUsers",
            type: "nvarchar(100)",
            maxLength: 100,
            nullable: true);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(
            name: "FirstName",
            table: "AspNetUsers");
    }
}
```

---

## 5. Files to Modify or Create

### Must Modify:
1. `API/DTOs/StudentRegisterDto.cs` - Add firstName, email, phoneNumber
2. `API/DTOs/LoginDto.cs` - Change email to identifier
3. `Controllers/AccountController.cs` - Update RegisterStudent and Login methods
4. `Models/AppUser.cs` - Verify FirstName property exists

### May Need to Create/Modify:
5. `Migrations/YYYYMMDD_AddFirstNameToUsers.cs` - If FirstName doesn't exist
6. `API/DTOs/UserDto.cs` - Ensure it includes FirstName in response

---

## 6. Request and Response Examples

### 6.1 Register Student (Updated)

**Request:**
```json
POST /api/Account/register-student
Content-Type: application/json

{
  "userName": "ahmed_student",
  "firstName": "Ahmed",
  "email": "ahmed@example.com",
  "phoneNumber": "+61412345678",
  "password": "Pass123",
  "age": 12,
  "year": 7,
  "parentId": 5
}
```

**Success Response (200):**
```json
{
  "id": 123,
  "userName": "ahmed_student",
  "firstName": "Ahmed",
  "email": "ahmed@example.com",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "role": "Student"
}
```

**Error Response (400):**
```json
{
  "error": "Email is already taken"
}
```

### 6.2 Login (Updated)

**Request Option 1 - Email:**
```json
POST /api/Account/login
Content-Type: application/json

{
  "identifier": "ahmed@example.com",
  "password": "Pass123"
}
```

**Request Option 2 - Username:**
```json
{
  "identifier": "ahmed_student",
  "password": "Pass123"
}
```

**Request Option 3 - Phone:**
```json
{
  "identifier": "+61412345678",
  "password": "Pass123"
}
```

**Success Response (200):**
```json
{
  "id": 123,
  "userName": "ahmed_student",
  "firstName": "Ahmed",
  "email": "ahmed@example.com",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "role": "Student"
}
```

**Error Response (401):**
```json
{
  "error": "Invalid credentials"
}
```

---

## 7. Additional Considerations

### 7.1 Validation
- Email format must be validated
- Phone number format should follow international standards (E.164)
- Username should be unique and lowercase
- FirstName should have minimum 2 characters

### 7.2 Security
- Ensure all identifiers (email, username, phone) are unique in the database
- Add rate limiting to login endpoint to prevent brute force attacks
- Log all login attempts for security monitoring

### 7.3 Backward Compatibility
- If changing `LoginDto.Email` to `LoginDto.Identifier`, ensure existing mobile apps or frontend versions are updated
- Consider supporting both old and new login formats during transition period

### 7.4 Testing Required
- Test registration with all new fields
- Test login with email
- Test login with username
- Test login with phone number
- Test duplicate email/username/phone validation
- Test missing required fields

---

## 8. Frontend Updates Required (After Backend Changes)

Once backend changes are implemented:

1. ✅ **Add Student Component**: Already prepared to send firstName, email, phoneNumber
2. ✅ **Login Component**: Update to use `identifier` instead of `email` field
3. ✅ **API Service**: Update login and register methods to match new DTOs
4. ✅ **Validation Messages**: Update error handling for new validation rules

---

## 9. Questions for Backend Team

1. Does the `AppUser` entity already have a `FirstName` property?
2. Are there any existing users without email addresses that need migration?
3. Should phone numbers be validated against a specific country format?
4. Do you want to support partial username matching in login (case-insensitive)?
5. Should we add a "remember me" functionality to the login?

---

## 10. Timeline Estimate

- **DTO Updates:** 30 minutes
- **Controller Logic:** 1-2 hours
- **Database Migration:** 30 minutes (if needed)
- **Testing:** 1-2 hours
- **Total Estimate:** 3-5 hours

---

## 11. Approval Required

- [ ] Backend Team Lead
- [ ] Database Administrator (if migration required)
- [ ] Security Team (for login changes)
- [ ] Frontend Team Lead (for coordination)

---

**Report Generated:** November 6, 2025  
**Generated By:** AI Frontend Development Assistant  
**Contact:** Development Team
