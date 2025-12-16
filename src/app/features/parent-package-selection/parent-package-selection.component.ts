import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PackagePricingService } from '../../core/services/package-pricing.service';
import { UserService, ChildDto } from '../../core/services/user.service';
import { ContentService, Year } from '../../core/services/content.service';
import { AcademicTermsService, AcademicTermResponse } from '../../core/services/academic-terms.service';
import {
  TeachingType,
  Subject,
  PriceCalculationRequest,
  PriceCalculationResponse
} from '../../models/package-pricing.model';

interface PackageSelectionState {
  teachingType: TeachingType;
  selectedSubjectNames: string[];  // Changed from IDs to names
  studentCount: number;
  selectedTermId: number | null;
  selectedStudentIds: number[];
  currentStep: number;
}

const STORAGE_KEY = 'packageSelectionState';

@Component({
  selector: 'app-parent-package-selection',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './parent-package-selection.component.html',
  styleUrls: ['./parent-package-selection.component.scss']
})
export class ParentPackageSelectionComponent implements OnInit {
  // Stepper
  currentStep = 1;
  totalSteps = 3;

  // Step 1: Teaching Type & Subject Selection
  teachingType: TeachingType = TeachingType.OneToOne;
  availableSubjects: Subject[] = [];
  selectedSubjectNames: string[] = [];  // Changed to track names instead of IDs
  studentCount = 1;

  // Term (Year is per-student, not global)
  terms: AcademicTermResponse[] = [];
  selectedTermId: number | null = null;
  loadingMeta = false;

  // Step 2: Student Selection
  availableStudents: ChildDto[] = [];
  selectedStudentIds: number[] = [];

  // Pricing
  priceCalculation: PriceCalculationResponse | null = null;
  calculatingPrice = false;

  // Order creation
  creatingOrder = false;

  // Loading
  loading = false;

  // Enums
  TeachingType = TeachingType;

  constructor(
    private packageService: PackagePricingService,
    private userService: UserService,
    private contentService: ContentService,
    private academicTermsService: AcademicTermsService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.restoreState();
    this.loadTerms();
    this.loadSubjects();
    this.loadStudents();
  }

  // ========================================
  // State Persistence
  // ========================================

  private saveState(): void {
    const state: PackageSelectionState = {
      teachingType: this.teachingType,
      selectedSubjectNames: this.selectedSubjectNames,
      studentCount: this.studentCount,
      selectedTermId: this.selectedTermId,
      selectedStudentIds: this.selectedStudentIds,
      currentStep: this.currentStep
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  private restoreState(): void {
    const savedState = localStorage.getItem(STORAGE_KEY);
    if (savedState) {
      try {
        const state: PackageSelectionState = JSON.parse(savedState);
        this.teachingType = state.teachingType;
        this.selectedSubjectNames = state.selectedSubjectNames || [];
        this.studentCount = state.studentCount;
        this.selectedTermId = state.selectedTermId;
        this.selectedStudentIds = state.selectedStudentIds || [];
        this.currentStep = state.currentStep || 1;
      } catch (error) {
        console.error('Error restoring state:', error);
      }
    }
  }

  private clearState(): void {
    localStorage.removeItem(STORAGE_KEY);
  }

  private loadTerms(): void {
    this.loadingMeta = true;

    const currentAcademicYear = this.academicTermsService.getCurrentYear();
    this.academicTermsService.getAcademicTerms(currentAcademicYear).subscribe({
      next: (terms) => {
        this.terms = terms;
        if (this.selectedTermId === null && terms.length > 0) {
          const activeTerm = terms.find(t => t.isActive);
          this.selectedTermId = (activeTerm?.id ?? terms[0].id) ?? null;
        }
        this.loadingMeta = false;
        this.calculatePrice();
      },
      error: (error) => {
        console.error('Error loading academic terms:', error);
        this.loadingMeta = false;
      }
    });
  }

  // ========================================
  // Data Loading
  // ========================================

  loadSubjects(): void {
    this.loading = true;
    this.packageService.getAvailableSubjects().subscribe({
      next: (subjects) => {
        this.availableSubjects = subjects;
        this.loading = false;
        this.calculatePrice();
      },
      error: (error) => {
        console.error('Error loading subjects:', error);
        this.loading = false;
      }
    });
  }

  loadStudents(): void {
    this.userService.getMyStudents().subscribe({
      next: (students) => {
        this.availableStudents = students;
      },
      error: (error) => {
        console.error('Error loading students:', error);
        // Fallback to empty array
        this.availableStudents = [];
      }
    });
  }

  // ========================================
  // Step 1: Teaching Type & Subjects
  // ========================================

  selectTeachingType(type: TeachingType): void {
    this.teachingType = type;
    if (type === TeachingType.OneToOne) {
      this.studentCount = 1;
    }
    this.saveState();
    this.calculatePrice();
  }

  toggleSubject(subjectName: string): void {
    const index = this.selectedSubjectNames.indexOf(subjectName);
    if (index > -1) {
      this.selectedSubjectNames.splice(index, 1);
    } else {
      this.selectedSubjectNames.push(subjectName);
    }
    this.saveState();
    this.calculatePrice();
  }

  isSubjectSelected(subjectName: string): boolean {
    return this.selectedSubjectNames.includes(subjectName);
  }

  updateStudentCount(count: number): void {
    this.studentCount = count;
    this.saveState();
    this.calculatePrice();
  }

  onTermChange(termId: number): void {
    this.selectedTermId = termId;
    this.saveState();
    this.calculatePrice();
  }

  calculatePrice(): void {
    if (this.selectedSubjectNames.length === 0) {
      this.priceCalculation = null;
      return;
    }

    if (this.selectedTermId === null) {
      this.priceCalculation = null;
      return;
    }

    this.calculatingPrice = true;
    const request: PriceCalculationRequest = {
      teachingType: this.teachingType,
      studentCount: this.studentCount,
      subjectNames: this.selectedSubjectNames,
      yearId: 1,  // Dummy value for now, backend will calculate per student
      termId: this.selectedTermId
    };

    this.packageService.calculatePrice(request).subscribe({
      next: (response) => {
        // Normalize response to keep backward-compatible fields
        this.priceCalculation = {
          ...response,
          totalPrice: response.totalPrice ?? response.price ?? 0,
          price: response.price ?? response.totalPrice ?? 0,
          packageName: response.packageName ?? response.message
        };
        this.calculatingPrice = false;
      },
      error: (error) => {
        console.error('Error calculating price:', error);
        this.calculatingPrice = false;
      }
    });
  }

  // ========================================
  // Step 2: Student Selection
  // ========================================

  toggleStudent(studentId: number): void {
    const index = this.selectedStudentIds.indexOf(studentId);
    if (index > -1) {
      this.selectedStudentIds.splice(index, 1);
    } else {
      // Check if we've reached the limit
      if (this.selectedStudentIds.length < this.studentCount) {
        this.selectedStudentIds.push(studentId);
      } else {
        alert(`You can only select ${this.studentCount} student(s)`);
      }
    }
    this.saveState();
  }

  isStudentSelected(studentId: number): boolean {
    return this.selectedStudentIds.includes(studentId);
  }

  // ========================================
  // Navigation
  // ========================================

  canProceedToStep2(): boolean {
    return (
      this.selectedTermId !== null &&
      this.selectedSubjectNames.length > 0 &&
      this.priceCalculation !== null
    );
  }

  canProceedToStep3(): boolean {
    return this.selectedStudentIds.length === this.studentCount;
  }

  nextStep(): void {
    if (this.currentStep === 1 && !this.canProceedToStep2()) {
      alert('Please select at least one subject');
      return;
    }

    if (this.currentStep === 2 && !this.canProceedToStep3()) {
      alert(`Please select exactly ${this.studentCount} student(s)`);
      return;
    }

    if (this.currentStep < this.totalSteps) {
      this.currentStep++;
      this.saveState();
    }
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
      this.saveState();
    }
  }

  goToStep(step: number): void {
    if (step <= this.currentStep || this.canNavigateToStep(step)) {
      this.currentStep = step;
    }
  }

  canNavigateToStep(step: number): boolean {
    if (step === 1) return true;
    if (step === 2) return this.canProceedToStep2();
    if (step === 3) return this.canProceedToStep2() && this.canProceedToStep3();
    return false;
  }

  // ========================================
  // Order Creation & Checkout
  // ========================================

  async proceedToCheckout(): Promise<void> {
    if (!this.priceCalculation) {
      alert('Price calculation error. Please try again.');
      return;
    }

    if (this.selectedTermId === null) {
      alert('Please select term.');
      return;
    }

    this.creatingOrder = true;

    const orderRequest = {
      teachingType: this.teachingType,
      studentCount: this.studentCount,
      subjectNames: this.selectedSubjectNames,  // Send names, not IDs
      studentIds: this.selectedStudentIds,
      termId: this.selectedTermId,
      expectedPrice: this.getTotalPrice()
    };

    this.packageService.createPackageOrder(orderRequest).subscribe({
      next: (response) => {
        // Save order details for success page
        localStorage.setItem('pendingOrder', JSON.stringify({
          orderId: response.orderId,
          orderNumber: response.orderNumber,
          amount: response.totalAmount
        }));

        // Clear saved state (checkout successful)
        this.clearState();

        // Redirect to Stripe Checkout
        window.location.href = response.stripeCheckoutUrl;
      },
      error: (error) => {
        console.error('Failed to create order:', error);
        alert('Failed to create order. Please try again.');
        this.creatingOrder = false;
      }
    });
  }

  // ========================================
  // Helpers
  // ========================================

  getSelectedSubjects(): Subject[] {
    return this.availableSubjects.filter(s => this.selectedSubjectNames.includes(s.name));
  }

  getSelectedStudents(): ChildDto[] {
    return this.availableStudents.filter(s => this.selectedStudentIds.includes(s.id));
  }

  getTotalPrice(): number {
    if (!this.priceCalculation) return 0;
    return (this.priceCalculation.price ?? this.priceCalculation.totalPrice ?? 0);
  }

  getPricePerStudent(): number {
    const total = this.getTotalPrice();
    if (!total || this.studentCount === 0) return 0;
    return total / this.studentCount;
  }

  addStudent(): void {
    this.saveState();
    this.router.navigate(['/add-student'], {
      queryParams: { returnTo: '/parent/packages' }
    });
  }

  isNextDisabled(): boolean {
    return this.calculatingPrice || this.loadingMeta;
  }
}
