import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TutoringStateService } from '../../../core/services/tutoring-state.service';
import { TutoringService } from '../../../core/services/tutoring.service';
import { ContentService, Subject } from '../../../core/services/content.service';
import { StudentInfo } from '../../../models/tutoring.models';

interface DiscountTier {
  minSubjects: number;
  percentage: number;
}

@Component({
  selector: 'app-step2-subjects',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './step2-students.component.html',
  styleUrls: ['./step2-students.component.scss'],
})
export class Step2SubjectsComponent implements OnInit {
  students: StudentInfo[] = [];
  subjects: Subject[] = [];
  subjectsByYear = new Map<number, Subject[]>();
  studentSubjects = new Map<number, Set<number>>();
  loading = false;

  // Dynamic discount tiers loaded from API (initialized with defaults)
  discountTiers: DiscountTier[] = [
    { minSubjects: 2, percentage: 5 },
    { minSubjects: 3, percentage: 10 },
    { minSubjects: 4, percentage: 15 },
    { minSubjects: 5, percentage: 20 }
  ];

  constructor(
    private stateService: TutoringStateService,
    private tutoringService: TutoringService,
    private contentService: ContentService
  ) { }

  ngOnInit(): void {
    this.restoreState();
    this.loadSubjects();
    this.loadDiscountTiers();
  }

  restoreState(): void {
    const state = this.stateService.getState();
    this.students = state.students;
    this.studentSubjects = new Map(state.studentSubjects);
  }

  loadSubjects(): void {
    this.loading = true;

    const uniqueYears = [...new Set(this.students.map(s => s.academicYearId))];

    let loadedCount = 0;
    uniqueYears.forEach(yearId => {
      this.contentService.getSubjectsByYear(yearId).subscribe({
        next: (subjects) => {
          const subjectsArray = Array.isArray(subjects) ? subjects : [];
          this.subjectsByYear.set(yearId, subjectsArray);
          this.subjects.push(...subjectsArray);

          loadedCount++;
          if (loadedCount === uniqueYears.length) {
            this.loading = false;
          }
        },
        error: (error) => {
          console.error(`Error loading subjects for year ${yearId}:`, error);
          this.subjectsByYear.set(yearId, []);

          loadedCount++;
          if (loadedCount === uniqueYears.length) {
            this.loading = false;
          }
        }
      });
    });

    if (uniqueYears.length === 0) {
      this.loading = false;
    }
  }

  getSubjectsForStudent(yearId: number): Subject[] {
    return this.subjectsByYear.get(yearId) || [];
  }

  toggleSubject(studentId: number, subject: Subject): void {
    if (!this.canSelectMoreSubjects(studentId, subject.id)) {
      return;
    }

    if (!this.studentSubjects.has(studentId)) {
      this.studentSubjects.set(studentId, new Set());
    }

    const subjects = this.studentSubjects.get(studentId)!;
    if (subjects.has(subject.id)) {
      subjects.delete(subject.id);
    } else {
      subjects.add(subject.id);
    }

    this.saveSelection();
  }

  isSubjectSelected(studentId: number, subjectId: number): boolean {
    return this.studentSubjects.get(studentId)?.has(subjectId) || false;
  }

  canSelectMoreSubjects(studentId: number, subjectId: number): boolean {
    if (this.isSubjectSelected(studentId, subjectId)) {
      return true; // Can always deselect
    }
    return this.getSelectedCount(studentId) < 5;
  }

  getSelectedCount(studentId: number): number {
    return this.studentSubjects.get(studentId)?.size || 0;
  }

  getSubjectDiscount(count: number): number {
    if (count <= 1) return 0;

    // Find the highest applicable discount tier
    let discount = 0;
    for (const tier of this.discountTiers) {
      if (count >= tier.minSubjects) {
        discount = tier.percentage;
      }
    }
    return discount;
  }

  private loadDiscountTiers(): void {
    this.tutoringService.getDiscountRules().subscribe({
      next: (response: any) => {
        const data = response.data || response;

        if (data.multiSubjectDiscount?.tiers) {
          const tiers = data.multiSubjectDiscount.tiers;
          this.discountTiers = [
            { minSubjects: 2, percentage: tiers.subjects2 || 5 },
            { minSubjects: 3, percentage: tiers.subjects3 || 10 },
            { minSubjects: 4, percentage: tiers.subjects4 || 15 },
            { minSubjects: 5, percentage: tiers.subjects5 || 20 }
          ];
        } else {
          // Fallback to default tiers
          this.discountTiers = [
            { minSubjects: 2, percentage: 5 },
            { minSubjects: 3, percentage: 10 },
            { minSubjects: 4, percentage: 15 },
            { minSubjects: 5, percentage: 20 }
          ];
        }

        console.log('✅ Loaded subject discount tiers:', this.discountTiers);
      },
      error: (err) => {
        console.error('Error loading discount tiers:', err);
        // Use default tiers on error
        this.discountTiers = [
          { minSubjects: 2, percentage: 5 },
          { minSubjects: 3, percentage: 10 },
          { minSubjects: 4, percentage: 15 },
          { minSubjects: 5, percentage: 20 }
        ];
      }
    });
  }

  getTutoringPrice(subject: Subject): number {
    // ✅ Use tutoring hourly rate (not self-learning subscription price)
    return subject.tutoringPricePerHour || subject.price || 100;
  }

  saveSelection(): void {
    this.stateService.setStudentSubjects(this.studentSubjects);
  }

  canProceed(): boolean {
    return this.students.every(student => this.getSelectedCount(student.id) > 0);
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
