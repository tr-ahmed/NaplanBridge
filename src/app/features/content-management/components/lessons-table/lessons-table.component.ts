import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Lesson, Week, Subject } from '../../../../core/services/content.service';

@Component({
  selector: 'app-lessons-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './lessons-table.component.html',
  styleUrls: ['./lessons-table.component.scss']
})
export class LessonsTableComponent {
  @Input() lessons: Lesson[] = [];
  @Input() weeks: Week[] = [];
  @Input() subjects: Subject[] = [];
  @Input() totalPages: number = 1;
  @Input() currentPage: number = 1;
  @Input() totalItems: number = 0;

  @Output() pageChange = new EventEmitter<number>();
  @Output() add = new EventEmitter<void>();
  @Output() edit = new EventEmitter<Lesson>();
  @Output() delete = new EventEmitter<Lesson>();
  @Output() manageResources = new EventEmitter<Lesson>();
  @Output() preview = new EventEmitter<Lesson>();
  @Output() approve = new EventEmitter<Lesson>();
  @Output() reject = new EventEmitter<Lesson>();

  getWeekName(weekId?: number): string {
    if (!weekId) return 'N/A';
    const week = this.weeks.find(w => w.id === weekId);
    return week ? `Week ${week.weekNumber}` : 'N/A';
  }

  getSubjectName(subjectId?: number): string {
    if (!subjectId) return 'N/A';
    const subject = this.subjects.find(s => s.id === subjectId);
    return subject ? subject.subjectName || 'N/A' : 'N/A';
  }

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.pageChange.emit(page);
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    for (let i = 1; i <= this.totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }

  getStatusBadgeClass(status?: string): string {
    const statusClasses: Record<string, string> = {
      'CREATED': 'badge bg-secondary',
      'SUBMITTED': 'badge bg-info',
      'PENDING': 'badge bg-warning',
      'APPROVED': 'badge bg-success',
      'PUBLISHED': 'badge bg-primary',
      'REJECTED': 'badge bg-danger',
      'REVISION_REQUESTED': 'badge bg-warning'
    };
    return statusClasses[status || ''] || 'badge bg-secondary';
  }

  getStatusText(status?: string): string {
    return status || 'CREATED';
  }

  canApprove(lesson: Lesson): boolean {
    return lesson.status === 'PENDING' || lesson.status === 'SUBMITTED';
  }

  canReject(lesson: Lesson): boolean {
    return lesson.status === 'PENDING' || lesson.status === 'SUBMITTED';
  }
}
