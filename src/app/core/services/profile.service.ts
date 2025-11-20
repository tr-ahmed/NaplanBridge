import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

/**
 * User Profile Interfaces
 */
export interface UserProfile {
  userId: number;
  userName: string;
  firstName: string | null;
  email: string;
  age: number;
  phoneNumber: string | null;
  createdAt: string;
  roles: string[];
  studentData: StudentProfileData | null;
  avatar?: string;
  role?: string;
  emailConfirmed?: boolean;
  phoneNumberConfirmed?: boolean;
  twoFactorEnabled?: boolean;
}

export interface StudentProfileData {
  studentId: number;
  yearId: number;
  yearNumber: number;
  parentId: number | null;
  parentName: string | null;
}

/**
 * Profile Service - Handles all user profile operations
 * Provides methods to fetch, update, and manage user profile data
 */
@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private apiUrl = 'https://naplan2.runasp.net/api/user';

  constructor(private http: HttpClient) {}

  /**
   * Get current authenticated user's profile
   * @returns Observable<UserProfile>
   */
  getProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.apiUrl}/profile`);
  }

  /**
   * Check if user is a student
   * @param profile UserProfile
   * @returns boolean
   */
  isStudent(profile: UserProfile): boolean {
    return profile.roles.includes('Student');
  }

  /**
   * Check if user is a parent
   * @param profile UserProfile
   * @returns boolean
   */
  isParent(profile: UserProfile): boolean {
    return profile.roles.includes('Parent');
  }

  /**
   * Check if user is a teacher
   * @param profile UserProfile
   * @returns boolean
   */
  isTeacher(profile: UserProfile): boolean {
    return profile.roles.includes('Teacher');
  }

  /**
   * Check if user is an admin
   * @param profile UserProfile
   * @returns boolean
   */
  isAdmin(profile: UserProfile): boolean {
    return profile.roles.includes('Admin');
  }

  /**
   * Get year label for students
   * @param profile UserProfile
   * @returns string
   */
  getYearLabel(profile: UserProfile): string {
    if (this.isStudent(profile) && profile.studentData?.yearNumber) {
      return `Year ${profile.studentData.yearNumber}`;
    }
    return 'N/A';
  }

  /**
   * Get user display name
   * @param profile UserProfile
   * @returns string
   */
  getDisplayName(profile: UserProfile): string {
    return profile.firstName || profile.userName;
  }

  /**
   * Get role display text
   * @param roles string[]
   * @returns string
   */
  getRoleDisplay(roles: string[]): string {
    return roles.join(', ');
  }
}
