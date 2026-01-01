import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TutoringStateService } from '../../../core/services/tutoring-state.service';
import { ContentService, Subject } from '../../../core/services/content.service';
import { StudentInfo, TeachingType } from '../../../models/tutoring.models';

@Component({
  selector: 'app-step3-teaching-type',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './step3-subjects.component.html',
  styleUrls: ['./step3-subjects.component.scss']
})
export class Step3TeachingTypeComponent implements OnInit {
  TeachingType = TeachingType;

  students: StudentInfo[] = [];
  subjects: Subject[] = [];
  subjectsByYear = new Map<number, Subject[]>();
  subjectTeachingTypes = new Map<string, TeachingType>();

  constructor(
    private stateService: TutoringStateService,
    private contentService: ContentService
  ) { }

  ngOnInit(): void {
    this.restoreState();
    this.loadSubjects();
  }

  restoreState(): void {
    const state = this.stateService.getState();
    this.students = state.students;
    this.subjectTeachingTypes = new Map(state.subjectTeachingTypes);
  }

  loadSubjects(): void {
    const uniqueYears = [...new Set(this.students.map(s => s.academicYearId))];

    uniqueYears.forEach(yearId => {
      this.contentService.getSubjectsByYear(yearId).subscribe({
        next: (subjects) => {
          const subjectsArray = Array.isArray(subjects) ? subjects : [];
          this.subjectsByYear.set(yearId, subjectsArray);
          this.subjects.push(...subjectsArray);
        },
        error: (error) => {
          console.error(`Error loading subjects for year ${yearId}:`, error);
          this.subjectsByYear.set(yearId, []);
        }
      });
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

  selectType(studentId: number, subjectId: number, type: TeachingType): void {
    this.stateService.setSubjectTeachingType(studentId, subjectId, type);
    const key = `${studentId}_${subjectId}`;
    this.subjectTeachingTypes.set(key, type);
  }

  getSelectedType(studentId: number, subjectId: number): TeachingType | null {
    const key = `${studentId}_${subjectId}`;
    return this.subjectTeachingTypes.get(key) || null;
  }

  canProceed(): boolean {
    return this.students.every(student => {
      const subjects = this.getStudentSubjects(student.id);
      return subjects.every(subjectId => {
        return this.getSelectedType(student.id, subjectId) !== null;
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
