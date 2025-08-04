# Login API Integration

This document explains the login API integration implemented in the NaplanBridge Angular application.

## Overview

The login functionality has been integrated with the NaplanBridge backend API, providing secure authentication for users. The implementation includes:

- **API Service**: `ParentApiService` with login method
- **Enhanced Authentication Service**: `AuthService` for managing authentication state
- **Reactive Forms**: Form validation and error handling
- **Role-based Navigation**: Automatic redirection based on user roles
- **Token Management**: Secure storage and retrieval of authentication tokens

## API Endpoint

```
POST http://naplanbridge.runasp.net/api/Account/login
```

### Request Body

```json
{
  "email": "user@example.com",
  "password": "string"
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

### Error Responses

- **400 Bad Request**: Invalid credentials or validation errors
- **401 Unauthorized**: Authentication failed
- **500 Internal Server Error**: Server-side error

## Implementation Details

### 1. Models (`src/app/models/auth.models.ts`)

Added new interface for login:

```typescript
export interface LoginRequest {
  email: string;
  password: string;
}
```

### 2. API Service (`src/app/core/services/parent-api.service.ts`)

New login method:

```typescript
login(loginData: LoginRequest): Observable<ApiResult<AuthResponse>> {
  const url = `${this.baseUrl}/Account/login`;
  // Implementation with error handling
}
```

### 3. Enhanced Authentication Service (`src/app/core/services/auth.service.ts`)

Features:
- **Reactive State Management**: Using Angular Signals for reactive authentication state
- **Role-based Navigation**: Automatic redirection based on user roles
- **Token Management**: Secure storage and validation
- **User State Management**: Observable and signal-based user state
- **Role Checking**: Methods to check user roles and permissions

Key methods:
- `login(loginRequest: LoginRequest)`: Authenticate user
- `logout()`: Clear authentication state
- `isAuthenticated()`: Check authentication status
- `hasRole(role: string)`: Check specific role
- `navigateToUserDashboard()`: Role-based navigation

### 4. Login Component (`src/app/auth/login/login.component.ts`)

Features:
- **Reactive Forms**: Form validation with real-time feedback
- **Loading States**: Visual feedback during API calls
- **Remember Me**: Email persistence functionality
- **Error Handling**: User-friendly error messages
- **Security**: Password clearing on failed attempts

### 5. Authentication Guards

#### Basic Auth Guard (`src/app/auth/auth.guard.ts`)
```typescript
export const authGuard: CanActivateFn = () => {
  // Check if user is authenticated
};
```

#### Role Guard (`src/app/auth/role.guard.ts`)
```typescript
export function roleGuard(expectedRole: string): CanActivateFn {
  // Check if user has specific role
}

export function roleGuardAny(expectedRoles: string[]): CanActivateFn {
  // Check if user has any of the specified roles
}
```

## Usage Examples

### Basic Login Flow

```typescript
// In component
const loginData: LoginRequest = {
  email: 'user@example.com',
  password: 'userpassword'
};

this.authService.login(loginData).subscribe({
  next: (result) => {
    if (result.success) {
      // User logged in successfully
      this.authService.navigateToUserDashboard();
    } else {
      // Handle error
      this.toastService.showError(result.message);
    }
  }
});
```

### Checking Authentication State

```typescript
// Using signals (reactive)
const isLoggedIn = this.authService.isAuthenticated();
const currentUser = this.authService.currentUser();
const userRoles = this.authService.userRoles();

// Using observables
this.authService.currentUser$.subscribe(user => {
  if (user) {
    console.log('User logged in:', user.userName);
  }
});
```

### Role-based Access Control

```typescript
// Check specific role
if (this.authService.hasRole('admin')) {
  // Show admin features
}

// Check multiple roles
if (this.authService.hasAnyRole(['teacher', 'admin'])) {
  // Show teacher/admin features
}

// In routes
{
  path: 'admin',
  canActivate: [roleGuard('admin')],
  loadComponent: () => import('./admin/dashboard.component')
}
```

## Navigation Flow

After successful login, users are redirected based on their primary role:

1. **Admin** → `/admin/dashboard`
2. **Teacher** → `/teacher/dashboard`
3. **Parent** → `/parent/dashboard`
4. **Student** → `/student/dashboard`
5. **Default** → `/home`

## Security Features

### 1. Token Management
- Secure storage in localStorage
- Automatic token validation
- Token expiration checking
- Secure token clearing on logout

### 2. Password Security
- Password fields cleared on failed login attempts
- No password persistence
- Secure form handling

### 3. Role-based Security
- Route protection with guards
- Component-level role checking
- API-level authorization

## Configuration

### Environment Setup
```typescript
// environment.ts
export const environment = {
  production: false,
  apiBaseUrl: 'http://naplanbridge.runasp.net/api'
};
```

### Route Protection
```typescript
// In route configuration
{
  path: 'dashboard',
  canActivate: [authGuard],
  loadComponent: () => import('./dashboard.component')
}
```

## Error Handling

### 1. Network Errors
- Connection timeout handling
- Offline state detection
- Retry mechanisms

### 2. Authentication Errors
- Invalid credentials
- Account locked/disabled
- Session expired

### 3. Validation Errors
- Email format validation
- Required field validation
- Custom server-side errors

## Testing

### Unit Testing Examples

```typescript
describe('AuthService', () => {
  it('should login successfully', () => {
    const loginData = { email: 'test@test.com', password: 'test123' };
    service.login(loginData).subscribe(result => {
      expect(result.success).toBe(true);
    });
  });

  it('should handle login errors', () => {
    // Test error scenarios
  });
});
```

### Integration Testing
- Login flow testing
- Role-based navigation testing
- Token persistence testing
- Logout functionality testing

## Future Enhancements

1. **Multi-factor Authentication**: SMS/Email verification
2. **Social Login**: Google, Facebook integration
3. **Single Sign-On (SSO)**: Enterprise SSO support
4. **Biometric Authentication**: Fingerprint/Face ID
5. **Session Management**: Advanced session handling
6. **Password Reset**: Forgot password functionality

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - Ensure backend allows frontend domain
   - Check preflight requests

2. **Token Expiration**
   - Implement token refresh mechanism
   - Handle expired token scenarios

3. **Role Mismatch**
   - Verify role names match between frontend and backend
   - Check case sensitivity

### Debug Commands

```typescript
// Check authentication state
console.log('Is Authenticated:', this.authService.isAuthenticated());
console.log('Current User:', this.authService.currentUser());
console.log('User Roles:', this.authService.userRoles());
console.log('Token:', this.authService.getToken());
```

## API Testing

### Using cURL
```bash
curl -X 'POST' \
  'http://naplanbridge.runasp.net/api/Account/login' \
  -H 'accept: text/plain' \
  -H 'Content-Type: application/json' \
  -d '{
  "email": "user@example.com",
  "password": "userpass"
}'
```

### Using Postman
1. Set method to POST
2. Set URL to login endpoint
3. Add Content-Type: application/json header
4. Add request body with email and password
5. Send request and verify response

---

*Last updated: August 4, 2025*
