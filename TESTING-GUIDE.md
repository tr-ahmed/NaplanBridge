# 🧪 API & Proxy Testing Guide

## Quick Start

### 1. **Access the Test Dashboard**
Navigate to: `http://localhost:4200/api-test`

Or click the "🧪 API Test" link in the navigation menu.

### 2. **Available Tests**

#### 🔗 **Proxy Tests**
- **Test Proxy Connection**: Checks if your proxy server is running
- **Test Login via Proxy**: Tests authentication through the proxy
- **Test Non-Proxied Request**: Verifies local files are served correctly

#### 📋 **Swagger Tests**
- **Test Swagger Login**: Uses the exact same request that works in Swagger
- **Test API Base**: Tests basic API connectivity
- **Test Direct API Call**: Tests direct external API (will show CORS errors)

#### 🐛 **Debug Tests**
- **Test Connectivity**: Basic server connectivity check
- **Test Login Endpoint**: GET request to login endpoint
- **Test Login POST**: POST request with test credentials

### 3. **How to Use**

1. **Start your development server**: `ng serve`
2. **Navigate to the test page**: `http://localhost:4200/api-test`
3. **Run tests in this order**:
   - First: Test Proxy Connection
   - Then: Test Login via Proxy
   - Compare with: Test Direct API Call (to see CORS error)
4. **Check browser Network tab** to see actual requests
5. **Look at browser console** for detailed error messages

### 4. **Understanding Results**

- ✅ **Green**: Test passed
- ❌ **Red**: Test failed (check details for why)
- 🔵 **Blue**: Information message

### 5. **Common Scenarios**

#### If Proxy Tests Fail:
- Make sure your proxy server is running
- Check if environment.ts has correct apiBaseUrl
- Verify proxy configuration

#### If Direct API Tests Fail:
- This is expected due to CORS
- Shows why you need the proxy

#### If Swagger Tests Work:
- Your API credentials are correct
- Proxy is working properly

### 6. **Debugging Tips**

- Open browser DevTools (F12)
- Check Network tab for actual requests
- Look for CORS errors in Console
- Verify request URLs and responses
- Check if requests are going to localhost (proxy) or external URL (direct)

### 7. **Expected Flow**

```
✅ Proxy Connection → ✅ Login via Proxy → ❌ Direct API (CORS error)
```

This confirms your proxy setup is working correctly!
