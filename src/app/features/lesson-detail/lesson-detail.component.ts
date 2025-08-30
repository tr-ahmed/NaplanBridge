import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { Lesson, LessonResource, StudentLesson, LessonProgress } from '../../models/lesson.models';
import { LessonsService } from '../../core/services/lessons.service';
import { AuthService } from '../../core/services/auth.service';

interface Quiz {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
  timeLimit?: number; // in minutes
}

interface VideoChapter {
  id: number;
  title: string;
  startTime: number; // in seconds
  endTime: number; // in seconds
  description?: string;
}

interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
  points: number;
}

interface QuizMaker {
  id: number;
  lessonId: number;
  title: string;
  description: string;
  timeLimit: number; // in minutes
  questions: QuizQuestion[];
  passingScore: number;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

interface LessonNote {
  id: number;
  content: string;
  timestamp: number; // video timestamp in seconds
  createdAt: Date;
}

interface TeacherQuestion {
  id: number;
  question: string;
  answer?: string;
  isAnswered: boolean;
  askedAt: Date;
  answeredAt?: Date;
}

@Component({
  selector: 'app-lesson-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './lesson-detail.component.html',
  styleUrls: ['./lesson-detail.component.scss']
})
export class LessonDetailComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // State signals
  lesson = signal<Lesson | null>(null);
  studentLesson = signal<StudentLesson | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);

  // Lesson navigation
  nextLesson = signal<Lesson | null>(null);
  previousLesson = signal<Lesson | null>(null);

  // Video player state
  videoCurrentTime = signal(0);
  videoDuration = signal(0);
  isVideoPlaying = signal(false);
  videoProgress = signal(0);

  // Video chapters
  videoChapters = signal<VideoChapter[]>([]);
  currentChapter = signal<VideoChapter | null>(null);
  isEditingChapters = signal(false);
  chapterForm: FormGroup;

  // Quiz state
  quizzes = signal<Quiz[]>([]);
  currentQuizIndex = signal(0);
  quizAnswers = signal<number[]>([]);
  showQuizResults = signal(false);
  quizScore = signal(0);

  // Quiz Maker state
  quizMakers = signal<QuizMaker[]>([]);
  isCreatingQuiz = signal(false);
  isEditingQuiz = signal(false);
  currentQuizMaker = signal<QuizMaker | null>(null);
  quizMakerForm: FormGroup;
  quizQuestionForm: FormGroup;

  // Notes state
  notes = signal<LessonNote[]>([]);
  noteForm: FormGroup;
  isAddingNote = signal(false);

  // Teacher interaction state
  teacherQuestions = signal<TeacherQuestion[]>([]);
  questionForm: FormGroup;
  isAskingQuestion = signal(false);

  // Active tab
  activeTab = signal<'video' | 'resources' | 'quiz' | 'notes' | 'teacher' | 'chapters' | 'quiz-maker'>('video');

  // Computed values
  currentQuiz = computed(() => {
    const quizzes = this.quizzes();
    const index = this.currentQuizIndex();
    return quizzes[index] || null;
  });

  hasQuizzes = computed(() => this.quizzes().length > 0);
  quizProgress = computed(() => {
    const total = this.quizzes().length;
    const current = this.currentQuizIndex() + 1;
    return total > 0 ? (current / total) * 100 : 0;
  });

  // Additional computed properties
  hasNextLesson = computed(() => this.nextLesson() !== null);
  hasPreviousLesson = computed(() => this.previousLesson() !== null);
  hasChapters = computed(() => this.videoChapters().length > 0);
  canEditContent = computed(() => {
    if (!this.authService.isAuthenticated()) return false;

    // Check if user has teacher or admin role
    return this.authService.hasAnyRole(['teacher', 'admin']);
  });
  hasQuizMakers = computed(() => this.quizMakers().length > 0);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private lessonsService: LessonsService,
    private authService: AuthService,
    private fb: FormBuilder
  ) {
    this.noteForm = this.fb.group({
      content: ['', [Validators.required, Validators.minLength(10)]]
    });

    this.questionForm = this.fb.group({
      question: ['', [Validators.required, Validators.minLength(10)]]
    });

    this.chapterForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      startTime: [0, [Validators.required, Validators.min(0)]],
      endTime: [0, [Validators.required, Validators.min(0)]],
      description: ['']
    });

    this.quizMakerForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required]],
      timeLimit: [30, [Validators.required, Validators.min(1)]],
      passingScore: [70, [Validators.required, Validators.min(0), Validators.max(100)]],
      isActive: [true]
    });

    this.quizQuestionForm = this.fb.group({
      question: ['', [Validators.required, Validators.minLength(10)]],
      option1: ['', [Validators.required]],
      option2: ['', [Validators.required]],
      option3: ['', [Validators.required]],
      option4: ['', [Validators.required]],
      correctAnswer: [0, [Validators.required, Validators.min(0), Validators.max(3)]],
      explanation: [''],
      points: [1, [Validators.required, Validators.min(1)]]
    });
  }

  ngOnInit(): void {
    this.route.params
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        const lessonId = parseInt(params['id']);
        if (lessonId) {
          this.loadLesson(lessonId);
          this.loadAdjacentLessons(lessonId);
          this.loadVideoChapters(lessonId);
          this.loadQuizMakers(lessonId);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load lesson details
   */
  private loadLesson(lessonId: number): void {
    this.loading.set(true);
    this.error.set(null);

    this.lessonsService.getLessonById(lessonId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (lesson) => {
          if (lesson) {
            this.lesson.set(lesson);
            this.loadMockQuizzes(lessonId);
            this.loadMockNotes(lessonId);
            this.loadMockTeacherQuestions(lessonId);

            // Load student progress if authenticated
            if (this.authService.isAuthenticated()) {
              this.loadStudentProgress(lessonId);
            }
          } else {
            this.error.set('Lesson not found');
          }
          this.loading.set(false);
        },
        error: (error) => {
          this.error.set('Failed to load lesson');
          this.loading.set(false);
          console.error('Error loading lesson:', error);
        }
      });
  }

  /**
   * Load student progress for this lesson
   */
  private loadStudentProgress(lessonId: number): void {
    // Mock student ID - in real app this would come from auth service
    const studentId = 1;

    this.lessonsService.getStudentLessons(studentId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (studentLessons) => {
          const studentLesson = studentLessons.find(sl => sl.lesson.id === lessonId);
          this.studentLesson.set(studentLesson || null);
        },
        error: (error) => {
          console.error('Error loading student progress:', error);
        }
      });
  }

  /**
   * Load mock quizzes for the lesson
   */
  private loadMockQuizzes(lessonId: number): void {
    // Mock quiz data - in real app this would come from API
    const mockQuizzes: Quiz[] = [
      {
        id: 1,
        question: "What is the main topic of this lesson?",
        options: [
          "Mathematics fundamentals",
          "English grammar",
          "Science experiments",
          "History facts"
        ],
        correctAnswer: 0,
        explanation: "This lesson focuses on mathematics fundamentals as stated in the introduction."
      },
      {
        id: 2,
        question: "Which method was demonstrated in the video?",
        options: [
          "Addition method",
          "Subtraction method",
          "Multiplication method",
          "Division method"
        ],
        correctAnswer: 2,
        explanation: "The video demonstrated the multiplication method with several examples."
      }
    ];

    this.quizzes.set(mockQuizzes);
    this.quizAnswers.set(new Array(mockQuizzes.length).fill(-1));
  }

  /**
   * Load mock notes for the lesson
   */
  private loadMockNotes(lessonId: number): void {
    const mockNotes: LessonNote[] = [
      {
        id: 1,
        content: "Important formula mentioned at the beginning",
        timestamp: 120,
        createdAt: new Date(Date.now() - 86400000)
      },
      {
        id: 2,
        content: "Remember to practice this example",
        timestamp: 300,
        createdAt: new Date(Date.now() - 43200000)
      }
    ];

    this.notes.set(mockNotes);
  }

  /**
   * Load mock teacher questions
   */
  private loadMockTeacherQuestions(lessonId: number): void {
    const mockQuestions: TeacherQuestion[] = [
      {
        id: 1,
        question: "Can you explain this concept in more detail?",
        answer: "Sure! Let me break it down step by step...",
        isAnswered: true,
        askedAt: new Date(Date.now() - 172800000),
        answeredAt: new Date(Date.now() - 86400000)
      },
      {
        id: 2,
        question: "I'm having trouble with the practice problems",
        isAnswered: false,
        askedAt: new Date(Date.now() - 3600000)
      }
    ];

    this.teacherQuestions.set(mockQuestions);
  }

  /**
   * Load adjacent lessons for navigation
   */
  private loadAdjacentLessons(currentLessonId: number): void {
    this.lessonsService.getLessons()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (lessons) => {
          const currentLesson = this.lesson();
          if (!currentLesson) return;

          // Filter lessons by same subject and course
          const sameCourse = lessons.filter(l =>
            l.subject === currentLesson.subject &&
            l.courseId === currentLesson.courseId
          ).sort((a, b) => a.order - b.order);

          const currentIndex = sameCourse.findIndex(l => l.id === currentLessonId);

          if (currentIndex > 0) {
            this.previousLesson.set(sameCourse[currentIndex - 1]);
          }

          if (currentIndex < sameCourse.length - 1) {
            this.nextLesson.set(sameCourse[currentIndex + 1]);
          }
        },
        error: (error) => {
          console.error('Error loading adjacent lessons:', error);
        }
      });
  }

  /**
   * Load video chapters for the lesson
   */
  private loadVideoChapters(lessonId: number): void {
    // Mock video chapters data
    const mockChapters: VideoChapter[] = [
      {
        id: 1,
        title: 'Introduction',
        startTime: 0,
        endTime: 120,
        description: 'Welcome and lesson overview'
      },
      {
        id: 2,
        title: 'Main Content',
        startTime: 120,
        endTime: 1800,
        description: 'Core learning material'
      },
      {
        id: 3,
        title: 'Practice Examples',
        startTime: 1800,
        endTime: 2400,
        description: 'Worked examples and practice'
      },
      {
        id: 4,
        title: 'Summary',
        startTime: 2400,
        endTime: 2700,
        description: 'Lesson recap and next steps'
      }
    ];

    this.videoChapters.set(mockChapters);

    // Set current chapter based on video time
    this.updateCurrentChapter();
  }

  /**
   * Load quiz makers for the lesson
   */
  private loadQuizMakers(lessonId: number): void {
    // Mock quiz makers data
    const mockQuizMakers: QuizMaker[] = [
      {
        id: 1,
        lessonId: lessonId,
        title: 'Lesson Comprehension Quiz',
        description: 'Test your understanding of the main concepts',
        timeLimit: 20,
        questions: [
          {
            id: 1,
            question: 'What is the main topic of this lesson?',
            options: ['Mathematics', 'Science', 'English', 'History'],
            correctAnswer: 0,
            explanation: 'The lesson focuses on mathematical concepts',
            points: 2
          },
          {
            id: 2,
            question: 'Which method is demonstrated in the video?',
            options: ['Addition', 'Subtraction', 'Multiplication', 'Division'],
            correctAnswer: 2,
            explanation: 'The video demonstrates multiplication techniques',
            points: 3
          }
        ],
        passingScore: 70,
        isActive: true,
        createdBy: 'Teacher Smith',
        createdAt: new Date(Date.now() - 86400000),
        updatedAt: new Date(Date.now() - 43200000)
      }
    ];

    this.quizMakers.set(mockQuizMakers);
  }

  /**
   * Set active tab
   */
  setActiveTab(tab: 'video' | 'resources' | 'quiz' | 'notes' | 'teacher' | 'chapters' | 'quiz-maker'): void {
    this.activeTab.set(tab);
  }

  /**
   * Update current chapter based on video time
   */
  private updateCurrentChapter(): void {
    const currentTime = this.videoCurrentTime();
    const chapters = this.videoChapters();

    const current = chapters.find(chapter =>
      currentTime >= chapter.startTime && currentTime <= chapter.endTime
    );

    this.currentChapter.set(current || null);
  }

  /**
   * Video player methods
   */
  onVideoTimeUpdate(event: any): void {
    const currentTime = event.target.currentTime;
    const duration = event.target.duration;
    this.videoCurrentTime.set(currentTime);
    this.videoDuration.set(duration);
    this.videoProgress.set(duration > 0 ? (currentTime / duration) * 100 : 0);

    // Update current chapter
    this.updateCurrentChapter();

    // Update lesson progress
    this.updateLessonProgress(currentTime, duration);
  }

  onVideoPlay(): void {
    this.isVideoPlaying.set(true);
  }

  onVideoPause(): void {
    this.isVideoPlaying.set(false);
  }

  seekToTime(timestamp: number): void {
    const videoElement = document.querySelector('video') as HTMLVideoElement;
    if (videoElement) {
      videoElement.currentTime = timestamp;
    }
  }

  /**
   * Get chapter marker position as percentage
   */
  getChapterPosition(chapter: VideoChapter): number {
    const duration = this.videoDuration();
    if (duration === 0) return 0;
    return (chapter.startTime / duration) * 100;
  }

  /**
   * Handle click on progress bar to seek to position
   */
  onProgressBarClick(event: MouseEvent): void {
    const progressBar = event.currentTarget as HTMLElement;
    const rect = progressBar.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const width = rect.width;
    const percentage = (clickX / width) * 100;
    const seekTime = (percentage / 100) * this.videoDuration();
    this.seekToTime(seekTime);
  }

  /**
   * Get chapter width as percentage of total video duration
   */
  getChapterWidth(chapter: VideoChapter): number {
    const duration = this.videoDuration();
    if (duration === 0) return 0;
    const chapterDuration = chapter.endTime - chapter.startTime;
    return (chapterDuration / duration) * 100;
  }

  /**
   * Get chapter color class based on index
   */
  getChapterColor(index: number): string {
    const colors = ['blue-200', 'green-200', 'yellow-200', 'purple-200', 'pink-200', 'indigo-200', 'red-200', 'orange-200'];
    return colors[index % colors.length];
  }

  /**
   * Get current chapter index
   */
  getCurrentChapterIndex(): number {
    const current = this.currentChapter();
    if (!current) return -1;
    return this.videoChapters().findIndex(c => c.id === current.id);
  }

  /**
   * Update lesson progress
   */
  private updateLessonProgress(currentTime: number, duration: number): void {
    const lesson = this.lesson();
    if (!lesson || !this.authService.isAuthenticated()) return;

    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
    const studentId = 1; // Mock student ID

    this.lessonsService.updateProgress(
      lesson.id,
      studentId,
      Math.round(progress),
      Math.round(currentTime / 60), // time spent in minutes
      currentTime
    ).subscribe();
  }

  /**
   * Quiz methods
   */
  selectQuizAnswer(answerIndex: number): void {
    const answers = [...this.quizAnswers()];
    answers[this.currentQuizIndex()] = answerIndex;
    this.quizAnswers.set(answers);
  }

  nextQuiz(): void {
    const currentIndex = this.currentQuizIndex();
    const totalQuizzes = this.quizzes().length;

    if (currentIndex < totalQuizzes - 1) {
      this.currentQuizIndex.set(currentIndex + 1);
    } else {
      this.finishQuiz();
    }
  }

  previousQuiz(): void {
    const currentIndex = this.currentQuizIndex();
    if (currentIndex > 0) {
      this.currentQuizIndex.set(currentIndex - 1);
    }
  }

  finishQuiz(): void {
    const answers = this.quizAnswers();
    const quizzes = this.quizzes();
    let correct = 0;

    answers.forEach((answer, index) => {
      if (answer === quizzes[index]?.correctAnswer) {
        correct++;
      }
    });

    this.quizScore.set(Math.round((correct / quizzes.length) * 100));
    this.showQuizResults.set(true);
  }

  resetQuiz(): void {
    this.currentQuizIndex.set(0);
    this.quizAnswers.set(new Array(this.quizzes().length).fill(-1));
    this.showQuizResults.set(false);
    this.quizScore.set(0);
  }

  /**
   * Notes methods
   */
  addNote(): void {
    if (this.noteForm.valid) {
      this.isAddingNote.set(true);

      const newNote: LessonNote = {
        id: Date.now(),
        content: this.noteForm.value.content,
        timestamp: this.videoCurrentTime(),
        createdAt: new Date()
      };

      const currentNotes = this.notes();
      this.notes.set([...currentNotes, newNote]);

      this.noteForm.reset();
      this.isAddingNote.set(false);
    }
  }

  deleteNote(noteId: number): void {
    if (confirm('Are you sure you want to delete this note?')) {
      const currentNotes = this.notes();
      this.notes.set(currentNotes.filter(note => note.id !== noteId));
    }
  }

  /**
   * Teacher interaction methods
   */
  askTeacher(): void {
    if (this.questionForm.valid) {
      this.isAskingQuestion.set(true);

      const newQuestion: TeacherQuestion = {
        id: Date.now(),
        question: this.questionForm.value.question,
        isAnswered: false,
        askedAt: new Date()
      };

      const currentQuestions = this.teacherQuestions();
      this.teacherQuestions.set([...currentQuestions, newQuestion]);

      this.questionForm.reset();
      this.isAskingQuestion.set(false);

      // Show success message
      alert('Your question has been sent to the teacher. You will be notified when they respond.');
    }
  }

  /**
   * Resource methods
   */
  downloadResource(resource: LessonResource): void {
    if (resource.downloadable) {
      // In a real app, this would trigger a download
      window.open(resource.url, '_blank');
    } else {
      this.router.navigate([resource.url]);
    }
  }

  /**
   * Navigation methods
   */
  goBack(): void {
    const lesson = this.lesson();
    if (lesson) {
      this.router.navigate(['/lessons'], {
        queryParams: {
          subject: lesson.subject,
          courseId: lesson.courseId
        }
      });
    } else {
      this.router.navigate(['/courses']);
    }
  }

  /**
   * Utility methods
   */
  formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  formatTimestamp(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  getResourceIcon(type: string): string {
    switch (type) {
      case 'pdf': return 'fas fa-file-pdf';
      case 'exercise': return 'fas fa-dumbbell';
      case 'quiz': return 'fas fa-question-circle';
      case 'worksheet': return 'fas fa-file-alt';
      default: return 'fas fa-file';
    }
  }

  getResourceColor(type: string): string {
    switch (type) {
      case 'pdf': return 'text-red-600';
      case 'exercise': return 'text-blue-600';
      case 'quiz': return 'text-green-600';
      case 'worksheet': return 'text-purple-600';
      default: return 'text-gray-600';
    }
  }

  /**
   * Get quiz option letter (A, B, C, D)
   */
  getOptionLetter(index: number): string {
    return String.fromCharCode(65 + index);
  }

  // ==================== LESSON NAVIGATION METHODS ====================

  /**
   * Navigate to previous lesson
   */
  goToPreviousLesson(): void {
    const prevLesson = this.previousLesson();
    if (prevLesson) {
      this.router.navigate(['/lesson', prevLesson.id]);
    }
  }

  /**
   * Navigate to next lesson
   */
  goToNextLesson(): void {
    const nextLesson = this.nextLesson();
    if (nextLesson) {
      this.router.navigate(['/lesson', nextLesson.id]);
    }
  }

  // ==================== VIDEO CHAPTER METHODS ====================

  /**
   * Jump to specific chapter
   */
  jumpToChapter(chapter: VideoChapter): void {
    this.seekToTime(chapter.startTime);
  }

  /**
   * Add new video chapter
   */
  addChapter(): void {
    if (this.chapterForm.valid && this.canEditContent()) {
      const formValue = this.chapterForm.value;
      const newChapter: VideoChapter = {
        id: Date.now(),
        title: formValue.title,
        startTime: formValue.startTime,
        endTime: formValue.endTime,
        description: formValue.description
      };

      const currentChapters = this.videoChapters();
      this.videoChapters.set([...currentChapters, newChapter].sort((a, b) => a.startTime - b.startTime));

      this.chapterForm.reset();
      alert('Chapter added successfully!');
    }
  }

  /**
   * Edit video chapter
   */
  editChapter(chapter: VideoChapter): void {
    if (this.canEditContent()) {
      this.chapterForm.patchValue({
        title: chapter.title,
        startTime: chapter.startTime,
        endTime: chapter.endTime,
        description: chapter.description
      });
      this.isEditingChapters.set(true);
    }
  }

  /**
   * Delete video chapter
   */
  deleteChapter(chapterId: number): void {
    if (this.canEditContent() && confirm('Are you sure you want to delete this chapter?')) {
      const currentChapters = this.videoChapters();
      this.videoChapters.set(currentChapters.filter(chapter => chapter.id !== chapterId));
      alert('Chapter deleted successfully!');
    }
  }

  /**
   * Toggle chapter editing mode
   */
  toggleChapterEditing(): void {
    this.isEditingChapters.set(!this.isEditingChapters());
    if (!this.isEditingChapters()) {
      this.chapterForm.reset();
    }
  }

  // ==================== QUIZ MAKER METHODS ====================

  /**
   * Start creating new quiz
   */
  startCreatingQuiz(): void {
    if (this.canEditContent()) {
      this.isCreatingQuiz.set(true);
      this.quizMakerForm.reset();
      this.quizQuestionForm.reset();
      this.currentQuizMaker.set({
        id: 0,
        lessonId: this.lesson()?.id || 0,
        title: '',
        description: '',
        timeLimit: 30,
        questions: [],
        passingScore: 70,
        isActive: true,
        createdBy: 'Current User',
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
  }

  /**
   * Add question to current quiz
   */
  addQuestionToQuiz(): void {
    if (this.quizQuestionForm.valid) {
      const formValue = this.quizQuestionForm.value;
      const newQuestion: QuizQuestion = {
        id: Date.now(),
        question: formValue.question,
        options: [formValue.option1, formValue.option2, formValue.option3, formValue.option4],
        correctAnswer: formValue.correctAnswer,
        explanation: formValue.explanation || '',
        points: formValue.points
      };

      const currentQuiz = this.currentQuizMaker();
      if (currentQuiz) {
        currentQuiz.questions.push(newQuestion);
        this.currentQuizMaker.set({ ...currentQuiz });
      }

      this.quizQuestionForm.reset();
      this.quizQuestionForm.patchValue({ correctAnswer: 0, points: 1 });
    }
  }

  /**
   * Remove question from quiz
   */
  removeQuestionFromQuiz(questionId: number): void {
    const currentQuiz = this.currentQuizMaker();
    if (currentQuiz) {
      currentQuiz.questions = currentQuiz.questions.filter(q => q.id !== questionId);
      this.currentQuizMaker.set({ ...currentQuiz });
    }
  }

  /**
   * Save quiz
   */
  saveQuiz(): void {
    if (this.quizMakerForm.valid && this.currentQuizMaker()?.questions.length! > 0) {
      const formValue = this.quizMakerForm.value;
      const currentQuiz = this.currentQuizMaker()!;

      const quizToSave: QuizMaker = {
        ...currentQuiz,
        title: formValue.title,
        description: formValue.description,
        timeLimit: formValue.timeLimit,
        passingScore: formValue.passingScore,
        isActive: formValue.isActive,
        updatedAt: new Date()
      };

      if (quizToSave.id === 0) {
        // New quiz
        quizToSave.id = Date.now();
        const currentQuizzes = this.quizMakers();
        this.quizMakers.set([...currentQuizzes, quizToSave]);
      } else {
        // Update existing quiz
        const currentQuizzes = this.quizMakers();
        const updatedQuizzes = currentQuizzes.map(q => q.id === quizToSave.id ? quizToSave : q);
        this.quizMakers.set(updatedQuizzes);
      }

      this.cancelQuizCreation();
      alert('Quiz saved successfully!');
    }
  }

  /**
   * Edit existing quiz
   */
  editQuiz(quiz: QuizMaker): void {
    if (this.canEditContent()) {
      this.isEditingQuiz.set(true);
      this.isCreatingQuiz.set(true);
      this.currentQuizMaker.set({ ...quiz });
      this.quizMakerForm.patchValue({
        title: quiz.title,
        description: quiz.description,
        timeLimit: quiz.timeLimit,
        passingScore: quiz.passingScore,
        isActive: quiz.isActive
      });
    }
  }

  /**
   * Delete quiz
   */
  deleteQuiz(quizId: number): void {
    if (this.canEditContent() && confirm('Are you sure you want to delete this quiz?')) {
      const currentQuizzes = this.quizMakers();
      this.quizMakers.set(currentQuizzes.filter(q => q.id !== quizId));
      alert('Quiz deleted successfully!');
    }
  }

  /**
   * Cancel quiz creation/editing
   */
  cancelQuizCreation(): void {
    this.isCreatingQuiz.set(false);
    this.isEditingQuiz.set(false);
    this.currentQuizMaker.set(null);
    this.quizMakerForm.reset();
    this.quizQuestionForm.reset();
  }

  /**
   * Toggle quiz active status
   */
  toggleQuizStatus(quizId: number): void {
    if (this.canEditContent()) {
      const currentQuizzes = this.quizMakers();
      const updatedQuizzes = currentQuizzes.map(quiz =>
        quiz.id === quizId ? { ...quiz, isActive: !quiz.isActive, updatedAt: new Date() } : quiz
      );
      this.quizMakers.set(updatedQuizzes);
    }
  }

  /**
   * Get total points for current quiz
   */
  getTotalQuizPoints(): number {
    const currentQuiz = this.currentQuizMaker();
    return currentQuiz?.questions.reduce((total, q) => total + q.points, 0) || 0;
  }

  /**
   * Get total points for any quiz
   */
  getQuizTotalPoints(quiz: QuizMaker): number {
    return quiz.questions.reduce((total, q) => total + q.points, 0);
  }

  /**
   * Format seconds to MM:SS
   */
  formatSecondsToTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
}
