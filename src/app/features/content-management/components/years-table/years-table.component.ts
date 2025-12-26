import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Year } from '../../../../core/services/content.service';

@Component({
  selector: 'app-years-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './years-table.component.html',
  styleUrls: ['./years-table.component.scss']
})
export class YearsTableComponent {
  @Input() years: Year[] = [];
  @Input() totalPages: number = 1;
  @Input() currentPage: number = 1;
  @Input() totalItems: number = 0;

  @Output() pageChange = new EventEmitter<number>();
  @Output() add = new EventEmitter<void>();
  @Output() edit = new EventEmitter<Year>();
  @Output() delete = new EventEmitter<Year>();

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.pageChange.emit(page);
    }
  }

  onAdd(): void {
    this.add.emit();
  }

  onEdit(year: Year): void {
    this.edit.emit(year);
  }

  onDelete(year: Year): void {
    this.delete.emit(year);
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    for (let i = 1; i <= this.totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }

  /**
   * Get year display label - Returns "Courses" for yearNumber 0, otherwise "Year {number}"
   */
  getYearDisplayLabel(year: Year): string {
    if (year.yearNumber === 0) {
      return 'Courses';
    }
    return `Year ${year.yearNumber}`;
  }
}
