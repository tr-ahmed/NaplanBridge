import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, Year, Category, Teacher } from '../../../../core/services/content.service';

@Component({
  selector: 'app-subjects-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './subjects-table.component.html',
  styleUrls: ['./subjects-table.component.scss']
})
export class SubjectsTableComponent {
  @Input() subjects: Subject[] = [];
  @Input() years: Year[] = [];
  @Input() categories: Category[] = [];
  @Input() teachers: Teacher[] = [];
  @Input() totalPages: number = 1;
  @Input() currentPage: number = 1;
  @Input() totalItems: number = 0;

  @Output() pageChange = new EventEmitter<number>();
  @Output() add = new EventEmitter<void>();
  @Output() edit = new EventEmitter<Subject>();
  @Output() delete = new EventEmitter<Subject>();

  getYearName(yearId: number): string {
    const year = this.years.find(y => y.id === yearId);
    return year ? `Year ${year.yearNumber}` : 'N/A';
  }

  getCategoryName(categoryId: number): string {
    const category = this.categories.find(c => c.id === categoryId);
    return category ? category.name : 'N/A';
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
}
