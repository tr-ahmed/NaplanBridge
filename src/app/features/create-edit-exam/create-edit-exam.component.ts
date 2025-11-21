/**
 * Create/Edit Exam Component
 * Multi-step form for creating or editing exams with questions
 */

import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { ExamApiService } from '../../core/services/exam-api.service';
import { SubjectService } from '../../core/services/subject.service';
import { CategoryService } from '../../core/services/category.service';
import { AuthService } from '../../auth/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { ExamType, QuestionType, CreateExamDto, CreateQuestionDto } from '../../models/exam-api.models';
import { Subject } from '../../models/subject.models';
import { Year } from '../../models/category.models';

type FormStep = 'basic' | 'questions' | 'settings' | 'preview';

@Component({
  selector: 'app-create-edit-exam',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './create-edit-exam.component.html',
  styleUrl: './create-edit-exam.component.scss'
})
export class CreateEditExamComponent implements OnInit {
  // Services
  private fb = inject(FormBuilder);
  private examApi = inject(ExamApiService);
  private subjectService = inject(SubjectService);
  private categoryService = inject(CategoryService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // State
  loading = signal<boolean>(false);
  saving = signal<boolean>(false);
  currentStep = signal<FormStep>('basic');
  isEditMode = signal<boolean>(false);
  examId: number | null = null;
  isAdminRoute: boolean = false;  // Track if accessing from admin or teacher route
  originalQuestionsCount: number = 0;  // Track original questions count when editing

  // Forms
  examForm!: FormGroup;

  // Data
  subjects = signal<Subject[]>([]);
  years = signal<Year[]>([]);
  teacherId: number = 0;

  // Enums for template
  examTypes: ExamType[] = [ExamType.Lesson, ExamType.Monthly, ExamType.Term];
  questionTypes: QuestionType[] = [QuestionType.Text, QuestionType.MultipleChoice, QuestionType.MultipleSelect, QuestionType.TrueFalse];

  ngOnInit(): void {
    const currentUser = this.authService.getCurrentUser();

    // ✅ Initialize form first regardless
    this.initForm();

    if (currentUser) {
      this.teacherId = currentUser.id;

      // ✅ Check if user has Teacher or Admin role (could be string or array)
      const userRoles = Array.isArray(currentUser.role) ? currentUser.role : [currentUser.role];
      const isTeacherOrAdmin = userRoles.includes('Teacher') || userRoles.includes('Admin') || userRoles.includes('admin');

      if (isTeacherOrAdmin) {
        this.loadSubjects();
        this.loadYears();
        this.checkEditMode();
      } else {
        console.warn('⚠️ User is not a Teacher or Admin. Roles:', userRoles);
        this.router.navigate(['/login']);
      }
    } else {
      console.error('❌ No user found');
      this.router.navigate(['/login']);
    }
  }

  /**
   * Initialize form with validation
   */
  private initForm(): void {
    this.examForm = this.fb.group({
      // Basic Info
      title: ['', [Validators.required, Validators.minLength(5)]],
      description: [''],
      examType: ['Lesson', Validators.required],
      subjectId: [null, Validators.required],
      yearId: [null, Validators.required],  // ✅ NEW: Year is required
      termId: [null],
      weekId: [null],
      lessonId: [null],

      // Timing
      durationInMinutes: [60, [Validators.required, Validators.min(5)]],
      startTime: [''],
      endTime: [''],

      // Questions
      questions: this.fb.array([]),

      // Settings
      totalMarks: [100, [Validators.required, Validators.min(1)]],
      passingMarks: [50, [Validators.required, Validators.min(0)]],
      allowLateSubmission: [false],
      shuffleQuestions: [false],
      showResults: [true],
      allowReview: [true],
      maxAttempts: [1, [Validators.required, Validators.min(1)]],
      isPublished: [false]
    });

    // Add initial question
    this.addQuestion();
  }

  /**
   * Check if we're in edit mode and which route we're on
   */
  private checkEditMode(): void {
    this.route.params.subscribe(params => {
      const id = params['id'];
      if (id) {
        this.examId = +id;
        this.isEditMode.set(true);
        this.loadExamData(this.examId);
      }
    });

    // Detect if we're on admin or teacher route
    this.route.url.subscribe(urlSegments => {
      const fullPath = urlSegments.map(s => s.path).join('/');
      this.isAdminRoute = fullPath.includes('admin');
      console.log('📍 Route detected:', fullPath, 'Is Admin:', this.isAdminRoute);
    });
  }

  /**
   * Load subjects
   */
  private loadSubjects(): void {
    this.subjectService.getSubjects().subscribe({
      next: (response) => {
        this.subjects.set(response.items);
      },
      error: (err: any) => {
        console.error('Failed to load subjects:', err);
        this.toastService.showError('Failed to load subjects');
      }
    });
  }

  /**
   * Load academic years
   */
  private loadYears(): void {
    this.categoryService.getYears().subscribe({
      next: (years) => {
        this.years.set(years);
      },
      error: (err: any) => {
        console.error('Failed to load years:', err);
        this.toastService.showError('Failed to load years');
      }
    });
  }

  /**
   * Load exam data for editing
   */
  private loadExamData(examId: number): void {
    this.loading.set(true);

    this.examApi.getExamById(examId).subscribe({
      next: (exam) => {
        this.patchFormData(exam);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load exam:', err);
        this.toastService.showError('Failed to load exam data');
        this.loading.set(false);
      }
    });

    /* OLD MOCK CODE - Now using real API
    setTimeout(() => {
      const mockExam = {
        id: examId,
        title: 'Math Week 3 - Algebra Quiz',
        description: 'Test your knowledge of basic algebra',
        examType: ExamType.Lesson,
        subjectId: 1,
        yearId: 1,  // ✅ NEW: Year 1
        termId: 1,
        weekId: 3,
        lessonId: 15,
        durationInMinutes: 45,
        startTime: '2025-10-30T10:00',
        endTime: '2025-10-30T23:59',
        totalMarks: 50,
        passingMarks: 25,
        allowLateSubmission: false,
        shuffleQuestions: true,
        showResults: true,
        allowReview: true,
        maxAttempts: 1,
        isPublished: true,
        questions: [
          {
            questionText: 'Solve for x: 2x + 5 = 15',
            questionType: QuestionType.Text,
            marks: 10,
            order: 1,
            options: []
          },
          {
            questionText: 'What is 2 + 2?',
            questionType: QuestionType.MultipleChoice,
            marks: 5,
            order: 2,
            options: [
              { optionText: '3', isCorrect: false },
              { optionText: '4', isCorrect: true },
              { optionText: '5', isCorrect: false },
              { optionText: '6', isCorrect: false }
            ]
          }
        ]
      };

      this.patchFormData(mockExam);
      this.loading.set(false);
    }, 500);
    */
  }

  /**
   * Patch form with exam data
   */
  private patchFormData(exam: any): void {
    // Track original questions count for detecting new questions in edit mode
    this.originalQuestionsCount = exam.questions?.length || 0;

    this.examForm.patchValue({
      title: exam.title,
      description: exam.description,
      examType: exam.examType,
      subjectId: exam.subjectId,
      yearId: exam.yearId,  // ✅ NEW: Load yearId from exam data
      termId: exam.termId,
      weekId: exam.weekId,
      lessonId: exam.lessonId,
      durationInMinutes: exam.durationInMinutes,
      startTime: exam.startTime,
      endTime: exam.endTime,
      totalMarks: exam.totalMarks,
      passingMarks: exam.passingMarks,
      allowLateSubmission: exam.allowLateSubmission,
      shuffleQuestions: exam.shuffleQuestions,
      showResults: exam.showResults,
      allowReview: exam.allowReview,
      maxAttempts: exam.maxAttempts,
      isPublished: exam.isPublished
    });

    // Clear default questions and add loaded ones
    this.questions.clear();
    exam.questions.forEach((q: any) => {
      const questionGroup = this.createQuestionGroup();
      questionGroup.patchValue({
        questionText: q.questionText,
        questionType: q.questionType,
        marks: q.marks,
        order: q.order
      });

      // Add options
      const optionsArray = questionGroup.get('options') as FormArray;
      optionsArray.clear();

      // If TrueFalse and no options, add default True/False
      if (q.questionType === 'TrueFalse' && (!q.options || q.options.length === 0)) {
        optionsArray.push(this.fb.group({
          optionText: ['True', Validators.required],
          isCorrect: [false]
        }));
        optionsArray.push(this.fb.group({
          optionText: ['False', Validators.required],
          isCorrect: [false]
        }));
      } else {
        // Load existing options
        q.options?.forEach((opt: any) => {
          optionsArray.push(this.fb.group({
            optionText: [opt.optionText, Validators.required],
            isCorrect: [opt.isCorrect]
          }));
        });
      }

      this.questions.push(questionGroup);
    });
  }

  /**
   * Get questions FormArray
   */
  get questions(): FormArray {
    return this.examForm.get('questions') as FormArray;
  }

  /**
   * Get options for a question
   */
  getOptions(questionIndex: number): FormArray {
    return this.questions.at(questionIndex).get('options') as FormArray;
  }

  /**
   * Create question form group
   */
  private createQuestionGroup(): FormGroup {
    return this.fb.group({
      questionText: ['', [Validators.required, Validators.minLength(5)]],
      questionType: ['MultipleChoice', Validators.required],
      marks: [5, [Validators.required, Validators.min(1)]],
      order: [this.questions.length + 1],
      options: this.fb.array([])
    });
  }

  /**
   * Add new question
   */
  addQuestion(): void {
    const questionGroup = this.createQuestionGroup();
    this.questions.push(questionGroup);

    // Add default options for MCQ, MultiSelect, and TrueFalse
    const questionType = questionGroup.get('questionType')?.value;
    const questionIndex = this.questions.length - 1;

    if (questionType === 'MultipleChoice' || questionType === 'MultipleSelect') {
      this.addOption(questionIndex);
      this.addOption(questionIndex);
    } else if (questionType === 'TrueFalse') {
      // Add True and False options for TrueFalse questions
      const options = this.getOptions(questionIndex);
      options.push(this.fb.group({
        optionText: ['True'],
        isCorrect: [false]
      }));
      options.push(this.fb.group({
        optionText: ['False'],
        isCorrect: [false]
      }));
    }
  }

  /**
   * Remove question
   */
  removeQuestion(index: number): void {
    if (this.questions.length > 1) {
      this.questions.removeAt(index);
      this.updateQuestionOrders();
    } else {
      this.toastService.showError('Exam must have at least one question');
    }
  }

  /**
   * Update question orders
   */
  private updateQuestionOrders(): void {
    this.questions.controls.forEach((control, index) => {
      control.get('order')?.setValue(index + 1);
    });
  }

  /**
   * Add option to question
   */
  addOption(questionIndex: number): void {
    const options = this.getOptions(questionIndex);
    options.push(this.fb.group({
      optionText: ['', Validators.required],
      isCorrect: [false]
    }));
  }

  /**
   * Remove option
   */
  removeOption(questionIndex: number, optionIndex: number): void {
    const options = this.getOptions(questionIndex);
    if (options.length > 2) {
      options.removeAt(optionIndex);
    } else {
      this.toastService.showError('Question must have at least 2 options');
    }
  }

  /**
   * Handle question type change
   */
  onQuestionTypeChange(questionIndex: number, newType: QuestionType): void {
    const question = this.questions.at(questionIndex);
    const options = this.getOptions(questionIndex);

    question.get('questionType')?.setValue(newType);

    // Clear and setup options based on type
    options.clear();

    if (newType === QuestionType.MultipleChoice || newType === QuestionType.MultipleSelect) {
      // Add 4 default options
      for (let i = 0; i < 4; i++) {
        this.addOption(questionIndex);
      }
    } else if (newType === QuestionType.TrueFalse) {
      // Add True/False options
      options.push(this.fb.group({
        optionText: ['True', Validators.required],
        isCorrect: [false]
      }));
      options.push(this.fb.group({
        optionText: ['False', Validators.required],
        isCorrect: [false]
      }));
    }
  }

  /**
   * Navigate to step
   */
  goToStep(step: FormStep): void {
    // Validate current step before moving
    if (this.currentStep() === 'basic' && step !== 'basic') {
      if (!this.validateBasicInfo()) {
        return;
      }
    }

    if (this.currentStep() === 'questions' && step !== 'basic' && step !== 'questions') {
      if (!this.validateQuestions()) {
        return;
      }
    }

    this.currentStep.set(step);
  }

  /**
   * Validate basic info
   */
  private validateBasicInfo(): boolean {
    const basicControls = ['title', 'examType', 'subjectId', 'durationInMinutes'];
    let isValid = true;

    basicControls.forEach(controlName => {
      const control = this.examForm.get(controlName);
      if (control && control.invalid) {
        control.markAsTouched();
        isValid = false;
      }
    });

    if (!isValid) {
      this.toastService.showError('Please fill all required basic information');
    }

    return isValid;
  }

  /**
   * Validate questions
   */
  private validateQuestions(): boolean {
    if (this.questions.length === 0) {
      this.toastService.showError('Exam must have at least one question');
      return false;
    }

    let isValid = true;
    this.questions.controls.forEach((question, index) => {
      const questionFormGroup = question as FormGroup;

      console.log(`🔍 Validating Question ${index + 1}:`, {
        questionText: question.get('questionText')?.value,
        questionType: question.get('questionType')?.value,
        invalid: question.invalid,
        errors: question.errors
      });

      if (question.invalid) {
        console.warn(`⚠️ Question ${index + 1} is INVALID - Errors:`, question.errors);

        // Log each control's errors
        Object.keys(questionFormGroup.controls).forEach(key => {
          const control = questionFormGroup.get(key);
          if (control?.invalid) {
            console.warn(`  ❌ ${key}: invalid=${control.invalid}, errors=`, control.errors);
          }
        });

        question.markAllAsTouched();
        isValid = false;
      }

      const questionType = question.get('questionType')?.value;
      if (questionType !== 'Text') {
        const options = this.getOptions(index);
        console.log(`📝 Question ${index + 1} Options:`,
          options.controls.map(opt => ({
            text: opt.get('optionText')?.value,
            isCorrect: opt.get('isCorrect')?.value
          }))
        );

        const hasCorrectAnswer = options.controls.some(opt => opt.get('isCorrect')?.value);

        if (!hasCorrectAnswer) {
          console.error(`❌ Question ${index + 1} has NO correct answer!`);
          this.toastService.showError(`Question ${index + 1} must have at least one correct answer`);
          isValid = false;
        } else {
          console.log(`✅ Question ${index + 1} has correct answer!`);
        }
      }
    });

    if (!isValid) {
      this.toastService.showError('Please fix question errors');
    }

    return isValid;
  }

  /**
   * Calculate total marks
   */
  calculateTotalMarks(): number {
    return this.questions.controls.reduce((total, question) => {
      return total + (question.get('marks')?.value || 0);
    }, 0);
  }

  /**
   * Save exam
   */
  saveExam(publish: boolean = false): void {
    if (this.examForm.invalid) {
      this.examForm.markAllAsTouched();
      this.toastService.showError('Please fix all errors before saving');
      return;
    }

    if (!this.validateQuestions()) {
      return;
    }

    // ✅ Validate required IDs before submitting
    const formValue = this.examForm.value;
    if (!formValue.subjectId) {
      this.toastService.showError('Please select a subject');
      this.currentStep.set('basic');
      return;
    }

    if (!formValue.yearId) {
      this.toastService.showError('Please select a year');
      this.currentStep.set('basic');
      return;
    }

    this.saving.set(true);
    this.examForm.patchValue({ isPublished: publish });

    // Transform form data to match CreateExamDto structure
    // ✅ Ensure all IDs are converted to numbers (handles both string and number inputs)
    const examData: CreateExamDto = {
      title: formValue.title,
      description: formValue.description || '',
      examType: formValue.examType,
      subjectId: Number(formValue.subjectId), // ✅ Convert to number
      termId: formValue.termId ? Number(formValue.termId) : null,
      lessonId: formValue.lessonId ? Number(formValue.lessonId) : null,
      weekId: formValue.weekId ? Number(formValue.weekId) : null,
      yearId: formValue.yearId ? Number(formValue.yearId) : null,
      durationInMinutes: Number(formValue.durationInMinutes), // ✅ Convert to number
      totalMarks: Number(formValue.totalMarks), // ✅ Convert to number
      passingMarks: Number(formValue.passingMarks), // ✅ Convert to number
      // ✅ Convert datetime-local to ISO 8601 format or set to null
      startTime: formValue.startTime ? new Date(formValue.startTime).toISOString() : null,
      endTime: formValue.endTime ? new Date(formValue.endTime).toISOString() : null,
      isPublished: publish,
      questions: formValue.questions.map((q: any, index: number) => ({
        questionText: q.questionText,
        questionType: q.questionType,
        marks: Number(q.marks), // ✅ Convert to number
        order: index + 1,
        isMultipleSelect: q.questionType === 'MultipleSelect',
        options: q.options?.map((opt: any, optIndex: number) => ({
          optionText: opt.optionText,
          isCorrect: opt.isCorrect,
          order: optIndex + 1
        })) || []
      }))
    };

    console.log('💾 Saving Exam Data:', examData);

    if (this.isEditMode() && this.examId) {
      // ✅ UPDATE exam
      this.examApi.updateExam(this.examId, examData).subscribe({
        next: (response) => {
          console.log('✅ Exam updated successfully:', response);

          // Check if there are new questions to add
          const currentQuestionsCount = this.questions.length;
          if (currentQuestionsCount > this.originalQuestionsCount) {
            console.log(`📌 Found ${currentQuestionsCount - this.originalQuestionsCount} new questions to add`);
            this.addNewQuestions();
          } else {
            this.completeExamSave();
          }
        },
        error: (error) => {
          console.error('❌ Error updating exam:', error);
          this.saving.set(false);

          // ✅ Enhanced error handling
          let errorMessage = 'Failed to update exam';

          if (error.error?.message) {
            errorMessage = error.error.message;
          } else if (error.error?.error) {
            errorMessage = error.error.error;
          }

          this.toastService.showError(errorMessage);
        }
      });
    } else {
      // ✅ CREATE new exam
      this.examApi.createExam(examData).subscribe({
        next: (response) => {
          console.log('✅ Exam created successfully:', response);
          this.examId = response.id; // Store the created exam ID
          this.completeExamSave();
        },
        error: (error) => {
          console.error('❌ Error creating exam:', error);
          this.saving.set(false);

          // ✅ Enhanced error handling with detailed messages
          let errorMessage = 'Failed to create exam';

          if (error.error) {
            // Check for specific error messages from backend
            if (error.error.message) {
              errorMessage = error.error.message;
            } else if (error.error.error) {
              errorMessage = error.error.error;
            } else if (typeof error.error === 'string') {
              errorMessage = error.error;
            }

            // Handle validation errors
            if (error.error.errors) {
              const validationErrors = Object.values(error.error.errors).flat();
              if (validationErrors.length > 0) {
                errorMessage = validationErrors.join(', ');
              }
            }
          }

          // Show specific error messages
          if (errorMessage.includes('Subject') && errorMessage.includes('does not exist')) {
            this.toastService.showError('Invalid subject selected. Please choose a valid subject.');
            this.currentStep.set('basic');
          } else if (errorMessage.includes('Term') && errorMessage.includes('does not exist')) {
            this.toastService.showError('Invalid term selected. Please choose a valid term or leave empty.');
            this.currentStep.set('basic');
          } else if (errorMessage.includes('Lesson') && errorMessage.includes('does not exist')) {
            this.toastService.showError('Invalid lesson selected. Please choose a valid lesson or leave empty.');
            this.currentStep.set('basic');
          } else if (errorMessage.includes('DateTime')) {
            this.toastService.showError('Invalid date/time format. Please check start and end times.');
            this.currentStep.set('settings');
          } else {
            this.toastService.showError(errorMessage);
          }

          console.error('📋 Full error details:', error);
        }
      });
    }
  }

  /**
   * Cancel and go back
   */
  cancel(): void {
    if (confirm('Are you sure? Any unsaved changes will be lost.')) {
      const redirectPath = this.isAdminRoute ? '/admin/exams' : '/teacher/exams';
      this.router.navigate([redirectPath]);
    }
  }

  /**
   * Check if field has error
   */
  hasError(fieldName: string): boolean {
    if (!this.examForm) {
      return false;
    }
    const control = this.examForm.get(fieldName);
    return !!(control && control.invalid && control.touched);
  }

  /**
   * Get error message
   */
  getErrorMessage(fieldName: string): string {
    if (!this.examForm) {
      return '';
    }
    const control = this.examForm.get(fieldName);
    if (!control || !control.errors) return '';

    if (control.errors['required']) return 'This field is required';
    if (control.errors['minlength']) return `Minimum length is ${control.errors['minlength'].requiredLength}`;
    if (control.errors['min']) return `Minimum value is ${control.errors['min'].min}`;

    return 'Invalid value';
  }

  /**
   * Add new questions to exam (for edit mode)
   */
  private addNewQuestions(): void {
    const newQuestionsToAdd = this.questions.controls.slice(this.originalQuestionsCount);
    let addedCount = 0;
    const totalToAdd = newQuestionsToAdd.length;

    if (totalToAdd === 0) {
      this.completeExamSave();
      return;
    }

    newQuestionsToAdd.forEach((questionControl: any, index: number) => {
      const questionValue = (questionControl as FormGroup).value;
      const questionData = {
        questionText: questionValue.questionText,
        questionType: questionValue.questionType,
        marks: questionValue.marks,
        order: this.originalQuestionsCount + index + 1,
        isMultipleSelect: questionValue.questionType === 'MultipleSelect',
        options: questionValue.options || []
      };

      console.log(`➕ Adding new question ${index + 1}:`, questionData);

      this.examApi.addQuestion(this.examId!, questionData).subscribe({
        next: (response: any) => {
          console.log(`✅ Question ${index + 1} added successfully`, response);
          addedCount++;

          // If all questions added, complete the save
          if (addedCount === totalToAdd) {
            console.log('✅ All new questions added successfully');
            this.completeExamSave();
          }
        },
        error: (error: any) => {
          console.error(`❌ Error adding question ${index + 1}:`, error);
          this.saving.set(false);
          this.toastService.showError(`Failed to add question ${index + 1}`);
        }
      });
    });
  }

  /**
   * Complete exam save and navigate
   */
  private completeExamSave(): void {
    this.saving.set(false);
    this.toastService.showSuccess('Exam saved successfully!');

    // Wait a moment then navigate to reload the list
    const redirectPath = this.isAdminRoute ? '/admin/exams' : '/teacher/exams';
    setTimeout(() => {
      this.router.navigate([redirectPath]);
    }, 500);
  }
}
