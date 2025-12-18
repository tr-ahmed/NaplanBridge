import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import {
  TutoringSelectionState,
  TeachingType,
  TutoringPlan,
  TutoringPriceResponse
} from '../../models/tutoring.models';

const STORAGE_KEY = 'tutoringSelectionState';

@Injectable({
  providedIn: 'root'
})
export class TutoringStateService {
  private stateSubject = new BehaviorSubject<TutoringSelectionState>(this.getInitialState());
  public state$ = this.stateSubject.asObservable();

  constructor() {
    this.restoreState();
  }

  private getInitialState(): TutoringSelectionState {
    return {
      teachingType: TeachingType.OneToOne,
      academicYearId: null,
      students: [],
      studentSubjects: new Map(),
      studentSubjectPlans: new Map(),
      studentSubjectTimeSlots: new Map(),
      currentStep: 1,
      priceCalculation: null
    };
  }

  // ============================================
  // State Management
  // ============================================

  getState(): TutoringSelectionState {
    return this.stateSubject.value;
  }

  private updateState(updates: Partial<TutoringSelectionState>): void {
    const newState = { ...this.stateSubject.value, ...updates };
    this.stateSubject.next(newState);
    this.saveState();
  }

  // ============================================
  // Step 1: Teaching Type & Academic Year
  // ============================================

  setTeachingType(type: TeachingType): void {
    this.updateState({ teachingType: type });
  }

  getTeachingType(): TeachingType {
    return this.stateSubject.value.teachingType;
  }

  setAcademicYear(yearId: number): void {
    this.updateState({ academicYearId: yearId });
  }

  getAcademicYear(): number | null {
    return this.stateSubject.value.academicYearId;
  }

  // ============================================
  // Step 2: Students
  // ============================================

  setStudents(students: { id: number; name: string }[]): void {
    this.updateState({ students });
  }

  getStudents(): { id: number; name: string }[] {
    return this.stateSubject.value.students;
  }

  // ============================================
  // Step 3: Student Subjects
  // ============================================

  setStudentSubjects(studentSubjects: Map<number, Set<number>>): void {
    this.updateState({ studentSubjects });
  }

  getStudentSubjects(studentId: number): Set<number> {
    return this.stateSubject.value.studentSubjects.get(studentId) || new Set();
  }

  // ============================================
  // Step 4: Plans
  // ============================================

  setPlan(studentId: number, subjectId: number, plan: TutoringPlan): void {
    const key = `${studentId}_${subjectId}`;
    const plans = new Map(this.stateSubject.value.studentSubjectPlans);
    plans.set(key, plan);
    this.updateState({ studentSubjectPlans: plans });
  }

  getPlan(studentId: number, subjectId: number): TutoringPlan | null {
    const key = `${studentId}_${subjectId}`;
    return this.stateSubject.value.studentSubjectPlans.get(key) || null;
  }

  // ============================================
  // Step 5: Time Slots
  // ============================================

  setTimeSlots(studentId: number, subjectId: number, timeSlotIds: number[]): void {
    const key = `${studentId}_${subjectId}`;
    const slots = new Map(this.stateSubject.value.studentSubjectTimeSlots);
    slots.set(key, timeSlotIds);
    this.updateState({ studentSubjectTimeSlots: slots });
  }

  getTimeSlots(studentId: number, subjectId: number): number[] {
    const key = `${studentId}_${subjectId}`;
    return this.stateSubject.value.studentSubjectTimeSlots.get(key) || [];
  }

  // ============================================
  // Step Navigation
  // ============================================

  setCurrentStep(step: number): void {
    this.updateState({ currentStep: step });
  }

  getCurrentStep(): number {
    return this.stateSubject.value.currentStep;
  }

  nextStep(): void {
    const current = this.stateSubject.value.currentStep;
    this.updateState({ currentStep: current + 1 });
  }

  previousStep(): void {
    const current = this.stateSubject.value.currentStep;
    if (current > 1) {
      this.updateState({ currentStep: current - 1 });
    }
  }

  // ============================================
  // Price Calculation
  // ============================================

  setPriceCalculation(priceCalc: TutoringPriceResponse | null): void {
    this.updateState({ priceCalculation: priceCalc });
  }

  getPriceCalculation(): TutoringPriceResponse | null {
    return this.stateSubject.value.priceCalculation;
  }

  // ============================================
  // Persistence
  // ============================================

  private saveState(): void {
    try {
      const state = this.stateSubject.value;
      // Convert Maps to arrays for JSON serialization
      const serializable = {
        ...state,
        studentSubjects: Array.from(state.studentSubjects.entries()).map(([k, v]) => [k, Array.from(v)]),
        studentSubjectPlans: Array.from(state.studentSubjectPlans.entries()),
        studentSubjectTimeSlots: Array.from(state.studentSubjectTimeSlots.entries())
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(serializable));
    } catch (error) {
      console.error('Failed to save tutoring state:', error);
    }
  }

  private restoreState(): void {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);

        // Restore Maps from arrays
        const studentSubjects = new Map(
          parsed.studentSubjects?.map(([k, v]: [number, number[]]) => [k, new Set(v)])
        );
        const studentSubjectPlans = new Map(parsed.studentSubjectPlans);
        const studentSubjectTimeSlots = new Map(parsed.studentSubjectTimeSlots);

        this.stateSubject.next({
          ...parsed,
          studentSubjects,
          studentSubjectPlans,
          studentSubjectTimeSlots
        });
      }
    } catch (error) {
      console.error('Failed to restore tutoring state:', error);
    }
  }

  clearState(): void {
    localStorage.removeItem(STORAGE_KEY);
    this.stateSubject.next(this.getInitialState());
  }

  // ============================================
  // Validation Helpers
  // ============================================

  canProceedToStep2(): boolean {
    const state = this.stateSubject.value;
    return state.teachingType !== null && state.academicYearId !== null;
  }

  canProceedToStep3(): boolean {
    const state = this.stateSubject.value;
    return state.students.length > 0;
  }

  canProceedToStep4(): boolean {
    const state = this.stateSubject.value;
    // Each student must have at least 1 subject selected
    return state.students.every(s =>
      (state.studentSubjects.get(s.id)?.size || 0) > 0
    );
  }

  canProceedToStep5(): boolean {
    const state = this.stateSubject.value;
    // Each student's each subject must have a plan
    return state.students.every(student => {
      const subjects = state.studentSubjects.get(student.id) || new Set();
      return Array.from(subjects).every(subjectId => {
        const key = `${student.id}_${subjectId}`;
        return state.studentSubjectPlans.has(key);
      });
    });
  }

  canProceedToStep6(): boolean {
    const state = this.stateSubject.value;
    // Each student's each subject must have required time slots selected
    return state.students.every(student => {
      const subjects = state.studentSubjects.get(student.id) || new Set();
      return Array.from(subjects).every(subjectId => {
        const key = `${student.id}_${subjectId}`;
        const plan = state.studentSubjectPlans.get(key);
        const slots = state.studentSubjectTimeSlots.get(key) || [];

        if (!plan) return false;

        const requiredSlots = this.getRequiredSlots(plan);
        return slots.length === requiredSlots;
      });
    });
  }

  private getRequiredSlots(plan: TutoringPlan): number {
    switch (plan) {
      case TutoringPlan.Hours10: return 10;
      case TutoringPlan.Hours20: return 20;
      case TutoringPlan.Hours30: return 30;
      default: return 10;
    }
  }
}
