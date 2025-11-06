# 🔧 خطوات تطبيق التحديثات على Lesson Detail Component

## الخطوة 1: نسخ احتياطي

```powershell
Copy-Item "f:\NaplanBridge\src\app\features\lesson-detail\lesson-detail.component.ts" `
          "f:\NaplanBridge\src\app\features\lesson-detail\lesson-detail.component.ts.backup"

Copy-Item "f:\NaplanBridge\src\app\features\lesson-detail\lesson-detail.component.html" `
          "f:\NaplanBridge\src\app\features\lesson-detail\lesson-detail.component.html.backup"
```

## الخطوة 2: تحديث Imports (في أول الملف)

أضف الـ imports التالية بعد السطر 8 (بعد import AuthService):

```typescript
import { ExamService } from '../../core/services/exam.service';
import { NotesService, Note, CreateNoteDto, UpdateNoteDto } from '../../core/services/notes.service';
import { LessonQuestionsService, LessonQuestion, CreateLessonQuestionDto } from '../../core/services/lesson-questions.service';
import { Exam, ExamDetails, StudentExamSession, ExamSubmission, ExamAnswer, ExamResult, QuestionType } from '../../models/exam.models';
import { ToastService } from '../../core/services/toast.service';
```

## الخطوة 3: تحديث Interfaces

استبدل الـ interfaces:

```typescript
// استبدل interface LessonNote بهذا:
// تم حذفها لأننا نستخدم Note من notes.service

// استبدل interface TeacherQuestion بهذا:
// تم حذفها لأننا نستخدم LessonQuestion من lesson-questions.service
```

## الخطوة 4: إضافة State Signals

أضف بعد السطر 100 (بعد // Quiz state):

```typescript
  // Exams state (from backend)
  lessonExams = signal<Exam[]>([]);
  currentExam = signal<ExamDetails | null>(null);
  currentExamSession = signal<StudentExamSession | null>(null);
  examAnswers = signal<ExamAnswer[]>([]);
  examResult = signal<ExamResult | null>(null);
  isLoadingExam = signal(false);
  isSubmittingExam = signal(false);
  showExamResults = signal(false);
```

## الخطوة 5: تحديث Notes و Questions State

استبدل:
```typescript
  // Notes state
  notes = signal<LessonNote[]>([]);
  noteForm: FormGroup;
  isAddingNote = signal(false);

  // Teacher interaction state
  teacherQuestions = signal<TeacherQuestion[]>([]);
  questionForm: FormGroup;
  isAskingQuestion = signal(false);
```

بهذا:
```typescript
  // Notes state (from backend)
  notes = signal<Note[]>([]);
  noteForm: FormGroup;
  isAddingNote = signal(false);
  isLoadingNotes = signal(false);

  // Teacher interaction state (from backend)
  teacherQuestions = signal<LessonQuestion[]>([]);
  questionForm: FormGroup;
  isAskingQuestion = signal(false);
  isLoadingQuestions = signal(false);
```

## الخطوة 6: تحديث Active Tab Type

استبدل:
```typescript
  activeTab = signal<'video' | 'resources' | 'quiz' | 'notes' | 'teacher' | 'chapters' | 'quiz-maker'>('video');
```

بهذا:
```typescript
  activeTab = signal<'video' | 'resources' | 'quiz' | 'notes' | 'teacher' | 'chapters' | 'quiz-maker' | 'exams'>('video');
```

## الخطوة 7: إضافة Computed Properties

أضف بعد hasQuizzes:
```typescript
  hasExams = computed(() => this.lessonExams().length > 0);
```

## الخطوة 8: تحديث Constructor

استبدل constructor parameters:

```typescript
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private lessonsService: LessonsService,
    private authService: AuthService,
    private examService: ExamService,  // إضافة
    private notesService: NotesService,  // إضافة
    private lessonQuestionsService: LessonQuestionsService,  // إضافة
    private toastService: ToastService,  // إضافة
    private fb: FormBuilder
  ) {
```

## الخطوة 9: تحديث ngOnInit

استبدل محتوى ngOnInit بهذا:

```typescript
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
          
          // Load backend data
          if (this.authService.isAuthenticated()) {
            this.loadLessonExams(lessonId);
            this.loadLessonNotes(lessonId);
            this.loadLessonQuestions(lessonId);
          }
        }
      });
  }
```

## الخطوة 10: إضافة Backend Integration Methods

أضف بعد ngOnDestroy (قبل loadLesson):

```typescript
  // ==================== BACKEND INTEGRATION METHODS ====================

  /**
   * Load exams for this lesson from backend
   */
  private loadLessonExams(lessonId: number): void {
    this.examService.getExamsByLesson(lessonId)
      .pipe(
        takeUntil(this.destroy$),
        catchError(error => {
          console.error('Error loading lesson exams:', error);
          this.toastService.showError('Failed to load exams');
          return [];
        })
      )
      .subscribe({
        next: (exams) => {
          this.lessonExams.set(exams);
          console.log(`Loaded ${exams.length} exams for lesson ${lessonId}`);
        }
      });
  }

  /**
   * Load notes for this lesson from backend
   */
  private loadLessonNotes(lessonId: number): void {
    this.isLoadingNotes.set(true);
    this.notesService.getNotesByLesson(lessonId)
      .pipe(
        takeUntil(this.destroy$),
        catchError(error => {
          console.error('Error loading notes:', error);
          this.toastService.showError('Failed to load notes');
          return [];
        })
      )
      .subscribe({
        next: (notes) => {
          this.notes.set(notes);
          this.isLoadingNotes.set(false);
          console.log(`Loaded ${notes.length} notes for lesson ${lessonId}`);
        },
        error: () => {
          this.isLoadingNotes.set(false);
        }
      });
  }

  /**
   * Load questions for this lesson from backend
   */
  private loadLessonQuestions(lessonId: number): void {
    this.isLoadingQuestions.set(true);
    this.lessonQuestionsService.getQuestionsByLesson(lessonId)
      .pipe(
        takeUntil(this.destroy$),
        catchError(error => {
          console.error('Error loading questions:', error);
          this.toastService.showError('Failed to load questions');
          return [];
        })
      )
      .subscribe({
        next: (questions) => {
          this.teacherQuestions.set(questions);
          this.isLoadingQuestions.set(false);
          console.log(`Loaded ${questions.length} questions for lesson ${lessonId}`);
        },
        error: () => {
          this.isLoadingQuestions.set(false);
        }
      });
  }

  /**
   * Start an exam
   */
  startExam(exam: Exam): void {
    this.isLoadingExam.set(true);
    
    this.examService.startExam(exam.id)
      .pipe(
        takeUntil(this.destroy$),
        catchError(error => {
          console.error('Error starting exam:', error);
          this.toastService.showError('Failed to start exam');
          this.isLoadingExam.set(false);
          throw error;
        })
      )
      .subscribe({
        next: (session) => {
          this.currentExamSession.set(session);
          this.examAnswers.set([]);
          this.showExamResults.set(false);
          this.setActiveTab('exams');
          this.isLoadingExam.set(false);
          this.toastService.showSuccess('Exam started successfully');
        }
      });
  }

  /**
   * Submit exam answers
   */
  submitExam(): void {
    const session = this.currentExamSession();
    if (!session) return;

    if (confirm('Are you sure you want to submit your exam? This action cannot be undone.')) {
      this.isSubmittingExam.set(true);

      const submission: ExamSubmission = {
        studentExamId: session.studentExamId,
        answers: this.examAnswers()
      };

      this.examService.submitExam(submission.studentExamId, submission.answers)
        .pipe(
          takeUntil(this.destroy$),
          catchError(error => {
            console.error('Error submitting exam:', error);
            this.toastService.showError('Failed to submit exam');
            this.isSubmittingExam.set(false);
            throw error;
          })
        )
        .subscribe({
          next: (result) => {
            this.examResult.set(result);
            this.showExamResults.set(true);
            this.isSubmittingExam.set(false);
            this.toastService.showSuccess('Exam submitted successfully');
          }
        });
    }
  }

  /**
   * Save exam answer
   */
  saveExamAnswer(questionId: number, answer: ExamAnswer): void {
    const currentAnswers = this.examAnswers();
    const existingIndex = currentAnswers.findIndex(a => a.questionId === questionId);

    if (existingIndex >= 0) {
      currentAnswers[existingIndex] = answer;
    } else {
      currentAnswers.push(answer);
    }

    this.examAnswers.set([...currentAnswers]);
  }

  /**
   * Get saved answer for a question
   */
  getExamAnswer(questionId: number): ExamAnswer | undefined {
    return this.examAnswers().find(a => a.questionId === questionId);
  }

  /**
   * Close exam and go back to exams list
   */
  closeExam(): void {
    this.currentExamSession.set(null);
    this.currentExam.set(null);
    this.examAnswers.set([]);
    this.examResult.set(null);
    this.showExamResults.set(false);
  }
```

## الخطوة 11: تحديث Notes Methods

احذف loadMockNotes() واستبدل addNote() و deleteNote() بهذا:

```typescript
  // ==================== NOTES METHODS (Backend Integrated) ====================

  /**
   * Add note to backend
   */
  addNote(): void {
    if (this.noteForm.valid && this.lesson()) {
      this.isAddingNote.set(true);

      const dto: CreateNoteDto = {
        content: this.noteForm.value.content,
        lessonId: this.lesson()!.id,
        timestamp: Math.floor(this.videoCurrentTime())
      };

      this.notesService.createNote(dto)
        .pipe(
          takeUntil(this.destroy$),
          catchError(error => {
            console.error('Error creating note:', error);
            this.toastService.showError('Failed to create note');
            this.isAddingNote.set(false);
            throw error;
          })
        )
        .subscribe({
          next: (note) => {
            const currentNotes = this.notes();
            this.notes.set([...currentNotes, note]);
            this.noteForm.reset();
            this.isAddingNote.set(false);
            this.toastService.showSuccess('Note added successfully');
          }
        });
    }
  }

  /**
   * Delete note from backend
   */
  deleteNote(noteId: number): void {
    if (confirm('Are you sure you want to delete this note?')) {
      this.notesService.deleteNote(noteId)
        .pipe(
          takeUntil(this.destroy$),
          catchError(error => {
            console.error('Error deleting note:', error);
            this.toastService.showError('Failed to delete note');
            throw error;
          })
        )
        .subscribe({
          next: () => {
            const currentNotes = this.notes();
            this.notes.set(currentNotes.filter(note => note.id !== noteId));
            this.toastService.showSuccess('Note deleted successfully');
          }
        });
    }
  }

  /**
   * Toggle note favorite status
   */
  toggleNoteFavorite(note: Note): void {
    this.notesService.toggleFavorite(note.id)
      .pipe(
        takeUntil(this.destroy$),
        catchError(error => {
          console.error('Error toggling favorite:', error);
          this.toastService.showError('Failed to update note');
          throw error;
        })
      )
      .subscribe({
        next: (updatedNote) => {
          const currentNotes = this.notes();
          const index = currentNotes.findIndex(n => n.id === updatedNote.id);
          if (index >= 0) {
            currentNotes[index] = updatedNote;
            this.notes.set([...currentNotes]);
          }
        }
      });
  }

  /**
   * Jump to note timestamp in video
   */
  jumpToNoteTimestamp(note: Note): void {
    if (note.timestamp) {
      this.seekToTime(note.timestamp);
      this.setActiveTab('video');
      this.toastService.showInfo(`Jumped to ${this.formatTime(note.timestamp)}`);
    }
  }
```

## الخطوة 12: تحديث Teacher Questions Methods

احذف loadMockTeacherQuestions() واستبدل askTeacher() بهذا:

```typescript
  // ==================== TEACHER QUESTIONS METHODS (Backend Integrated) ====================

  /**
   * Ask teacher a question
   */
  askTeacher(): void {
    if (this.questionForm.valid && this.lesson()) {
      this.isAskingQuestion.set(true);

      const dto: CreateLessonQuestionDto = {
        lessonId: this.lesson()!.id,
        questionText: this.questionForm.value.question
      };

      this.lessonQuestionsService.createQuestion(dto)
        .pipe(
          takeUntil(this.destroy$),
          catchError(error => {
            console.error('Error creating question:', error);
            this.toastService.showError('Failed to send question');
            this.isAskingQuestion.set(false);
            throw error;
          })
        )
        .subscribe({
          next: (question) => {
            const currentQuestions = this.teacherQuestions();
            this.teacherQuestions.set([...currentQuestions, question]);
            this.questionForm.reset();
            this.isAskingQuestion.set(false);
            this.toastService.showSuccess('Question sent to teacher successfully');
          }
        });
    }
  }

  /**
   * Delete a question
   */
  deleteQuestion(questionId: number): void {
    if (confirm('Are you sure you want to delete this question?')) {
      this.lessonQuestionsService.deleteQuestion(questionId)
        .pipe(
          takeUntil(this.destroy$),
          catchError(error => {
            console.error('Error deleting question:', error);
            this.toastService.showError('Failed to delete question');
            throw error;
          })
        )
        .subscribe({
          next: () => {
            const currentQuestions = this.teacherQuestions();
            this.teacherQuestions.set(currentQuestions.filter(q => q.id !== questionId));
            this.toastService.showSuccess('Question deleted successfully');
          }
        });
    }
  }
```

## الخطوة 13: تحديث setActiveTab Method

استبدل:
```typescript
  setActiveTab(tab: 'video' | 'resources' | 'quiz' | 'notes' | 'teacher' | 'chapters' | 'quiz-maker'): void {
    this.activeTab.set(tab);
  }
```

بهذا:
```typescript
  setActiveTab(tab: 'video' | 'resources' | 'quiz' | 'notes' | 'teacher' | 'chapters' | 'quiz-maker' | 'exams'): void {
    this.activeTab.set(tab);
  }
```

## الخطوة 14: تحديث Toast Calls

ابحث واستبدل في كل الملف:
- `alert('...')` → `this.toastService.showSuccess('...')` أو `showError` أو `showInfo`
- استخدم الـ methods الصحيحة للـ ToastService

---

## ملاحظات:
1. تأكد من حفظ نسخة احتياطية قبل التطبيق
2. قم بتطبيق كل خطوة بعناية
3. تحقق من عدم وجود أخطاء compile بعد كل خطوة
4. ارجع للملف `LESSON_DETAIL_ENHANCEMENT_SUMMARY.md` للتفاصيل الكاملة

---

هذه التعليمات مخصصة لتحديث `lesson-detail.component.ts` فقط.
تحديثات HTML ستكون في ملف منفصل.
