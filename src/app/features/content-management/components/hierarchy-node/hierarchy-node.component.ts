import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Year, Subject, Term, Week, Lesson } from '../../../../core/services/content.service';

export type EntityType = 'year' | 'category' | 'subjectName' | 'subject' | 'term' | 'week' | 'lesson';

@Component({
  selector: 'app-hierarchy-node',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './hierarchy-node.component.html',
  styleUrls: ['./hierarchy-node.component.scss']
})
export class HierarchyNodeComponent implements OnChanges {
  @Input() year!: Year;
  @Input() subjects: Subject[] = [];
  @Input() terms: Term[] = [];
  @Input() weeks: Week[] = [];
  @Input() lessons: Lesson[] = [];
  @Input() expandState: 'expanded' | 'collapsed' | 'default' = 'default';
  @Input() expandedSubjects: Set<number> = new Set();
  @Input() expandedTerms: Set<number> = new Set();
  @Input() expandedWeeks: Set<number> = new Set();
  @Input() isTeacherView: boolean = false;

  @Output() add = new EventEmitter<{ type: EntityType; entity: any }>();
  @Output() edit = new EventEmitter<{ type: EntityType; entity: any }>();
  @Output() delete = new EventEmitter<{ type: EntityType; entity: any }>();
  @Output() lessonClick = new EventEmitter<Lesson>();
  @Output() preview = new EventEmitter<Lesson>();
  @Output() expandStateChange = new EventEmitter<{ type: 'subject' | 'term' | 'week'; id: number; expanded: boolean }>();

  ngOnChanges(): void {
    // expandState is only used for 'expanded' and 'collapsed' commands from parent
    // The actual state is now managed by the parent through expandedSubjects/Terms/Weeks inputs
    if (this.expandState === 'expanded') {
      // Parent is requesting to expand all
      this.subjects.forEach(s => {
        if (s.id && !this.expandedSubjects.has(s.id)) {
          this.expandStateChange.emit({ type: 'subject', id: s.id, expanded: true });
        }
      });
      this.terms.forEach(t => {
        if (t.id && !this.expandedTerms.has(t.id)) {
          this.expandStateChange.emit({ type: 'term', id: t.id, expanded: true });
        }
      });
      this.weeks.forEach(w => {
        if (w.id && !this.expandedWeeks.has(w.id)) {
          this.expandStateChange.emit({ type: 'week', id: w.id, expanded: true });
        }
      });
    } else if (this.expandState === 'collapsed') {
      // Parent is requesting to collapse all
      Array.from(this.expandedSubjects).forEach(id => {
        this.expandStateChange.emit({ type: 'subject', id, expanded: false });
      });
      Array.from(this.expandedTerms).forEach(id => {
        this.expandStateChange.emit({ type: 'term', id, expanded: false });
      });
      Array.from(this.expandedWeeks).forEach(id => {
        this.expandStateChange.emit({ type: 'week', id, expanded: false });
      });
    }
  }

  getSubjectsForYear(): Subject[] {
    return this.subjects.filter(s => s.yearId === this.year.id);
  }

  getTermsForSubject(subjectId: number): Term[] {
    return this.terms.filter(t => t.subjectId === subjectId);
  }

  getWeeksForTerm(termId: number): Week[] {
    return this.weeks.filter(w => w.termId === termId);
  }

  getLessonsForWeek(weekId: number): Lesson[] {
    return this.lessons.filter(l => l.weekId === weekId);
  }

  /**
   * ✅ NEW: Get lessons directly linked to a subject (for global courses)
   * Global lessons have subjectId set and weekId = null
   */
  getLessonsForSubject(subjectId: number): Lesson[] {
    return this.lessons.filter(l => l.subjectId === subjectId && !l.weekId);
  }

  toggleSubject(subjectId: number): void {
    const isExpanded = this.expandedSubjects.has(subjectId);
    this.expandStateChange.emit({ type: 'subject', id: subjectId, expanded: !isExpanded });
  }

  toggleTerm(termId: number): void {
    const isExpanded = this.expandedTerms.has(termId);
    this.expandStateChange.emit({ type: 'term', id: termId, expanded: !isExpanded });
  }

  toggleWeek(weekId: number): void {
    const isExpanded = this.expandedWeeks.has(weekId);
    this.expandStateChange.emit({ type: 'week', id: weekId, expanded: !isExpanded });
  }

  isSubjectExpanded(subjectId: number): boolean {
    return this.expandedSubjects.has(subjectId);
  }

  isTermExpanded(termId: number): boolean {
    return this.expandedTerms.has(termId);
  }

  isWeekExpanded(weekId: number): boolean {
    return this.expandedWeeks.has(weekId);
  }

  onAdd(type: EntityType, entity: any): void {
    this.add.emit({ type, entity });
  }

  onEdit(type: EntityType, entity: any): void {
    this.edit.emit({ type, entity });
  }

  onDelete(type: EntityType, entity: any): void {
    this.delete.emit({ type, entity });
  }

  onLessonClick(lesson: Lesson): void {
    this.lessonClick.emit(lesson);
  }

  onPreviewLesson(lesson: Lesson): void {
    this.preview.emit(lesson);
  }

  /**
   * Get year display label - Returns "Courses" for yearNumber 0, otherwise "Year {number}"
   */
  getYearDisplayLabel(): string {
    if (this.year.yearNumber === 0) {
      return 'Courses';
    }
    return `Year ${this.year.yearNumber}`;
  }
}
