import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AcademicTermsService, AcademicTerm, AcademicTermResponse } from '../../core/services/academic-terms.service';

@Component({
  selector: 'app-academic-terms',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './academic-terms.component.html',
  styleUrls: ['./academic-terms.component.scss']
})
export class AcademicTermsComponent implements OnInit {
  // State
  terms: AcademicTermResponse[] = [];
  selectedYear: number;
  isLoading = false;

  // Edit mode
  editMode = false;
  editingTerm: AcademicTerm | null = null;

  // Add mode
  showAddForm = false;
  newTerm: AcademicTerm = this.getEmptyTerm();

  // Messages
  successMessage = '';
  errorMessage = '';

  /**
   * Get the current term being edited or added
   */
  get currentTerm(): AcademicTerm {
    return this.editMode && this.editingTerm ? this.editingTerm : this.newTerm;
  }

  constructor(private academicTermsService: AcademicTermsService) {
    this.selectedYear = this.academicTermsService.getCurrentYear();
  }

  ngOnInit(): void {
    this.loadTerms();
  }

  /**
   * Load terms for selected year
   */
  loadTerms(): void {
    this.isLoading = true;
    this.clearMessages();

    console.log('Loading terms for year:', this.selectedYear);

    this.academicTermsService.getAcademicTerms(this.selectedYear)
      .subscribe({
        next: (terms) => {
          console.log('Loaded terms:', terms);
          this.terms = terms;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading terms:', error);
          this.showError('Failed to load academic terms');
          this.isLoading = false;
        }
      });
  }



  /**
   * Change selected year
   */
  onYearChange(): void {
    console.log('Year changed to:', this.selectedYear);
    this.loadTerms();
  }

  /**
   * Open add form
   */
  openAddForm(): void {
    this.showAddForm = true;
    this.editMode = false;
    this.newTerm = this.getEmptyTerm();
    this.clearMessages();
  }

  /**
   * Cancel add/edit
   */
  cancelEdit(): void {
    this.showAddForm = false;
    this.editMode = false;
    this.editingTerm = null;
    this.newTerm = this.getEmptyTerm();
    this.clearMessages();
  }

  /**
   * Save term (create or update)
   */
  saveTerm(): void {
    const term = this.currentTerm;

    // Validation
    if (!term.name || !term.startDate || !term.endDate) {
      this.showError('Please fill in all required fields');
      return;
    }

    if (new Date(term.endDate) <= new Date(term.startDate)) {
      this.showError('End date must be after start date');
      return;
    }

    this.isLoading = true;
    this.clearMessages();

    if (this.editMode && this.editingTerm?.id) {
      // Update
      this.academicTermsService.updateAcademicTerm(this.editingTerm.id, term)
        .subscribe({
          next: () => {
            this.showSuccess('Term updated successfully');
            this.loadTerms();
            this.cancelEdit();
          },
          error: (error) => {
            console.error('Error updating term:', error);
            this.showError('Failed to update term');
            this.isLoading = false;
          }
        });
    } else {
      // Create
      this.academicTermsService.createAcademicTerm(term)
        .subscribe({
          next: () => {
            this.showSuccess('Term created successfully');
            this.loadTerms();
            this.cancelEdit();
          },
          error: (error) => {
            console.error('Error creating term:', error);
            this.showError('Failed to create term');
            this.isLoading = false;
          }
        });
    }
  }

  /**
   * Edit term
   */
  editTerm(term: AcademicTermResponse): void {
    this.editMode = true;
    this.showAddForm = true;
    this.editingTerm = { ...term };
    this.clearMessages();
  }

  /**
   * Delete term
   */
  deleteTerm(term: AcademicTermResponse): void {
    if (!confirm(`Delete ${term.name}? This action cannot be undone.`)) {
      return;
    }

    this.isLoading = true;
    this.clearMessages();

    this.academicTermsService.deleteAcademicTerm(term.id)
      .subscribe({
        next: () => {
          this.showSuccess('Term deleted successfully');
          this.loadTerms();
        },
        error: (error) => {
          console.error('Error deleting term:', error);
          this.showError('Failed to delete term');
          this.isLoading = false;
        }
      });
  }

  /**
   * Toggle term active status
   */
  toggleActive(term: AcademicTermResponse): void {
    const updatedTerm = { ...term, isActive: !term.isActive };

    this.academicTermsService.updateAcademicTerm(term.id, updatedTerm)
      .subscribe({
        next: () => {
          this.showSuccess(`Term ${updatedTerm.isActive ? 'activated' : 'deactivated'}`);
          this.loadTerms();
        },
        error: (error) => {
          console.error('Error toggling term status:', error);
          this.showError('Failed to update term status');
        }
      });
  }

  /**
   * Get empty term template
   */
  private getEmptyTerm(): AcademicTerm {
    return {
      name: '',
      termNumber: 1,
      startDate: '',
      endDate: '',
      academicYear: this.selectedYear,
      isActive: true
    };
  }

  /**
   * Show success message
   */
  private showSuccess(message: string): void {
    this.successMessage = message;
    this.errorMessage = '';
    setTimeout(() => this.successMessage = '', 5000);
  }

  /**
   * Show error message
   */
  private showError(message: string): void {
    this.errorMessage = message;
    this.successMessage = '';
  }

  /**
   * Show warning message
   */
  private showWarning(message: string): void {
    this.errorMessage = message;
    this.successMessage = '';
  }

  /**
   * Clear all messages
   */
  private clearMessages(): void {
    this.successMessage = '';
    this.errorMessage = '';
  }

  /**
   * Get years list for dropdown
   */
  getYears(): number[] {
    const currentYear = this.academicTermsService.getCurrentYear();
    return [currentYear - 1, currentYear, currentYear + 1];
  }

  /**
   * Format date for display
   */
  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
}
