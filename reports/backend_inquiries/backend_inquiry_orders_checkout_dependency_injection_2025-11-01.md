# ✅ Backend Inquiry Report - **RESOLVED**

## Status: **FIXED** ✅
**Date Fixed**: November 1, 2025  
**Commit Hash**: `6821149`  
**Fix Applied By**: Backend Team

---

## 1. Inquiry Topic

**Dependency Injection Error in OrdersController for Stripe Checkout** ✅ **RESOLVED**

---

## 2. Error Details (Original Issue)

### Frontend Request:
```http
POST https://localhost:44349/api/Orders/checkout
Content-Type: application/json

{}
```

### Backend Response:
```json
{
  "statusCode": 500,
  "message": "Internal Server Error",
  "details": "Unable to resolve service for type 'API.Services.I…g to activate 'API.Controllers.OrdersController'.",
  "traceId": "3f128eff-45ae-4796-bf5a-3535e76a87fc",
  "timestamp": "2025-11-01T10:03:46.7274349Z"
}
```

---

## 3. Issue Analysis

The `OrdersController` is trying to inject a service (likely `IStripeService` or `IPaymentService`) that is **NOT registered** in the Dependency Injection container.

### Typical DI Error Pattern:
```csharp
// OrdersController.cs
public class OrdersController : ControllerBase
{
    private readonly IStripeService _stripeService; // ← Not registered in Program.cs!
    
    public OrdersController(IStripeService stripeService)
    {
        _stripeService = stripeService;
    }
}
```

### Missing Registration in Program.cs:
```csharp
// Program.cs should have:
builder.Services.AddScoped<IStripeService, StripeService>(); // ← MISSING!
```

---

## 4. Requested Details from Backend Team

### A. Controller Implementation
Please provide the **complete constructor** of `OrdersController`:
```csharp
public OrdersController(/* What services are injected here? */)
{
    // Constructor body
}
```

### B. Service Registration
Which services are registered in `Program.cs` or `Startup.cs`?
```csharp
// Expected registrations:
builder.Services.AddScoped<IStripeService, StripeService>();
builder.Services.AddScoped<ICartRepository, CartRepository>();
builder.Services.AddScoped<IOrderRepository, OrderRepository>();
// ... etc
```

### C. Checkout Endpoint Implementation
Please provide the implementation of the checkout endpoint:
```csharp
[HttpPost("checkout")]
public async Task<ActionResult<CheckoutSessionResponse>> CreateCheckoutSession()
{
    // Current implementation?
}
```

### D. Required Services
What services does `OrdersController` depend on for the checkout flow?
- Stripe service?
- Cart repository?
- Order repository?
- User/Auth service?

---

## 5. Expected Endpoint Behavior

According to swagger.json, the endpoint should:

### Request:
```http
POST /api/Orders/checkout
Authorization: Bearer {token}
Content-Type: application/json

{}
```

### Expected Response:
```json
{
  "sessionId": "cs_test_a1b2c3...",
  "sessionUrl": "https://checkout.stripe.com/c/pay/cs_test_...",
  "orderId": 123,
  "totalAmount": 35.99,
  "currency": "usd"
}
```

### Current Cart State:
- User has items in cart (studentId: 1)
- Cart total: $35.99
- Cart contains 1 item (subject enrollment)

---

## 6. Suggested Backend Fix

### Step 1: Register Missing Services
In `Program.cs`:
```csharp
// Add Stripe configuration
builder.Services.Configure<StripeSettings>(
    builder.Configuration.GetSection("Stripe")
);

// Register Stripe service
builder.Services.AddScoped<IStripeService, StripeService>();

// Register repositories
builder.Services.AddScoped<ICartRepository, CartRepository>();
builder.Services.AddScoped<IOrderRepository, OrderRepository>();
```

### Step 2: Update appsettings.json
```json
{
  "Stripe": {
    "PublishableKey": "pk_test_...",
    "SecretKey": "sk_test_...",
    "WebhookSecret": "whsec_..."
  }
}
```

### Step 3: Verify Controller Constructor
```csharp
public class OrdersController : ControllerBase
{
    private readonly IStripeService _stripeService;
    private readonly ICartRepository _cartRepo;
    private readonly IOrderRepository _orderRepo;
    
    public OrdersController(
        IStripeService stripeService,
        ICartRepository cartRepo,
        IOrderRepository orderRepo)
    {
        _stripeService = stripeService;
        _cartRepo = cartRepo;
        _orderRepo = orderRepo;
    }
    
    [HttpPost("checkout")]
    public async Task<ActionResult<CheckoutSessionResponse>> CreateCheckoutSession()
    {
        // 1. Get user cart
        // 2. Create order
        // 3. Create Stripe checkout session
        // 4. Return session URL
    }
}
```

---

## 7. Frontend is Ready

The Angular frontend is correctly calling:
```typescript
POST /api/Orders/checkout
{} // Empty body (cart from session)
```

And expecting:
```typescript
{
  sessionId: string;
  sessionUrl: string;  // ← Will redirect user here
  orderId: number;
  totalAmount: number;
  currency: string;
}
```

---

## 8. Priority

**🔴 HIGH PRIORITY**

This blocks the entire payment flow. Users cannot enroll in courses until this is fixed.

---

## 9. Contact

**Frontend Developer:** Ahmed Hamdi  
**Date Reported:** November 1, 2025  
**Affected Endpoint:** `POST /api/Orders/checkout`  
**Error Code:** 500 Internal Server Error  
**Trace ID:** `3f128eff-45ae-4796-bf5a-3535e76a87fc`

---

## ✅ PARTIAL RESOLUTION + NEW ISSUE

### Date Fixed: November 1, 2025
### Commit Hash: `6821149`

### ✅ FIXED: Services Registered in Program.cs:
```csharp
builder.Services.AddScoped<IOrderService, OrderService>(); // ✅ ADDED
builder.Services.AddScoped<IStripeService, StripeService>(); // ✅ ADDED
```

### Controller Implementation:
```csharp
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class OrdersController(
    IOrderService orderService,  // ✅ Now injected
    ICartService cartService
) : Controller
{
    [HttpPost("checkout")]
    public async Task<IActionResult> Checkout()
    {
        var parentId = GetCurrentUserId();
        
        // Validate cart
        var cartItemCount = await cartService.GetCartItemCountAsync(parentId);
        if (cartItemCount == 0)
            return BadRequest(new { message = "Cart is empty" });
        
        // Create Stripe checkout session
        var checkoutResponse = await orderService.CheckoutCartAsync(parentId);
        return Ok(checkoutResponse);
    }
}
```

### Expected Response:
```json
{
  "sessionId": "cs_test_...",
  "sessionUrl": "https://checkout.stripe.com/c/pay/...",
  "orderId": 123,
  "totalAmount": 35.99,
  "currency": "usd"
}
```

### Status:
- ✅ Backend deployed
- ✅ Services registered
- ✅ Endpoint working
- ✅ Ready for frontend testing

### Frontend Action:
**NO CODE CHANGES NEEDED** - Your Angular code was correct all along!

---

## 🔴 NEW ISSUE - Stripe API Key Missing

### Date: November 1, 2025 - 10:10 AM

### Error Message:
```
{
  "statusCode": 500,
  "message": "An error occurred during checkout",
  "error": "No API key provided. Set your API key using `var client = new StripeClient(\"sk_test_...\")`"
}
```

### Root Cause:
**Stripe Secret Key is not configured in appsettings.json**

The backend is missing the Stripe API configuration. The `IStripeService` is registered but cannot initialize without the API key.

### Required Fix in Backend:

#### 1. Add to `appsettings.json`:
```json
{
  "Stripe": {
    "SecretKey": "sk_test_YOUR_STRIPE_SECRET_KEY_HERE",
    "PublishableKey": "pk_test_YOUR_STRIPE_PUBLISHABLE_KEY_HERE",
    "WebhookSecret": "whsec_YOUR_WEBHOOK_SECRET_HERE"
  }
}
```

#### 2. Ensure StripeService reads configuration:
```csharp
public class StripeService : IStripeService
{
    private readonly string _secretKey;
    
    public StripeService(IConfiguration configuration)
    {
        _secretKey = configuration["Stripe:SecretKey"];
        StripeConfiguration.ApiKey = _secretKey;
        
        if (string.IsNullOrEmpty(_secretKey))
            throw new InvalidOperationException("Stripe:SecretKey is not configured");
    }
}
```

#### 3. Get Stripe API Keys:
- Login to https://dashboard.stripe.com/test/apikeys
- Copy **Secret key** (starts with `sk_test_`)
- Copy **Publishable key** (starts with `pk_test_`)
- For webhooks: https://dashboard.stripe.com/test/webhooks

### Priority:
**🔴 CRITICAL** - Payment system is completely blocked until Stripe keys are added.

### Status:
- ✅ DI Fixed (IOrderService & IStripeService registered)
- ❌ **Stripe API Key Missing in Configuration**
- ⏳ Waiting for Backend Team to add Stripe keys

### Frontend Status:
**✅ Frontend is ready** - No changes needed. Waiting for backend configuration only.

---

## 🟡 UPDATE - Backend Responding but Missing sessionUrl

### Date: November 1, 2025 - 10:15 AM

### Current Situation:
✅ Backend endpoint `/api/Orders/checkout` is now responding (no more 500 error)  
❌ Response is missing `sessionUrl` field

### Error in Frontend:
```
Error: Failed to create order
Response: { orderId: ???, ... } // But NO sessionUrl!
```

### Expected Response Format:
According to the backend update, the endpoint should return:

```json
{
  "sessionId": "cs_test_a1b2c3d4e5f6...",
  "sessionUrl": "https://checkout.stripe.com/c/pay/cs_test_...",
  "orderId": 123,
  "totalAmount": 35.99,
  "currency": "usd"
}
```

### What We're Actually Getting:
```json
{
  "orderId": 123
  // ❌ Missing: sessionUrl, sessionId, totalAmount, currency
}
```

### Required Backend Fix:

The `POST /api/Orders/checkout` endpoint must return the complete Stripe checkout session response:

```csharp
[HttpPost("checkout")]
public async Task<IActionResult> Checkout()
{
    var parentId = GetCurrentUserId();
    
    // Create Stripe checkout session
    var checkoutResponse = await orderService.CheckoutCartAsync(parentId);
    
    // MUST return this structure:
    return Ok(new {
        sessionId = checkoutResponse.SessionId,      // ← REQUIRED
        sessionUrl = checkoutResponse.SessionUrl,    // ← REQUIRED (for redirect)
        orderId = checkoutResponse.OrderId,
        totalAmount = checkoutResponse.TotalAmount,
        currency = checkoutResponse.Currency
    });
}
```

### Why sessionUrl is Critical:
The frontend needs `sessionUrl` to redirect the user to Stripe's hosted checkout page:
```typescript
window.location.href = response.sessionUrl;
// Must redirect to: https://checkout.stripe.com/c/pay/...
```

### Stripe CheckoutSession Creation:
Make sure the backend is creating the Stripe session correctly:

```csharp
var options = new SessionCreateOptions
{
    PaymentMethodTypes = new List<string> { "card" },
    LineItems = lineItems,
    Mode = "payment",
    SuccessUrl = $"{frontendUrl}/payment/success?session_id={{CHECKOUT_SESSION_ID}}",
    CancelUrl = $"{frontendUrl}/cart",
};

var service = new SessionService();
var session = await service.CreateAsync(options);

// Return session.Url to frontend!
return new CheckoutSessionResponse
{
    SessionId = session.Id,
    SessionUrl = session.Url,  // ← This is what frontend needs!
    OrderId = orderId,
    TotalAmount = totalAmount,
    Currency = "usd"
};
```

### Frontend Code Updated:
✅ Frontend now expects single endpoint response with `sessionUrl`  
✅ Improved logging to show exact response structure  
✅ Better error messages

### Status:
- ✅ DI Fixed
- ✅ Backend responds (no 500 error)
- ❌ **Response missing sessionUrl field**
- ⏳ Waiting for backend to include sessionUrl in response

### Priority:
**🟡 HIGH** - Backend is responding but not returning complete data needed for redirect.

---

## ✅ PAYMENT FLOW WORKING - New Issue: Wrong Redirect URL

### Date: November 1, 2025 - 10:30 AM

### 🎉 SUCCESS: Payment Working!
✅ Stripe checkout page loads correctly  
✅ User can complete payment  
✅ Stripe processes payment successfully  
✅ Backend receives webhook callback  

### ❌ Issue: Wrong Success URL

After successful payment, user is redirected to:
```
❌ https://naplan2.runasp.net/api/Payment/success?session_id=cs_test_...
```

Should redirect to:
```
✅ http://localhost:4200/payment/success?session_id=cs_test_...
```

### Root Cause:
Backend is using **backend URL** instead of **frontend URL** when creating Stripe checkout session.

### Required Backend Fix:

When creating the Stripe checkout session, use the **frontend URL** for success/cancel URLs:

```csharp
var options = new SessionCreateOptions
{
    PaymentMethodTypes = new List<string> { "card" },
    LineItems = lineItems,
    Mode = "payment",
    
    // ❌ WRONG: Using backend URL
    SuccessUrl = $"https://naplan2.runasp.net/api/Payment/success?session_id={{CHECKOUT_SESSION_ID}}",
    CancelUrl = $"https://naplan2.runasp.net/api/Payment/cancel",
    
    // ✅ CORRECT: Use frontend URL
    SuccessUrl = $"http://localhost:4200/payment/success?session_id={{CHECKOUT_SESSION_ID}}",
    CancelUrl = $"http://localhost:4200/cart",
};
```

### Recommended Backend Implementation:

```csharp
// In appsettings.json
{
  "FrontendUrls": {
    "Development": "http://localhost:4200",
    "Production": "https://naplan2.runasp.net"
  }
}

// In StripeService
var frontendUrl = _configuration["FrontendUrls:Development"]; // or Production
var options = new SessionCreateOptions
{
    SuccessUrl = $"{frontendUrl}/payment/success?session_id={{CHECKOUT_SESSION_ID}}",
    CancelUrl = $"{frontendUrl}/cart",
};
```

### Frontend Routes Already Configured:
✅ `/payment/success` - Handles successful payment  
✅ `/payment/cancel` - Handles cancelled payment  
✅ Both routes are ready to receive session_id parameter

### Environment Configuration Added:
```typescript
// environment.ts (Development)
frontendUrl: 'http://localhost:4200'

// environment.prod.ts (Production)
frontendUrl: 'https://naplan2.runasp.net'
```

### Status:
- ✅ Payment flow working end-to-end
- ✅ Stripe integration successful
- ❌ **Wrong redirect URL (backend URL instead of frontend)**
- ⏳ Waiting for backend to use correct frontend URLs

### Priority:
**🟡 MEDIUM** - Payment works but user experience is broken due to wrong redirect.
