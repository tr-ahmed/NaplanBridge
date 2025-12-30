import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { TutoringStateService } from '../../../core/services/tutoring-state.service';
import { TutoringService } from '../../../core/services/tutoring.service';
import { ContentService, Subject } from '../../../core/services/content.service';
import { StudentInfo } from '../../../models/tutoring.models';
import { AvailableTutoringTerm, SubjectTermsResponse } from '../../../models/term.models';

interface SubjectWithTerms {
  subjectId: number;
  subjectName: string;
  isGlobal: boolean;
  requiresTermSelection: boolean;
  availableTerms: AvailableTutoringTerm[];
  selectedTermId: number | null;           // Subject Term ID (for UI display)
  selectedAcademicTermId: number | null;   // Academic Term ID (for Smart Scheduling)
}

interface StudentSubjectTerms {
  student: StudentInfo;
  subjects: SubjectWithTerms[];
}

@Component({
  selector: 'app-step2b-term-selection',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="step-container">
      <div class="header-section">
        <h2 class="step-title">Step 3: Select Academic Term</h2>
        <p class="step-subtitle">Choose which term you want to book tutoring sessions for</p>
      </div>

      <!-- Loading State -->
      @if (loading) {
        <div class="loading">
          <div class="spinner"></div>
          <p>Loading available terms...</p>
        </div>
      }

      <!-- No Term Selection Required -->
      @if (!loading && !hasSubjectsRequiringTerms) {
        <div class="info-card global">
          <div class="info-icon">🌍</div>
          <div class="info-content">
            <h4>No Term Selection Required</h4>
            <p>All selected subjects are available year-round without term restrictions.</p>
          </div>
        </div>
      }

      <!-- Student Term Selections -->
      @for (studentData of studentSubjectTerms; track studentData.student.id) {
        @if (hasTermBasedSubjects(studentData)) {
          <div class="student-section">
            <div class="student-header">
              <div class="student-info-header">
                <div class="student-icon">📅</div>
                <div>
                  <h3 class="student-name">{{ studentData.student.name }}</h3>
                  <span class="year-badge">Year {{ studentData.student.yearNumber }}</span>
                </div>
              </div>
            </div>

            <!-- Subject Term Cards -->
            @for (subject of studentData.subjects; track subject.subjectId) {
              @if (subject.requiresTermSelection) {
                <div class="subject-term-section">
                  <h4 class="subject-title">{{ subject.subjectName }}</h4>
                  
                  <div class="terms-grid">
                    @for (term of getFilteredTerms(subject.availableTerms); track term.termId) {
                      <div 
                        class="term-card-compact"
                        [class.selected]="subject.selectedTermId === term.termId"
                        [class.current]="term.isCurrent"
                        [class.next]="isNextTerm(term, subject.availableTerms)"
                        (click)="selectTerm(studentData.student.id, subject.subjectId, term.termId, term.academicTermId)">
                        
                        <div class="term-card-content">
                          <div class="term-main">
                            <span class="term-name">{{ term.termName }}</span>
                            @if (term.isCurrent) {
                              <span class="badge-current-mini">Now</span>
                            }
                            @if (isNextTerm(term, subject.availableTerms)) {
                              <span class="badge-next-mini">Next</span>
                            }
                          </div>
                          <div class="term-meta">
                            <span class="term-dates-mini">{{ formatDateWithYear(term.startDate) }} - {{ formatDateWithYear(term.endDate) }}</span>
                          </div>
                        </div>
                        
                        @if (subject.selectedTermId === term.termId) {
                          <span class="check-icon">✓</span>
                        }
                      </div>
                    }
                  </div>
                </div>
              } @else {
                <!-- Global Subject Info -->
                <div class="global-subject-info">
                  <span class="global-icon">🌍</span>
                  <span class="global-text">{{ subject.subjectName }} - Available year-round</span>
                </div>
              }
            }
          </div>
        }
      }

      <!-- Navigation -->
      <div class="nav-buttons">
        <button
          type="button"
          (click)="previousStep()"
          class="btn btn-secondary">
          <span class="btn-icon">←</span>
          <span>Back to Subjects</span>
        </button>
        <button
          type="button"
          (click)="nextStep()"
          [disabled]="!canProceed()"
          class="btn btn-primary">
          <span>Next: Teaching Type</span>
          <span class="btn-icon">→</span>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .step-container {
      background: white;
      border-radius: 16px;
      padding: 2.5rem;
      box-shadow: 0 4px 12px rgba(0,0,0,0.08);
      max-width: 1200px;
      margin: 0 auto;
    }

    .header-section {
      text-align: center;
      margin-bottom: 2rem;
    }

    .step-title {
      font-size: 2rem;
      font-weight: 700;
      color: #1a1a1a;
      margin-bottom: 0.5rem;
    }

    .step-subtitle {
      font-size: 1.125rem;
      color: #666;
    }

    .loading {
      text-align: center;
      padding: 4rem 2rem;
      color: #666;
    }

    .spinner {
      border: 4px solid #f3f3f3;
      border-top: 4px solid #108092;
      border-radius: 50%;
      width: 50px;
      height: 50px;
      animation: spin 1s linear infinite;
      margin: 0 auto 1rem;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .info-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.5rem;
      border-radius: 12px;
      margin-bottom: 2rem;
    }

    .info-card.global {
      background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
      border: 2px solid #64b5f6;
    }

    .info-icon {
      font-size: 2.5rem;
    }

    .info-content h4 {
      font-size: 1.25rem;
      font-weight: 600;
      color: #1565c0;
      margin: 0 0 0.25rem 0;
    }

    .info-content p {
      color: #1976d2;
      margin: 0;
    }

    /* Student Section */
    .student-section {
      margin-bottom: 2rem;
      padding: 1.5rem;
      background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
      border-radius: 16px;
      border: 2px solid #e9ecef;
    }

    .student-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      padding-bottom: 1rem;
      border-bottom: 2px solid #e9ecef;
    }

    .student-info-header {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .student-icon {
      font-size: 2rem;
      width: 50px;
      height: 50px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #108092 0%, #0d6a7a 100%);
      border-radius: 12px;
    }

    .student-name {
      font-size: 1.375rem;
      font-weight: 700;
      color: #1a1a1a;
      margin: 0 0 0.25rem 0;
    }

    .year-badge {
      display: inline-block;
      background: linear-gradient(135deg, #108092 0%, #0d6a7a 100%);
      color: white;
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 600;
    }

    /* Subject Term Section */
    .subject-term-section {
      margin-bottom: 1.5rem;
      padding: 1.25rem;
      background: white;
      border-radius: 12px;
      border: 1px solid #e9ecef;
    }

    .subject-title {
      font-size: 1.125rem;
      font-weight: 600;
      color: #333;
      margin: 0 0 1rem 0;
    }

    /* Terms Grid - 2 columns */
    .terms-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.75rem;
    }

    /* Compact Term Card */
    .term-card-compact {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: white;
      border: 2px solid #e2e8f0;
      border-radius: 10px;
      padding: 0.75rem 1rem;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .term-card-compact:hover {
      border-color: #108092;
      background: #f8fffe;
    }

    .term-card-compact.selected {
      border-color: #108092;
      background: linear-gradient(135deg, #e6f7f9 0%, #fff 100%);
      box-shadow: 0 2px 8px rgba(16, 128, 146, 0.15);
    }

    .term-card-compact.current {
      border-color: #4caf50;
    }

    .term-card-compact.current.selected {
      border-color: #108092;
    }

    .term-card-content {
      flex: 1;
    }

    .term-main {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.25rem;
    }

    .term-name {
      font-weight: 600;
      color: #1a1a1a;
      font-size: 0.95rem;
    }

    .badge-current-mini {
      background: linear-gradient(135deg, #4caf50, #2e7d32);
      color: white;
      padding: 0.125rem 0.5rem;
      border-radius: 10px;
      font-size: 0.65rem;
      font-weight: 700;
      text-transform: uppercase;
    }

    .badge-next-mini {
      background: linear-gradient(135deg, #2196f3, #1565c0);
      color: white;
      padding: 0.125rem 0.5rem;
      border-radius: 10px;
      font-size: 0.65rem;
      font-weight: 700;
      text-transform: uppercase;
    }

    .term-card-compact.next {
      border-color: #2196f3;
    }

    .term-card-compact.next:hover {
      background: #e3f2fd;
    }

    .term-meta {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .term-dates-mini {
      color: #64748b;
      font-size: 0.8rem;
    }

    .check-icon {
      font-size: 1.25rem;
      color: #108092;
      font-weight: bold;
    }

    /* Global Subject Info */
    .global-subject-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem;
      background: #e8f5e9;
      border-radius: 8px;
      margin-bottom: 0.75rem;
    }

    .global-icon {
      font-size: 1.5rem;
    }

    .global-text {
      color: #2e7d32;
      font-weight: 500;
    }

    /* Navigation */
    .nav-buttons {
      display: flex;
      justify-content: space-between;
      gap: 1rem;
      margin-top: 2.5rem;
      padding-top: 1.5rem;
      border-top: 2px solid #f0f0f0;
    }

    .btn {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem 2rem;
      border: none;
      border-radius: 10px;
      font-weight: 600;
      font-size: 1.05rem;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .btn-icon {
      font-size: 1.25rem;
    }

    .btn-secondary {
      background: #f5f5f5;
      color: #666;
      border: 2px solid #e0e0e0;
    }

    .btn-secondary:hover {
      background: #e9ecef;
      transform: translateX(-4px);
    }

    .btn-primary {
      background: linear-gradient(135deg, #108092 0%, #0d6a7a 100%);
      color: white;
      box-shadow: 0 4px 12px rgba(16, 128, 146, 0.3);
    }

    .btn-primary:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(16, 128, 146, 0.4);
    }

    .btn-primary:disabled {
      background: #ccc;
      cursor: not-allowed;
      box-shadow: none;
      opacity: 0.6;
    }

    @media (max-width: 768px) {
      .step-container {
        padding: 1rem;
        margin: 0 0.5rem;
      }

      .header-section {
        margin-bottom: 1.5rem;
      }

      .step-title {
        font-size: 1.5rem;
      }

      .step-subtitle {
        font-size: 1rem;
      }

      .student-section {
        padding: 1rem;
        margin-bottom: 1.5rem;
      }

      .student-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
      }

      .student-info-header {
        width: 100%;
      }

      .student-name {
        font-size: 1.25rem;
      }

      .subject-term-section {
        padding: 1rem;
      }

      .subject-title {
        font-size: 1rem;
      }

      .terms-grid {
        grid-template-columns: 1fr;
        gap: 0.5rem;
      }

      .term-card-compact {
        padding: 0.75rem;
      }

      .term-name {
        font-size: 0.9rem;
      }

      .term-dates-mini {
        font-size: 0.75rem;
      }

      .nav-buttons {
        flex-direction: column;
        gap: 0.75rem;
        margin-top: 2rem;
      }

      .btn {
        justify-content: center;
        width: 100%;
        padding: 1rem 1.5rem;
      }

      .info-card {
        padding: 1rem;
        flex-direction: column;
        text-align: center;
      }
    }
  `]
})
export class Step2bTermSelectionComponent implements OnInit {
  loading = false;
  studentSubjectTerms: StudentSubjectTerms[] = [];
  hasSubjectsRequiringTerms = false;

  constructor(
    private stateService: TutoringStateService,
    private tutoringService: TutoringService,
    private contentService: ContentService
  ) { }

  ngOnInit(): void {
    this.loadTermsData();
  }

  loadTermsData(): void {
    this.loading = true;
    const state = this.stateService.getState();
    const students = state.students;

    // Build requests for each student's subjects
    const requests: { studentId: number; subjectId: number }[] = [];

    students.forEach(student => {
      const subjects = state.studentSubjects.get(student.id);
      if (subjects) {
        subjects.forEach(subjectId => {
          requests.push({ studentId: student.id, subjectId });
        });
      }
    });

    if (requests.length === 0) {
      this.loading = false;
      return;
    }

    console.log('📚 Loading terms for subjects:', requests);

    // Fetch term data for each subject
    const termRequests = requests.map(req =>
      this.tutoringService.getSubjectTerms(req.subjectId).pipe(
        map(response => {
          console.log(`✅ Terms for subject ${req.subjectId}:`, response);

          // ⚠️ DEBUG: Check if academicTermId is present in the response
          if (response.availableTerms && response.availableTerms.length > 0) {
            response.availableTerms.forEach((term, idx) => {
              console.log(`   Term ${idx + 1}: termId=${term.termId}, academicTermId=${term.academicTermId}, termName=${term.termName}`);
              if (!term.academicTermId) {
                console.error(`   ❌ BACKEND ISSUE: academicTermId is MISSING for term ${term.termId}!`);
                console.error(`      The create-order-v2 endpoint requires academicTermId, not termId.`);
                console.error(`      Please ensure the backend returns academicTermId in the terms response.`);
              }
            });
          }

          return { ...req, response };
        }),
        catchError((error) => {
          console.warn(`⚠️ Failed to load terms for subject ${req.subjectId}:`, error);
          // Default to requiring term selection when API fails
          // This ensures subjects aren't incorrectly marked as global
          return of({
            ...req,
            response: {
              subjectId: req.subjectId,
              subjectName: `Subject ${req.subjectId}`,
              isGlobal: false, // Changed: assume NOT global when API fails
              requiresTermSelection: true, // Changed: require term selection by default
              availableTerms: [] // Empty terms, user will see "No terms available"
            } as SubjectTermsResponse
          });
        })
      )
    );

    forkJoin(termRequests).subscribe({
      next: (results) => {
        console.log('📊 All term results:', results);
        this.processTermsData(students, results);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading terms data:', error);
        this.loading = false;
      }
    });
  }

  private processTermsData(
    students: StudentInfo[],
    results: { studentId: number; subjectId: number; response: SubjectTermsResponse }[]
  ): void {
    this.studentSubjectTerms = [];
    this.hasSubjectsRequiringTerms = false;

    students.forEach(student => {
      const studentResults = results.filter(r => r.studentId === student.id);

      const subjects: SubjectWithTerms[] = studentResults.map(r => {
        const existingTermId = this.stateService.getSubjectTerm(student.id, r.subjectId);

        if (r.response.requiresTermSelection) {
          this.hasSubjectsRequiringTerms = true;
        }

        return {
          subjectId: r.subjectId,
          subjectName: r.response.subjectName,
          isGlobal: r.response.isGlobal,
          requiresTermSelection: r.response.requiresTermSelection,
          availableTerms: r.response.availableTerms || [],
          selectedTermId: existingTermId,
          selectedAcademicTermId: existingTermId  // Will be updated when user selects a term
        };
      });

      this.studentSubjectTerms.push({ student, subjects });
    });

    // Update state flag
    this.stateService.setRequiresTermSelection(this.hasSubjectsRequiringTerms);
  }

  hasTermBasedSubjects(studentData: StudentSubjectTerms): boolean {
    return studentData.subjects.some(s => s.requiresTermSelection);
  }

  selectTerm(studentId: number, subjectId: number, termId: number, academicTermId?: number): void {
    // Update local state
    const studentData = this.studentSubjectTerms.find(s => s.student.id === studentId);
    if (studentData) {
      const subject = studentData.subjects.find(s => s.subjectId === subjectId);
      if (subject) {
        subject.selectedTermId = termId;
        subject.selectedAcademicTermId = academicTermId || null;
      }
    }

    // Log the term selection
    console.log(`📅 Saving term for subject ${subjectId}: termId=${termId}, academicTermId=${academicTermId}`);

    if (!academicTermId) {
      console.warn(`⚠️ WARNING: academicTermId is missing for subject ${subjectId}!`);
      console.warn(`   Backend API should return academicTermId in the terms response.`);
    }

    // Store BOTH termId and academicTermId in state
    this.stateService.setSubjectTermIds(studentId, subjectId, termId, academicTermId ?? null);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }

  formatDateShort(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short'
    });
  }

  /**
   * Format date with year (e.g., "Jan 1, 2025")
   */
  formatDateWithYear(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }

  /**
   * Get only current term and next term (2 options max)
   */
  getFilteredTerms(terms: AvailableTutoringTerm[]): AvailableTutoringTerm[] {
    if (!terms || terms.length === 0) return [];

    // Sort terms by start date
    const sortedTerms = [...terms].sort((a, b) =>
      new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );

    // Find current term
    const currentTerm = sortedTerms.find(t => t.isCurrent);

    // Find next term (first non-past term after current, or first future term)
    const today = new Date();
    const futureTerms = sortedTerms.filter(t => !t.isPast && !t.isCurrent);
    const nextTerm = futureTerms.length > 0 ? futureTerms[0] : null;

    // Return current and next (max 2 options)
    const result: AvailableTutoringTerm[] = [];
    if (currentTerm) result.push(currentTerm);
    if (nextTerm) result.push(nextTerm);

    // If no current term, just show the first 2 future terms
    if (result.length === 0 && futureTerms.length > 0) {
      return futureTerms.slice(0, 2);
    }

    return result;
  }

  /**
   * Check if a term is the "next" term (first future term after current)
   */
  isNextTerm(term: AvailableTutoringTerm, allTerms: AvailableTutoringTerm[]): boolean {
    if (term.isCurrent || term.isPast) return false;

    const futureTerms = allTerms
      .filter(t => !t.isPast && !t.isCurrent)
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

    return futureTerms.length > 0 && futureTerms[0].termId === term.termId;
  }

  canProceed(): boolean {
    // If no subjects require term selection, can always proceed
    if (!this.hasSubjectsRequiringTerms) {
      return true;
    }

    // Check all term-based subjects have a term selected
    return this.studentSubjectTerms.every(studentData =>
      studentData.subjects.every(subject =>
        !subject.requiresTermSelection || subject.selectedTermId !== null
      )
    );
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
