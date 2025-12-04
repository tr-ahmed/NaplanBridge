import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, filter } from 'rxjs/operators';
import { UploadService } from './upload.service';

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
  avatarUrl?: string;
  role?: string;
  emailConfirmed?: boolean;
  phoneNumberConfirmed?: boolean;
  twoFactorEnabled?: boolean;
}

/**
 * Profile Update DTO
 */
export interface UpdateProfileRequest {
  userName?: string;
  email?: string;
  age?: number;
  phoneNumber?: string;
  avatarUrl?: string;
}

/**
 * Profile Update Response
 */
export interface UpdateProfileResponse {
  success: boolean;
  message: string;
  data?: {
    userName: string;
    email: string;
    age: number;
    phoneNumber: string;
    avatarUrl?: string;
  };
}

/**
 * Media Upload Response
 */
export interface MediaUploadResponse {
  url: string;
  storagePath: string;
  success: boolean;
}

/**
 * Avatar Upload Response (New API)
 */
export interface AvatarUploadResponse {
  success: boolean;
  avatarUrl?: string;
  message: string;
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
  private accountApiUrl = 'https://naplan2.runasp.net/api/account';
  private mediaApiUrl = 'https://naplan2.runasp.net/api/media';

  private http = inject(HttpClient);
  private uploadService = inject(UploadService);

  /**
   * Get current authenticated user's profile
   * @returns Observable<UserProfile>
   */
  getProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.apiUrl}/profile`);
  }

  /**
   * Update user profile with new information
   * @param profileData UpdateProfileRequest
   * @returns Observable<UpdateProfileResponse>
   */
  updateProfile(profileData: UpdateProfileRequest): Observable<UpdateProfileResponse> {
    return this.http.put<UpdateProfileResponse>(
      `${this.accountApiUrl}/update-profile`,
      profileData
    );
  }

  /**
   * Upload avatar/profile picture (Old method - deprecated)
   * @param file File to upload
   * @param folder Destination folder (default: 'profiles')
   * @returns Observable<MediaUploadResponse>
   */
  uploadAvatarOld(file: File, folder: string = 'profiles'): Observable<MediaUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);

    return this.http.post<MediaUploadResponse>(
      `${this.mediaApiUrl}/upload-image`,
      formData
    );
  }

  /**
   * Upload avatar using new backend API (Bunny.net CDN)
   * Automatically replaces old avatar with progress tracking
   * @param file Image file (JPG, PNG, GIF - max 5MB)
   * @returns Observable<AvatarUploadResponse>
   */
  uploadAvatar(file: File): Observable<AvatarUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    return this.uploadService.uploadWithProgress<AvatarUploadResponse>(
      `${this.apiUrl}/profile/avatar`,
      formData,
      'avatar_upload'
    ).pipe(
      filter(event => event.response !== undefined),
      map(event => event.response!)
    );
  }

  /**
   * Get avatar upload progress
   * @returns Current upload progress or undefined
   */
  getAvatarUploadProgress() {
    return this.uploadService.getProgress('avatar_upload');
  }

  /**
   * Delete user's profile picture
   * @returns Observable with success message
   */
  deleteAvatar(): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(
      `${this.apiUrl}/profile/avatar`
    );
  }

  /**
   * Get avatar URL or default placeholder
   * @param user UserProfile
   * @returns Avatar URL or default
   */
  getAvatarUrl(user: UserProfile): string {
    return user.avatarUrl || user.avatar || 'https://upload.wikimedia.org/wikipedia/commons/2/2c/Default_pfp.svg';
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
