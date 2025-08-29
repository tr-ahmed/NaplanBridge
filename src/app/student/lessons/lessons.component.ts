import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { LessonsService } from '../../core/services/lessons.service';
import { StudentLesson, LessonFilter } from '../../models/lesson.models';

@Component({
  selector: 'app-lessons',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './lessons.component.html',
  styleUrls: ['./lessons.component.scss']
})
export class LessonsComponent implements OnInit {
  studentLessons = signal<StudentLesson[]>([]);
  filteredLessons = signal<StudentLesson[]>([]);
  loading = signal(false);

  // Filter options
  filters = signal<LessonFilter>({});
  subjects = ['Mathematics', 'English', 'Science', 'HASS'];
  difficulties = ['Easy', 'Medium', 'Hard'];

  // Search and filter
  searchTerm = signal('');
  selectedSubject = signal('');
  selectedDifficulty = signal('');
  selectedCompletion = signal('');
  sortBy = signal('order');

  // Pagination
  currentPage = signal(1);
  itemsPerPage = 12;

  // Rating modal
  showRatingModal = signal(false);
  selectedLessonForRating = signal<StudentLesson | null>(null);
  newRating = signal(0);
  newComment = signal('');

  // Helper arrays for templates
  skeletonItems = Array(12).fill(0);

  constructor(
    private lessonsService: LessonsService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadLessons();
  }

  private loadLessons(): void {
    this.loading.set(true);

    this.lessonsService.getStudentLessons(1).subscribe({
      next: (lessons) => {
        this.studentLessons.set(lessons);
        this.applyFilters();
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading lessons:', error);
        this.loading.set(false);
      }
    });
  }

  applyFilters(): void {
    let filtered = [...this.studentLessons()];

    // Apply search
    if (this.searchTerm()) {
      const term = this.searchTerm().toLowerCase();
      filtered = filtered.filter(sl =>
        sl.lesson.title.toLowerCase().includes(term) ||
        sl.lesson.description.toLowerCase().includes(term) ||
        sl.lesson.courseName.toLowerCase().includes(term)
      );
    }

    // Apply subject filter
    if (this.selectedSubject()) {
      filtered = filtered.filter(sl => sl.lesson.subject === this.selectedSubject());
    }

    // Apply difficulty filter
    if (this.selectedDifficulty()) {
      filtered = filtered.filter(sl => sl.lesson.difficulty === this.selectedDifficulty());
    }

    // Apply completion filter
    if (this.selectedCompletion()) {
      const isCompleted = this.selectedCompletion() === 'completed';
      filtered = filtered.filter(sl => sl.lesson.isCompleted === isCompleted);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (this.sortBy()) {
        case 'title':
          return a.lesson.title.localeCompare(b.lesson.title);
        case 'rating':
          return b.lesson.rating - a.lesson.rating;
        case 'duration':
          return a.lesson.duration - b.lesson.duration;
        case 'progress':
          return b.progress.progress - a.progress.progress;
        default: // order
          return a.lesson.order - b.lesson.order;
      }
    });

    this.filteredLessons.set(filtered);
    this.currentPage.set(1); // Reset to first page when filters change
  }

  onSearchChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchTerm.set(target.value);
    this.applyFilters();
  }

  onSubjectChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.selectedSubject.set(target.value);
    this.applyFilters();
  }

  onDifficultyChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.selectedDifficulty.set(target.value);
    this.applyFilters();
  }

  onCompletionChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.selectedCompletion.set(target.value);
    this.applyFilters();
  }

  onSortChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.sortBy.set(target.value);
    this.applyFilters();
  }

  clearFilters(): void {
    this.searchTerm.set('');
    this.selectedSubject.set('');
    this.selectedDifficulty.set('');
    this.selectedCompletion.set('');
    this.sortBy.set('order');
    this.applyFilters();
  }

  get paginatedLessons(): StudentLesson[] {
    const start = (this.currentPage() - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.filteredLessons().slice(start, end);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredLessons().length / this.itemsPerPage);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage.set(page);
    }
  }

  openRatingModal(studentLesson: StudentLesson): void {
    this.selectedLessonForRating.set(studentLesson);
    this.newRating.set(0);
    this.newComment.set('');
    this.showRatingModal.set(true);
  }

  closeRatingModal(): void {
    this.showRatingModal.set(false);
    this.selectedLessonForRating.set(null);
  }

  setRating(rating: number): void {
    this.newRating.set(rating);
  }

  submitRating(): void {
    const lesson = this.selectedLessonForRating();
    if (lesson && this.newRating() > 0) {
      this.lessonsService.rateLesson(
        lesson.lesson.id,
        this.newRating(),
        this.newComment()
      ).subscribe({
        next: () => {
          // Update the lesson rating locally
          lesson.lesson.rating = this.newRating();
          this.closeRatingModal();
        },
        error: (error) => {
          console.error('Error submitting rating:', error);
        }
      });
    }
  }

  startLesson(studentLesson: StudentLesson): void {
    this.router.navigate(['/student/lessons', studentLesson.lesson.id]);
  }

  getProgressColor(progress: number): string {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 60) return 'bg-blue-500';
    if (progress >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  }

  getDifficultyColor(difficulty: string): string {
    switch (difficulty) {
      case 'Easy': return 'bg-green-100 text-green-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  formatDuration(minutes: number): string {
    if (minutes < 60) {
      return `${minutes}min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours}h`;
  }

  renderStars(rating: number): string {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    let stars = '★'.repeat(fullStars);
    if (hasHalfStar) stars += '☆';
    const emptyStars = 5 - Math.ceil(rating);
    stars += '☆'.repeat(emptyStars);
    return stars;
  }

  getRatingStars(rating: number): boolean[] {
    return Array(5).fill(false).map((_, index) => index < rating);
  }

  getPaginationPages(): number[] {
    return Array(this.totalPages).fill(0).map((_, i) => i + 1);
  }
}
