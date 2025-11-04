import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ContentService } from '../../core/services/content.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-lesson-detail',
  imports: [CommonModule, FormsModule],
  templateUrl: './lesson-detail.html',
  styleUrl: './lesson-detail.scss'
})
export class LessonDetail implements OnInit {
  lessonId!: number;
  lesson: any = null;
  
  // Tabs
  activeTab: 'overview' | 'questions' | 'discussions' | 'resources' = 'overview';
  
  // Lesson Questions (Quiz)
  lessonQuestions: any[] = [];
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
  isAddingQuestion = false;
  
  // Discussions
  discussions: any[] = [];
  discussionForm: any = {
    question: '',
    details: ''
  };
  isAddingDiscussion = false;
  
  // Resources
  resources: any[] = [];
  resourceForm: any = {
    title: '',
    file: null
  };
  isAddingResource = false;
  
  // Loading states
  isLoading = false;
  isLoadingQuestions = false;
  isLoadingDiscussions = false;
  isLoadingResources = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private contentService: ContentService
  ) {}

  ngOnInit(): void {
    // Get lesson ID from route
    this.route.params.subscribe(params => {
      this.lessonId = +params['id'];
      if (this.lessonId) {
        this.loadLesson();
        this.loadLessonQuestions();
        this.loadDiscussions();
        this.loadResources();
      }
    });
  }

  async loadLesson(): Promise<void> {
    try {
      this.isLoading = true;
      this.lesson = await this.contentService.getLesson(this.lessonId).toPromise();
    } catch (error) {
      console.error('Error loading lesson:', error);
      Swal.fire('Error', 'Failed to load lesson details', 'error');
    } finally {
      this.isLoading = false;
    }
  }

  async loadLessonQuestions(): Promise<void> {
    try {
      this.isLoadingQuestions = true;
      const response: any = await this.contentService.getLessonQuestions(this.lessonId).toPromise();
      this.lessonQuestions = Array.isArray(response) ? response : (response?.items || []);
    } catch (error) {
      console.error('Error loading lesson questions:', error);
    } finally {
      this.isLoadingQuestions = false;
    }
  }

  async loadDiscussions(): Promise<void> {
    try {
      this.isLoadingDiscussions = true;
      const response: any = await this.contentService.getLessonDiscussions(this.lessonId).toPromise();
      this.discussions = Array.isArray(response) ? response : (response?.items || []);
    } catch (error) {
      console.error('Error loading discussions:', error);
    } finally {
      this.isLoadingDiscussions = false;
    }
  }

  async loadResources(): Promise<void> {
    try {
      this.isLoadingResources = true;
      const response: any = await this.contentService.getLessonResources(this.lessonId).toPromise();
      this.resources = Array.isArray(response) ? response : (response?.items || []);
    } catch (error) {
      console.error('Error loading resources:', error);
    } finally {
      this.isLoadingResources = false;
    }
  }

  setActiveTab(tab: 'overview' | 'questions' | 'discussions' | 'resources'): void {
    this.activeTab = tab;
  }

  // ============================================
  // Lesson Questions Management
  // ============================================
  
  openAddQuestion(): void {
    this.isAddingQuestion = true;
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
  }

  closeQuestionForm(): void {
    this.isAddingQuestion = false;
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
      // Validate
      if (!this.questionForm.questionText.trim()) {
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

      await this.contentService.addLessonQuestion(
        this.lessonId,
        this.questionForm.questionText,
        this.questionForm.questionType,
        this.questionForm.points,
        this.questionForm.options.filter((opt: any) => opt.optionText.trim())
      ).toPromise();

      await this.loadLessonQuestions();
      this.closeQuestionForm();

      Swal.fire('Success', 'Question added successfully', 'success');
    } catch (error) {
      console.error('Error saving question:', error);
      Swal.fire('Error', 'Failed to save question', 'error');
    }
  }

  async deleteQuestion(questionId: number): Promise<void> {
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
        await this.contentService.deleteLessonQuestion(questionId).toPromise();
        await this.loadLessonQuestions();
        Swal.fire('Deleted', 'Question deleted successfully', 'success');
      } catch (error) {
        console.error('Error deleting question:', error);
        Swal.fire('Error', 'Failed to delete question', 'error');
      }
    }
  }

  // ============================================
  // Discussions Management
  // ============================================
  
  openAddDiscussion(): void {
    this.isAddingDiscussion = true;
    this.discussionForm = {
      question: '',
      details: ''
    };
  }

  closeDiscussionForm(): void {
    this.isAddingDiscussion = false;
  }

  async saveDiscussion(): Promise<void> {
    try {
      if (!this.discussionForm.question.trim()) {
        Swal.fire('Error', 'Please enter a question', 'error');
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

      Swal.fire('Success', 'Discussion added successfully', 'success');
    } catch (error) {
      console.error('Error saving discussion:', error);
      Swal.fire('Error', 'Failed to save discussion', 'error');
    }
  }

  async deleteDiscussion(discussionId: number): Promise<void> {
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
        await this.contentService.deleteLessonDiscussion(discussionId).toPromise();
        await this.loadDiscussions();
        Swal.fire('Deleted', 'Discussion deleted successfully', 'success');
      } catch (error) {
        console.error('Error deleting discussion:', error);
        Swal.fire('Error', 'Failed to delete discussion', 'error');
      }
    }
  }

  // ============================================
  // Resources Management
  // ============================================
  
  openAddResource(): void {
    this.isAddingResource = true;
    this.resourceForm = {
      title: '',
      file: null
    };
  }

  closeResourceForm(): void {
    this.isAddingResource = false;
  }

  onResourceFileChange(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.resourceForm.file = file;
    }
  }

  async saveResource(): Promise<void> {
    try {
      if (!this.resourceForm.title.trim()) {
        Swal.fire('Validation Error', 'Please enter resource title', 'error');
        return;
      }

      if (!this.resourceForm.file) {
        Swal.fire('Validation Error', 'Please select a file to upload', 'error');
        return;
      }

      // Validate lessonId
      if (!this.lessonId || this.lessonId <= 0) {
        Swal.fire('Error', 'Invalid lesson ID. Please refresh the page.', 'error');
        return;
      }

      // File size validation (max 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (this.resourceForm.file.size > maxSize) {
        Swal.fire('File Too Large', 'Maximum file size is 10MB', 'error');
        return;
      }

      console.log('Uploading resource:', {
        lessonId: this.lessonId,
        title: this.resourceForm.title,
        fileName: this.resourceForm.file.name,
        fileSize: this.resourceForm.file.size,
        fileType: this.resourceForm.file.type
      });

      Swal.fire({
        title: 'Uploading...',
        html: `
          <p>Uploading: <strong>${this.resourceForm.file.name}</strong></p>
          <p class="text-sm text-gray-500">Size: ${(this.resourceForm.file.size / 1024).toFixed(2)} KB</p>
        `,
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });

      // API only accepts Title, LessonId, and File
      await this.contentService.addLessonResource(
        this.lessonId,
        this.resourceForm.title,
        '', // description (not used by API)
        '', // resourceType (not used by API)
        this.resourceForm.file
      ).toPromise();

      await this.loadResources();
      this.closeResourceForm();

      Swal.fire({
        icon: 'success',
        title: 'Upload Successful!',
        text: 'Resource has been added to the lesson',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (error: any) {
      console.error('Error saving resource:', error);
      
      let errorMessage = 'Failed to upload resource. Please try again.';
      let errorTitle = 'Upload Failed';
      
      // Handle different error types
      if (error.status === 500) {
        errorTitle = 'Server Error (500)';
        errorMessage = 'The server encountered an error while processing your upload. This may be due to:\n\n' +
                      '• File type not supported by the server\n' +
                      '• Database or storage issue\n' +
                      '• Invalid lesson ID\n\n' +
                      'Please contact support if this persists.';
      } else if (error.status === 413) {
        errorTitle = 'File Too Large';
        errorMessage = 'The uploaded file exceeds the server\'s size limit.';
      } else if (error.status === 415) {
        errorTitle = 'Unsupported File Type';
        errorMessage = 'The file type you\'re trying to upload is not supported.';
      } else if (error.status === 401 || error.status === 403) {
        errorTitle = 'Access Denied';
        errorMessage = 'You don\'t have permission to upload resources.';
      } else if (error.status === 0) {
        errorTitle = 'Network Error';
        errorMessage = 'Cannot connect to server. Please check your internet connection.';
      }
      
      Swal.fire({
        icon: 'error',
        title: errorTitle,
        text: errorMessage,
        footer: error.error?.traceId ? `<small>Trace ID: ${error.error.traceId}</small>` : undefined
      });
    }
  }

  async deleteResource(resourceId: number): Promise<void> {
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
        await this.contentService.deleteLessonResource(resourceId).toPromise();
        await this.loadResources();
        Swal.fire('Deleted', 'Resource deleted successfully', 'success');
      } catch (error) {
        console.error('Error deleting resource:', error);
        Swal.fire('Error', 'Failed to delete resource', 'error');
      }
    }
  }

  goBack(): void {
    this.router.navigate(['/content-management']);
  }
}

