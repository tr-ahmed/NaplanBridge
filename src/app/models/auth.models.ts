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
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Interface for authentication response
 */
export interface AuthResponse {
  userName: string;
  token: string;
  roles: string[];
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
