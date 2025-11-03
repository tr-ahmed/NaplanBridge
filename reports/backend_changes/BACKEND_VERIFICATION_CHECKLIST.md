# ✅ Backend Update Verification Checklist

## Date: October 31, 2025
## Purpose: Verify that Backend team completed all required updates

---

## 🎯 Required Backend Updates

### ✅ Update 1: Add yearId to JWT Token

**Status:** ⏳ Needs Verification

**What was required:**
```csharp
// In JWT token generation
claims.Add(new Claim("yearId", user.YearId.Value.ToString()));
```

**Expected JWT Payload:**
```json
{
  "nameid": "8",
  "unique_name": "ali_ahmed",
  "role": ["Student", "Member"],
  "yearId": "1",  // ⚠️ Must be present
  "nbf": 1761942698,
  "exp": 1762540155
}
```

**How to Test:**
1. Login with student account
2. Open Console (F12)
3. Look for: `🔓 Decoding JWT Token...`
4. Check if `yearId` appears in payload

**Expected Console Output:**
```javascript
✅ Mapped user object: {
  id: '8',
  userName: 'ali_ahmed',
  role: ['Student', 'Member'],
  yearId: 1  // ✅ Should be present
}

✅ Student detected - Auto-filtering for Year ID: 1
📚 Will show only subjects with yearId = 1
```

**If Missing:**
```javascript
⚠️ Student detected but NO yearId found in token!
📋 Backend may not have added yearId claim to JWT
```

---

### ✅ Update 2: Fix Cart API Endpoint

**Status:** ⏳ Needs Verification

**What was required:**
- Endpoint: `POST /api/Cart/items`
- Accept: `{ subscriptionPlanId, studentId, quantity }`
- Return: `{ success, message, cartItemCount }`

**Swagger Documentation:**
```json
{
  "paths": {
    "/api/Cart/items": {
      "post": {
        "summary": "Add item to cart",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/AddToCartDto"
              }
            }
          }
        },
        "responses": {
          "200": { "description": "Success" }
        }
      }
    }
  }
}
```

**Expected Request:**
```json
POST /api/Cart/items
{
  "subscriptionPlanId": 17,
  "studentId": 8,
  "quantity": 1
}
```

**Expected Response (Success):**
```json
{
  "success": true,
  "message": "Item added to cart successfully",
  "cartItemCount": 2
}
```

**How to Test:**
1. Open Courses page
2. Click "Add to Cart" on any subject
3. Select a plan from modal
4. Click "Add to Cart" in modal
5. Watch Console

**Expected Console Output (Success):**
```javascript
🛒 Adding to cart: {
  url: 'https://naplan2.runasp.net/api/Cart/items',
  subscriptionPlanId: 17,
  studentId: 8,
  studentIdType: 'number',
  quantity: 1
}

📦 Cart API call initiated...

✅ Cart API Success Response: {
  success: true,
  message: "Item added to cart successfully",
  cartItemCount: 2
}

✅ Status: Item added to cart successfully

🎉 Toast: "Geometry Year 8 - Term 1 has been added to your cart successfully!"
```

**Expected Console Output (If Still Broken):**
```javascript
❌ Cart API Error: {
  status: 500,
  statusText: "Internal Server Error",
  message: "An internal server error occurred",
  traceId: "xyz123"
}

🔧 Backend needs investigation. TraceId: xyz123

❌ Toast: "Server error, please try again later"
```

---

## 🧪 Complete Testing Procedure

### Test 1: JWT Token with yearId

**Login Credentials:**
```
Email: ali_ahmed@naplan.edu
Password: Student@123
```

**Steps:**
1. ✅ Navigate to `/auth/login`
2. ✅ Enter credentials
3. ✅ Open Console (F12)
4. ✅ Click "Login"
5. ✅ Look for token decode logs

**Success Criteria:**
- [ ] Console shows: `🔓 Decoding JWT Token...`
- [ ] JWT payload contains `yearId: "1"`
- [ ] Mapped user object contains `yearId: 1` (number)
- [ ] Console shows: `✅ Student detected - Auto-filtering for Year ID: 1`

**Result:** ⬜ Pass / ⬜ Fail

**If Fail:** Backend did not add yearId to JWT token

---

### Test 2: Student Auto-Filter by Year

**Prerequisites:**
- Student logged in with yearId

**Steps:**
1. ✅ Navigate to `/courses`
2. ✅ Open Console
3. ✅ Check filter application

**Success Criteria:**
- [ ] Console shows: `📚 Will show only subjects with yearId = 1`
- [ ] Only shows subjects for student's year
- [ ] Year selector is HIDDEN for student
- [ ] Shows info banner: "Your Year Level: Year 7"

**Expected Subjects Count:**
- Year 7 students: See 3 subjects (Math, English, Science for Year 7)
- Year 8 students: See 3 subjects (Math, English, Science for Year 8)
- Not see subjects from other years

**Result:** ⬜ Pass / ⬜ Fail

**If Fail:** 
- YearId missing from token, OR
- Subject data doesn't have yearId field, OR
- Filter logic not working

---

### Test 3: Cart API - Add Item

**Prerequisites:**
- Student logged in
- On Courses page

**Steps:**
1. ✅ Click "Add to Cart" on any subject
2. ✅ Plan selection modal opens
3. ✅ Select a plan (e.g., "Geometry Year 8 - Term 1")
4. ✅ Click "Add to Cart" in modal
5. ✅ Watch Console and Toast

**Success Criteria:**
- [ ] Console shows: `🛒 Adding to cart: {...}`
- [ ] Console shows: `📦 Cart API call initiated...`
- [ ] **NO 500 error**
- [ ] Console shows: `✅ Cart API Success Response: {...}`
- [ ] Toast shows: "X has been added to your cart successfully!"
- [ ] Cart badge updates (shows item count)
- [ ] Modal closes

**Result:** ⬜ Pass / ⬜ Fail

**If Fail:** Backend Cart API still has issues

---

### Test 4: Cart API - Error Handling

**Test Scenario A: Duplicate Item**

**Steps:**
1. ✅ Add item to cart (from Test 3)
2. ✅ Try to add SAME item again
3. ✅ Watch response

**Expected:**
- [ ] Status: 409 Conflict
- [ ] Toast: "This plan is already in your cart" (Warning, not Error)

**Result:** ⬜ Pass / ⬜ Fail

---

**Test Scenario B: Invalid Plan**

**Steps:**
1. ✅ Manually call API with non-existent planId (e.g., 99999)

**Expected:**
- [ ] Status: 404 Not Found
- [ ] Toast: "Selected plan not found"

**Result:** ⬜ Pass / ⬜ Fail

---

**Test Scenario C: Unauthorized Access**

**Steps:**
1. ✅ Logout
2. ✅ Try to add to cart (if possible)

**Expected:**
- [ ] Status: 401 Unauthorized
- [ ] Toast: "Please log in to sync your cart with the server"

**Result:** ⬜ Pass / ⬜ Fail

---

## 📊 Final Verification Matrix

| Feature | Frontend Status | Backend Required | Test Status |
|---------|----------------|------------------|-------------|
| JWT yearId Claim | ✅ Ready | ✅ Required | ⬜ Not Tested |
| Token Decoder | ✅ Working | N/A | ⬜ Not Tested |
| Student Auto-Filter | ✅ Ready | ✅ Required | ⬜ Not Tested |
| Year Selector UI | ✅ Working | N/A | ⬜ Not Tested |
| Cart API Endpoint | ✅ Ready | ✅ Required | ⬜ Not Tested |
| Cart Error Handling | ✅ Enhanced | ✅ Required | ⬜ Not Tested |
| Cart Response Format | ✅ Ready | ✅ Required | ⬜ Not Tested |

---

## 🔍 Quick Debug Commands

### Check JWT Token:
```javascript
// In Console after login
localStorage.getItem('authToken')
```

### Decode Token Manually:
```javascript
// Copy token from localStorage
const token = 'eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9...';
const payload = JSON.parse(atob(token.split('.')[1]));
console.log('Token Payload:', payload);
console.log('Has yearId?', 'yearId' in payload);
console.log('yearId value:', payload.yearId);
```

### Test Cart API with Fetch:
```javascript
// In Console
fetch('https://naplan2.runasp.net/api/Cart/items', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + localStorage.getItem('authToken')
  },
  body: JSON.stringify({
    subscriptionPlanId: 17,
    studentId: 8,
    quantity: 1
  })
})
.then(r => r.json())
.then(data => console.log('Response:', data))
.catch(err => console.error('Error:', err));
```

---

## 📝 Backend Team Checklist

### YearId Implementation:
- [ ] Added `yearId` claim to JWT token generation
- [ ] Verified claim appears in token payload
- [ ] Tested with student accounts
- [ ] Tested that non-students don't get yearId

### Cart API Implementation:
- [ ] Created `Carts` table in database
- [ ] Created `CartItems` table in database
- [ ] Applied database migration
- [ ] Added `Cart` and `CartItem` entities to DbContext
- [ ] Implemented `POST /api/Cart/items` endpoint
- [ ] Added proper error handling (400, 404, 409, 500)
- [ ] Added validation for subscriptionPlanId
- [ ] Added validation for studentId
- [ ] Tested endpoint with Postman
- [ ] Verified foreign key relationships work
- [ ] Added logging for debugging

---

## 🎯 Success Criteria Summary

**All Tests Must Pass:**
1. ✅ JWT token contains yearId claim
2. ✅ Student sees only their year's subjects
3. ✅ Cart API returns 200 (not 500)
4. ✅ Items successfully added to cart
5. ✅ Cart badge updates correctly
6. ✅ Error handling works for all scenarios

**When All Pass:**
- Frontend: 100% Complete ✅
- Backend: 100% Complete ✅
- Integration: Fully Working ✅
- Ready for Production: YES ✅

---

## 📋 Next Steps After Verification

### If All Tests Pass:
1. ✅ Mark backend as complete
2. ✅ Update documentation
3. ✅ Move to next feature
4. ✅ Celebrate! 🎉

### If Any Test Fails:
1. ❌ Document which test failed
2. ❌ Copy error logs and traceId
3. ❌ Share with backend team
4. ❌ Wait for fix
5. ❌ Retest

---

## 📞 Contact Information

**Frontend Developer:** Ready and waiting
**Backend Team:** Please confirm when updates are deployed
**Testing Required:** Yes, immediately after backend deployment

**Reports Available:**
- `backend_change_student_year_filter_2025-10-31.md`
- `backend_debug_cart_500_error_2025-10-31.md`

---

**Status:** ⏳ Awaiting Backend Confirmation and Testing

**Last Updated:** October 31, 2025

**Next Action:** Run all tests to verify backend updates
