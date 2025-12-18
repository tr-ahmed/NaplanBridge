import { Injectable } from '@angular/core';
import { Subject } from '../../models/subject.models';

/**
 * Shared Utility Service for Subject Operations
 * Handles global subjects logic and display formatting
 */
@Injectable({
  providedIn: 'root'
})
export class SubjectUtilsService {

  /**
   * Get display name for subject's year
   * @param subject - Subject object
   * @returns Formatted year display string
   */
  getYearDisplayName(subject: Subject | null | undefined): string {
    if (!subject) {
      return 'N/A';
    }

    // Global subjects show "All Years"
    if (subject.isGlobal) {
      return '🌍 All Years';
    }

    // Year-specific subjects show "Year X"
    if (subject.yearId) {
      return `Year ${subject.yearId}`;
    }

    return 'N/A';
  }

  /**
   * Check if a subject is available for a specific year
   * @param subject - Subject to check
   * @param yearId - Year ID to check against
   * @returns True if subject is available for the year
   */
  isSubjectAvailableForYear(subject: Subject, yearId: number): boolean {
    // Global subjects are available for all years
    if (subject.isGlobal) {
      return true;
    }

    // Year-specific subjects must match the year
    return subject.yearId === yearId;
  }

  /**
   * Get CSS class for subject badge based on type
   * @param subject - Subject object
   * @returns CSS class name
   */
  getSubjectBadgeClass(subject: Subject | null | undefined): string {
    if (!subject) {
      return 'badge-default';
    }

    return subject.isGlobal ? 'badge-global' : 'badge-year';
  }

  /**
   * Sort subjects with year-specific first, then global
   * Within each group, sort alphabetically by name
   * @param subjects - Array of subjects to sort
   * @param selectedYearId - Optional year ID to prioritize
   * @returns Sorted array of subjects
   */
  sortSubjectsYearFirst(subjects: Subject[], selectedYearId?: number): Subject[] {
    return [...subjects].sort((a, b) => {
      // If selectedYearId is provided, prioritize exact matches
      if (selectedYearId) {
        const aMatchesYear = a.yearId === selectedYearId && !a.isGlobal;
        const bMatchesYear = b.yearId === selectedYearId && !b.isGlobal;

        if (aMatchesYear && !bMatchesYear) return -1;
        if (!aMatchesYear && bMatchesYear) return 1;
      }

      // Global subjects come after year-specific
      if (a.isGlobal && !b.isGlobal) return 1;
      if (!a.isGlobal && b.isGlobal) return -1;

      // Within same type, sort by year (if not global)
      if (!a.isGlobal && !b.isGlobal) {
        if (a.yearId !== b.yearId) {
          return a.yearId - b.yearId;
        }
      }

      // Finally, sort alphabetically by subject name
      return a.subjectName.localeCompare(b.subjectName);
    });
  }

  /**
   * Filter subjects by year, including global subjects
   * @param subjects - Array of subjects to filter
   * @param yearId - Year ID to filter by
   * @returns Filtered array of subjects
   */
  filterSubjectsByYear(subjects: Subject[], yearId: number): Subject[] {
    return subjects.filter(subject =>
      subject.isGlobal || subject.yearId === yearId
    );
  }

  /**
   * Group subjects by their type (global vs year-specific)
   * @param subjects - Array of subjects
   * @returns Object with global and yearSpecific arrays
   */
  groupSubjectsByType(subjects: Subject[]): { global: Subject[], yearSpecific: Subject[] } {
    return {
      global: subjects.filter(s => s.isGlobal),
      yearSpecific: subjects.filter(s => !s.isGlobal)
    };
  }

  /**
   * Get human-readable description for subject availability
   * @param subject - Subject object
   * @returns Description string
   */
  getAvailabilityDescription(subject: Subject): string {
    if (subject.isGlobal) {
      return 'Available to all students regardless of year level';
    }
    return `Available to Year ${subject.yearId} students only`;
  }

  /**
   * Check if any subject in array is global
   * @param subjects - Array of subjects
   * @returns True if at least one global subject exists
   */
  hasGlobalSubjects(subjects: Subject[]): boolean {
    return subjects.some(s => s.isGlobal);
  }

  /**
   * Get count of global vs year-specific subjects
   * @param subjects - Array of subjects
   * @returns Object with counts
   */
  getSubjectTypeCounts(subjects: Subject[]): { global: number, yearSpecific: number, total: number } {
    const global = subjects.filter(s => s.isGlobal).length;
    const yearSpecific = subjects.filter(s => !s.isGlobal).length;

    return {
      global,
      yearSpecific,
      total: subjects.length
    };
  }
}
