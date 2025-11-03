import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Category } from '../../../../core/services/content.service';

@Component({
  selector: 'app-categories-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './categories-table.component.html',
  styleUrls: ['./categories-table.component.scss']
})
export class CategoriesTableComponent {
  @Input() categories: Category[] = [];
  @Input() totalPages: number = 1;
  @Input() currentPage: number = 1;
  @Input() totalItems: number = 0;

  @Output() pageChange = new EventEmitter<number>();
  @Output() add = new EventEmitter<void>();
  @Output() edit = new EventEmitter<Category>();
  @Output() delete = new EventEmitter<Category>();

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.pageChange.emit(page);
    }
  }

  onAdd(): void {
    this.add.emit();
  }

  onEdit(category: Category): void {
    this.edit.emit(category);
  }

  onDelete(category: Category): void {
    this.delete.emit(category);
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    for (let i = 1; i <= this.totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }
}
