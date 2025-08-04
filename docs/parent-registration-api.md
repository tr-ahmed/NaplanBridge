# Parent Registration API Integration

This document explains the parent registration API integration implemented in the NaplanBridge Angular application.

## Overview

The application now includes a complete parent registration system that integrates with the NaplanBridge backend API. The implementation includes:

- **API Service**: `ParentApiService` for handling parent registration
- **Error Handling**: Global error interceptor and toast notifications
- **Form Validation**: Reactive forms with client-side and server-side validation
- **User Experience**: Loading states, error messages, and success notifications

## API Endpoint

```
POST http://naplanbridge.runasp.net/api/Account/register-parent
```

### Request Body

```json
{
  "userName": "string",
  "email": "user@example.com",
  "password": "string",
  "phoneNumber": "01012345678",
  "age": 25
}
```

### Response (Success - 200)

```json
{
  "userName": "string",
  "token": "string",
  "roles": ["string"]
}
```

### Response (Error - 400)

```json
{
  "type": "https://tools.ietf.org/html/rfc9110#section-15.5.1",
  "title": "One or more validation errors occurred.",
  "status": 400,
  "errors": {
    "Password": [
      "The field Password must be a string with a minimum length of 4 and a maximum length of 8."
    ]
  },
  "traceId": "..."
}
```

## Implementation Details

### 1. Models (`src/app/models/auth.models.ts`)

Defined TypeScript interfaces for:
- `ParentRegisterRequest`: API request structure
- `AuthResponse`: API success response
- `ApiErrorResponse`: API error response
- `ValidationError`: Validation error details
- `ApiResult<T>`: Generic result wrapper

### 2. API Service (`src/app/core/services/parent-api.service.ts`)

Features:
- **Type-safe API calls** using HttpClient
- **Error handling** with RxJS operators
- **Password validation** according to API requirements (4-8 characters)
- **Response parsing** for both success and error cases

### 3. Toast Notifications (`src/app/core/services/toast.service.ts`)

- **Angular Signals** for reactive state management
- **Multiple toast types**: success, error, warning, info
- **Auto-dismissal** with configurable duration
- **Manual dismissal** option

### 4. UI Components

#### Register Component (`src/app/auth/register/register.component.ts`)
- **Reactive Forms** with FormBuilder
- **Custom validators** for password matching
- **Client-side validation** with real-time feedback
- **Server-side error handling** with field-specific messages
- **Loading states** during API calls

#### Toast Container (`src/app/components/toast-container.component.ts`)
- **Responsive design** with Tailwind CSS
- **Animation effects** for smooth user experience
- **Positioned** at top-right corner
- **Accessible** with proper ARIA attributes

### 5. Error Handling

- **HTTP Interceptor** for global error handling (optional)
- **Toast notifications** for user feedback
- **Form field errors** for validation feedback
- **Network error handling** for offline scenarios

## Usage

### Basic Registration Flow

1. User fills out the registration form
2. Client-side validation occurs in real-time
3. On form submission, API call is made
4. Loading state is shown during the request
5. Success or error response is handled appropriately
6. User receives feedback via toast notifications
7. On success, user is redirected to dashboard

### Password Requirements

The API requires passwords to be:
- **Minimum length**: 4 characters
- **Maximum length**: 8 characters

### Phone Number Format

Expected format for Egyptian phone numbers:
- **Pattern**: `01XXXXXXXXX` (11 digits starting with 01)
- **Example**: `01012345678`

## Configuration

### Environment Variables (`src/environments/environment.ts`)

```typescript
export const environment = {
  production: false,
  apiBaseUrl: 'http://naplanbridge.runasp.net/api'
};
```

### App Configuration (`src/app/app.config.ts`)

```typescript
export const appConfig: ApplicationConfig = {
  providers: [
    // ... other providers
    provideHttpClient()
  ]
};
```

## Error Scenarios

### 1. Validation Errors (400)
- Password too short/long
- Invalid email format
- Missing required fields
- Invalid phone number format

### 2. Network Errors
- No internet connection
- Server unavailable
- Request timeout

### 3. Server Errors (500)
- Internal server error
- Database connection issues

## Testing

### Manual Testing Steps

1. **Valid Registration**:
   - Fill form with valid data
   - Submit and verify success message
   - Check redirect to dashboard

2. **Password Validation**:
   - Test password < 4 characters
   - Test password > 8 characters
   - Verify error messages

3. **Email Validation**:
   - Test invalid email formats
   - Test duplicate email (if applicable)

4. **Phone Number Validation**:
   - Test invalid phone formats
   - Test non-Egyptian numbers

### Unit Testing

```typescript
// Example test for ParentApiService
describe('ParentApiService', () => {
  it('should register parent successfully', () => {
    // Test implementation
  });

  it('should handle validation errors', () => {
    // Test implementation
  });
});
```

## Future Enhancements

1. **Email Verification**: Add email confirmation step
2. **Phone Verification**: SMS verification code
3. **Social Login**: Google/Facebook integration
4. **Terms Acceptance**: Link to actual terms page
5. **Password Strength**: Visual password strength indicator

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure backend allows requests from localhost
2. **Network Errors**: Check API endpoint availability
3. **Validation Errors**: Verify field requirements match API
4. **Build Errors**: Check TypeScript compilation

### Debug Tools

- Browser Developer Tools Network tab
- Angular DevTools for component inspection
- Console logs for error details

## Security Considerations

1. **Password Validation**: Enforced both client and server-side
2. **Input Sanitization**: All inputs are validated
3. **Token Storage**: Secure token storage in localStorage
4. **HTTPS**: Use HTTPS in production
5. **No Sensitive Data**: Never expose secrets in frontend code

---

*Last updated: August 4, 2025*
