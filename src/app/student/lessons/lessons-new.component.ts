import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { LessonsService } from '../../core/services/lessons.service';
import { SubjectsService } from '../../core/services/subjects.service';
import { StudentLesson, LessonFilter } from '../../models/lesson.models';
import { Subject } from '../../models/course.models';

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
  subjects = signal<Subject[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  // Current subject and lesson info
  currentSubject = signal<Subject | null>(null);
  currentSubjectId = signal<number | null>(null);

  // Filter options
  filters = signal<LessonFilter>({});
  difficulties = ['Easy', 'Medium', 'Hard'];

  // Search and filter
  searchTerm = signal('');
  selectedDifficulty = signal('');
  selectedCompletion = signal('');
  sortBy = signal('order');

  // Pagination
  currentPage = signal(1);
  itemsPerPage = 12;

  // Helper arrays for templates
  skeletonItems = Array(12).fill(0);

  constructor(
    private lessonsService: LessonsService,
    private subjectsService: SubjectsService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.loadSubjects();

    // Check for query parameters
    this.route.queryParams.subscribe(params => {
      if (params['subjectId']) {
        this.currentSubjectId.set(parseInt(params['subjectId']));
        this.loadLessonsForSubject(parseInt(params['subjectId']));
      } else {
        this.loadAllLessons();
      }
    });
  }

  private loadSubjects(): void {
    this.subjectsService.getEnrolledSubjects(1).subscribe({
      next: (subjects) => {
        this.subjects.set(subjects);

        // Set current subject if subjectId is provided
        const subjectId = this.currentSubjectId();
        if (subjectId) {
          const subject = subjects.find(s => s.id === subjectId);
          this.currentSubject.set(subject || null);
        }
      },
      error: (error) => {
        console.error('Error loading subjects:', error);
      }
    });
  }

  private loadAllLessons(): void {
    this.loading.set(true);
    this.error.set(null);

    this.lessonsService.getStudentLessons(1).subscribe({
      next: (lessons) => {
        this.studentLessons.set(lessons);
        this.applyFilters();
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading lessons:', error);
        this.error.set('حدث خطأ في تحميل الدروس');
        this.loading.set(false);
      }
    });
  }

  private loadLessonsForSubject(subjectId: number): void {
    this.loading.set(true);
    this.error.set(null);

    this.lessonsService.getLessonsBySubject(subjectId).subscribe({
      next: (lessons) => {
        this.studentLessons.set(lessons);
        this.applyFilters();
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading lessons for subject:', error);
        this.error.set('حدث خطأ في تحميل دروس المادة');
        this.loading.set(false);
      }
    });
  }

  switchSubject(subjectId: number): void {
    this.router.navigate(['/student/lessons'], { queryParams: { subjectId } });
  }

  viewAllLessons(): void {
    this.router.navigate(['/student/lessons']);
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

  startLesson(studentLesson: StudentLesson): void {
    this.router.navigate(['/student/lessons', studentLesson.lesson.id]);
  }

  continueFromLastLesson(): void {
    const subject = this.currentSubject();
    if (subject && subject.lastLessonId) {
      this.router.navigate(['/student/lessons', subject.lastLessonId]);
    }
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
      return `${minutes}د`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}س ${remainingMinutes}د` : `${hours}س`;
  }

  getPaginationPages(): number[] {
    return Array(this.totalPages).fill(0).map((_, i) => i + 1);
  }
}
