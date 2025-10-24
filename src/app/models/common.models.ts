/**
 * Common Models and DTOs
 * Based on Backend API Documentation
 */

// ============================================
// Pagination Models
// ============================================

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

// ============================================
// Error Models
// ============================================

export interface ApiError {
  statusCode: number;
  message: string;
  details?: string;
  errors?: { [key: string]: string[] } | null;
  traceId: string;
  timestamp: string;
}

export interface ValidationError {
  [field: string]: string[];
}

// ============================================
// Health Check Models
// ============================================

export interface HealthCheckResponse {
  status: 'Healthy' | 'Degraded' | 'Unhealthy';
  checks: HealthCheckItem[];
  totalDuration: number;
}

export interface HealthCheckItem {
  name: string;
  status: 'Healthy' | 'Degraded' | 'Unhealthy';
  duration: number;
}

// ============================================
// Response Models
// ============================================

export interface ApiResponse<T> {
  data?: T;
  message?: string;
  success: boolean;
}

export interface MessageResponse {
  message: string;
}
