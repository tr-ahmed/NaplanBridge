# 🧪 Quick Testing Guide - After Token Update

## Date: November 1, 2025
## Purpose: Verify Backend token update is working

---

## 🎯 Quick Test Steps

### Step 1: Clear Old Data
```javascript
// Run in Console (F12)
localStorage.clear();
location.reload();
```

### Step 2: Login Fresh
```
Email: ali_ahmed@naplan.edu
Password: Student@123
```

### Step 3: Check Console Output

**Look for these logs:**

#### ✅ Expected (Success):
```javascript
🔓 Decoding JWT Token...
📦 Raw token payload: {
  nameid: '8',              // ✅ or any number
  unique_name: 'ali_ahmed',
  role: ['Student', 'Member'],
  yearId: '1'               // ✅ Should be present
}

✅ Mapped user object: {
  id: '8',
  userName: 'ali_ahmed',
  role: ['Student', 'Member'],
  yearId: 1                 // ✅ Number
}

✅ Student detected - Auto-filtering for Year ID: 1
```

#### ❌ If Still Broken:
```javascript
⚠️ yearId NOT found in JWT token!
🔧 Backend needs to add yearId claim to token
```

---

### Step 4: Test Cart

1. Go to `/courses`
2. Click "Add to Cart" on any subject
3. Select a plan
4. Click "Add to Cart"

#### ✅ Expected (Success):
```javascript
🛒 Adding to cart: {
  subscriptionPlanId: X,
  studentId: 8,             // ✅ Should match token nameid
  quantity: 1
}

✅ Cart API Success Response: {
  success: true,
  message: "Item added to cart successfully",
  cartItemCount: 1
}

🎉 Toast: "Subject added to cart successfully!"
```

#### ❌ If Error:
```javascript
❌ Cart API Error: {
  status: 400,
  message: "Student with ID X not found"
}
```

**Solution:** Backend needs to ensure student exists in database with same ID as in token.

---

## 🔍 Debug Commands

### Check Token in Console:
```javascript
const token = localStorage.getItem('authToken');
console.log('Token:', token);

// Decode manually
if (token) {
  const payload = JSON.parse(atob(token.split('.')[1]));
  console.log('Payload:', payload);
  console.log('Has yearId?', 'yearId' in payload);
  console.log('Student ID:', payload.nameid);
}
```

### Check Current User:
```javascript
// In Console
const userStr = localStorage.getItem('currentUser');
if (userStr) {
  const user = JSON.parse(userStr);
  console.log('Current User:', user);
  console.log('ID:', user.id);
  console.log('YearId:', user.yearId);
}
```

---

## 📊 Verification Checklist

- [ ] Login successful
- [ ] Console shows token decode logs
- [ ] Token payload contains `yearId`
- [ ] Token payload contains `nameid`
- [ ] Mapped user object has `yearId` as number
- [ ] No warnings about missing yearId
- [ ] Student auto-filter message appears
- [ ] Cart API call succeeds (no 400/500 error)
- [ ] Toast shows success message
- [ ] Cart badge updates

---

## ✅ Success Criteria

All of these must be true:

1. **Token has yearId**
   - `yearId: "1"` in token payload

2. **Token has correct student ID**
   - `nameid: "8"` matches database

3. **No Console Errors**
   - No red errors in console
   - No warnings about missing yearId

4. **Cart Works**
   - Add to cart succeeds
   - Returns 200 (not 400 or 500)
   - Success toast appears

5. **Auto-Filter Works**
   - Student sees only their year's subjects
   - Year selector hidden

---

## 🚨 If Still Not Working

### Problem 1: yearId missing
**Console shows:**
```
⚠️ yearId NOT found in JWT token!
```

**Solution:** Backend didn't update token generation. Contact backend team.

---

### Problem 2: Student ID mismatch
**Console shows:**
```
❌ Student with ID 8 not found
```

**Check:**
```sql
SELECT Id, UserName FROM AspNetUsers WHERE UserName = 'ali_ahmed';
```

**If ID is different (e.g., 5):**
Backend token generation using wrong ID. Should use actual database ID.

---

### Problem 3: Student doesn't exist
**Console shows:**
```
❌ Student with ID 8 not found
```

**Solution:** Backend needs to seed database or create student:
```sql
-- Check if student exists
SELECT * FROM AspNetUsers WHERE Id = 8;

-- If empty, backend needs to create student or reseed database
```

---

## 📞 Report Issues

If tests fail, share these details:

1. **Console logs** (copy all logs from login to error)
2. **Token payload** (from debug command above)
3. **Error message** (exact message from backend)
4. **Screenshots** (if helpful)

---

## 🎉 When All Tests Pass

✅ **Frontend:** 100% Working  
✅ **Backend:** Token Fixed  
✅ **Integration:** Complete  
✅ **Ready for:** Production Use

**Next Steps:**
- Test with multiple students
- Test with different year levels
- Test cart checkout flow
- Test full user journey

---

**Status:** ⏳ Awaiting Test Results  
**Expected:** All tests should pass after token update  
**If Fail:** Backend needs additional fixes (see troubleshooting above)
