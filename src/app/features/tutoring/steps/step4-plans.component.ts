import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TutoringStateService } from '../../../core/services/tutoring-state.service';
import { ContentService, Subject } from '../../../core/services/content.service';
import { TutoringService } from '../../../core/services/tutoring.service';
import { StudentInfo } from '../../../models/tutoring.models';

interface HoursDiscountTiers {
  hours20: number;
  hours30: number;
}

interface SubjectDiscountTier {
  minSubjects: number;
  percentage: number;
}

const MAX_TOTAL_DISCOUNT = 20; // Maximum combined discount percentage

@Component({
  selector: 'app-step4-hours',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './step4-plans.component.html',
  styleUrls: ['./step4-plans.component.scss']
})
export class Step4HoursComponent implements OnInit {
  students: StudentInfo[] = [];
  subjects: Subject[] = [];
  subjectHours = new Map<string, number>();
  loading = false;

  // Dynamic discount tiers loaded from API
  hoursDiscountTiers: HoursDiscountTiers = {
    hours20: 5, // Default fallback
    hours30: 10 // Default fallback
  };

  // Multi-subject discount tiers (loaded from API)
  subjectDiscountTiers: SubjectDiscountTier[] = [
    { minSubjects: 2, percentage: 5 },
    { minSubjects: 3, percentage: 10 },
    { minSubjects: 4, percentage: 15 },
    { minSubjects: 5, percentage: 20 }
  ];

  constructor(
    private stateService: TutoringStateService,
    private contentService: ContentService,
    private tutoringService: TutoringService
  ) { }

  ngOnInit(): void {
    this.restoreState();
    this.loadSubjects();
  }

  restoreState(): void {
    const state = this.stateService.getState();
    this.students = state.students;
    this.subjectHours = new Map(state.subjectHours);
  }

  loadSubjects(): void {
    this.loading = true;
    this.contentService.getSubjects().subscribe({
      next: (response) => {
        // Handle paginated response: { items: [...], totalCount, page, ... }
        if (response && Array.isArray(response.items)) {
          this.subjects = response.items;
        } else if (response && Array.isArray(response.data)) {
          // Fallback for alternative response structure
          this.subjects = response.data;
        } else if (Array.isArray(response)) {
          // Fallback if API returns array directly
          this.subjects = response;
        } else {
          this.subjects = [];
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading subjects:', error);
        this.subjects = [];
        this.loading = false;
      }
    });
  }

  getStudentSubjects(studentId: number): number[] {
    const state = this.stateService.getState();
    const subjectSet = state.studentSubjects.get(studentId);
    return subjectSet ? Array.from(subjectSet) : [];
  }

  getSubjectName(subjectId: number): string {
    const subject = this.subjects.find(s => s.id === subjectId);
    return subject ? subject.subjectName : `Subject ${subjectId}`;
  }

  getSubjectPrice(subjectId: number): number {
    const subject = this.subjects.find(s => s.id === subjectId);
    // ✅ Use tutoring price per hour (not self-learning subscription price)
    return subject?.tutoringPricePerHour || subject?.price || 100;
  }

  selectHours(studentId: number, subjectId: number, hours: number): void {
    this.stateService.setSubjectHours(studentId, subjectId, hours);
    const key = `${studentId}_${subjectId}`;
    this.subjectHours.set(key, hours);
  }

  getSelectedHours(studentId: number, subjectId: number): number | null {
    const key = `${studentId}_${subjectId}`;
    return this.subjectHours.get(key) || null;
  }

  calculatePrice(basePrice: number, hours: number, studentId?: number): number {
    const total = basePrice * hours;
    if (hours === 10) return total;

    // Get the effective discount (capped at remaining discount after multi-subject)
    let effectiveDiscount = 0;
    if (hours === 20) {
      effectiveDiscount = studentId
        ? this.getEffectiveHoursDiscount(studentId, 20)
        : this.hoursDiscountTiers.hours20;
    } else if (hours === 30) {
      effectiveDiscount = studentId
        ? this.getEffectiveHoursDiscount(studentId, 30)
        : this.hoursDiscountTiers.hours30;
    }

    const discountRate = effectiveDiscount / 100;
    return Math.round(total * (1 - discountRate));
  }

  /**
   * Get the number of subjects selected for a student
   */
  getStudentSubjectCount(studentId: number): number {
    return this.getStudentSubjects(studentId).length;
  }

  /**
   * Calculate multi-subject discount for a student based on number of subjects
   */
  getMultiSubjectDiscount(studentId: number): number {
    const subjectCount = this.getStudentSubjectCount(studentId);
    if (subjectCount <= 1) return 0;

    // Find the highest applicable discount tier
    let discount = 0;
    for (const tier of this.subjectDiscountTiers) {
      if (subjectCount >= tier.minSubjects) {
        discount = tier.percentage;
      }
    }
    return discount;
  }

  /**
   * Get the maximum hours selected for any subject for this student
   * Used for display purposes
   */
  getStudentMaxHours(studentId: number): number {
    const subjects = this.getStudentSubjects(studentId);
    let maxHours = 0;

    for (const subjectId of subjects) {
      const hours = this.getSelectedHours(studentId, subjectId) || 0;
      if (hours > maxHours) {
        maxHours = hours;
      }
    }

    return maxHours;
  }

  /**
   * Get the CUMULATIVE hours discount for the student
   * Each subject contributes its hours tier discount:
   * - Subject at 20h adds 5%
   * - Subject at 30h adds 10%
   * Total is summed across all subjects
   */
  getStudentHoursDiscount(studentId: number): number {
    const subjects = this.getStudentSubjects(studentId);
    let totalHoursDiscount = 0;

    for (const subjectId of subjects) {
      const hours = this.getSelectedHours(studentId, subjectId) || 0;

      if (hours >= 30) {
        totalHoursDiscount += this.hoursDiscountTiers.hours30;
      } else if (hours >= 20) {
        totalHoursDiscount += this.hoursDiscountTiers.hours20;
      }
      // 10 hours = no discount contribution
    }

    return totalHoursDiscount;
  }

  /**
   * Get the effective hours discount after applying the 20% cap rule
   * Total discount (multi-subject + hours) cannot exceed 20%
   * Hours discount is CUMULATIVE across all subjects
   */
  getEffectiveHoursDiscount(studentId: number, hours?: number): number {
    const multiSubjectDiscount = this.getMultiSubjectDiscount(studentId);
    const remainingDiscount = MAX_TOTAL_DISCOUNT - multiSubjectDiscount;

    // If multi-subject discount already reached max, no hours discount allowed
    if (remainingDiscount <= 0) {
      return 0;
    }

    // Get the CUMULATIVE hours discount for this student
    const baseHoursDiscount = this.getStudentHoursDiscount(studentId);

    // Cap the hours discount to not exceed the remaining discount
    return Math.min(baseHoursDiscount, remainingDiscount);
  }

  /**
   * Get total discount percentage for student (multi-subject + hours)
   */
  getTotalStudentDiscount(studentId: number): number {
    const multiSubject = this.getMultiSubjectDiscount(studentId);
    const hours = this.getEffectiveHoursDiscount(studentId);
    return Math.min(multiSubject + hours, MAX_TOTAL_DISCOUNT);
  }

  canProceed(): boolean {
    return this.students.every(student => {
      const subjects = this.getStudentSubjects(student.id);
      return subjects.every(subjectId => {
        return this.getSelectedHours(student.id, subjectId) !== null;
      });
    });
  }

  previousStep(): void {
    this.stateService.previousStep();
  }

  nextStep(): void {
    if (this.canProceed()) {
      this.stateService.nextStep();
    }
  }
}
