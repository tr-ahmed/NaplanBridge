# ❓ Backend Inquiry Report: Auto-Renew 403 Forbidden Error

## Date: November 5, 2025
## Topic: Permission Denied on Auto-Renew Endpoint
## Priority: 🔴 HIGH
## Status: ⏳ REQUIRES BACKEND FIX

---

## 1. Issue Summary

The auto-renewal toggle endpoint is returning **403 Forbidden** when accessed by a **Parent** user, preventing parents from managing their children's subscription auto-renewal settings.

---

## 2. Error Details

### API Request:
```http
PUT /api/StudentSubjects/subscriptions/1/auto-renew
Authorization: Bearer {parent_token}
Content-Type: application/json

{
  "autoRenew": true
}
```

### Response:
```http
HTTP/1.1 403 Forbidden
Content-Type: application/json

null
```

### Console Errors:
```
🔄 Updating auto-renewal: {subscriptionId: 1, autoRenew: true, url: '...'}
PUT https://naplan2.runasp.net/api/StudentSubjects/subscriptions/1/auto-renew 403 (Forbidden)
❌ Update auto-renewal error: {status: 403, statusText: 'OK'}
```

---

## 3. Current Authorization Configuration

Based on the backend response document, the endpoint should be:

```csharp
[HttpPut("subscriptions/{subscriptionId}/auto-renew")]
[Authorize(Roles = "Parent,Admin")]  // ← Should allow Parent role
public async Task<IActionResult> UpdateAutoRenew(int subscriptionId, [FromBody] AutoRenewDto dto)
{
    // Implementation
}
```

**Expected:** Parent role should have access  
**Actual:** Parent role is denied (403 Forbidden)

---

## 4. Possible Causes

### Cause 1: Missing Role Authorization ⚠️ MOST LIKELY
```csharp
// Current (causing 403):
[Authorize(Roles = "Admin")]  // Only Admin allowed

// Should be:
[Authorize(Roles = "Parent,Admin")]  // Parent + Admin allowed
```

### Cause 2: Ownership Verification Issue
```csharp
// Backend may be checking:
if (subscription.UserId != currentUserId) {
    return Forbid();  // 403
}

// But should check:
var parent = GetCurrentParentId();
if (subscription.Student.ParentId != parent) {
    return Forbid();
}
```

### Cause 3: JWT Token Claims Issue
- Parent's JWT token may not have correct roles
- Claims may be:
  - Missing `role: Parent`
  - Has `role: Student` instead
  - Token expired or malformed

---

## 5. Verification Steps

### Step 1: Check Endpoint Authorization
```csharp
// File: API/Controllers/StudentSubjectsController.cs

[HttpPut("subscriptions/{subscriptionId}/auto-renew")]
[Authorize(Roles = "Parent,Admin")]  // ← Verify this line
public async Task<IActionResult> UpdateAutoRenew(...)
```

### Step 2: Check JWT Token Claims
```javascript
// Frontend - decode parent's token
const token = localStorage.getItem('authToken');
const payload = JSON.parse(atob(token.split('.')[1]));
console.log('User Claims:', payload);

// Expected claims:
{
  "nameid": "5",  // Parent ID
  "role": "Parent",  // ← Should be "Parent"
  "email": "parent@example.com"
}
```

### Step 3: Check Ownership Logic
```csharp
// Verify parent owns the subscription
var studentSubject = await _context.StudentSubjects
    .Include(ss => ss.Student)
    .FirstOrDefaultAsync(ss => ss.Id == subscriptionId);

var currentParentId = GetCurrentUserId();

// Should check ParentId, not UserId
if (studentSubject.Student.ParentId != currentParentId) {
    return Forbid();  // Correct check
}
```

---

## 6. Recommended Fix

### Option 1: Update Authorization Attribute (Recommended)

```csharp
// File: API/Controllers/StudentSubjectsController.cs

[HttpPut("subscriptions/{subscriptionId}/auto-renew")]
[Authorize(Roles = "Parent,Admin")]  // ✅ Add Parent role
public async Task<IActionResult> UpdateAutoRenew(int subscriptionId, [FromBody] AutoRenewDto dto)
{
    var subscription = await _context.StudentSubjects
        .Include(ss => ss.Student)
        .FirstOrDefaultAsync(ss => ss.Id == subscriptionId);
    
    if (subscription == null)
        return NotFound("Subscription not found");
    
    // ✅ Verify parent ownership
    var currentUserId = GetCurrentUserId();
    var currentUserRole = GetCurrentUserRole();
    
    if (currentUserRole == "Parent") {
        if (subscription.Student.ParentId != currentUserId) {
            return Forbid("You can only manage your own children's subscriptions");
        }
    }
    
    subscription.AutoRenew = dto.AutoRenew;
    await _context.SaveChangesAsync();
    
    return Ok(new {
        success = true,
        subscriptionId,
        autoRenew = dto.AutoRenew
    });
}
```

---

### Option 2: Use Custom Authorization Policy

```csharp
// File: Program.cs or Startup.cs

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("ManageSubscriptions", policy =>
        policy.RequireRole("Parent", "Admin"));
});

// Controller:
[HttpPut("subscriptions/{subscriptionId}/auto-renew")]
[Authorize(Policy = "ManageSubscriptions")]
public async Task<IActionResult> UpdateAutoRenew(...)
```

---

## 7. Similar Endpoints to Check

These endpoints may have the same issue:

### Cancel Subscription:
```csharp
[HttpPut("subscriptions/{subscriptionId}/cancel")]
[Authorize(Roles = "Parent,Admin")]  // ← Check this
```

### Download Invoice:
```csharp
[HttpGet("{orderId}/invoice")]
[Authorize(Roles = "Parent,Admin")]  // ← Check this
```

---

## 8. Testing After Fix

### Test Case 1: Parent User
```bash
# Login as Parent
POST /api/Account/login
{
  "email": "parent@example.com",
  "password": "password"
}

# Get token from response
TOKEN="eyJhbGciOiJS..."

# Try to toggle auto-renewal
PUT /api/StudentSubjects/subscriptions/1/auto-renew
Authorization: Bearer $TOKEN
{
  "autoRenew": true
}

# Expected: 200 OK ✅
# Actual (before fix): 403 Forbidden ❌
```

### Test Case 2: Admin User
```bash
# Login as Admin
# Should still work: 200 OK ✅
```

### Test Case 3: Unauthorized Parent
```bash
# Parent tries to modify another parent's subscription
# Expected: 403 Forbidden (correct behavior)
```

---

## 9. Frontend Workaround (Temporary)

Until backend is fixed, disable the button for parents:

```typescript
// my-subscriptions.component.ts

isParentUser(): boolean {
  const token = localStorage.getItem('authToken');
  if (!token) return false;
  
  const payload = JSON.parse(atob(token.split('.')[1]));
  return payload.role === 'Parent';
}

// HTML
<button 
  [disabled]="isParentUser()"
  [title]="isParentUser() ? 'Feature temporarily unavailable for parents' : ''"
  (click)="toggleAutoRenew(subscription)">
  {{ subscription.autoRenew ? 'Disable' : 'Enable' }} Auto-Renew
</button>
```

---

## 10. Questions for Backend Team

### Question 1: Authorization Roles
**Q:** What role should be used for parents managing subscriptions?
- `Parent`?
- `Guardian`?
- `Customer`?

### Question 2: Ownership Verification
**Q:** How should we verify subscription ownership?
- Check `StudentSubjects.Student.ParentId`?
- Check `StudentSubjects.UserId`?
- Use a separate permissions table?

### Question 3: Policy vs Roles
**Q:** Should we use:
- Simple role-based authorization: `[Authorize(Roles = "Parent,Admin")]`?
- Policy-based authorization: `[Authorize(Policy = "ManageSubscriptions")]`?

### Question 4: Error Response
**Q:** Why is the 403 response body `null`?
- Should return: `{ "message": "Permission denied" }`
- Helps with debugging and user feedback

---

## 11. Impact Analysis

### High Priority Issues:
1. ❌ Parents cannot toggle auto-renewal
2. ❌ Parents cannot cancel subscriptions (likely same issue)
3. ❌ Poor user experience (unclear error message)

### User Experience Impact:
- Parents see generic error: "Failed to update"
- No explanation of why it failed
- No alternative action suggested
- Frustration and support tickets

### Business Impact:
- Loss of functionality
- Reduced customer satisfaction
- Increased support burden
- Potential revenue impact (if affects renewals)

---

## 12. Recommended Timeline

### Immediate (Today):
- ✅ Frontend: Show better error message for 403
- ⏳ Backend: Verify authorization configuration

### Short-term (1-2 days):
- ⏳ Backend: Fix authorization roles
- ⏳ Backend: Test all subscription management endpoints
- ⏳ Backend: Deploy fix

### Follow-up (1 week):
- ⏳ Add integration tests for Parent role
- ⏳ Document authorization patterns
- ⏳ Review other endpoints for similar issues

---

## 13. Related Issues

Check these endpoints for the same problem:

```http
PUT /api/StudentSubjects/subscriptions/{id}/cancel
GET /api/Orders/{orderId}/invoice
PUT /api/StudentSubjects/{id}
DELETE /api/StudentSubjects/{id}
```

All may have the same authorization issue.

---

## 14. Success Criteria

### After Fix:
- ✅ Parent can toggle auto-renewal: Returns 200 OK
- ✅ Parent can cancel subscriptions: Returns 200 OK
- ✅ Parent gets clear error for unauthorized actions
- ✅ Admin retains full access
- ✅ Ownership is properly verified
- ✅ JWT claims are correct

---

## 15. Summary

### Problem:
- **403 Forbidden** when Parent tries to update auto-renewal
- Prevents core functionality for parents

### Root Cause (Suspected):
- Authorization attribute missing `Parent` role
- OR JWT token claims incorrect
- OR Ownership verification logic error

### Solution:
- Add `Parent` role to endpoint authorization
- Verify JWT token generation
- Test ownership verification logic

### Status:
- ⏳ Waiting for backend team investigation
- ✅ Frontend updated with better error handling
- 🔴 HIGH priority (blocks parent functionality)

---

**Please provide:**
1. Current authorization configuration for this endpoint
2. JWT token payload example for parent user
3. Ownership verification logic in code
4. Expected timeline for fix

---

**Report Generated:** November 5, 2025  
**Report ID:** INQUIRY-AUTO-RENEW-403-001  
**Priority:** HIGH  
**Status:** REQUIRES IMMEDIATE BACKEND ATTENTION
