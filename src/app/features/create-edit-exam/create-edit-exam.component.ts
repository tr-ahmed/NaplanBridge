/**
 * Create/Edit Exam Component
 * Multi-step form for creating or editing exams with questions
 */

import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { ExamService } from '../../core/services/exam.service';
import { SubjectService } from '../../core/services/subject.service';
import { AuthService } from '../../auth/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { ExamType, QuestionType, CreateExamDto, ExamQuestion } from '../../models/exam.models';
import { Subject } from '../../models/subject.models';

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
  private examService = inject(ExamService);
  private subjectService = inject(SubjectService);
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

  // Forms
  examForm!: FormGroup;

  // Data
  subjects = signal<Subject[]>([]);
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

      // ✅ Check if user has Teacher role (could be string or array)
      const userRoles = Array.isArray(currentUser.role) ? currentUser.role : [currentUser.role];
      const isTeacher = userRoles.includes('Teacher');

      if (isTeacher) {
        this.loadSubjects();
        this.checkEditMode();
      } else {
        console.warn('⚠️ User is not a Teacher. Roles:', userRoles);
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
   * Check if we're in edit mode
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
   * Load exam data for editing
   */
  private loadExamData(examId: number): void {
    this.loading.set(true);

    // Mock data for now
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
  }

  /**
   * Patch form with exam data
   */
  private patchFormData(exam: any): void {
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

    this.saving.set(true);
    this.examForm.patchValue({ isPublished: publish });

    const examData: CreateExamDto = {
      ...this.examForm.value,
      teacherId: this.teacherId,
      isPublished: publish
    };

    console.log('💾 Saving Exam Data:', examData);

    if (this.isEditMode() && this.examId) {
      // ✅ UPDATE exam
      this.examService.updateExam(this.examId, examData).subscribe({
        next: (response) => {
          console.log('✅ Exam updated successfully:', response);
          this.saving.set(false);
          this.toastService.showSuccess('Exam updated and published successfully!');
          this.router.navigate(['/teacher/exams']);
        },
        error: (error) => {
          console.error('❌ Error updating exam:', error);
          this.saving.set(false);
          this.toastService.showError('Failed to update exam');
        }
      });
    } else {
      // ✅ CREATE new exam
      this.examService.createExam(examData).subscribe({
        next: (response) => {
          console.log('✅ Exam created successfully:', response);
          this.saving.set(false);
          this.toastService.showSuccess('Exam created and published successfully!');
          this.router.navigate(['/teacher/exams']);
        },
        error: (error) => {
          console.error('❌ Error creating exam:', error);
          this.saving.set(false);
          this.toastService.showError('Failed to create exam');
        }
      });
    }
  }

  /**
   * Cancel and go back
   */
  cancel(): void {
    if (confirm('Are you sure? Any unsaved changes will be lost.')) {
      this.router.navigate(['/teacher/exams']);
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
}
