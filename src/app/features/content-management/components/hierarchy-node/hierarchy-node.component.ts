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

  @Output() add = new EventEmitter<{ type: EntityType; entity: any }>();
  @Output() edit = new EventEmitter<{ type: EntityType; entity: any }>();
  @Output() delete = new EventEmitter<{ type: EntityType; entity: any }>();
  @Output() lessonClick = new EventEmitter<Lesson>();
  @Output() preview = new EventEmitter<Lesson>();

  expandedSubjects: Set<number> = new Set();
  expandedTerms: Set<number> = new Set();
  expandedWeeks: Set<number> = new Set();

  ngOnChanges(): void {
    if (this.expandState === 'expanded') {
      // Expand all
      this.subjects.forEach(s => this.expandedSubjects.add(s.id!));
      this.terms.forEach(t => this.expandedTerms.add(t.id!));
      this.weeks.forEach(w => this.expandedWeeks.add(w.id!));
    } else if (this.expandState === 'collapsed') {
      // Collapse all
      this.expandedSubjects.clear();
      this.expandedTerms.clear();
      this.expandedWeeks.clear();
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

  toggleSubject(subjectId: number): void {
    if (this.expandedSubjects.has(subjectId)) {
      this.expandedSubjects.delete(subjectId);
    } else {
      this.expandedSubjects.add(subjectId);
    }
  }

  toggleTerm(termId: number): void {
    if (this.expandedTerms.has(termId)) {
      this.expandedTerms.delete(termId);
    } else {
      this.expandedTerms.add(termId);
    }
  }

  toggleWeek(weekId: number): void {
    if (this.expandedWeeks.has(weekId)) {
      this.expandedWeeks.delete(weekId);
    } else {
      this.expandedWeeks.add(weekId);
    }
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
}
