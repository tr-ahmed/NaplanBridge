/**
 * Category, Year, Subject Name Models
 * Based on Backend API Documentation
 */

// ============================================
// Category Models
// ============================================

export interface Category {
  id: number;
  name: string;
  description?: string;
}

export interface CreateCategoryDto {
  name: string;
  description?: string;
}

export interface UpdateCategoryDto {
  name: string;
  description?: string;
}

// ============================================
// Year Models
// ============================================

export interface Year {
  id: number;
  yearNumber: number; // 7, 8, 9, 10, 11, 12
  description?: string;
}

export interface CreateYearDto {
  yearNumber: number;
  description?: string;
}

export interface UpdateYearDto {
  yearNumber: number;
  description?: string;
}

// ============================================
// Subject Name Models
// ============================================

export interface SubjectName {
  id: number;
  name: string;
  categoryId: number;
  categoryName: string;
}

export interface CreateSubjectNameDto {
  name: string;
  categoryId: number;
}

export interface UpdateSubjectNameDto {
  name: string;
  categoryId: number;
}
