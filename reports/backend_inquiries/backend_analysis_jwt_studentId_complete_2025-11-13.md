# 🔐 JWT Token & Student Claims - Complete Backend Analysis Report

**Date:** November 13, 2025  
**Report Type:** Technical Analysis & Implementation Status  
**Priority:** 🔴 HIGH (Critical for Cart & Frontend Features)

---

## 📋 Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current JWT Implementation](#current-jwt-implementation)
3. [Database Structure](#database-structure)
4. [Authentication Endpoints](#authentication-endpoints)
5. [User Model Structure](#user-model-structure)
6. [Answers to Frontend Questions](#answers-to-frontend-questions)
7. [Current Issues & Solutions](#current-issues--solutions)
8. [Testing Guide](#testing-guide)
9. [Recommendations](#recommendations)

---

## 📊 Executive Summary

### Current Status: ⚠️ **NEEDS VERIFICATION**

The backend should include `studentId` and `yearId` claims in JWT tokens for student users. This report analyzes the expected implementation and provides guidance for both backend and frontend teams.

### Key Requirements:

✅ **`yearId` Claim:** Should be added to JWT token for students  
✅ **`studentId` Claim:** Should be added to JWT token for students  
✅ **Login Response:** Should include `yearId` for students  
✅ **Database Structure:** Proper relationships between User, Student, and Year  
✅ **Entity Loading:** Student entity should be included in login query

---

## 🔧 1. Current JWT Implementation

### A. Expected JWT Token Generation Code

**File:** `API\Services\Implementations\TokenService.cs`

```csharp
public async Task<string> CreateToken(User user)
{
    var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(config["TokenKey"]!));

    var claims = new List<Claim>
    {
        new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
        new Claim(ClaimTypes.Name, user.UserName!),
        new Claim(ClaimTypes.Email, user.Email!),
    };

    var roles = await userManager.GetRolesAsync(user);
    claims.AddRange(roles.Select(role => new Claim(ClaimTypes.Role, role)));

    // ✅ CRITICAL: Add Student ID and YearId to token if user is a student
    if (roles.Contains("Student") && user.Student != null)
    {
        claims.Add(new Claim("yearId", user.Student.YearId.ToString()));
        claims.Add(new Claim("studentId", user.Student.Id.ToString())); // ✅ THIS IS ESSENTIAL
    }

    var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha512Signature);

    var tokenDescriptor = new SecurityTokenDescriptor
    {
        Subject = new ClaimsIdentity(claims),
        Expires = DateTime.UtcNow.AddDays(7),
        SigningCredentials = creds,
    };

    var tokenHandler = new JwtSecurityTokenHandler();
    var token = tokenHandler.CreateToken(tokenDescriptor);

    return tokenHandler.WriteToken(token);
}
```

### B. Expected JWT Token Claims (Decoded)

When a student logs in, the JWT token should contain:

```json
{
  "nameid": "9dd137f3-85b5-4988-8305-1d7491610d21",    // ✅ User.Id (from AspNetUsers table)
  "unique_name": "hijaq@mailinator.com",
  "email": "hijaq@mailinator.com",
  "role": ["Student"],
  "yearId": "1",                                        // ✅ Student.YearId (from Students table)
  "studentId": "1",                                     // ✅ Student.Id (from Students table)
  "nbf": 1737849600,
  "exp": 1738454400,
  "iat": 1737849600
}
```

**⚠️ IMPORTANT DISTINCTION:**

- `nameid` (User.Id): User's ID from `AspNetUsers` table (e.g., 9dd137f3-85b5-4988-8305-1d7491610d21)
- `studentId`: Student's ID from `Students` table (e.g., 1)
- **These are TWO DIFFERENT IDs!**

---

## 🗄️ 2. Database Structure

### A. Entity Relationship Diagram

```
┌─────────────────────┐
│  AspNetUsers (User) │
│  - Id (Guid)        │ ◄────┐
│  - UserName         │      │
│  - Email            │      │
│  - FirstName        │      │
│  - LastName         │      │
│  - PhoneNumber      │      │
└─────────────────────┘      │
          │                  │
          │ 1:1              │
          ▼                  │
┌─────────────────────┐      │
│     Students        │      │
│  - Id (PK)          │      │ UserId (FK)
│  - UserId (FK)──────┼──────┘
│  - ParentId (FK)    │
│  - YearId (FK)      │
└─────────────────────┘
          │
          │ M:1
          ▼
┌─────────────────────┐
│       Years         │
│  - Id (PK)          │
│  - YearNumber       │ (e.g., 7, 8, 9)
└─────────────────────┘
```

### B. Database Tables

#### User Table (`AspNetUsers`)

| Column | Type | Description |
|--------|------|-------------|
| `Id` | uniqueidentifier (PK) | User's unique ID (GUID) |
| `UserName` | nvarchar | Login username |
| `Email` | nvarchar | Email address |
| `FirstName` | nvarchar | User's first name |
| `LastName` | nvarchar | User's last name |
| `PhoneNumber` | nvarchar | Phone number |

#### Student Table (`Students`)

| Column | Type | Description |
|--------|------|-------------|
| `Id` | int (PK) | **Student's ID (1, 2, 3...)** - Used for Cart! |
| `UserId` | uniqueidentifier (FK) | References AspNetUsers.Id |
| `ParentId` | uniqueidentifier (FK) | Parent's User.Id |
| `YearId` | int (FK) | References Years.Id |

#### Year Table (`Years`)

| Column | Type | Description |
|--------|------|-------------|
| `Id` | int (PK) | Year ID (1, 2, 3...) |
| `YearNumber` | int | Academic year (7, 8, 9...) |

### C. Sample Data

**Users Table:**
```sql
Id                                   | UserName   | Email                    | FirstName
-------------------------------------|------------|--------------------------|----------
9dd137f3-85b5-4988-8305-1d7491610d21 | hijaq      | hijaq@mailinator.com     | Laurel
a1b2c3d4-5678-90ab-cdef-1234567890ab | ali_ahmed  | ali_ahmed@naplan.edu     | Ali
b2c3d4e5-6789-01bc-def1-234567890abc | maryam_h   | maryam_hassan@naplan.edu | Maryam
```

**Students Table:**
```sql
Id | UserId                               | ParentId                             | YearId
---|--------------------------------------|--------------------------------------|--------
1  | 9dd137f3-85b5-4988-8305-1d7491610d21 | ...                                  | 1
2  | a1b2c3d4-5678-90ab-cdef-1234567890ab | ...                                  | 1
3  | b2c3d4e5-6789-01bc-def1-234567890abc | ...                                  | 2
```

**Years Table:**
```sql
Id | YearNumber
---|------------
1  | 7
2  | 8
3  | 9
```

---

## 🔐 3. Authentication Endpoints

### A. POST `/api/Account/login` or `/api/Auth/login`

#### Request:

```json
{
  "identifier": "hijaq@mailinator.com", // Can be email, username, or phone
  "password": "Student@123"
}
```

#### Expected Response (Student):

```json
{
  "userName": "hijaq",
  "token": "eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9...",
  "roles": ["Student"],
  "userId": "9dd137f3-85b5-4988-8305-1d7491610d21",  // ✅ User.Id (from AspNetUsers)
  "userProfile": {
    "id": "9dd137f3-85b5-4988-8305-1d7491610d21",
    "email": "hijaq@mailinator.com",
    "phoneNumber": "+61412345678"
  },
  "yearId": 1                                         // ✅ Student.YearId (ONLY for students)
}
```

#### Expected Code Implementation:

**File:** `API\Controllers\AccountController.cs` or `AuthController.cs`

```csharp
[HttpPost("login")]
public async Task<ActionResult<UserDto>> Login(LoginDto loginDto)
{
    User? user = null;

    // ✅ Find user by Email, Username, or Phone
    if (loginDto.Identifier.Contains("@"))
    {
        user = await userManager.Users
            .Include(u => u.Student)              // ✅ CRITICAL: Load Student entity
                .ThenInclude(s => s.Year)
            .FirstOrDefaultAsync(x => x.Email == loginDto.Identifier.ToLower());
    }
    else if (loginDto.Identifier.All(char.IsDigit) || loginDto.Identifier.StartsWith("+"))
    {
        user = await userManager.Users
            .Include(u => u.Student)              // ✅ CRITICAL: Load Student entity
                .ThenInclude(s => s.Year)
            .FirstOrDefaultAsync(x => x.PhoneNumber == loginDto.Identifier);
    }
    else
    {
        user = await userManager.Users
            .Include(u => u.Student)              // ✅ CRITICAL: Load Student entity
                .ThenInclude(s => s.Year)
            .FirstOrDefaultAsync(x => x.UserName == loginDto.Identifier.ToLower());
    }

    if (user == null)
        return Unauthorized("Invalid credentials");

    var result = await userManager.CheckPasswordAsync(user, loginDto.Password);
    if (!result)
        return Unauthorized("Invalid credentials");

    var token = await tokenService.CreateToken(user); // ✅ Token includes studentId & yearId
    var roles = await userManager.GetRolesAsync(user);

    var userDto = new UserDto
    {
        UserName = user.UserName!,
        Token = token,
        Roles = roles,
        UserId = user.Id,
        UserProfile = new UserProfileDto
        {
            Id = user.Id,
            Email = user.Email!,
            PhoneNumber = user.PhoneNumber,
        },
    };

    // ✅ For students, include yearId in response
    if (roles.Contains("Student") && user.Student != null)
    {
        return Ok(new
        {
            userName = userDto.UserName,
            token = userDto.Token,
            roles = userDto.Roles,
            userId = userDto.UserId,
            userProfile = userDto.UserProfile,
            yearId = user.Student.YearId,         // ✅ Include yearId for students
        });
    }

    return Ok(userDto);
}
```

---

### B. POST `/api/Account/register-student`

#### Request:

```json
{
  "userName": "test_student",
  "firstName": "Test",
  "lastName": "Student",
  "email": "test.student@example.com",
  "phoneNumber": "+61412345678",
  "password": "Pass123!",
  "yearId": 1,                    // YearId (must exist in Years table)
  "parentId": "..."               // Optional, defaults to logged-in parent
}
```

#### Response:

```json
{
  "userName": "test_student",
  "firstName": "Test",
  "lastName": "Student",
  "email": "test.student@example.com",
  "phoneNumber": "+61412345678",
  "roles": ["Student"]
}
```

---

## 👤 4. User Model Structure

### A. User Entity

**File:** `API\Entities\User.cs` or `Domain\Entities\User.cs`

```csharp
public class User : IdentityUser<Guid>  // or <string> depending on your implementation
{
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // ✅ Navigation property to Student (1:1 relationship)
    public Student? Student { get; set; }

    // ✅ Students where this user is the parent (1:M relationship)
    public ICollection<Student> Children { get; set; } = new List<Student>();

    // Other collections...
}
```

### B. Student Entity

**File:** `API\Entities\Student.cs`

```csharp
public class Student
{
    public int Id { get; set; }                    // ✅ Student's ID (used for Cart)

    // ✅ Navigation properties
    public Guid UserId { get; set; }               // FK to AspNetUsers.Id
    public User User { get; set; } = null!;

    public Guid? ParentId { get; set; }            // FK to Parent's User.Id
    public User? Parent { get; set; }

    public int YearId { get; set; }                // FK to Years.Id
    public Year? Year { get; set; }

    // Collections...
    public ICollection<CartItem> CartItems { get; set; } = new List<CartItem>();
    public ICollection<Subscription> Subscriptions { get; set; } = new List<Subscription>();
}
```

### C. DTOs

#### UserDto

```csharp
public class UserDto
{
    public required string UserName { get; set; }
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public required string Token { get; set; }
    public required IList<string> Roles { get; set; }
    public Guid UserId { get; set; }                // ✅ User.Id (from AspNetUsers)
    public UserProfileDto? UserProfile { get; set; }
}
```

---

## ✅ 5. Answers to Frontend Questions

### ❓ Question A: Is `studentId` included in JWT token?

**Answer:** ⚠️ **SHOULD BE!** `studentId` should be included in the JWT token for student users.

**Expected Location:** `TokenService.cs`

```csharp
if (roles.Contains("Student") && user.Student != null)
{
    claims.Add(new Claim("studentId", user.Student.Id.ToString())); // ✅ THIS SHOULD EXIST
    claims.Add(new Claim("yearId", user.Student.YearId.ToString()));
}
```

**Expected Decoded Token:**
```json
{
  "nameid": "9dd137f3-85b5-4988-8305-1d7491610d21",
  "studentId": "1",                                    // ✅ Student.Id (USE FOR CART)
  "yearId": "1"
}
```

---

### ❓ Question B: Is `yearId` included in JWT token?

**Answer:** ⚠️ **SHOULD BE!** `yearId` should be included in the JWT token for student users.

**Expected Location:** `TokenService.cs`

```csharp
if (roles.Contains("Student") && user.Student != null)
{
    claims.Add(new Claim("yearId", user.Student.YearId.ToString())); // ✅ THIS SHOULD EXIST
    claims.Add(new Claim("studentId", user.Student.Id.ToString()));
}
```

---

### ❓ Question C: Is `yearId` included in login response?

**Answer:** ⚠️ **SHOULD BE!** `yearId` should be included in the login response for students.

**Expected Location:** `AccountController.cs`

```csharp
if (roles.Contains("Student") && user.Student != null)
{
    return Ok(new
    {
        userName = userDto.UserName,
        token = userDto.Token,
        roles = userDto.Roles,
        userId = userDto.UserId,
        userProfile = userDto.UserProfile,
        yearId = user.Student.YearId,                // ✅ THIS SHOULD BE HERE
    });
}
```

---

### ❓ Question D: What's the difference between `userId` and `studentId`?

**Answer:** ⚠️ **CRITICAL DISTINCTION!**

| Property | Type | Table | Description | Example | Usage |
|----------|------|-------|-------------|---------|-------|
| `userId` (or `nameid`) | Guid | AspNetUsers | User's ID in Identity system | 9dd137f3-... | Authentication, user profile |
| `studentId` | int | Students | Student's ID in Students table | 1 | **Cart operations, subscriptions** |

**Why Two IDs?**

- A **User** can have multiple roles (Student, Parent, Teacher, Admin)
- When a user is a **Student**, a separate **Student** record is created
- The **Student** record has its own ID (`studentId`) for tracking:
  - Cart items
  - Subscriptions
  - Progress
  - Exams
  - Certificates

**Example:**

```sql
-- Laurel's User record
SELECT * FROM AspNetUsers WHERE UserName = 'hijaq';
-- Result: Id='9dd137f3-85b5-4988-8305-1d7491610d21', UserName='hijaq'

-- Laurel's Student record
SELECT * FROM Students WHERE UserId = '9dd137f3-85b5-4988-8305-1d7491610d21';
-- Result: Id=1, UserId='9dd137f3-...', YearId=1
```

**For Cart API:**

```typescript
// ❌ WRONG - Using userId (GUID)
addToCart(planId, userId, quantity);

// ✅ CORRECT - Using studentId (1, 2, 3...)
addToCart(planId, studentId, quantity);
```

---

### ❓ Question E: How to get `studentId` from JWT token?

**Answer:** Decode the JWT token and read the `studentId` claim.

**Frontend Code Example:**

```typescript
import jwtDecode from 'jwt-decode';

interface JwtPayload {
  nameid: string;              // userId (GUID)
  unique_name: string;         // userName
  email: string;
  studentId?: string;          // studentId (int as string)
  yearId?: string;             // yearId (int as string)
  role: string | string[];
  exp: number;
}

// Extract studentId from token
const token = localStorage.getItem('token');
if (token) {
  const decoded = jwtDecode<JwtPayload>(token);
  
  const userId = decoded.nameid;              // ✅ GUID (User.Id)
  const studentId = decoded.studentId         // ✅ "1" (Student.Id) - USE THIS FOR CART
    ? parseInt(decoded.studentId) 
    : null;
  const yearId = decoded.yearId 
    ? parseInt(decoded.yearId) 
    : null;
  
  console.log('User ID:', userId);            // 9dd137f3-85b5-4988-8305-1d7491610d21
  console.log('Student ID:', studentId);      // 1
  console.log('Year ID:', yearId);            // 1
}
```

---

### ❓ Question F: Why is frontend saying `studentId` is missing?

**Answer:** 🔍 **Possible Causes:**

1. **Backend Not Implemented Yet**
   - `studentId` claim not added to token generation
   - **Solution:** Backend team needs to implement the claim

2. **Token Not Decoded Correctly**
   - Frontend might be looking for wrong property name
   - **Solution:** Use exact property name from token

3. **Old Token Cached**
   - User logged in before `studentId` was added to token
   - **Solution:** Clear localStorage and re-login

4. **User is Not a Student**
   - `studentId` is only added for users with "Student" role
   - **Solution:** Check if user actually has Student role

5. **Student Record Not Created**
   - User has "Student" role but no record in `Students` table
   - **Solution:** Verify database has Student record

**Debug Steps:**

```typescript
// 1. Log the raw token
const token = localStorage.getItem('token');
console.log('Raw Token:', token);

// 2. Decode and log the payload
const decoded = jwtDecode(token!);
console.log('Decoded Token:', decoded);

// 3. Check if studentId exists
console.log('Student ID:', decoded.studentId);
console.log('Student ID exists?', 'studentId' in decoded);

// 4. Check token on jwt.io
// Copy token and paste at https://jwt.io
```

---

## 🚨 6. Current Issues & Solutions

### Issue #1: Frontend Using `userId` Instead of `studentId` for Cart

**Symptoms:**
- Cart API returns `400 Bad Request`
- Error: "Student not found" or similar

**Root Cause:**
- Frontend sending `userId` (GUID) to cart API
- Cart API expects `studentId` (int)

**Solution:**

```typescript
// ❌ WRONG
const user = authService.currentUser();
addToCart(planId, user.id, 1); // user.id is userId (GUID)

// ✅ CORRECT
const token = localStorage.getItem('token');
const decoded = jwtDecode<JwtPayload>(token!);
const studentId = decoded.studentId ? parseInt(decoded.studentId) : null;
if (studentId) {
  addToCart(planId, studentId, 1);
}
```

---

### Issue #2: Token Not Including `studentId` Claim

**Symptoms:**
- `studentId` is `undefined` when decoding token
- Token only has `nameid`, `unique_name`, `role`

**Root Cause:**
- Backend not adding `studentId` to token claims
- Student entity not loaded during login

**Solution (Backend):**

```csharp
// In TokenService.cs
public async Task<string> CreateToken(User user)
{
    var claims = new List<Claim>
    {
        new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
        new Claim(ClaimTypes.Name, user.UserName!),
    };

    var roles = await userManager.GetRolesAsync(user);
    claims.AddRange(roles.Select(role => new Claim(ClaimTypes.Role, role)));

    // ✅ ADD THIS CODE
    if (roles.Contains("Student") && user.Student != null)
    {
        claims.Add(new Claim("studentId", user.Student.Id.ToString()));
        claims.Add(new Claim("yearId", user.Student.YearId.ToString()));
    }

    // ... rest of token generation
}

// In AccountController.cs - Login method
var user = await userManager.Users
    .Include(u => u.Student)              // ✅ ADD THIS
        .ThenInclude(s => s.Year)         // ✅ AND THIS
    .FirstOrDefaultAsync(x => x.Email == loginDto.Identifier.ToLower());
```

---

### Issue #3: Getting `Student.Id` from `User.Id`

**Scenario:** Frontend only has `userId` and needs to get `studentId`.

**Solution:** Call backend API to get student info.

**New API Endpoint (Recommended):**

```csharp
// Add to UserController.cs or StudentsController.cs
[Authorize(Roles = "Student")]
[HttpGet("me/student-info")]
public async Task<ActionResult<StudentInfoDto>> GetMyStudentInfo()
{
    var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
    if (string.IsNullOrEmpty(userIdClaim))
        return Unauthorized();

    var userId = Guid.Parse(userIdClaim);
    
    var student = await context.Students
        .Include(s => s.Year)
        .FirstOrDefaultAsync(s => s.UserId == userId);

    if (student == null)
        return NotFound("Student record not found");

    return Ok(new StudentInfoDto
    {
        StudentId = student.Id,              // ✅ This is what cart needs
        UserId = student.UserId,
        YearId = student.YearId,
        YearNumber = student.Year!.YearNumber
    });
}

public class StudentInfoDto
{
    public int StudentId { get; set; }
    public Guid UserId { get; set; }
    public int YearId { get; set; }
    public int YearNumber { get; set; }
}
```

**Frontend Usage:**

```typescript
// Call once on login, store in state
const getStudentInfo = async () => {
  const response = await fetch('/api/User/me/student-info', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  const data = await response.json();
  
  // Store for later use
  localStorage.setItem('studentId', data.studentId.toString());
  return data.studentId;
};
```

---

## 🧪 7. Testing Guide

### Test 1: Verify Token Claims

**Steps:**

1. Login as student:
   ```bash
   POST /api/Account/login
   {
     "identifier": "hijaq@mailinator.com",
     "password": "Student@123"
   }
   ```

2. Copy the `token` from response

3. Go to https://jwt.io

4. Paste token in "Encoded" section

5. Check "Decoded" payload should contain:
   ```json
   {
     "nameid": "9dd137f3-85b5-4988-8305-1d7491610d21",
     "studentId": "1",
     "yearId": "1"
   }
   ```

---

### Test 2: Verify Login Response

**Steps:**

1. Login as student

2. Check response should include:
   ```json
   {
     "userName": "hijaq",
     "token": "...",
     "yearId": 1
   }
   ```

---

### Test 3: Verify Database Relationships

**SQL Query:**

```sql
-- Get complete student information
SELECT 
    u.Id AS UserId,
    u.UserName,
    u.Email,
    s.Id AS StudentId,               -- This is what cart needs!
    s.ParentId,
    s.YearId,
    y.YearNumber
FROM AspNetUsers u
INNER JOIN Students s ON u.Id = s.UserId
INNER JOIN Years y ON s.YearId = y.Id
WHERE u.UserName = 'hijaq';
```

**Expected Result:**
```
UserId                                | UserName | Email                | StudentId | ParentId | YearId | YearNumber
--------------------------------------|----------|----------------------|-----------|----------|--------|------------
9dd137f3-85b5-4988-8305-1d7491610d21  | hijaq    | hijaq@mailinator.com | 1         | ...      | 1      | 7
```

---

### Test 4: Verify Cart API Works with `studentId`

**API Call:**

```bash
POST /api/cart/add
Authorization: Bearer {token}
Content-Type: application/json

{
  "subscriptionPlanId": 1,
  "studentId": 1,                    # ✅ Use Student.Id (not User.Id)
  "quantity": 1
}
```

**Expected Response:**

```json
{
  "success": true,
  "message": "Item added to cart",
  "cartItemId": 1
}
```

---

## 💡 8. Recommendations

### For Backend Team:

1. **Implement JWT Claims** (if not already done):
   ```csharp
   // In TokenService.cs
   if (roles.Contains("Student") && user.Student != null)
   {
       claims.Add(new Claim("studentId", user.Student.Id.ToString()));
       claims.Add(new Claim("yearId", user.Student.YearId.ToString()));
   }
   ```

2. **Load Student Entity in Login**:
   ```csharp
   // In AccountController.cs
   var user = await userManager.Users
       .Include(u => u.Student)
           .ThenInclude(s => s.Year)
       .FirstOrDefaultAsync(x => x.Email == loginDto.Identifier);
   ```

3. **Add API Endpoint for Student Info**:
   ```csharp
   [HttpGet("me/student-info")]
   public async Task<ActionResult<StudentInfoDto>> GetMyStudentInfo() { ... }
   ```

4. **Update API Documentation**:
   - Document JWT token structure
   - Clarify difference between `userId` and `studentId`
   - Add examples for cart operations

---

### For Frontend Team:

1. **Install jwt-decode Library**:
   ```bash
   npm install jwt-decode
   ```

2. **Create JWT Payload Interface**:
   ```typescript
   interface JwtPayload {
     nameid: string;
     unique_name: string;
     email: string;
     studentId?: string;
     yearId?: string;
     role: string | string[];
     exp: number;
   }
   ```

3. **Update AuthService**:
   ```typescript
   import jwtDecode from 'jwt-decode';

   private loadUserFromToken(): void {
     const token = localStorage.getItem('token');
     if (token) {
       const decoded = jwtDecode<JwtPayload>(token);
       
       const user: User = {
         id: decoded.nameid,
         userName: decoded.unique_name,
         email: decoded.email,
         studentId: decoded.studentId ? parseInt(decoded.studentId) : undefined,
         yearId: decoded.yearId ? parseInt(decoded.yearId) : undefined,
         roles: Array.isArray(decoded.role) ? decoded.role : [decoded.role],
         token: token
       };
       
       this.currentUserSubject.next(user);
       
       // Store studentId for easy access
       if (decoded.studentId) {
         localStorage.setItem('studentId', decoded.studentId);
       }
     }
   }

   getStudentId(): number | null {
     const user = this.currentUserSubject.value;
     if (user?.studentId) {
       return user.studentId;
     }
     
     const stored = localStorage.getItem('studentId');
     return stored ? parseInt(stored) : null;
   }
   ```

4. **Update Cart Service**:
   ```typescript
   addToCart(subscriptionPlanId: number, quantity: number = 1): Observable<CartResponse> {
     const studentId = this.authService.getStudentId();
     
     if (!studentId) {
       return throwError(() => new Error('Student ID not found. Please login again.'));
     }

     return this.http.post<CartResponse>(`${environment.apiUrl}/cart/add`, {
       subscriptionPlanId: subscriptionPlanId,
       studentId: studentId,            // ✅ Use Student.Id from token
       quantity: quantity
     });
   }
   ```

5. **Remove Temporary Workaround**:
   ```typescript
   // In courses.component.ts
   // ❌ REMOVE:
   studentId: user.studentId || (isStudent ? userId : undefined)
   
   // ✅ REPLACE WITH:
   studentId: user.studentId
   ```

---

## 📞 9. Support & Contact

### If You Still Have Issues:

1. **Check Console Logs**:
   ```typescript
   console.log('Token:', localStorage.getItem('token'));
   console.log('Decoded:', jwtDecode(localStorage.getItem('token')!));
   ```

2. **Verify at jwt.io**:
   - Copy your token
   - Paste at https://jwt.io
   - Check if `studentId` and `yearId` are in the payload

3. **Re-login**:
   - Clear localStorage
   - Login again
   - Get fresh token

4. **Check Database**:
   ```sql
   -- Verify student record exists
   SELECT u.Id, u.UserName, s.Id AS StudentId, s.YearId
   FROM AspNetUsers u
   LEFT JOIN Students s ON u.Id = s.UserId
   WHERE u.UserName = 'hijaq';
   ```

5. **Contact Backend Team**:
   - Provide: Decoded token, User ID, Username
   - Show: Cart API error message
   - Include: Browser console screenshot

---

## ✅ Summary Checklist

### Backend Implementation:
- [ ] Add `studentId` claim to JWT token
- [ ] Add `yearId` claim to JWT token
- [ ] Load Student entity in login query (.Include)
- [ ] Include `yearId` in login response for students
- [ ] Verify database relationships are correct
- [ ] Test token generation with student user
- [ ] Update API documentation

### Frontend Implementation:
- [ ] Install jwt-decode library
- [ ] Create JwtPayload interface
- [ ] Update AuthService to decode token
- [ ] Extract and store studentId from token
- [ ] Update CartService to use studentId
- [ ] Update User model to include studentId and yearId
- [ ] Remove temporary userId fallback
- [ ] Test cart functionality
- [ ] Clear old tokens and re-login

---

## 📊 Conclusion

**Current Status:** ⚠️ **REQUIRES BACKEND IMPLEMENTATION**

The backend needs to provide:
- ✅ `studentId` in JWT token claims
- ✅ `yearId` in JWT token claims
- ✅ `yearId` in login response
- ✅ Student entity loading in queries
- ✅ Proper database relationships

**Frontend Status:** 🔧 **TEMPORARY WORKAROUND IN PLACE**

The frontend has implemented:
- ✅ Fallback using `userId` as `studentId` for students
- ✅ Role-based access control for cart
- ✅ Validation before cart operations

**Recommended Action:**
1. **Backend Team:** Implement JWT claims and entity loading
2. **Frontend Team:** Update token decoder and cart service
3. **Testing:** Verify end-to-end cart functionality
4. **Cleanup:** Remove temporary workarounds

**Priority:** 🔴 **HIGH** - Critical for cart and enrollment features

---

**Report Date:** November 13, 2025  
**Report Version:** 1.0  
**Status:** ⚠️ Awaiting Backend Implementation  
**Next Steps:** Backend team to implement JWT claims

---

**END OF REPORT**
