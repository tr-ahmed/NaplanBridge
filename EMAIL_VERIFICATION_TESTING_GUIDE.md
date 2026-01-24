# 🧪 Email Verification System - Quick Testing Guide

**Date:** January 24, 2026  
**Purpose:** Quick reference for testing email verification flow

---

## 🚀 Quick Start Testing

### Prerequisites

1. ✅ Backend server running
2. ✅ Frontend dev server running (`ng serve` or `npm start`)
3. ✅ Email service configured in backend
4. ✅ Test email account accessible

---

## 📋 Test Scenarios

### Scenario 1: New User Registration ✓

**Steps:**

1. Navigate to `/auth/register`
2. Fill in registration form:
   - Username: `testuser123`
   - Email: `your-test-email@example.com`
   - Password: `Test@12345`
   - Phone: `+96123456789`
   - Age: `25`
3. Click "Register"

**Expected Results:**

- ✅ Success toast: "Registration successful! Please check your email..."
- ✅ Info toast: "We've sent a verification link to..."
- ✅ Redirect to `/auth/check-email?email=...&type=registration`
- ✅ Check-email page shows email address
- ✅ "Resend Email" button available

**Verify:**

- Check email inbox for verification email
- Email should contain verification link

---

### Scenario 2: Email Verification from Link ✓

**Steps:**

1. Open verification email
2. Click verification link
3. Browser opens `/auth/verify-email?email=...&token=...`

**Expected Results:**

- ✅ Shows "Verifying your email..." with spinner
- ✅ After ~2 seconds, shows "Email verified successfully!"
- ✅ Success toast notification
- ✅ Auto-redirects to `/auth/login?email=...` after 2 seconds
- ✅ Login page has email pre-filled

---

### Scenario 3: Login Before Verification ❌ → ✅

**Steps:**

1. Register new account (don't verify)
2. Navigate to `/auth/login`
3. Enter credentials
4. Click "Login"

**Expected Results:**

- ✅ Warning toast: "Please verify your email address..."
- ✅ Auto-redirect to `/auth/verify-email?email=...`
- ✅ Verify-email page shows instructions
- ✅ Email address displayed
- ✅ "Resend Email" button available
- ✅ "Back to Login" link available

---

### Scenario 4: Resend Verification Email ✓

**Steps:**

1. Navigate to `/auth/verify-email?email=your-email@example.com`
2. Click "Resend Email" button

**Expected Results:**

- ✅ Button shows "Sending..." with spinner
- ✅ After sending, button returns to normal
- ✅ Success message appears: "Verification email sent successfully!"
- ✅ Success toast notification
- ✅ New email received in inbox

**Verify:**

- Check email inbox for new verification email
- New email should have different token

---

### Scenario 5: Expired Verification Token ⚠️ → ✅

**Steps:**

1. Wait 24+ hours after registration (or use expired token)
2. Click old verification link
3. Browser opens `/auth/verify-email?email=...&token=...`

**Expected Results:**

- ✅ Shows "Verifying..." spinner
- ✅ After verification fails, shows error message
- ✅ Error message: "Invalid or expired verification token..."
- ✅ Error toast notification
- ✅ "Resend Verification Email" button displayed
- ✅ Clicking resend sends new email

---

### Scenario 6: Manual Email Entry ✓

**Steps:**

1. Navigate to `/auth/verify-email` (no query params)
2. Email input field appears
3. Enter email address
4. Click "Resend Email"

**Expected Results:**

- ✅ Email input field visible
- ✅ Resend button disabled when empty
- ✅ Resend button enabled after entering email
- ✅ Clicking resend sends email
- ✅ Success notification shown

---

### Scenario 7: Complete Happy Path ✓✓✓

**Full Flow:**

1. Register new account
2. Receive verification email
3. Click verification link
4. Email verified successfully
5. Redirected to login
6. Login with credentials
7. Successfully access dashboard

**Expected Results:**

- ✅ All steps complete without errors
- ✅ User can access protected routes
- ✅ Session established correctly

---

## 🔍 What to Check

### Visual Checks

- [ ] All pages responsive on mobile
- [ ] Gradient backgrounds display correctly
- [ ] Icons load and animate properly
- [ ] Buttons have hover effects
- [ ] Loading spinners animate smoothly
- [ ] Toast notifications appear and disappear
- [ ] Text is readable (proper contrast)
- [ ] No layout overflow or scrolling issues

### Functional Checks

- [ ] All buttons clickable
- [ ] Forms submit correctly
- [ ] Navigation works (back button, links)
- [ ] Email pre-filled from query params
- [ ] Auto-redirect timers work
- [ ] Resend button has cooldown/loading state
- [ ] Error messages clear and helpful
- [ ] Success messages encouraging

### Network Checks (DevTools)

- [ ] API calls return correct status codes
- [ ] 200 OK for successful verification
- [ ] 401 Unauthorized for login without verification
- [ ] 400 Bad Request for expired token
- [ ] Proper error messages in response bodies
- [ ] No console errors
- [ ] No CORS issues

---

## 🐛 Common Issues & Solutions

### Issue 1: Email Not Received

**Symptoms:**

- User doesn't receive verification email
- Inbox and spam folder both empty

**Solutions:**

1. Check backend email service configuration
2. Verify SMTP settings in backend
3. Check backend logs for email send errors
4. Try resend button
5. Use different email address
6. Contact system administrator

**Testing:**

```bash
# Check backend logs
# Look for email service errors or SMTP connection issues
```

---

### Issue 2: Verification Link Not Working

**Symptoms:**

- Clicking link shows error
- Token invalid or expired message

**Solutions:**

1. Check if token is correctly encoded in URL
2. Verify token hasn't expired (24hr limit)
3. Use resend button to get new token
4. Check backend token validation logic
5. Verify email matches exactly

**Testing:**

```typescript
// In browser console, check query params:
const params = new URLSearchParams(window.location.search);
console.log("Email:", params.get("email"));
console.log("Token:", params.get("token"));
```

---

### Issue 3: Auto-Redirect Not Working

**Symptoms:**

- Page doesn't redirect after success
- User stuck on verification page

**Solutions:**

1. Check browser console for JavaScript errors
2. Verify router is working correctly
3. Check if user has JavaScript enabled
4. Try manual "Back to Login" link
5. Clear browser cache and retry

**Testing:**

```typescript
// In browser console:
console.log("Router available:", !!this.router);
```

---

### Issue 4: Resend Button Not Working

**Symptoms:**

- Clicking resend does nothing
- Button stays in loading state
- No email received

**Solutions:**

1. Check network tab for API call
2. Verify email address is valid
3. Check backend logs for errors
4. Ensure button not in disabled state
5. Check API endpoint is correct

**Testing:**

```typescript
// In browser console, check button state:
const button = document.querySelector(".btn-primary");
console.log("Disabled:", button.disabled);
```

---

### Issue 5: Styling Issues

**Symptoms:**

- Gradient not showing
- Icons not displaying
- Layout broken

**Solutions:**

1. Check if FontAwesome is loaded
2. Verify SCSS compiling correctly
3. Check for CSS conflicts
4. Clear browser cache
5. Check browser developer tools for CSS errors

**Testing:**

```html
<!-- Check if FontAwesome loaded in browser console: -->
<script>
  console.log("FontAwesome:", typeof FontAwesome !== "undefined");
</script>
```

---

## 📊 Test Results Template

Use this template to record your test results:

```markdown
### Test Session: [Date/Time]

**Environment:**

- Frontend: http://localhost:4200
- Backend: http://localhost:5000
- Email Service: [Configured/Not Configured]

**Test Results:**

| Scenario                  | Status | Notes |
| ------------------------- | ------ | ----- |
| New User Registration     | ⬜     |       |
| Email Verification        | ⬜     |       |
| Login Before Verification | ⬜     |       |
| Resend Email              | ⬜     |       |
| Expired Token             | ⬜     |       |
| Manual Email Entry        | ⬜     |       |
| Complete Happy Path       | ⬜     |       |

**Issues Found:**

1. [Issue description]
2. [Issue description]

**Notes:**

- [Additional observations]
```

---

## 🎯 Quick Verification Commands

### Check if component exists:

```bash
# Windows PowerShell
Test-Path "src\app\auth\verify-email\verify-email.component.ts"
```

### Check if route is configured:

```bash
# Search for verify-email in routes
Select-String -Path "src\app\auth\auth.routes.ts" -Pattern "verify-email"
```

### Check for errors:

```bash
# Compile TypeScript
ng build --configuration development
```

### Run dev server:

```bash
npm start
# or
ng serve
```

---

## ✅ Final Checklist

Before marking testing complete:

- [ ] All 7 test scenarios passed
- [ ] No console errors in browser
- [ ] No TypeScript compilation errors
- [ ] Emails received successfully
- [ ] All buttons and links working
- [ ] Mobile responsive design verified
- [ ] Toast notifications working
- [ ] Auto-redirects functioning
- [ ] Loading states displaying correctly
- [ ] Error handling comprehensive
- [ ] Success flows smooth and intuitive
- [ ] Documentation reviewed
- [ ] Team members can replicate tests

---

## 📞 Need Help?

**Resources:**

- Implementation Guide: `FRONTEND_EMAIL_VERIFICATION_IMPLEMENTATION_STATUS.md`
- Backend API Docs: `/swagger`
- Angular Docs: https://angular.io

**Contact:**

- Technical Lead: [Name]
- Email Support: support@naplanbridge.com
- Slack Channel: #email-verification

---

## 🎉 Test Completion

When all tests pass:

1. ✅ Mark all scenarios as complete
2. ✅ Document any issues found
3. ✅ Update team on Slack/email
4. ✅ Move ticket to "Ready for Production"

---

**Status:** ✅ Ready for Testing  
**Last Updated:** January 24, 2026  
**Test Duration:** ~30-45 minutes for complete suite
