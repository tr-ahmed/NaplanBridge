/**
 * Browse Available Teachers Component
 * For parents to view available teachers for booking
 */

import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SessionService } from '../../../core/services/session.service';
import { ToastService } from '../../../core/services/toast.service';
import { AvailableTeacherDto } from '../../../models/session.models';

@Component({
  selector: 'app-browse-teachers',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './browse-teachers.component.html',
  styleUrl: './browse-teachers.component.scss'
})
export class BrowseTeachersComponent implements OnInit {
  private sessionService = inject(SessionService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  teachers = signal<AvailableTeacherDto[]>([]);
  loading = signal<boolean>(true);
  searchQuery = signal<string>('');

  ngOnInit(): void {
    this.loadTeachers();
  }

  /**
   * Load available teachers
   */
  private loadTeachers(): void {
    this.loading.set(true);

    this.sessionService.getAvailableTeachers().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.teachers.set(response.data);
        }
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading teachers:', error);
        this.toastService.showError('Failed to load teachers');
        this.loading.set(false);
      }
    });
  }

  /**
   * Navigate to book session with teacher
   */
  bookWithTeacher(teacher: AvailableTeacherDto): void {
    this.router.navigate(['/sessions/book', teacher.teacherId]);
  }

  /**
   * Filter teachers by search query
   */
  get filteredTeachers(): AvailableTeacherDto[] {
    const query = this.searchQuery().toLowerCase();
    if (!query) return this.teachers();

    return this.teachers().filter(teacher =>
      teacher.teacherName.toLowerCase().includes(query) ||
      teacher.subjects.some(subject => subject.toLowerCase().includes(query))
    );
  }

  /**
   * Update search query
   */
  onSearchChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
  }
}
