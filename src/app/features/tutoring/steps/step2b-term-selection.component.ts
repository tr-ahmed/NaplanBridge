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
  templateUrl: './step2b-term-selection.component.html',
  styleUrls: ['./step2b-term-selection.component.scss']
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
