import { Component, OnInit, OnDestroy, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ContentService } from '../../core/services/content.service';
import { AuthService } from '../../core/services/auth.service';
import Swal from 'sweetalert2';

/**
 * Comprehensive Lesson Management Component
 * Manages all lesson-related entities:
 * - Lesson Details (title, description, video, poster)
 * - Resources (PDFs, documents, files)
 * - Notes (student notes)
 * - Questions/Quiz
 * - Discussions
 * - Exams (related exams)
 * - Chapters (lesson segments/timestamps)
 */
@Component({
  selector: 'app-lesson-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './lesson-management.component.html',
  styleUrls: ['./lesson-management.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class LessonManagementComponent implements OnInit, OnDestroy {
  lessonId!: number;
  lesson: any = null;
  
  // ============================================
  // Active Tab Management
  // ============================================
  activeTab: 'overview' | 'resources' | 'notes' | 'questions' | 'discussions' | 'exams' | 'chapters' = 'overview';
  
  // ============================================
  // Loading States
  // ============================================
  isLoading = false;
  isLoadingResources = false;
  isLoadingNotes = false;
  isLoadingQuestions = false;
  isLoadingDiscussions = false;
  isLoadingExams = false;
  isLoadingChapters = false;
  
  // ============================================
  // Resources Management
  // ============================================
  resources: any[] = [];
  resourceForm: any = {
    title: '',
    description: '',
    resourceType: 'pdf',
    file: null
  };
  isResourceFormOpen = false;
  editingResource: any = null;
  
  // ============================================
  // Notes Management
  // ============================================
  notes: any[] = [];
  noteForm: any = {
    title: '',
    content: '',
    isFavorite: false
  };
  isNoteFormOpen = false;
  editingNote: any = null;
  
  // ============================================
  // Questions/Quiz Management
  // ============================================
  questions: any[] = [];
  questionForm: any = {
    questionText: '',
    questionType: 'MultipleChoice',
    points: 1,
    options: [
      { optionText: '', isCorrect: false },
      { optionText: '', isCorrect: false },
      { optionText: '', isCorrect: false },
      { optionText: '', isCorrect: false }
    ]
  };
  isQuestionFormOpen = false;
  editingQuestion: any = null;
  
  // ============================================
  // Discussions Management
  // ============================================
  discussions: any[] = [];
  discussionForm: any = {
    question: '',
    details: ''
  };
  isDiscussionFormOpen = false;
  editingDiscussion: any = null;
  
  // ============================================
  // Exams Management
  // ============================================
  exams: any[] = [];
  examForm: any = {
    title: '',
    description: '',
    duration: 60,
    totalMarks: 100,
    passingMarks: 50,
    examDate: new Date().toISOString().split('T')[0]
  };
  isExamFormOpen = false;
  editingExam: any = null;
  
  // ============================================
  // Chapters Management (Lesson Segments/Timestamps)
  // ============================================
  chapters: any[] = [];
  chapterForm: any = {
    title: '',
    description: '',
    startTime: '00:00:00',
    endTime: '00:00:00',
    orderIndex: 0
  };
  isChapterFormOpen = false;
  editingChapter: any = null;
  
  // ============================================
  // Lesson Edit Form
  // ============================================
  lessonEditForm: any = {
    title: '',
    description: '',
    weekId: null,
    posterFile: null,
    videoFile: null
  };
  isLessonEditFormOpen = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private contentService: ContentService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.lessonId = +params['id'];
      if (this.lessonId) {
        this.loadAllData();
      }
    });
  }

  ngOnDestroy(): void {
    // Cleanup if needed
  }

  // ============================================
  // Data Loading
  // ============================================
  
  async loadAllData(): Promise<void> {
    await this.loadLesson();
    await Promise.all([
      this.loadResources(),
      this.loadNotes(),
      this.loadQuestions(),
      this.loadDiscussions(),
      this.loadExams(),
      this.loadChapters()
    ]);
  }

  async loadLesson(): Promise<void> {
    try {
      this.isLoading = true;
      this.lesson = await this.contentService.getLesson(this.lessonId).toPromise();
    } catch (error: any) {
      console.error('Error loading lesson:', error);
      Swal.fire('Error', 'Failed to load lesson details', 'error');
    } finally {
      this.isLoading = false;
    }
  }

  async loadResources(): Promise<void> {
    try {
      this.isLoadingResources = true;
      const response: any = await this.contentService.getLessonResources(this.lessonId).toPromise();
      this.resources = Array.isArray(response) ? response : (response?.items || response?.data || []);
    } catch (error: any) {
      console.error('Error loading resources:', error);
      this.resources = [];
    } finally {
      this.isLoadingResources = false;
    }
  }

  async loadNotes(): Promise<void> {
    try {
      this.isLoadingNotes = true;
      const response: any = await this.contentService.getLessonNotes(this.lessonId).toPromise();
      this.notes = Array.isArray(response) ? response : (response?.items || response?.data || []);
    } catch (error: any) {
      console.error('Error loading notes:', error);
      this.notes = [];
    } finally {
      this.isLoadingNotes = false;
    }
  }

  async loadQuestions(): Promise<void> {
    try {
      this.isLoadingQuestions = true;
      const response: any = await this.contentService.getLessonQuestions(this.lessonId).toPromise();
      this.questions = Array.isArray(response) ? response : (response?.items || response?.data || []);
    } catch (error: any) {
      console.error('Error loading questions:', error);
      this.questions = [];
    } finally {
      this.isLoadingQuestions = false;
    }
  }

  async loadDiscussions(): Promise<void> {
    try {
      this.isLoadingDiscussions = true;
      const response: any = await this.contentService.getLessonDiscussions(this.lessonId).toPromise();
      this.discussions = Array.isArray(response) ? response : (response?.items || response?.data || []);
    } catch (error: any) {
      console.error('Error loading discussions:', error);
      this.discussions = [];
    } finally {
      this.isLoadingDiscussions = false;
    }
  }

  async loadExams(): Promise<void> {
    try {
      this.isLoadingExams = true;
      const response: any = await this.contentService.getLessonExams(this.lessonId).toPromise();
      this.exams = Array.isArray(response) ? response : (response?.items || response?.data || []);
    } catch (error: any) {
      console.error('Error loading exams:', error);
      this.exams = [];
    } finally {
      this.isLoadingExams = false;
    }
  }

  async loadChapters(): Promise<void> {
    try {
      this.isLoadingChapters = true;
      const response: any = await this.contentService.getLessonChapters(this.lessonId).toPromise();
      this.chapters = Array.isArray(response) ? response : (response?.items || response?.data || []);
    } catch (error: any) {
      console.error('Error loading chapters:', error);
      this.chapters = [];
    } finally {
      this.isLoadingChapters = false;
    }
  }

  // ============================================
  // Tab Navigation
  // ============================================
  
  setActiveTab(tab: typeof this.activeTab): void {
    this.activeTab = tab;
  }

  // ============================================
  // Lesson Details Management
  // ============================================
  
  openLessonEdit(): void {
    if (this.lesson) {
      this.lessonEditForm = {
        title: this.lesson.title || '',
        description: this.lesson.description || '',
        weekId: this.lesson.weekId || null,
        posterFile: null,
        videoFile: null
      };
      this.isLessonEditFormOpen = true;
    }
  }

  closeLessonEdit(): void {
    this.isLessonEditFormOpen = false;
    this.lessonEditForm = {
      title: '',
      description: '',
      weekId: null,
      posterFile: null,
      videoFile: null
    };
  }

  async saveLessonEdit(): Promise<void> {
    try {
      if (!this.lessonEditForm.title?.trim()) {
        Swal.fire('Error', 'Please enter lesson title', 'error');
        return;
      }

      Swal.fire({
        title: 'Updating...',
        text: 'Please wait',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });

      await this.contentService.updateLesson(
        this.lessonId,
        this.lessonEditForm.title,
        this.lessonEditForm.description,
        this.lessonEditForm.weekId,
        this.lessonEditForm.posterFile,
        this.lessonEditForm.videoFile
      ).toPromise();

      await this.loadLesson();
      this.closeLessonEdit();

      Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: 'Lesson updated successfully',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (error: any) {
      Swal.fire('Error', this.extractErrorMessage(error), 'error');
    }
  }

  // ============================================
  // Resources Management
  // ============================================
  
  openAddResource(): void {
    this.editingResource = null;
    this.resourceForm = {
      title: '',
      description: '',
      resourceType: 'pdf',
      file: null
    };
    this.isResourceFormOpen = true;
  }

  openEditResource(resource: any): void {
    this.editingResource = resource;
    this.resourceForm = {
      title: resource.title || '',
      description: resource.description || '',
      resourceType: resource.resourceType || 'pdf',
      file: null
    };
    this.isResourceFormOpen = true;
  }

  closeResourceForm(): void {
    this.isResourceFormOpen = false;
    this.editingResource = null;
    this.resourceForm = {
      title: '',
      description: '',
      resourceType: 'pdf',
      file: null
    };
  }

  async saveResource(): Promise<void> {
    try {
      if (!this.resourceForm.title?.trim()) {
        Swal.fire('Error', 'Please enter resource title', 'error');
        return;
      }

      if (!this.editingResource && !this.resourceForm.file) {
        Swal.fire('Error', 'Please select a file', 'error');
        return;
      }

      Swal.fire({
        title: 'Saving...',
        text: 'Please wait',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });

      if (this.editingResource) {
        await this.contentService.updateLessonResource(
          this.editingResource.id,
          this.resourceForm.title,
          this.resourceForm.description,
          this.resourceForm.resourceType,
          this.resourceForm.file
        ).toPromise();
      } else {
        await this.contentService.addLessonResource(
          this.lessonId,
          this.resourceForm.title,
          this.resourceForm.description,
          this.resourceForm.resourceType,
          this.resourceForm.file
        ).toPromise();
      }

      await this.loadResources();
      this.closeResourceForm();

      Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: `Resource ${this.editingResource ? 'updated' : 'added'} successfully`,
        timer: 2000,
        showConfirmButton: false
      });
    } catch (error: any) {
      const errorMessage = this.extractErrorMessage(error);
      
      // Check if it's the known backend 500 error
      if (error.status === 500 && error.error?.statusCode === 500) {
        Swal.fire({
          icon: 'error',
          title: 'Backend Error (500)',
          html: `
            <p><strong>Known Issue:</strong> The backend server is experiencing an internal error when processing resource uploads.</p>
            <p class="mt-2 text-sm text-gray-600">This is a documented backend issue. The frontend request is correct according to Swagger specification.</p>
            <p class="mt-2 text-sm">
              <strong>Trace ID:</strong> <code>${error.error.traceId || 'N/A'}</code><br>
              <strong>Error:</strong> ${errorMessage}
            </p>
            <p class="mt-3 text-sm text-blue-600"><strong>Action Required:</strong> Contact the backend development team to investigate the server logs.</p>
            <p class="mt-2 text-xs text-gray-500">Reference: backend_inquiry_resources_upload_500_error_2025-11-04.md</p>
          `,
          width: '600px'
        });
      } else {
        Swal.fire('Error', errorMessage, 'error');
      }
    }
  }

  async deleteResource(resource: any): Promise<void> {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to delete this resource?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        Swal.fire({
          title: 'Deleting...',
          text: 'Please wait',
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading()
        });

        await this.contentService.deleteLessonResource(resource.id).toPromise();
        await this.loadResources();

        Swal.fire({
          icon: 'success',
          title: 'Deleted!',
          text: 'Resource has been deleted',
          timer: 2000,
          showConfirmButton: false
        });
      } catch (error: any) {
        Swal.fire('Error', this.extractErrorMessage(error), 'error');
      }
    }
  }

  // ============================================
  // Notes Management
  // ============================================
  
  openAddNote(): void {
    this.editingNote = null;
    this.noteForm = {
      title: '',
      content: '',
      isFavorite: false
    };
    this.isNoteFormOpen = true;
  }

  openEditNote(note: any): void {
    this.editingNote = note;
    this.noteForm = {
      title: note.title || '',
      content: note.content || '',
      isFavorite: note.isFavorite || false
    };
    this.isNoteFormOpen = true;
  }

  closeNoteForm(): void {
    this.isNoteFormOpen = false;
    this.editingNote = null;
    this.noteForm = {
      title: '',
      content: '',
      isFavorite: false
    };
  }

  async saveNote(): Promise<void> {
    try {
      if (!this.noteForm.title?.trim()) {
        Swal.fire('Error', 'Please enter note title', 'error');
        return;
      }

      Swal.fire({
        title: 'Saving...',
        text: 'Please wait',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });

      if (this.editingNote) {
        await this.contentService.updateNote(
          this.editingNote.id,
          this.noteForm.title,
          this.noteForm.content
        ).toPromise();
      } else {
        await this.contentService.addNote(
          this.lessonId,
          this.noteForm.title,
          this.noteForm.content
        ).toPromise();
      }

      await this.loadNotes();
      this.closeNoteForm();

      Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: `Note ${this.editingNote ? 'updated' : 'added'} successfully`,
        timer: 2000,
        showConfirmButton: false
      });
    } catch (error: any) {
      Swal.fire('Error', this.extractErrorMessage(error), 'error');
    }
  }

  async deleteNote(note: any): Promise<void> {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to delete this note?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        Swal.fire({
          title: 'Deleting...',
          text: 'Please wait',
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading()
        });

        await this.contentService.deleteNote(note.id).toPromise();
        await this.loadNotes();

        Swal.fire({
          icon: 'success',
          title: 'Deleted!',
          text: 'Note has been deleted',
          timer: 2000,
          showConfirmButton: false
        });
      } catch (error: any) {
        Swal.fire('Error', this.extractErrorMessage(error), 'error');
      }
    }
  }

  async toggleNoteFavorite(note: any): Promise<void> {
    try {
      await this.contentService.toggleNoteFavorite(note.id).toPromise();
      await this.loadNotes();
    } catch (error: any) {
      Swal.fire('Error', this.extractErrorMessage(error), 'error');
    }
  }

  // ============================================
  // Questions Management
  // ============================================
  
  openAddQuestion(): void {
    this.editingQuestion = null;
    this.questionForm = {
      questionText: '',
      questionType: 'MultipleChoice',
      points: 1,
      options: [
        { optionText: '', isCorrect: false },
        { optionText: '', isCorrect: false },
        { optionText: '', isCorrect: false },
        { optionText: '', isCorrect: false }
      ]
    };
    this.isQuestionFormOpen = true;
  }

  openEditQuestion(question: any): void {
    this.editingQuestion = question;
    this.questionForm = {
      questionText: question.questionText || '',
      questionType: question.questionType || 'MultipleChoice',
      points: question.points || 1,
      options: question.options ? [...question.options] : [
        { optionText: '', isCorrect: false },
        { optionText: '', isCorrect: false }
      ]
    };
    this.isQuestionFormOpen = true;
  }

  closeQuestionForm(): void {
    this.isQuestionFormOpen = false;
    this.editingQuestion = null;
  }

  addOption(): void {
    this.questionForm.options.push({ optionText: '', isCorrect: false });
  }

  removeOption(index: number): void {
    if (this.questionForm.options.length > 2) {
      this.questionForm.options.splice(index, 1);
    }
  }

  async saveQuestion(): Promise<void> {
    try {
      if (!this.questionForm.questionText?.trim()) {
        Swal.fire('Error', 'Please enter question text', 'error');
        return;
      }

      if (this.questionForm.questionType === 'MultipleChoice') {
        const validOptions = this.questionForm.options.filter((opt: any) => opt.optionText.trim());
        if (validOptions.length < 2) {
          Swal.fire('Error', 'Please add at least 2 options', 'error');
          return;
        }
        const correctOptions = this.questionForm.options.filter((opt: any) => opt.isCorrect);
        if (correctOptions.length === 0) {
          Swal.fire('Error', 'Please mark at least one option as correct', 'error');
          return;
        }
      }

      Swal.fire({
        title: 'Saving...',
        text: 'Please wait',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });

      if (this.editingQuestion) {
        await this.contentService.updateLessonQuestion(
          this.editingQuestion.id,
          this.questionForm.questionText,
          this.questionForm.questionType,
          this.questionForm.points,
          this.questionForm.options.filter((opt: any) => opt.optionText.trim())
        ).toPromise();
      } else {
        await this.contentService.addLessonQuestion(
          this.lessonId,
          this.questionForm.questionText,
          this.questionForm.questionType,
          this.questionForm.points,
          this.questionForm.options.filter((opt: any) => opt.optionText.trim())
        ).toPromise();
      }

      await this.loadQuestions();
      this.closeQuestionForm();

      Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: `Question ${this.editingQuestion ? 'updated' : 'added'} successfully`,
        timer: 2000,
        showConfirmButton: false
      });
    } catch (error: any) {
      Swal.fire('Error', this.extractErrorMessage(error), 'error');
    }
  }

  async deleteQuestion(question: any): Promise<void> {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to delete this question?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        Swal.fire({
          title: 'Deleting...',
          text: 'Please wait',
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading()
        });

        await this.contentService.deleteLessonQuestion(question.id).toPromise();
        await this.loadQuestions();

        Swal.fire({
          icon: 'success',
          title: 'Deleted!',
          text: 'Question has been deleted',
          timer: 2000,
          showConfirmButton: false
        });
      } catch (error: any) {
        Swal.fire('Error', this.extractErrorMessage(error), 'error');
      }
    }
  }

  // ============================================
  // Discussions Management
  // ============================================
  
  openAddDiscussion(): void {
    this.editingDiscussion = null;
    this.discussionForm = {
      question: '',
      details: ''
    };
    this.isDiscussionFormOpen = true;
  }

  closeDiscussionForm(): void {
    this.isDiscussionFormOpen = false;
    this.editingDiscussion = null;
  }

  async saveDiscussion(): Promise<void> {
    try {
      if (!this.discussionForm.question?.trim()) {
        Swal.fire('Error', 'Please enter discussion question', 'error');
        return;
      }

      Swal.fire({
        title: 'Saving...',
        text: 'Please wait',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });

      await this.contentService.addLessonDiscussion(
        this.lessonId,
        this.discussionForm.question,
        this.discussionForm.details
      ).toPromise();

      await this.loadDiscussions();
      this.closeDiscussionForm();

      Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: 'Discussion added successfully',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (error: any) {
      Swal.fire('Error', this.extractErrorMessage(error), 'error');
    }
  }

  async deleteDiscussion(discussion: any): Promise<void> {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to delete this discussion?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        Swal.fire({
          title: 'Deleting...',
          text: 'Please wait',
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading()
        });

        await this.contentService.deleteLessonDiscussion(discussion.id).toPromise();
        await this.loadDiscussions();

        Swal.fire({
          icon: 'success',
          title: 'Deleted!',
          text: 'Discussion has been deleted',
          timer: 2000,
          showConfirmButton: false
        });
      } catch (error: any) {
        Swal.fire('Error', this.extractErrorMessage(error), 'error');
      }
    }
  }

  // ============================================
  // Exams Management
  // ============================================
  
  openAddExam(): void {
    this.editingExam = null;
    this.examForm = {
      title: '',
      description: '',
      duration: 60,
      totalMarks: 100,
      passingMarks: 50,
      examDate: new Date().toISOString().split('T')[0]
    };
    this.isExamFormOpen = true;
  }

  openEditExam(exam: any): void {
    this.editingExam = exam;
    this.examForm = {
      title: exam.title || '',
      description: exam.description || '',
      duration: exam.duration || 60,
      totalMarks: exam.totalMarks || 100,
      passingMarks: exam.passingMarks || 50,
      examDate: exam.examDate ? new Date(exam.examDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
    };
    this.isExamFormOpen = true;
  }

  closeExamForm(): void {
    this.isExamFormOpen = false;
    this.editingExam = null;
  }

  async saveExam(): Promise<void> {
    try {
      if (!this.examForm.title?.trim()) {
        Swal.fire('Error', 'Please enter exam title', 'error');
        return;
      }

      Swal.fire({
        title: 'Saving...',
        text: 'Please wait',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });

      if (this.editingExam) {
        await this.contentService.updateExam(
          this.editingExam.id,
          this.examForm.title,
          this.examForm.description,
          this.examForm.duration,
          this.examForm.totalMarks,
          this.examForm.passingMarks,
          this.examForm.examDate
        ).toPromise();
      } else {
        await this.contentService.addExam(
          this.lessonId,
          this.examForm.title,
          this.examForm.description,
          this.examForm.duration,
          this.examForm.totalMarks,
          this.examForm.passingMarks,
          this.examForm.examDate
        ).toPromise();
      }

      await this.loadExams();
      this.closeExamForm();

      Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: `Exam ${this.editingExam ? 'updated' : 'added'} successfully`,
        timer: 2000,
        showConfirmButton: false
      });
    } catch (error: any) {
      Swal.fire('Error', this.extractErrorMessage(error), 'error');
    }
  }

  async deleteExam(exam: any): Promise<void> {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to delete this exam?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        Swal.fire({
          title: 'Deleting...',
          text: 'Please wait',
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading()
        });

        await this.contentService.deleteExam(exam.id).toPromise();
        await this.loadExams();

        Swal.fire({
          icon: 'success',
          title: 'Deleted!',
          text: 'Exam has been deleted',
          timer: 2000,
          showConfirmButton: false
        });
      } catch (error: any) {
        Swal.fire('Error', this.extractErrorMessage(error), 'error');
      }
    }
  }

  // ============================================
  // Chapters Management
  // ============================================
  
  openAddChapter(): void {
    this.editingChapter = null;
    this.chapterForm = {
      title: '',
      description: '',
      startTime: '00:00:00',
      endTime: '00:00:00',
      orderIndex: this.chapters.length
    };
    this.isChapterFormOpen = true;
  }

  openEditChapter(chapter: any): void {
    this.editingChapter = chapter;
    this.chapterForm = {
      title: chapter.title || '',
      description: chapter.description || '',
      startTime: chapter.startTime || '00:00:00',
      endTime: chapter.endTime || '00:00:00',
      orderIndex: chapter.orderIndex || 0
    };
    this.isChapterFormOpen = true;
  }

  closeChapterForm(): void {
    this.isChapterFormOpen = false;
    this.editingChapter = null;
  }

  async saveChapter(): Promise<void> {
    try {
      if (!this.chapterForm.title?.trim()) {
        Swal.fire('Error', 'Please enter chapter title', 'error');
        return;
      }

      Swal.fire({
        title: 'Saving...',
        text: 'Please wait',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });

      if (this.editingChapter) {
        await this.contentService.updateChapter(
          this.editingChapter.id,
          this.chapterForm.title,
          this.chapterForm.description,
          this.chapterForm.startTime,
          this.chapterForm.endTime,
          this.chapterForm.orderIndex
        ).toPromise();
      } else {
        await this.contentService.addChapter(
          this.lessonId,
          this.chapterForm.title,
          this.chapterForm.description,
          this.chapterForm.startTime,
          this.chapterForm.endTime,
          this.chapterForm.orderIndex
        ).toPromise();
      }

      await this.loadChapters();
      this.closeChapterForm();

      Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: `Chapter ${this.editingChapter ? 'updated' : 'added'} successfully`,
        timer: 2000,
        showConfirmButton: false
      });
    } catch (error: any) {
      Swal.fire('Error', this.extractErrorMessage(error), 'error');
    }
  }

  async deleteChapter(chapter: any): Promise<void> {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to delete this chapter?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        Swal.fire({
          title: 'Deleting...',
          text: 'Please wait',
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading()
        });

        await this.contentService.deleteChapter(chapter.id).toPromise();
        await this.loadChapters();

        Swal.fire({
          icon: 'success',
          title: 'Deleted!',
          text: 'Chapter has been deleted',
          timer: 2000,
          showConfirmButton: false
        });
      } catch (error: any) {
        Swal.fire('Error', this.extractErrorMessage(error), 'error');
      }
    }
  }

  // ============================================
  // File Handling
  // ============================================
  
  onFileChange(event: any, field: string): void {
    const file = event.target.files?.[0];
    if (file) {
      if (field === 'resource') {
        this.resourceForm.file = file;
      } else if (field === 'posterFile') {
        this.lessonEditForm.posterFile = file;
      } else if (field === 'videoFile') {
        this.lessonEditForm.videoFile = file;
      }
    }
  }

  getFileName(field: string): string {
    if (field === 'resource' && this.resourceForm.file) {
      return this.resourceForm.file.name;
    } else if (field === 'posterFile' && this.lessonEditForm.posterFile) {
      return this.lessonEditForm.posterFile.name;
    } else if (field === 'videoFile' && this.lessonEditForm.videoFile) {
      return this.lessonEditForm.videoFile.name;
    }
    return '';
  }

  // ============================================
  // Helper Methods
  // ============================================
  
  goBack(): void {
    this.router.navigate(['/admin/content-management']);
  }

  private extractErrorMessage(error: any): string {
    if (error?.error?.message) {
      return error.error.message;
    }
    if (error?.error?.errors) {
      const errors = error.error.errors;
      const firstKey = Object.keys(errors)[0];
      if (firstKey && Array.isArray(errors[firstKey])) {
        return errors[firstKey][0];
      }
    }
    if (error?.message) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    return 'An unexpected error occurred';
  }
}
