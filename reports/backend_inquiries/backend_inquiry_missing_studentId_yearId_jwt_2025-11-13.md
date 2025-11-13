# ❓ Backend Inquiry Report

## 1. Inquiry Topic

Missing `studentId` and `yearId` Claims in JWT Token for Student Users

## 2. Reason for Inquiry

The Angular frontend is attempting to implement cart functionality and year-based course filtering for student users. However, the JWT token returned by the authentication endpoint (`/api/auth/login` or `/api/auth/register`) **does not include** the following critical claims:

- `studentId` - Required for cart operations (adding courses to cart)
- `yearId` - Required for auto-filtering courses by student's academic year

### Current Issue:
When a student user logs in, the JWT token contains:
```json
{
  "userId": "9dd137f3-85b5-4988-8305-1d7491610d21",
  "email": "hijaq@mailinator.com",
  "firstName": "Laurel",
  "lastName": "Knowles",
  "roles": ["Student"]
}
```

But it's **missing**:
```json
{
  "studentId": "...",  // ❌ NOT PRESENT
  "yearId": "..."      // ❌ NOT PRESENT
}
```

### Frontend Impact:
- ⚠️ Cart API calls fail with `400 Bad Request` because `studentId` is required in the request body
- ⚠️ Students cannot be auto-filtered to see only courses for their academic year
- ⚠️ Enrollment status checks may fail without proper `studentId`

## 3. Requested Details from Backend Team

### A. JWT Token Generation
Please confirm whether the JWT token generation logic includes these claims:

```csharp
// Expected in AuthService.cs or JwtGenerator.cs
var claims = new List<Claim>
{
    new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
    new Claim(ClaimTypes.Email, user.Email),
    new Claim(ClaimTypes.Name, $"{user.FirstName} {user.LastName}"),
    new Claim(ClaimTypes.Role, user.Role),
    
    // ⚠️ CRITICAL: Are these being added?
    new Claim("studentId", user.Student?.Id.ToString() ?? user.Id.ToString()),
    new Claim("yearId", user.Student?.YearId.ToString() ?? "")
};
```

### B. Database Structure
Please clarify the relationship between:
1. **User** table
2. **Student** table
3. **Year** table

Questions:
- Is there a `Students` table with a foreign key to `Users`?
- Does the `Students` table contain `YearId`?
- How is the `studentId` determined for a user with the "Student" role?

### C. Authentication Endpoints

#### `/api/auth/login`
- **Current Response:** What is the exact structure of the JWT token payload?
- **Expected Response:** Should include `studentId` and `yearId` for student users

#### `/api/auth/register`
- When registering a new student, is the `Student` record created automatically?
- Is `yearId` assigned during registration?

### D. User Model Structure
Please provide the complete structure of:

```csharp
// User.cs
public class User
{
    public Guid Id { get; set; }
    public string Email { get; set; }
    public string FirstName { get; set; }
    public string LastName { get; set; }
    public string Role { get; set; }
    
    // ❓ Is there a navigation property to Student?
    public virtual Student? Student { get; set; }
}

// Student.cs (if exists)
public class Student
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public int YearId { get; set; }
    
    public virtual User User { get; set; }
    public virtual Year Year { get; set; }
}
```

## 4. Temporary Frontend Workaround

Until this issue is resolved on the backend, the frontend is using a **temporary fallback**:

```typescript
// In courses.component.ts - Line ~142
studentId: user.studentId || (isStudent ? userId : undefined)
```

This uses the `userId` as a fallback for `studentId` when the student role is detected.

**⚠️ This is NOT a permanent solution and should be removed once the backend includes proper `studentId` in the JWT token.**

## 5. Recommended Backend Changes

### Option A: Add Claims to JWT (Preferred)
Modify the JWT generation to include these claims for student users:

```csharp
if (user.Role == "Student" && user.Student != null)
{
    claims.Add(new Claim("studentId", user.Student.Id.ToString()));
    claims.Add(new Claim("yearId", user.Student.YearId.ToString()));
}
```

### Option B: Add Properties to Login Response
If modifying JWT is not possible, add these fields to the login response DTO:

```csharp
public class LoginResponseDto
{
    public string Token { get; set; }
    public string UserId { get; set; }
    public string Email { get; set; }
    public string FirstName { get; set; }
    public string LastName { get; set; }
    public string[] Roles { get; set; }
    
    // Add these:
    public string? StudentId { get; set; }
    public int? YearId { get; set; }
}
```

## 6. Testing Requirements

Once implemented, please test:
1. ✅ Student user login returns `studentId` and `yearId`
2. ✅ Parent user login returns appropriate student information
3. ✅ Admin/Teacher users do NOT receive `studentId` (should be null)
4. ✅ Cart API accepts the `studentId` from the token

## 7. Priority

🔴 **HIGH PRIORITY** - This blocks critical cart functionality for all student users.

---

## 8. Frontend Quick Fix Guide

**Once Backend implements the changes, use this guide to update the frontend:**

### Step 1: Install `jwt-decode`

```bash
npm install jwt-decode
```

### Step 2: Update `auth.service.ts`

```typescript
import jwtDecode from 'jwt-decode';

interface JwtPayload {
  nameid: string;           // userId
  unique_name: string;      // userName
  email: string;
  studentId?: string;       // ✅ NEW - studentId (only for students)
  yearId?: string;          // ✅ NEW - yearId (only for students)
  role: string | string[];
  exp: number;
}

export class AuthService {
  private loadUserFromToken(): void {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode<JwtPayload>(token);
        
        const user: User = {
          id: parseInt(decoded.nameid),
          userName: decoded.unique_name,
          email: decoded.email,
          studentId: decoded.studentId ? parseInt(decoded.studentId) : undefined,  // ✅ NEW
          yearId: decoded.yearId ? parseInt(decoded.yearId) : undefined,           // ✅ NEW
          roles: Array.isArray(decoded.role) ? decoded.role : [decoded.role],
          token: token
        };
        
        this.currentUserSubject.next(user);
        
        // ✅ Store studentId for easy access
        if (decoded.studentId) {
          localStorage.setItem('studentId', decoded.studentId);
        }
      } catch (error) {
        console.error('Failed to decode token:', error);
        this.logout();
      }
    }
  }

  // ✅ NEW - Helper method to get studentId
  getStudentId(): number | null {
    const user = this.currentUserSubject.value;
    if (user?.studentId) {
      return user.studentId;
    }
    
    const stored = localStorage.getItem('studentId');
    return stored ? parseInt(stored) : null;
  }
}
```

### Step 3: Update User Interface

```typescript
// user.model.ts
export interface User {
  id: number;              // userId (from AspNetUsers)
  userName: string;
  email?: string;
  studentId?: number;      // ✅ NEW - Student.Id (from Students table)
  yearId?: number;         // ✅ NEW - Year.Id
  roles: string[];
  token: string;
}
```

### Step 4: Update Cart Service

```typescript
// cart.service.ts
addToCart(subscriptionPlanId: number, quantity: number = 1): Observable<CartResponse> {
  // ✅ Get studentId from AuthService
  const studentId = this.authService.getStudentId();
  
  if (!studentId) {
    return throwError(() => new Error('Student ID not found. Please login again.'));
  }

  return this.http.post<CartResponse>(`${environment.apiUrl}/cart/add`, {
    subscriptionPlanId: subscriptionPlanId,
    studentId: studentId,  // ✅ Use Student.Id from token (not User.Id)
    quantity: quantity
  });
}
```

### Step 5: Remove Temporary Workaround

Once backend changes are live, remove the temporary fallback from `courses.component.ts`:

```typescript
// ❌ REMOVE THIS:
studentId: user.studentId || (isStudent ? userId : undefined)

// ✅ REPLACE WITH:
studentId: user.studentId  // Now properly populated from JWT
```

### Verification Steps

1. **Login as student user**
2. **Check token in console:**
   ```javascript
   const token = localStorage.getItem('token');
   const decoded = JSON.parse(atob(token.split('.')[1]));
   console.log('Student ID:', decoded.studentId);  // Should be 1, 2, 3...
   console.log('Year ID:', decoded.yearId);         // Should be 1, 2, 3...
   ```
3. **Test cart functionality:**
   - Add item to cart
   - Check Network tab → Request payload should show `studentId: 1` (not `123`)
   - Verify response is successful

### Expected Token Payload (After Fix)

```json
{
  "nameid": "9dd137f3-85b5-4988-8305-1d7491610d21",
  "unique_name": "hijaq@mailinator.com",
  "email": "hijaq@mailinator.com",
  "studentId": "1",     // ✅ NOW PRESENT
  "yearId": "2",        // ✅ NOW PRESENT
  "role": ["Student"],
  "exp": 1735689600
}
```

---

**Report Generated:** 2025-11-13  
**Frontend Developer:** AI Assistant  
**Related Frontend File:** `src/app/features/courses/courses.component.ts` (Lines 130-195)  
**Issue Detected In Console:** Browser console logs showing missing `studentId` and `yearId`  
**Temporary Workaround:** Using `userId` as fallback for `studentId` (to be removed after backend fix)
