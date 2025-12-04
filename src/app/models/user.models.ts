/**
 * User and Authentication Models
 * Based on Backend API Documentation
 */

// ============================================
// User Roles
// ============================================

export type UserRole = 'Admin' | 'Teacher' | 'Parent' | 'Student' | 'Member';

export const UserRoles = {
  ADMIN: 'Admin' as UserRole,
  TEACHER: 'Teacher' as UserRole,
  PARENT: 'Parent' as UserRole,
  STUDENT: 'Student' as UserRole,
  MEMBER: 'Member' as UserRole
};

// ============================================
// Authentication DTOs
// ============================================

export interface LoginDto {
  email: string;
  password: string;
}

export interface UserDto {
  userName: string;
  email?: string;
  token: string;
  roles: UserRole[];
}

export interface ParentRegisterDto {
  userName: string;
  email: string;
  password: string;
  age: number;
  phoneNumber: string;
}

export interface TeacherRegisterDto {
  userName: string;
  email: string;
  password: string;
  age: number;
  phoneNumber: string;
  salary?: number;
  iban?: string;
}

export interface StudentRegisterDto {
  userName: string;
  password: string;
  age: number;
  year: number; // Year level (7, 8, 9, etc.)
}

// ============================================
// User Profile Models
// ============================================

export interface UserProfile {
  id: number;
  userName: string;
  email?: string;
  age?: number;
  phoneNumber?: string;
  roles: UserRole[];
  year?: number; // For students
  createdAt?: Date;
}

export interface UpdateProfileDto {
  userName?: string;
  email?: string;
  age?: number;
  phoneNumber?: string;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// ============================================
// Parent-Student Relationship
// ============================================

export interface ParentStudent {
  id: number;
  studentId: number;
  studentName: string;
  studentUserName: string;
  year: number;
  parentId: number;
  addedAt: Date;
}

export interface AddStudentDto {
  studentUserName: string;
}
