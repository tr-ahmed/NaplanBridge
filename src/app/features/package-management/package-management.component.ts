import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PackagePricingService } from '../../core/services/package-pricing.service';
import {
  PackagePricing,
  TeachingType,
  GenerateMixesRequest,
  PricingMatrix,
  PackagePricingBulkUpdateDto,
  Subject
} from '../../models/package-pricing.model';

@Component({
  selector: 'app-package-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './package-management.component.html',
  styleUrls: ['./package-management.component.scss']
})
export class PackageManagementComponent implements OnInit {
  packages: PackagePricing[] = [];
  filteredPackages: PackagePricing[] = [];
  subjects: Subject[] = [];

  // Matrix view
  oneToOneMatrix: PricingMatrix | null = null;
  groupMatrix: PricingMatrix | null = null;

  // View mode
  viewMode: 'list' | 'matrix' = 'matrix';
  currentTab: 'oneToOne' | 'group' = 'oneToOne';

  // Filters
  selectedYear = 1;
  selectedTeachingType: TeachingType | 'all' = 'all';
  selectedStudentCount: number | 'all' = 'all';
  showActiveOnly = false;

  // Generate packages form
  generateForm!: FormGroup;
  showGenerateModal = false;

  // Bulk edit
  bulkEditMode = false;
  selectedPackages = new Set<number>();
  bulkEditPrice: number | null = null;

  // Loading states
  loading = false;
  generating = false;

  // Enums
  TeachingType = TeachingType;

  constructor(
    private packageService: PackagePricingService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.initGenerateForm();
    this.loadSubjects();
    this.loadMatrixData();
  }

  initGenerateForm(): void {
    this.generateForm = this.fb.group({
      yearId: [this.selectedYear, Validators.required],
      includeOneToOne: [true],
      includeGroupTutoring: [true],
      minStudents: [1, [Validators.required, Validators.min(1)]],
      maxStudents: [4, [Validators.required, Validators.min(1)]],
      maxSubjectsPerPackage: [3, [Validators.required, Validators.min(1)]]
    });
  }

  loadSubjects(): void {
    this.packageService.getAvailableSubjects().subscribe({
      next: (subjects) => {
        this.subjects = subjects;
      },
      error: (error) => {
        console.error('Error loading subjects:', error);
      }
    });
  }

  loadMatrixData(): void {
    this.loading = true;

    // Load both matrices in parallel
    Promise.all([
      this.packageService.getPricingMatrix(TeachingType.OneToOne, this.selectedYear).toPromise(),
      this.packageService.getPricingMatrix(TeachingType.GroupTutoring, this.selectedYear).toPromise()
    ]).then(([oneToOne, group]) => {
      this.oneToOneMatrix = oneToOne || null;
      this.groupMatrix = group || null;
      this.loading = false;
    }).catch(error => {
      console.error('Error loading matrix data:', error);
      this.loading = false;
    });
  }

  loadPackages(): void {
    this.loading = true;
    const teachingType = this.selectedTeachingType === 'all' ? undefined : this.selectedTeachingType;
    const studentCount = this.selectedStudentCount === 'all' ? undefined : this.selectedStudentCount;

    this.packageService.getAllPackages(
      this.selectedYear,
      teachingType,
      studentCount,
      this.showActiveOnly ? true : undefined
    ).subscribe({
      next: (packages) => {
        this.packages = packages;
        this.filteredPackages = packages;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading packages:', error);
        this.loading = false;
      }
    });
  }

  openGenerateModal(): void {
    this.showGenerateModal = true;
  }

  closeGenerateModal(): void {
    this.showGenerateModal = false;
    this.generateForm.reset({
      yearId: this.selectedYear,
      includeOneToOne: true,
      includeGroupTutoring: true,
      minStudents: 1,
      maxStudents: 4,
      maxSubjectsPerPackage: 3
    });
  }

  generatePackages(): void {
    if (this.generateForm.invalid) return;

    this.generating = true;
    const request: GenerateMixesRequest = this.generateForm.value;

    this.packageService.generateMixes(request).subscribe({
      next: (response) => {
        alert(`✅ Success!\n\nTotal Generated: ${response.totalGenerated}\nNewly Created: ${response.newlyCreated}\nAlready Existed: ${response.alreadyExisted}`);
        this.generating = false;
        this.closeGenerateModal();
        this.loadMatrixData();
      },
      error: (error) => {
        console.error('Error generating packages:', error);
        alert('❌ Error generating packages. Please try again.');
        this.generating = false;
      }
    });
  }

  updatePrice(packageId: number, price: number | null, studentCount?: number): void {
    if (price === null || price < 0) return;

    this.packageService.updatePackage(packageId, { price }).subscribe({
      next: () => {
        this.loadMatrixData();
      },
      error: (error) => {
        console.error('Error updating price:', error);
        alert('❌ Error updating price. Please try again.');
      }
    });
  }

  toggleStatus(packageId: number): void {
    this.packageService.toggleStatus(packageId).subscribe({
      next: () => {
        this.loadMatrixData();
      },
      error: (error) => {
        console.error('Error toggling status:', error);
        alert('❌ Error toggling status. Please try again.');
      }
    });
  }

  deletePackage(packageId: number): void {
    if (!confirm('Are you sure you want to delete this package?')) return;

    this.packageService.deletePackage(packageId).subscribe({
      next: () => {
        this.loadMatrixData();
      },
      error: (error) => {
        console.error('Error deleting package:', error);
        alert('❌ Error deleting package. Please try again.');
      }
    });
  }

  toggleBulkEdit(): void {
    this.bulkEditMode = !this.bulkEditMode;
    if (!this.bulkEditMode) {
      this.selectedPackages.clear();
      this.bulkEditPrice = null;
    }
  }

  togglePackageSelection(packageId: number): void {
    if (this.selectedPackages.has(packageId)) {
      this.selectedPackages.delete(packageId);
    } else {
      this.selectedPackages.add(packageId);
    }
  }

  applyBulkUpdate(): void {
    if (this.selectedPackages.size === 0 || this.bulkEditPrice === null) {
      alert('Please select packages and enter a price.');
      return;
    }

    const updates: PackagePricingBulkUpdateDto[] = Array.from(this.selectedPackages).map(id => ({
      packageId: id,
      price: this.bulkEditPrice!
    }));

    this.packageService.bulkUpdatePrices(updates).subscribe({
      next: (response) => {
        alert(`✅ Successfully updated ${response.updatedCount} packages!`);
        this.toggleBulkEdit();
        this.loadMatrixData();
      },
      error: (error) => {
        console.error('Error bulk updating prices:', error);
        alert('❌ Error updating prices. Please try again.');
      }
    });
  }

  switchTab(tab: 'oneToOne' | 'group'): void {
    this.currentTab = tab;
  }

  getStudentCounts(matrix: PricingMatrix | null): number[] {
    if (!matrix || matrix.rows.length === 0) return [];
    const firstRow = matrix.rows[0];
    return Object.keys(firstRow.priceByStudentCount).map(k => parseInt(k)).sort((a, b) => a - b);
  }

  getPrice(row: any, studentCount: number): number | null {
    return row.priceByStudentCount[studentCount] ?? null;
  }

  trackByPackageId(index: number, item: any): number {
    return item.packageId;
  }
}
