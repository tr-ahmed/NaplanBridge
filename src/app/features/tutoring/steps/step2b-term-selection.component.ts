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
  selectedTermId: number | null;
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
        <h2 class="step-title">Select Academic Term</h2>
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
                    @for (term of subject.availableTerms; track term.termId) {
                      <div 
                        class="term-card"
                        [class.selected]="subject.selectedTermId === term.termId"
                        [class.current]="term.isCurrent"
                        (click)="selectTerm(studentData.student.id, subject.subjectId, term.termId)">
                        
                        <!-- Current Badge -->
                        @if (term.isCurrent) {
                          <span class="badge badge-current">Current</span>
                        }
                        
                        <!-- Term Header -->
                        <div class="term-header">
                          <h5>{{ term.termName }}</h5>
                          <p class="term-number">Term {{ term.termNumber }}</p>
                        </div>
                        
                        <!-- Term Dates -->
                        <div class="term-dates">
                          <span class="date-icon">📆</span>
                          <span>{{ formatDate(term.startDate) }} - {{ formatDate(term.endDate) }}</span>
                        </div>
                        
                        <!-- Term Status -->
                        @if (term.isCurrent) {
                          <div class="term-status current">
                            <span class="status-icon">⏰</span>
                            <span>{{ term.daysRemaining }} days remaining</span>
                            @if (term.weeksRemaining > 0) {
                              <span class="weeks">({{ term.weeksRemaining }} weeks)</span>
                            }
                          </div>
                        } @else {
                          <div class="term-status future">
                            <span class="status-icon">📅</span>
                            <span>Starts {{ formatDate(term.startDate) }}</span>
                          </div>
                        }
                        
                        <!-- Available Slots -->
                        <div class="slots-info">
                          <span class="slots-icon">🎯</span>
                          <span>{{ term.availableSlots }} slots available</span>
                        </div>
                        
                        <!-- Selection Indicator -->
                        @if (subject.selectedTermId === term.termId) {
                          <div class="selected-indicator">✓</div>
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

    /* Terms Grid */
    .terms-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1rem;
    }

    .term-card {
      background: white;
      border: 2px solid #e0e0e0;
      border-radius: 12px;
      padding: 1.25rem;
      cursor: pointer;
      transition: all 0.3s ease;
      position: relative;
    }

    .term-card:hover {
      border-color: #108092;
      box-shadow: 0 4px 12px rgba(16, 128, 146, 0.1);
    }

    .term-card.current {
      border-color: #4caf50;
    }

    .term-card.selected {
      border-color: #108092;
      background: linear-gradient(135deg, #f0f9fa 0%, #fff 100%);
      box-shadow: 0 4px 16px rgba(16, 128, 146, 0.2);
    }

    .badge-current {
      position: absolute;
      top: -10px;
      right: 10px;
      background: linear-gradient(135deg, #4caf50, #2e7d32);
      color: white;
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 700;
      box-shadow: 0 2px 6px rgba(76, 175, 80, 0.4);
    }

    .term-header h5 {
      font-size: 1.25rem;
      font-weight: 600;
      margin: 0 0 0.25rem 0;
      color: #212529;
    }

    .term-number {
      color: #6c757d;
      font-size: 0.875rem;
      margin: 0;
    }

    .term-dates {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin: 1rem 0;
      color: #6c757d;
      font-size: 0.875rem;
    }

    .term-status {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin: 0.75rem 0;
      padding: 0.5rem 0.75rem;
      border-radius: 8px;
      font-size: 0.875rem;
    }

    .term-status.current {
      background: #fff3cd;
      color: #856404;
    }

    .term-status.future {
      background: #e7f3ff;
      color: #004085;
    }

    .weeks {
      color: #6c757d;
      font-size: 0.8rem;
    }

    .slots-info {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-top: 0.75rem;
      color: #108092;
      font-weight: 600;
      font-size: 0.9rem;
    }

    .selected-indicator {
      position: absolute;
      top: 50%;
      right: 16px;
      transform: translateY(-50%);
      font-size: 28px;
      color: #108092;
      animation: checkmark 0.3s ease;
    }

    @keyframes checkmark {
      0% { transform: translateY(-50%) scale(0); }
      50% { transform: translateY(-50%) scale(1.2); }
      100% { transform: translateY(-50%) scale(1); }
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

    /* Responsive */
    @media (max-width: 768px) {
      .step-container {
        padding: 1.5rem;
      }

      .terms-grid {
        grid-template-columns: 1fr;
      }

      .nav-buttons {
        flex-direction: column;
      }

      .btn {
        justify-content: center;
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
          selectedTermId: existingTermId
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

  selectTerm(studentId: number, subjectId: number, termId: number): void {
    // Update local state
    const studentData = this.studentSubjectTerms.find(s => s.student.id === studentId);
    if (studentData) {
      const subject = studentData.subjects.find(s => s.subjectId === subjectId);
      if (subject) {
        subject.selectedTermId = termId;
      }
    }

    // Persist to state service
    this.stateService.setSubjectTerm(studentId, subjectId, termId);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
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
