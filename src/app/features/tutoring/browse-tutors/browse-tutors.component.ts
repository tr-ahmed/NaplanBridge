/**
 * Browse Available Tutors Component
 * For parents to view available tutors for booking
 */

import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TutoringService } from '../../../core/services/tutoring.service';
import { ToastService } from '../../../core/services/toast.service';
import { AvailableTutorDto } from '../../../models/tutoring.models';

@Component({
  selector: 'app-browse-tutors',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './browse-tutors.component.html',
  styleUrl: './browse-tutors.component.scss'
})
export class BrowseTutorsComponent implements OnInit {
  private tutoringService = inject(TutoringService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  tutors = signal<AvailableTutorDto[]>([]);
  loading = signal<boolean>(true);
  searchQuery = signal<string>('');

  ngOnInit(): void {
    this.loadTutors();
  }

  /**
   * Load available tutors
   */
  private loadTutors(): void {
    this.loading.set(true);

    this.tutoringService.getAvailableTutors().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.tutors.set(response.data);
        }
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading tutors:', error);
        this.toastService.showError('Failed to load tutors');
        this.loading.set(false);
      }
    });
  }

  /**
   * Navigate to book tutoring with tutor
   */
  bookWithTutor(tutor: AvailableTutorDto): void {
    this.router.navigate(['/tutoring/book', tutor.teacherId]);
  }

  /**
   * Filter tutors by search query
   */
  get filteredTutors(): AvailableTutorDto[] {
    const query = this.searchQuery().toLowerCase();
    if (!query) return this.tutors();

    return this.tutors().filter(tutor =>
      tutor.teacherName.toLowerCase().includes(query) ||
      tutor.subjects.some(subject => subject.toLowerCase().includes(query))
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
