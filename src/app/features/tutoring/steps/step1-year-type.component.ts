import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TutoringStateService } from '../../../core/services/tutoring-state.service';
import { TutoringService } from '../../../core/services/tutoring.service';
import { UserService } from '../../../core/services/user.service';
import { TeachingType, StudentInfo } from '../../../models/tutoring.models';

interface StudentWithSelection extends StudentInfo {
  selected: boolean;
}

interface DiscountTier {
  minStudents: number;
  percentage: number;
}

@Component({
  selector: 'app-step1-students',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './step1-year-type.component.html',
  styleUrls: ['./step1-year-type.component.scss']
})
export class Step1YearTypeComponent implements OnInit {
  availableStudents: StudentWithSelection[] = [];
  selectedCount = 0;
  loading = false;
  error: string | null = null;

  // Default discount tiers for regular users
  // Admin users can configure these via admin panel
  discountTiers: DiscountTier[] = [
    { minStudents: 2, percentage: 5 },
    { minStudents: 3, percentage: 10 },
    { minStudents: 4, percentage: 15 },
    { minStudents: 5, percentage: 20 }
  ];

  constructor(
    private stateService: TutoringStateService,
    private tutoringService: TutoringService,
    private userService: UserService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadStudents();
    this.restoreState();
  }

  loadStudents(): void {
    this.loading = true;
    this.error = null;

    this.userService.getMyStudents().subscribe({
      next: (students) => {
        // Map API response to StudentWithSelection interface
        // ChildDto has: id, userName, email, age, year
        this.availableStudents = students.map(s => ({
          id: s.id,
          name: s.userName || `Student ${s.id}`,
          academicYearId: s.year || 1,
          yearNumber: s.year || 1,
          selected: false
        }));
        this.restoreSelections();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading students:', err);
        this.error = 'Failed to load students. Please try again.';
        this.loading = false;
      }
    });
  }

  restoreState(): void {
    const savedStudents = this.stateService.getStudents();
    if (savedStudents.length > 0) {
      this.restoreSelections();
    }
  }

  restoreSelections(): void {
    const savedStudents = this.stateService.getStudents();
    const savedIds = new Set(savedStudents.map(s => s.id));

    this.availableStudents.forEach(student => {
      student.selected = savedIds.has(student.id);
    });

    this.updateSelectedCount();
  }

  toggleStudent(student: StudentWithSelection): void {
    student.selected = !student.selected;
    this.updateSelectedCount();
    this.saveSelection();
  }

  updateSelectedCount(): void {
    this.selectedCount = this.availableStudents.filter(s => s.selected).length;
  }

  saveSelection(): void {
    const selected = this.availableStudents
      .filter(s => s.selected)
      .map(s => ({
        id: s.id,
        name: s.name,
        academicYearId: s.academicYearId,
        yearNumber: s.yearNumber
      }));

    this.stateService.setStudents(selected);
  }

  addNewStudent(): void {
    // Navigate to add student page
    this.router.navigate(['/add-student']);
  }

  canProceed(): boolean {
    return this.selectedCount > 0;
  }

  nextStep(): void {
    if (this.canProceed()) {
      this.stateService.nextStep();
    }
  }

  getDiscountPercentage(): number {
    // Find the highest applicable discount tier
    let discount = 0;
    for (const tier of this.discountTiers) {
      if (this.selectedCount >= tier.minStudents) {
        discount = tier.percentage;
      }
    }
    return discount;
  }

}

