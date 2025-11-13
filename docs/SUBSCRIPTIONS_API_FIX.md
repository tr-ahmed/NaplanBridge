# Subscriptions Component API URL Fix

## Issue Identified

The subscriptions component was generating incorrect API URLs with duplicate `/api` paths:

```
❌ BEFORE:
https://naplan2.runasp.net/api/api/Orders
https://naplan2.runasp.net/api/api/SubscriptionPlans
https://naplan2.runasp.net/api/api/Orders/parent/analytics
```

This was causing **404 Not Found** errors for all API calls.

## Root Cause

The `environment.apiBaseUrl` already includes `/api` in its configuration:
```typescript
apiBaseUrl: 'https://naplan2.runasp.net/api'
```

However, the component was adding `/api/` again when constructing the URLs:
```typescript
// ❌ WRONG - Double /api
this.http.get(`${environment.apiBaseUrl}/api/Orders`)
```

## Solution Applied

Removed the duplicate `/api/` prefix from all 8 API endpoint calls in the component:

```
✅ AFTER:
https://naplan2.runasp.net/api/Orders
https://naplan2.runasp.net/api/SubscriptionPlans
https://naplan2.runasp.net/api/Orders/parent/analytics
```

## Fixed Endpoints

### Subscription Plans (4 endpoints)
1. **GET** `/SubscriptionPlans` - Load all subscription plans
2. **PUT** `/SubscriptionPlans/{id}` - Update existing plan
3. **POST** `/SubscriptionPlans` - Create new plan
4. **POST** `/SubscriptionPlans/deactivate-plan/{id}` - Deactivate plan

### Orders (3 endpoints)
5. **GET** `/Orders` - Load all orders
6. **GET** `/Orders/{id}` - Get order details
7. **GET** `/Orders/{id}/invoice` - Download invoice (blob)

### Analytics (1 endpoint)
8. **GET** `/Orders/parent/analytics` - Load analytics with date filters

## Testing Status

- ✅ No compilation errors
- ✅ All API URLs correctly formatted
- 🔄 Ready for backend integration testing

## Changes Made

**File:** `src/app/features/subscriptions/subscriptions.component.ts`

- Line 133: Fixed `loadSubscriptionPlans()` GET endpoint
- Line 182: Fixed `savePlan()` PUT endpoint
- Line 197: Fixed `savePlan()` POST endpoint
- Line 224: Fixed `deactivatePlan()` POST endpoint
- Line 245: Fixed `loadOrders()` GET endpoint
- Line 270: Fixed `viewOrderDetails()` GET endpoint
- Line 304: Fixed `downloadInvoice()` GET endpoint (blob)
- Line 330: Fixed `loadAnalytics()` GET endpoint

## Next Steps

1. **Test with Backend API**: Navigate to `/admin/subscriptions` and verify:
   - Subscription plans load without 404 errors
   - Orders load correctly
   - Analytics data displays properly
   - CRUD operations work (Create, Update, Deactivate)
   - Invoice download functions correctly

2. **Backend Verification**: Ensure the backend API endpoints match:
   - `/api/SubscriptionPlans`
   - `/api/Orders`
   - `/api/Orders/parent/analytics`

3. **Monitor Console**: Check browser console for any remaining errors

## Expected Behavior

With these fixes, the component should now:
- ✅ Successfully load subscription plans on page load
- ✅ Display orders in the orders tab
- ✅ Show analytics data in the analytics tab
- ✅ Allow creating new subscription plans
- ✅ Allow editing existing plans
- ✅ Allow deactivating plans
- ✅ Enable viewing order details
- ✅ Support downloading invoices as PDFs

---

**Date:** November 11, 2025  
**Component:** Subscriptions Management  
**Status:** Fixed - Ready for Testing
