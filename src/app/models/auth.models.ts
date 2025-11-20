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
