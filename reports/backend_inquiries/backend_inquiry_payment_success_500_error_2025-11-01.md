# ❓ Backend Inquiry Report

**Date:** November 1, 2025  
**Reporter:** Frontend Development Team  
**Priority:** HIGH  
**Status:** Pending Investigation

---

## 1. Inquiry Topic

**500 Internal Server Error** on `/api/Payment/success` endpoint during Stripe payment verification

---

## 2. Reason for Inquiry

The frontend is successfully receiving the Stripe `session_id` from the payment redirect and calling the backend endpoint as documented in Swagger, but the backend is returning a **500 Internal Server Error** instead of processing the payment verification.

### Error Details:

```
GET https://naplan2.runasp.net/api/Payment/success?session_id=cs_test_b1aE97yY9ohys3MQsQ9ALd1tklg4pVhhcpuluq9pmyNNXddIF1YXiz4PoZ

Status: 500 Internal Server Error
```

### Frontend Implementation:

The frontend is correctly calling the endpoint as specified in Swagger:

```typescript
// GET request with session_id as query parameter
this.http.get<PaymentResponse>(`${this.apiBaseUrl}/Payment/success?session_id=${sessionId}`)
```

### Console Logs:

```
🔍 Verifying payment with session ID: cs_test_b1aE97yY9ohys3MQsQ9ALd1tklg4pVhhcpuluq9pmyNNXddIF1YXiz4PoZ
🔑 Auth token present: false
🌐 API URL: https://naplan2.runasp.net/api/Payment/success?session_id=cs_test_b1aE97yY9ohys3MQsQ9ALd1tklg4pVhhcpuluq9pmyNNXddIF1YXiz4PoZ
❌ Payment verification error: [500 Error Object]
```

**Note:** Auth token is showing as `false` - this may be related to the issue (see question #3 below).

---

## 3. Requested Details from Backend Team

### A. Authentication Requirements

**Question:** Does `/api/Payment/success` require authentication?

- Swagger documentation does **not** show any `[Authorize]` attribute or security requirement
- However, the endpoint might need authentication to identify which user's order to process
- **Please clarify:**
  - Is this endpoint supposed to be public (for Stripe redirect)?
  - Should it require a Bearer token?
  - If authentication is required, how should the frontend pass the token when users are redirected from Stripe?

### B. Expected Request Format

**Please confirm:**
- Endpoint: `GET /api/Payment/success`
- Query Parameter: `session_id` (string)
- Headers Required: Authorization Bearer token? (Yes/No)
- Any other required parameters or headers?

### C. Expected Response Format

**Please provide:**

1. **Success Response Schema:**
```json
{
  "message": "string",
  "sessionId": "string",
  "success": true,
  "orderId": 123,
  // ... any other fields
}
```

2. **Error Response Schema:**
```json
{
  "message": "error description",
  "errors": {}
}
```

### D. Backend Error Investigation

**Please investigate the following:**

1. **What is causing the 500 error?**
   - Check backend logs for exceptions
   - Verify Stripe API key configuration
   - Check database connection
   - Verify the `session_id` parameter is being received correctly

2. **Does the endpoint:**
   - Successfully connect to Stripe API?
   - Properly validate the `session_id`?
   - Update the order status in the database?
   - Clear the user's cart after successful payment?
   - Activate subscriptions for the student?

3. **Test Session ID:**
   - Session ID used: `cs_test_b1aE97yY9ohys3MQsQ9ALd1tklg4pVhhcpuluq9pmyNNXddIF1YXiz4PoZ`
   - Please test with this specific session ID and report findings

---

## 4. Current Frontend Implementation

### File: `payment-success.component.ts`

```typescript
private verifyStripePayment(sessionId: string): void {
  console.log('🔍 Verifying payment with session ID:', sessionId);

  // Check if user is authenticated
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  console.log('🔑 Auth token present:', !!token);
  console.log('🌐 API URL:', `${this.apiBaseUrl}/Payment/success?session_id=${sessionId}`);

  // Call backend endpoint: GET /api/Payment/success?session_id={sessionId}
  // Auth interceptor will automatically add Authorization header
  this.http.get<PaymentResponse>(`${this.apiBaseUrl}/Payment/success?session_id=${sessionId}`)
    .subscribe({
      next: (response: PaymentResponse) => {
        console.log('✅ Payment verification response:', response);
        
        if (response.message && response.message.includes('successful')) {
          // Handle success - clear cart, redirect to dashboard
          this.handleSuccessfulPayment();
        }
      },
      error: (error: any) => {
        console.error('❌ Payment verification error:', error);
        this.loading.set(false);
        this.toastService.showError('Payment verification failed. Please contact support.');
      }
    });
}
```

---

## 5. Impact on User Experience

**Current Issue:**
- Users complete payment on Stripe successfully
- Stripe redirects to success page with `session_id`
- Backend returns 500 error
- Users see error message
- Cart is not cleared
- Subscriptions are not activated
- User experience is broken

**Critical:** This is blocking the entire payment flow and affecting real users.

---

## 6. Temporary Workaround Needed?

While the backend team investigates, **please advise if there is a temporary workaround:**

1. Alternative endpoint to verify payment?
2. Different authentication approach for Stripe redirects?
3. Manual order processing procedure for affected users?

---

## 7. Related Endpoints

These endpoints may be related and should be reviewed together:

- `GET /api/Payment/success?session_id={session_id}` ← **Currently failing**
- `GET /api/Payment/cancel?session_id={session_id}`
- `GET /api/Payment/verify?session_id={session_id}`
- `POST /api/Orders/success?session_id={session_id}`
- `POST /api/StripeWebhook` (webhook for async payment processing)

**Question:** Should we use a different endpoint for payment verification?

---

## 8. Suggested Backend Investigation Steps

1. ✅ Enable detailed logging in `PaymentController.Success()` method
2. ✅ Check Stripe API key configuration in `appsettings.json`
3. ✅ Verify Stripe SDK is properly installed and configured
4. ✅ Test the endpoint with the provided `session_id` in Postman/Swagger
5. ✅ Check if the endpoint requires authentication (add `[AllowAnonymous]` if needed)
6. ✅ Verify database connection and order update logic
7. ✅ Review exception logs for this specific request
8. ✅ Test with both test and live Stripe keys

---

## 9. Required Response from Backend Team

Please provide:

1. **Root Cause:** What is causing the 500 error?
2. **Fix Timeline:** When will this be resolved?
3. **Authentication Clarification:** Does this endpoint need a token?
4. **Response Schema:** Complete response format with all fields
5. **Testing:** Confirmation that the endpoint works after the fix
6. **Documentation Update:** Update Swagger if authentication requirements change

---

## 10. Contact Information

**Frontend Team:**
- Available for testing and collaboration
- Can provide additional logs or test scenarios
- Ready to update frontend code based on backend requirements

**Please respond to this inquiry as soon as possible** - this is blocking the payment flow for all users.

---

## 11. Additional Context

### Stripe Integration Status:
- ✅ Stripe checkout session creation works
- ✅ Stripe redirect to success page works
- ✅ Session ID is correctly captured from URL
- ❌ **Backend payment verification fails (500 error)**
- ❌ Cart clearing depends on successful verification
- ❌ Subscription activation depends on successful verification

### Test Environment:
- Frontend: `http://localhost:4200` (development)
- Backend: `https://naplan2.runasp.net` (production)
- Stripe Mode: Test mode
- Test Session ID: `cs_test_b1aE97yY9ohys3MQsQ9ALd1tklg4pVhhcpuluq9pmyNNXddIF1YXiz4PoZ`

---

**Status:** 🔴 **BLOCKING** - Requires immediate attention from backend team.
