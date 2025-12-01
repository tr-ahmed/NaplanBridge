/**
 * Interface for parent registration request
 */
export interface ParentRegisterRequest {
  userName: string;
  email: string;
  password: string;
  phoneNumber: string;
  age: number;
}

/**
 * Interface for login request
 * Supports flexible login with email, username, or phone number
 */
export interface LoginRequest {
  identifier: string; // Can be email, username, or phone number
  password: string;
}

/**
 * Interface for user profile information
 */
export interface UserProfile {
  id: number;
  email: string;
  phoneNumber?: string;
}

/**
 * Interface for authentication response
 */
export interface AuthResponse {
  userName: string;
  firstName: string; // Student's first name
  token: string;
  roles: string[];
  userId: number;
  userProfile: UserProfile;
  yearId?: number;      // Year.Id - Only for students (from backend response)
  studentId?: number;   // ✅ NEW - Student.Id (from JWT token) - Used for cart operations
}

/**
 * Interface for API error response
 */
export interface ApiErrorResponse {
  type: string;
  title: string;
  status: number;
  errors: { [key: string]: string[] };
  traceId: string;
}

/**
 * Interface for validation error details
 */
export interface ValidationError {
  field: string;
  messages: string[];
}

/**
 * Type for API result wrapper
 */
export type ApiResult<T> = {
  success: true;
  data: T;
} | {
  success: false;
  error: string;
  validationErrors?: ValidationError[];
  statusCode?: number; // For handling specific HTTP status codes (e.g., 403 for deactivated accounts)
  requiresVerification?: boolean; // For email verification required errors
  email?: string; // Email associated with the verification request
};

/**
 * Interface for password reset request
 */
export interface PasswordResetRequest {
  email: string;
}

/**
 * Interface for password reset confirmation
 */
export interface PasswordResetConfirmation {
  email: string;
  password: string;
  token: string;
}

/**
 * Interface for email verification request
 */
export interface VerifyEmailDto {
  email: string;
  token: string;
}

/**
 * Interface for resend verification email request
 */
export interface ResendVerificationDto {
  email: string;
}

/**
 * Generic API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

/**
 * Interface for login error with verification flag
 */
export interface LoginError {
  error: string;
  message: string;
  requiresVerification?: boolean;
}
