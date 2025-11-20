# 🔧 Backend Change Report - Reset Password Feature

## 1. Reason for Change

The frontend has implemented a complete **Reset Password** feature accessible from both the Login page and Account Settings page. This feature requires two new API endpoints to handle password reset requests and password reset confirmation via secure tokens.

---

## 2. Required or Modified Endpoints

### Endpoint 1: Request Password Reset
* **URL:** `/api/Account/forgot-password`
* **Method:** `POST`
* **Controller:** `AccountController`
* **Action:** `ForgotPassword`
* **Description:** Initiates password reset process by sending a reset email with a secure token to the user's email address.

### Endpoint 2: Confirm Password Reset
* **URL:** `/api/Account/reset-password`
* **Method:** `POST`
* **Controller:** `AccountController`
* **Action:** `ResetPassword`
* **Description:** Confirms and applies the password reset using the email, new password, and reset token received from the email link.

---

## 3. Suggested Backend Implementation

### 3.1 Password Reset Token Service

Create a service to manage password reset tokens:

**File:** `Services/PasswordResetTokenService.cs`

```csharp
public interface IPasswordResetTokenService
{
    /// <summary>
    /// Generate a secure password reset token for the user
    /// </summary>
    string GenerateResetToken(string userId);
    
    /// <summary>
    /// Validate if the reset token is valid and not expired
    /// </summary>
    bool ValidateResetToken(string userId, string token);
    
    /// <summary>
    /// Invalidate/consume the reset token after use
    /// </summary>
    void InvalidateToken(string userId);
}

public class PasswordResetTokenService : IPasswordResetTokenService
{
    private readonly IMemoryCache _cache;
    private const int TokenExpirationMinutes = 1440; // 24 hours
    
    public PasswordResetTokenService(IMemoryCache cache)
    {
        _cache = cache;
    }
    
    public string GenerateResetToken(string userId)
    {
        var token = Guid.NewGuid().ToString("N");
        var key = $"reset_token_{userId}";
        _cache.Set(key, token, TimeSpan.FromMinutes(TokenExpirationMinutes));
        return token;
    }
    
    public bool ValidateResetToken(string userId, string token)
    {
        var key = $"reset_token_{userId}";
        if (_cache.TryGetValue(key, out string cachedToken))
        {
            return cachedToken == token;
        }
        return false;
    }
    
    public void InvalidateToken(string userId)
    {
        var key = $"reset_token_{userId}";
        _cache.Remove(key);
    }
}
```

### 3.2 Email Service Integration

Ensure email service is configured to send password reset emails.

**Example implementation in email service:**

```csharp
public async Task SendPasswordResetEmailAsync(string email, string resetToken, string resetLink)
{
    var subject = "Password Reset Request";
    
    var resetUrl = $"{resetLink}?token={resetToken}&email={Uri.EscapeDataString(email)}";
    
    var htmlBody = $@"
        <h2>Password Reset Request</h2>
        <p>You requested to reset your password. Click the link below to proceed:</p>
        <p><a href='{resetUrl}'>Reset Your Password</a></p>
        <p>This link will expire in 24 hours.</p>
        <p>If you didn't request this, please ignore this email.</p>
    ";
    
    await SendEmailAsync(email, subject, htmlBody);
}
```

### 3.3 Update Account Controller

**File:** `Controllers/AccountController.cs`

```csharp
[HttpPost("forgot-password")]
[AllowAnonymous]
public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
{
    try
    {
        // Validate email format
        if (string.IsNullOrWhiteSpace(request.Email) || !request.Email.Contains("@"))
        {
            return BadRequest(new { message = "Invalid email address" });
        }

        // Find user by email
        var user = await _userManager.FindByEmailAsync(request.Email.ToLower());
        
        if (user == null)
        {
            // For security: don't reveal if email exists or not
            // Always return success to prevent email enumeration attacks
            return Ok(new { 
                success = true, 
                message = "If an account exists, reset instructions have been sent" 
            });
        }

        // Generate reset token
        var resetToken = _passwordResetTokenService.GenerateResetToken(user.Id);

        // Build reset URL (frontend URL)
        var resetUrl = $"https://yourfrontend.com/auth/reset-password";

        // Send email with reset link
        await _emailService.SendPasswordResetEmailAsync(user.Email, resetToken, resetUrl);

        return Ok(new { 
            success = true, 
            message = "Password reset instructions sent to your email" 
        });
    }
    catch (Exception ex)
    {
        _logger.LogError($"Error in ForgotPassword: {ex.Message}");
        return StatusCode(500, new { message = "An error occurred while processing your request" });
    }
}

[HttpPost("reset-password")]
[AllowAnonymous]
public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
{
    try
    {
        // Validate input
        if (string.IsNullOrWhiteSpace(request.Email) || 
            string.IsNullOrWhiteSpace(request.Password) || 
            string.IsNullOrWhiteSpace(request.Token))
        {
            return BadRequest(new { message = "Invalid request parameters" });
        }

        // Find user by email
        var user = await _userManager.FindByEmailAsync(request.Email.ToLower());
        
        if (user == null)
        {
            return BadRequest(new { message = "User not found" });
        }

        // Validate reset token
        if (!_passwordResetTokenService.ValidateResetToken(user.Id, request.Token))
        {
            return BadRequest(new { message = "Invalid or expired reset token" });
        }

        // Validate password strength
        var passwordValidator = new PasswordValidator<AppUser>();
        var passwordValidationResult = await passwordValidator.ValidateAsync(
            _userManager, 
            user, 
            request.Password
        );

        if (!passwordValidationResult.Succeeded)
        {
            var errors = string.Join(", ", passwordValidationResult.Errors.Select(e => e.Description));
            return BadRequest(new { message = $"Password does not meet requirements: {errors}" });
        }

        // Remove old password hash and set new one
        var token = await _userManager.GeneratePasswordResetTokenAsync(user);
        var result = await _userManager.ResetPasswordAsync(user, token, request.Password);

        if (!result.Succeeded)
        {
            var errors = string.Join(", ", result.Errors.Select(e => e.Description));
            return BadRequest(new { message = $"Failed to reset password: {errors}" });
        }

        // Invalidate the reset token after successful use
        _passwordResetTokenService.InvalidateToken(user.Id);

        return Ok(new { 
            success = true, 
            message = "Password has been reset successfully" 
        });
    }
    catch (Exception ex)
    {
        _logger.LogError($"Error in ResetPassword: {ex.Message}");
        return StatusCode(500, new { message = "An error occurred while processing your request" });
    }
}
```

### 3.4 Create Request DTOs

**File:** `DTOs/ForgotPasswordRequest.cs`

```csharp
public class ForgotPasswordRequest
{
    /// <summary>
    /// User's email address for password reset
    /// </summary>
    [Required(ErrorMessage = "Email is required")]
    [EmailAddress(ErrorMessage = "Invalid email format")]
    public string Email { get; set; }
}
```

**File:** `DTOs/ResetPasswordRequest.cs`

```csharp
public class ResetPasswordRequest
{
    /// <summary>
    /// User's email address
    /// </summary>
    [Required(ErrorMessage = "Email is required")]
    [EmailAddress(ErrorMessage = "Invalid email format")]
    public string Email { get; set; }

    /// <summary>
    /// New password for the account
    /// </summary>
    [Required(ErrorMessage = "Password is required")]
    [StringLength(100, MinimumLength = 8, 
        ErrorMessage = "Password must be between 8 and 100 characters")]
    public string Password { get; set; }

    /// <summary>
    /// Reset token from email link
    /// </summary>
    [Required(ErrorMessage = "Reset token is required")]
    public string Token { get; set; }
}
```

### 3.5 Register Services in Startup

**File:** `Program.cs` or `Startup.cs`

```csharp
// Add Password Reset Token Service
services.AddScoped<IPasswordResetTokenService, PasswordResetTokenService>();

// Ensure email service is registered
services.AddScoped<IEmailService, EmailService>(); // Or your email service implementation
```

---

## 4. Database Impact

**No direct database changes required** if using ASP.NET Core Identity's built-in password management.

However, if implementing token storage in database instead of cache:

```sql
-- Add table for password reset tokens
CREATE TABLE PasswordResetTokens (
    Id INT PRIMARY KEY IDENTITY(1,1),
    UserId NVARCHAR(450) NOT NULL,
    Token NVARCHAR(MAX) NOT NULL,
    ExpiryDate DATETIME NOT NULL,
    IsUsed BIT DEFAULT 0,
    CreatedDate DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (UserId) REFERENCES AspNetUsers(Id) ON DELETE CASCADE,
    INDEX IDX_UserToken (UserId, Token)
);
```

---

## 5. Files to Modify or Create

| File | Type | Purpose |
|------|------|---------|
| `Services/PasswordResetTokenService.cs` | Create | Manage password reset tokens |
| `DTOs/ForgotPasswordRequest.cs` | Create | Request model for forgot password |
| `DTOs/ResetPasswordRequest.cs` | Create | Request model for reset password |
| `Controllers/AccountController.cs` | Modify | Add two new endpoints |
| `Program.cs` or `Startup.cs` | Modify | Register token service |
| `Services/EmailService.cs` | Modify | Add password reset email method |

---

## 6. Request and Response Examples

### Request 1: Forgot Password

**Request:**

```http
POST /api/Account/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Password reset instructions sent to your email"
}
```

**Error Response (400):**

```json
{
  "message": "Invalid email address"
}
```

---

### Request 2: Reset Password

**Request:**

```http
POST /api/Account/reset-password
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "NewSecurePassword123!",
  "token": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"
}
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Password has been reset successfully"
}
```

**Error Response (400) - Invalid Token:**

```json
{
  "message": "Invalid or expired reset token"
}
```

**Error Response (400) - Weak Password:**

```json
{
  "message": "Password does not meet requirements: Passwords must be at least 8 characters, contain an uppercase letter, a lowercase letter, a digit, and a special character"
}
```

---

## 7. Security Considerations

### ✅ Implemented Security Measures

1. **Token Expiration**: Tokens expire after 24 hours
2. **Single-Use Tokens**: Tokens are invalidated after successful password reset
3. **Email Verification**: Password reset requires valid email address
4. **Password Validation**: Uses ASP.NET Core Identity's password validator
5. **HTTPS Only**: All endpoints should be accessed via HTTPS in production
6. **Email Enumeration Prevention**: Don't reveal if email exists (return success for non-existent emails)
7. **Rate Limiting**: Recommended to implement rate limiting on forgot-password endpoint

### ⚠️ Recommended Additional Security

- Implement rate limiting to prevent brute force attacks
- Log password reset attempts for audit trail
- Send confirmation email after successful password reset
- Implement CAPTCHA for forgot password endpoint
- Consider IP-based restrictions for sensitive operations

---

## 8. Integration Notes

### Frontend Integration
The frontend has already implemented:
- `AuthService.requestPasswordReset(email)` - Calls `/Account/forgot-password`
- `AuthService.resetPassword(email, password, token)` - Calls `/Account/reset-password`
- Reset Password component with token extraction from URL query params
- Reset Password tab in Account Settings

### Testing Endpoints
After implementation, test the endpoints with:

```bash
# Test 1: Request password reset
curl -X POST https://api.yourdomian.com/api/Account/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com"}'

# Test 2: Reset password (after receiving token from email)
curl -X POST https://api.yourdomian.com/api/Account/reset-password \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"NewPassword123!","token":"token_from_email"}'
```

---

## 9. Deployment Notes

- [ ] Update `appsettings.json` with email service configuration
- [ ] Register `IPasswordResetTokenService` in dependency injection
- [ ] Update Swagger documentation with new endpoints
- [ ] Add authorization checks if needed
- [ ] Test password reset flow end-to-end
- [ ] Monitor logs for any errors during initial deployment
- [ ] Consider implementing background job to clean up expired tokens

---

## 10. Timeline and Effort

- **Estimated Development Time**: 2-3 hours
- **Testing Time**: 1-2 hours
- **Total Effort**: 3-5 hours

---

**Report Generated:** November 20, 2025
**Feature:** Reset Password (Accessible from Login and Account Settings)
**Status:** Ready for Backend Implementation
