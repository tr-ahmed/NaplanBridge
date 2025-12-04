# Testing Guide - Subscription Validation System

**Version:** 1.0  
**Date:** 2025-01-27  
**For:** QA & Testing Team  

---

## 📋 Overview

This guide helps you test the subscription validation error handling system implemented on the frontend.

---

## ⚠️ Prerequisites

### Required
- ✅ Backend must have validation enabled
- ✅ Backend must return 400 errors with proper messages
- ✅ Backend endpoint `/api/subscriptions/student/{id}/active` must exist
- ✅ Test user accounts with various subscription states
- ✅ Test student accounts

### Test Accounts Needed
1. **Parent account** with at least 2 children
2. **Student accounts** with different subscription states:
   - No subscriptions
   - Single term subscription
   - Annual subscription
   - Full year subscription
   - Multiple overlapping subscriptions

---

## 🧪 Test Scenarios

### Scenario 1: Same Plan Already in Cart

**Setup:**
1. Login as Parent
2. Select a student
3. Add "Mathematics Term 1" to cart
4. DO NOT checkout

**Test Steps:**
1. Try to add "Mathematics Term 1" again
2. Click "Add to Cart" button

**Expected Result:**
- ✅ Error dialog appears
- ✅ Error message: "This plan is already in your cart for this student. Please proceed to checkout."
- ✅ "View Cart" button is shown
- ✅ Clicking "View Cart" navigates to `/cart`
- ✅ Clicking "Close" dismisses dialog

**Mobile Test:**
- ✅ Dialog is full width on mobile
- ✅ Buttons are easy to tap (48px height)
- ✅ Text is readable without zooming

---

### Scenario 2: Different Plan for Same Subject in Cart

**Setup:**
1. Login as Parent
2. Add "Mathematics Term 1" to cart
3. DO NOT checkout

**Test Steps:**
1. Try to add "Mathematics Term 2" (different term, same subject)
2. Click "Add to Cart"

**Expected Result:**
- ✅ Error dialog appears
- ✅ Error message mentions existing plan in cart
- ✅ "View Cart" button is shown
- ✅ Clicking button navigates to cart
- ✅ User can remove conflicting item from cart

**Edge Cases:**
- Try with different subjects (should work)
- Try with same subject different year (test behavior)

---

### Scenario 3: Active Subscription Exists

**Setup:**
1. Student already has active "Mathematics Term 1" subscription
2. Subscription expires in future (e.g., 60 days)
3. Login as Parent

**Test Steps:**
1. Try to add "Mathematics Term 1" to cart
2. Click "Add to Cart"

**Expected Result:**
- ✅ Error dialog appears
- ✅ Error message mentions active subscription
- ✅ Error shows expiry date
- ✅ "View Active Subscriptions" button shown
- ✅ Clicking button navigates to subscriptions page
- ✅ Active subscriptions page shows the existing plan

**Verify:**
- Expiry date matches backend
- Days remaining is correct
- Badge color is correct (green > 30 days)

---

### Scenario 4: Annual Subscription Covers Term

**Setup:**
1. Student has active "Mathematics Annual" subscription
2. Annual subscription includes all terms
3. Login as Parent

**Test Steps:**
1. Try to add "Mathematics Term 1" to cart
2. Click "Add to Cart"

**Expected Result:**
- ✅ Error dialog appears
- ✅ Error explains "Annual includes all terms"
- ✅ "View Active Subscriptions" button shown
- ✅ Clicking button shows annual subscription
- ✅ Annual subscription clearly marked

**Test All Terms:**
- Try adding Term 1 ❌ Should fail
- Try adding Term 2 ❌ Should fail
- Try adding Term 3 ❌ Should fail
- Try adding Term 4 ❌ Should fail

---

### Scenario 5: Full Year Subscription Exists

**Setup:**
1. Student has active "Full Year" subscription
2. Full Year covers ALL subjects and terms
3. Login as Parent

**Test Steps:**
1. Try to add ANY subject/term plan
2. Click "Add to Cart"

**Expected Result:**
- ✅ Error dialog appears
- ✅ Error explains "Full Year covers everything"
- ✅ "View Active Subscriptions" button shown
- ✅ Full Year subscription is displayed

**Test Multiple Subjects:**
- Try Mathematics ❌ Should fail
- Try Science ❌ Should fail
- Try English ❌ Should fail
- All should show same error

---

### Scenario 6: Multi-Term Overlap

**Setup:**
1. Student has "Mathematics Terms 1&2" subscription
2. Login as Parent

**Test Steps:**
1. Try to add "Mathematics Terms 2&3" plan

**Expected Result:**
- ✅ Error dialog appears
- ✅ Error mentions overlapping terms
- ✅ Shows existing subscription that causes conflict
- ✅ "View Active Subscriptions" button works

**Test Overlap Variations:**
- Terms 1&2 exists, add Term 1 ❌
- Terms 1&2 exists, add Term 2 ❌
- Terms 1&2 exists, add Terms 2&3 ❌
- Terms 1&2 exists, add Term 3 ✅ (should work, no overlap)

---

## 📱 Mobile & Responsive Testing

### Test Devices
- iPhone SE (320px width)
- iPhone 12 Pro (390px)
- iPad (768px)
- Desktop (1920px)

### Error Dialog Mobile Tests
- ✅ Dialog doesn't exceed screen width
- ✅ All text is readable
- ✅ No horizontal scrolling
- ✅ Buttons are touch-friendly (48px)
- ✅ Long error messages scroll vertically
- ✅ Backdrop click closes dialog

### Active Subscriptions Mobile Tests
- ✅ Cards stack vertically on mobile
- ✅ All information visible without scrolling horizontally
- ✅ Badges are readable
- ✅ Dates format correctly
- ✅ Refresh button works

---

## 🎨 UI/UX Validation

### Error Dialog
- ✅ Red error icon displays
- ✅ Clear heading: "❌ Cannot Add to Cart"
- ✅ Error message is readable (not truncated)
- ✅ Action button is blue (primary color)
- ✅ Close button is gray (secondary color)
- ✅ Animations are smooth
- ✅ Focus management (keyboard navigation)

### Active Subscriptions
- ✅ Loading spinner shows while fetching
- ✅ Cards have subtle shadow/border
- ✅ Badge colors correct:
  - Green: > 30 days
  - Yellow: 8-30 days
  - Red: ≤ 7 days
- ✅ Empty state shows helpful message
- ✅ "Browse Plans" button works
- ✅ Refresh button reloads data

---

## 🔄 User Flow Tests

### Flow 1: Error → View Cart
1. Trigger cart error
2. Click "View Cart"
3. **Verify:** Navigate to `/cart`
4. **Verify:** Cart shows existing items
5. **Verify:** User can remove items
6. **Verify:** Can retry adding after removing conflict

### Flow 2: Error → View Subscriptions
1. Trigger subscription conflict error
2. Click "View Active Subscriptions"
3. **Verify:** Navigate to subscriptions page
4. **Verify:** Active subscriptions display
5. **Verify:** Expiry dates shown
6. **Verify:** Can navigate back

### Flow 3: Error → Close → Retry
1. Trigger any error
2. Click "Close"
3. **Verify:** Dialog closes
4. **Verify:** User stays on same page
5. **Verify:** Can select different plan
6. **Verify:** Can retry successfully

---

## 🌐 Browser Compatibility

### Desktop Browsers
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

### Mobile Browsers
- [ ] Safari iOS
- [ ] Chrome Android
- [ ] Samsung Internet

**Test Each:**
- Error dialog displays
- Buttons work
- Navigation works
- Active subscriptions load

---

## ⚡ Performance Tests

### Loading Times
- ✅ Error dialog appears instantly (< 100ms)
- ✅ Active subscriptions load within 2 seconds
- ✅ Navigation is immediate
- ✅ No visible lag on button clicks

### Network Conditions
Test on:
- Fast 3G
- Slow 3G
- Offline (should show error)

---

## 🔒 Security Tests

### Authorization
- ✅ Only parent can view their students' subscriptions
- ✅ Cannot view other users' subscriptions (test wrong studentId)
- ✅ Unauthenticated users get 401 error
- ✅ Error messages don't expose sensitive data

### Input Validation
- ✅ Invalid studentId returns proper error
- ✅ Negative numbers handled
- ✅ Special characters in URLs handled

---

## 🐛 Error Handling Tests

### API Failures
1. **Network Offline:**
   - ✅ Shows generic error message
   - ✅ Doesn't crash app

2. **Backend 500 Error:**
   - ✅ Shows user-friendly error
   - ✅ Logs to console

3. **Timeout:**
   - ✅ Shows timeout message
   - ✅ User can retry

4. **Invalid Response:**
   - ✅ Handles gracefully
   - ✅ Shows fallback error

---

## 📊 Test Report Template

```
Test Date: _____________
Tester: _____________
Browser: _____________
Device: _____________

| Scenario | Pass | Fail | Notes |
|----------|------|------|-------|
| 1. Same plan in cart | ☐ | ☐ | |
| 2. Different plan same subject | ☐ | ☐ | |
| 3. Active subscription | ☐ | ☐ | |
| 4. Annual covers term | ☐ | ☐ | |
| 5. Full year exists | ☐ | ☐ | |
| 6. Multi-term overlap | ☐ | ☐ | |
| Mobile responsive | ☐ | ☐ | |
| Active subscriptions | ☐ | ☐ | |
| User flows | ☐ | ☐ | |
| Performance | ☐ | ☐ | |

Overall Result: PASS / FAIL
```

---

## 🔍 Debugging Tips

### Error Dialog Not Showing
1. Check browser console for errors
2. Verify backend returns 400 status
3. Check error message format
4. Verify component imports

### Wrong Action Button
1. Check error message text
2. Verify `determineActionType()` logic
3. Test with exact backend error message

### Active Subscriptions Not Loading
1. Check network tab for API call
2. Verify endpoint exists on backend
3. Check response format matches interface
4. Verify studentId is correct

### Navigation Not Working
1. Check router configuration
2. Verify routes exist
3. Check browser console for errors

---

## ✅ Acceptance Criteria

All tests must pass before release:

- [ ] All 6 error scenarios work correctly
- [ ] Error dialogs display on all browsers
- [ ] Mobile responsive on all devices
- [ ] Action buttons navigate correctly
- [ ] Active subscriptions load and display
- [ ] No console errors
- [ ] Performance is acceptable
- [ ] Security tests pass
- [ ] User flows are smooth

---

## 📞 Reporting Issues

When reporting bugs, include:

1. **Scenario number** (e.g., "Scenario 3")
2. **Steps to reproduce**
3. **Expected result**
4. **Actual result**
5. **Screenshots** (especially for UI issues)
6. **Browser/device info**
7. **Console errors** (if any)
8. **Network tab** (for API issues)

**Example:**
```
Scenario 3 - Active Subscription Exists
Steps: Added Math Term 1 with existing subscription
Expected: Error dialog with "View Subscriptions" button
Actual: Dialog shows but button missing
Browser: Chrome 120.0, Windows 11
Console: TypeError: actionButton is undefined
Screenshot: attached
```

---

## 🎯 Priority Issues

**P0 - Critical (Block Release):**
- Error dialog doesn't show
- App crashes
- Navigation broken
- Data security issues

**P1 - High (Fix Before Release):**
- Wrong error message
- Wrong action button
- Mobile layout broken
- Active subscriptions don't load

**P2 - Medium (Fix Soon):**
- Minor UI issues
- Slow performance
- Missing animations

**P3 - Low (Nice to Have):**
- Cosmetic issues
- Enhancement suggestions

---

**Testing Guide Version:** 1.0  
**Last Updated:** 2025-01-27  
**Prepared By:** GitHub Copilot

---

**Ready to Test!** 🚀
