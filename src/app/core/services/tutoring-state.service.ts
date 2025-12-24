import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import {
  TutoringSelectionState,
  TeachingType,
  TutoringPlan,
  TutoringPriceResponse,
  StudentInfo
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
      students: [],
      studentSubjects: new Map(),
      subjectTeachingTypes: new Map(),
      subjectHours: new Map(),
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
  // Step 1: Students
  // ============================================

  setStudents(students: StudentInfo[]): void {
    this.updateState({ students });
  }

  getStudents(): StudentInfo[] {
    return this.stateSubject.value.students;
  }

  // ============================================
  // Step 2: Student Subjects
  // ============================================

  setStudentSubjects(studentSubjects: Map<number, Set<number>>): void {
    this.updateState({ studentSubjects });
  }

  getStudentSubjects(studentId: number): Set<number> {
    return this.stateSubject.value.studentSubjects.get(studentId) || new Set();
  }

  // ============================================
  // Step 3: Teaching Type per Subject
  // ============================================

  setSubjectTeachingType(studentId: number, subjectId: number, type: TeachingType): void {
    const key = `${studentId}_${subjectId}`;
    const types = new Map(this.stateSubject.value.subjectTeachingTypes);
    types.set(key, type);
    this.updateState({ subjectTeachingTypes: types });
  }

  getSubjectTeachingType(studentId: number, subjectId: number): TeachingType | null {
    const key = `${studentId}_${subjectId}`;
    return this.stateSubject.value.subjectTeachingTypes.get(key) || null;
  }

  // ============================================
  // Step 4: Hours per Subject
  // ============================================

  setSubjectHours(studentId: number, subjectId: number, hours: number): void {
    const key = `${studentId}_${subjectId}`;
    const hoursMap = new Map(this.stateSubject.value.subjectHours);
    hoursMap.set(key, hours);
    this.updateState({ subjectHours: hoursMap });
  }

  getSubjectHours(studentId: number, subjectId: number): number | null {
    const key = `${studentId}_${subjectId}`;
    return this.stateSubject.value.subjectHours.get(key) || null;
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
        subjectTeachingTypes: Array.from(state.subjectTeachingTypes.entries()),
        subjectHours: Array.from(state.subjectHours.entries()),
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

        // Restore Maps from arrays (with safety checks)
        const studentSubjects = new Map(
          (parsed.studentSubjects || []).map(([k, v]: [number, number[]]) => [k, new Set(v || [])])
        );
        const subjectTeachingTypes = new Map(parsed.subjectTeachingTypes || []);
        const subjectHours = new Map(parsed.subjectHours || []);
        const studentSubjectTimeSlots = new Map(parsed.studentSubjectTimeSlots || []);

        // Ensure students is an array
        const students = Array.isArray(parsed.students) ? parsed.students : [];

        this.stateSubject.next({
          ...this.getInitialState(), // Start with defaults
          ...parsed,
          students,
          studentSubjects,
          subjectTeachingTypes,
          subjectHours,
          studentSubjectTimeSlots
        });
      }
    } catch (error) {
      console.error('Failed to restore tutoring state:', error);
      // Reset to initial state on error
      this.stateSubject.next(this.getInitialState());
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
    return state.students.length > 0;
  }

  canProceedToStep3(): boolean {
    const state = this.stateSubject.value;
    // Each student must have at least 1 subject selected
    return state.students.every(s =>
      (state.studentSubjects.get(s.id)?.size || 0) > 0
    );
  }

  canProceedToStep4(): boolean {
    const state = this.stateSubject.value;
    // Each student's each subject must have a teaching type
    return state.students.every(student => {
      const subjects = state.studentSubjects.get(student.id) || new Set();
      return Array.from(subjects).every(subjectId => {
        const key = `${student.id}_${subjectId}`;
        return state.subjectTeachingTypes.has(key);
      });
    });
  }

  canProceedToStep5(): boolean {
    const state = this.stateSubject.value;
    // Each student's each subject must have hours selected
    return state.students.every(student => {
      const subjects = state.studentSubjects.get(student.id) || new Set();
      return Array.from(subjects).every(subjectId => {
        const key = `${student.id}_${subjectId}`;
        return state.subjectHours.has(key);
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
        const hours = state.subjectHours.get(key);
        const slots = state.studentSubjectTimeSlots.get(key) || [];

        if (!hours) return false;

        return slots.length === hours;
      });
    });
  }
}
