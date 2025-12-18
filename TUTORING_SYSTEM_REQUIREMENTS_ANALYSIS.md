# 🎓 Tutoring System - Requirements Analysis & Development Plan

**Date:** December 18, 2025  
**Client Request:** New Tutoring Services Module  
**Priority:** 🔴 **HIGH - Major System Redesign**

---

## 📋 Table of Contents

1. [Current System vs New Requirements](#current-vs-new)
2. [Frontend Development Plan](#frontend-plan)
3. [Backend Requirements](#backend-requirements)
4. [Data Models](#data-models)
5. [Implementation Phases](#implementation-phases)
6. [Discount Logic](#discount-logic)
7. [Timeline & Resources](#timeline)

---

## 🔄 Current System vs New Requirements {#current-vs-new}

### **Current System:**

| Feature | Current Implementation |
|---------|----------------------|
| Student Selection | ✅ All students select **same subjects** |
| Subject Selection | ✅ Select by subject names |
| Pricing | ✅ Fixed price per subject |
| Scheduling | ❌ No scheduling |
| Plans | ❌ No duration plans |
| Discounts | ✅ Basic (Group 20%) |
| Per-Student Subjects | ❌ Not supported |

### **New Requirements:**

| Feature | New Requirement |
|---------|----------------|
| Student Selection | ✅ Each student selects **different subjects** |
| Subject Selection | ✅ Select per student |
| Pricing | ✅ Dynamic based on hours (10/20/30) |
| Scheduling | ✅ **Required** - Select time slots per subject |
| Plans | ✅ 10hrs, 20hrs, 30hrs over 12 weeks |
| Discounts | ✅ **Complex** - Multiple discount rules |
| Per-Student Subjects | ✅ **Required** |

---

## 🎯 New System Requirements

### 1. **Parent/Student Flow:**

```
Step 1: Select Academic Year
        ↓
Step 2: Select Tutoring Type (One-to-One / Group)
        ↓
Step 3: Select Number of Students (1-3)
        ↓
Step 4: For Each Student:
        ├─ Select Subjects (1-5 subjects)
        ├─ Select Plan per Subject:
        │  ├─ 10hrs over 12 weeks (1 subject = base price)
        │  ├─ 20hrs over 12 weeks (2x subject = 5% discount)
        │  └─ 30hrs over 12 weeks (3x subject = 10% discount)
        └─ Select Time Slots per Subject
        ↓
Step 5: Dynamic Price Calculation
        ├─ Base Price
        ├─ Group Discount (35% if Group Tutoring)
        ├─ Multiple Students Discount (5% per student, max 20%)
        ├─ Multiple Subjects Discount (5% per subject, max 20%)
        └─ Final Price
        ↓
Step 6: Proceed to Payment
        ↓
Step 7: Booking Confirmation
```

---

## 🛠️ Frontend Development Plan {#frontend-plan}

### **Phase 1: Data Models & Types**

#### **New Interfaces:**

```typescript
// 1. Tutoring Plan
export enum TutoringPlan {
  Hours10 = '10hrs',   // 10 hours over 12 weeks
  Hours20 = '20hrs',   // 20 hours over 12 weeks
  Hours30 = '30hrs'    // 30 hours over 12 weeks
}

// 2. Time Slot
export interface TimeSlot {
  id: number;
  dayOfWeek: string;        // "Monday", "Tuesday", etc.
  startTime: string;        // "14:00"
  endTime: string;          // "15:00"
  duration: number;         // 60 (minutes)
  isAvailable: boolean;
  teacherId?: number;
  maxStudents?: number;     // For group sessions
}

// 3. Subject Selection (Per Student)
export interface StudentSubjectSelection {
  studentId: number;
  studentName: string;
  subjects: SubjectWithPlan[];
}

export interface SubjectWithPlan {
  subjectId: number;
  subjectName: string;
  plan: TutoringPlan;           // 10hrs, 20hrs, or 30hrs
  basePrice: number;            // Price for 10hrs
  totalPrice: number;           // Based on plan
  selectedTimeSlots: TimeSlot[];
  requiredSlots: number;        // Based on plan (e.g., 10 slots for 10hrs)
}

// 4. Tutoring Order Request
export interface CreateTutoringOrderRequest {
  teachingType: 'OneToOne' | 'GroupTutoring';
  academicYearId: number;
  termId: number;
  studentSelections: StudentSubjectSelection[];
  totalStudents: number;
  expectedPrice: number;
}

// 5. Price Calculation Request
export interface CalculateTutoringPriceRequest {
  teachingType: 'OneToOne' | 'GroupTutoring';
  academicYearId: number;
  studentSelections: StudentSubjectSelection[];  // Each student with their subjects & plans
}

// 6. Price Breakdown Response
export interface TutoringPriceResponse {
  basePrice: number;
  groupDiscount: number;           // 35% for Group Tutoring
  multipleStudentsDiscount: number; // 5% per student (max 20%)
  multipleSubjectsDiscount: number; // 5% per subject (max 20%)
  totalDiscount: number;
  finalPrice: number;
  breakdown: {
    studentName: string;
    subjects: {
      subjectName: string;
      plan: TutoringPlan;
      basePrice: number;
      finalPrice: number;
    }[];
    studentTotal: number;
  }[];
}
```

---

### **Phase 2: New Components**

#### **Component Structure:**

```
src/app/features/tutoring/
├── tutoring-package-selection/
│   ├── tutoring-package-selection.component.ts
│   ├── tutoring-package-selection.component.html
│   ├── tutoring-package-selection.component.scss
│   └── steps/
│       ├── step1-year-type.component.ts        // Year + Teaching Type
│       ├── step2-students.component.ts          // Number of students
│       ├── step3-subjects-per-student.component.ts  // Each student selects subjects
│       ├── step4-plans-per-subject.component.ts     // Each subject select plan
│       ├── step5-schedule-per-subject.component.ts  // Each subject select time slots
│       ├── step6-review-payment.component.ts    // Review & Payment
│       └── components/
│           ├── subject-selector.component.ts
│           ├── plan-selector.component.ts
│           ├── time-slot-picker.component.ts
│           └── price-summary.component.ts
│
├── tutoring-schedule/
│   ├── schedule-calendar.component.ts
│   └── schedule-list.component.ts
│
└── shared/
    ├── tutoring.service.ts
    └── tutoring-discount.service.ts
```

---

### **Phase 3: Step-by-Step Implementation**

#### **Step 1: Year & Teaching Type Selection**

```html
<!-- step1-year-type.component.html -->
<div class="step-container">
  <h2>Step 1: Select Academic Year & Teaching Type</h2>
  
  <!-- Academic Year -->
  <div class="form-group">
    <label>Academic Year</label>
    <select [(ngModel)]="selectedYearId">
      <option *ngFor="let year of academicYears" [value]="year.id">
        {{ year.name }} ({{ year.startDate | date:'yyyy' }} - {{ year.endDate | date:'yyyy' }})
      </option>
    </select>
  </div>

  <!-- Teaching Type -->
  <div class="teaching-type-selector">
    <button 
      (click)="selectType('OneToOne')"
      [class.active]="teachingType === 'OneToOne'">
      <h3>👤 One-to-One Tutoring</h3>
      <p>Private tutoring for 1 student</p>
      <p class="price-info">Standard Rate</p>
    </button>

    <button 
      (click)="selectType('GroupTutoring')"
      [class.active]="teachingType === 'GroupTutoring'">
      <h3>👥 Group Tutoring</h3>
      <p>Small group (2-3 students)</p>
      <p class="price-info discount">35% Discount!</p>
    </button>
  </div>

  <button (click)="nextStep()" [disabled]="!canProceed()">Next →</button>
</div>
```

```typescript
// step1-year-type.component.ts
export class Step1YearTypeComponent {
  selectedYearId: number | null = null;
  teachingType: 'OneToOne' | 'GroupTutoring' = 'OneToOne';
  academicYears: AcademicYear[] = [];

  ngOnInit() {
    this.loadAcademicYears();
  }

  selectType(type: 'OneToOne' | 'GroupTutoring') {
    this.teachingType = type;
    this.stateService.setTeachingType(type);
  }

  canProceed(): boolean {
    return this.selectedYearId !== null && this.teachingType !== null;
  }

  nextStep() {
    if (this.canProceed()) {
      this.stateService.setAcademicYear(this.selectedYearId!);
      this.router.navigate(['../step2'], { relativeTo: this.route });
    }
  }
}
```

---

#### **Step 2: Number of Students**

```html
<!-- step2-students.component.html -->
<div class="step-container">
  <h2>Step 2: How many students?</h2>
  
  <div class="student-count-selector">
    <button 
      *ngFor="let count of allowedCounts"
      (click)="selectStudentCount(count)"
      [class.active]="studentCount === count">
      {{ count }} Student{{ count > 1 ? 's' : '' }}
      <span *ngIf="count > 1" class="discount-badge">
        {{ getStudentDiscount(count) }}% OFF
      </span>
    </button>
  </div>

  <!-- Student Names -->
  <div class="student-names" *ngIf="studentCount > 0">
    <h3>Enter Student Names:</h3>
    <div *ngFor="let i of [].constructor(studentCount); let idx = index">
      <input 
        type="text" 
        [(ngModel)]="studentNames[idx]"
        placeholder="Student {{ idx + 1 }} Name"
        required>
    </div>
  </div>

  <div class="nav-buttons">
    <button (click)="previousStep()">← Back</button>
    <button (click)="nextStep()" [disabled]="!canProceed()">Next →</button>
  </div>
</div>
```

```typescript
// step2-students.component.ts
export class Step2StudentsComponent {
  teachingType: string = '';
  studentCount: number = 1;
  studentNames: string[] = [];
  allowedCounts: number[] = [];

  ngOnInit() {
    this.teachingType = this.stateService.getTeachingType();
    this.allowedCounts = this.teachingType === 'OneToOne' ? [1] : [1, 2, 3];
  }

  selectStudentCount(count: number) {
    this.studentCount = count;
    this.studentNames = Array(count).fill('');
  }

  getStudentDiscount(count: number): number {
    return Math.min(count * 5, 20);  // 5% per student, max 20%
  }

  canProceed(): boolean {
    return this.studentNames.every(name => name.trim().length > 0);
  }

  nextStep() {
    if (this.canProceed()) {
      this.stateService.setStudents(
        this.studentNames.map((name, idx) => ({
          id: idx + 1,
          name: name
        }))
      );
      this.router.navigate(['../step3'], { relativeTo: this.route });
    }
  }
}
```

---

#### **Step 3: Subjects Per Student**

```html
<!-- step3-subjects-per-student.component.html -->
<div class="step-container">
  <h2>Step 3: Select Subjects for Each Student</h2>
  
  <div *ngFor="let student of students; let i = index" class="student-section">
    <h3>📚 {{ student.name }}'s Subjects</h3>
    
    <!-- Available Subjects -->
    <div class="subjects-grid">
      <div 
        *ngFor="let subject of availableSubjects"
        (click)="toggleSubject(student.id, subject)"
        [class.selected]="isSubjectSelected(student.id, subject.id)"
        class="subject-card">
        <h4>{{ subject.name }}</h4>
        <p>{{ subject.arabicName }}</p>
        <p class="price">From ${{ subject.basePrice }}/10hrs</p>
        <div *ngIf="isSubjectSelected(student.id, subject.id)" class="checkmark">✓</div>
      </div>
    </div>

    <p class="selected-count">
      Selected: {{ getSelectedCount(student.id) }} / 5 subjects
      <span *ngIf="getSelectedCount(student.id) > 1" class="discount-info">
        {{ getSubjectDiscount(getSelectedCount(student.id)) }}% multi-subject discount!
      </span>
    </p>
  </div>

  <div class="nav-buttons">
    <button (click)="previousStep()">← Back</button>
    <button (click)="nextStep()" [disabled]="!canProceed()">Next →</button>
  </div>
</div>
```

```typescript
// step3-subjects-per-student.component.ts
export class Step3SubjectsPerStudentComponent {
  students: any[] = [];
  availableSubjects: Subject[] = [];
  studentSubjects: Map<number, Set<number>> = new Map();

  ngOnInit() {
    this.students = this.stateService.getStudents();
    this.loadAvailableSubjects();
    
    // Initialize empty sets for each student
    this.students.forEach(s => {
      this.studentSubjects.set(s.id, new Set());
    });
  }

  toggleSubject(studentId: number, subject: Subject) {
    const selected = this.studentSubjects.get(studentId)!;
    
    if (selected.has(subject.id)) {
      selected.delete(subject.id);
    } else {
      if (selected.size < 5) {  // Max 5 subjects
        selected.add(subject.id);
      } else {
        alert('Maximum 5 subjects per student');
      }
    }
  }

  isSubjectSelected(studentId: number, subjectId: number): boolean {
    return this.studentSubjects.get(studentId)?.has(subjectId) || false;
  }

  getSelectedCount(studentId: number): number {
    return this.studentSubjects.get(studentId)?.size || 0;
  }

  getSubjectDiscount(count: number): number {
    return Math.min(count * 5, 20);  // 5% per subject, max 20%
  }

  canProceed(): boolean {
    // Each student must select at least 1 subject
    return this.students.every(s => 
      this.getSelectedCount(s.id) > 0
    );
  }

  nextStep() {
    if (this.canProceed()) {
      this.stateService.setStudentSubjects(this.studentSubjects);
      this.router.navigate(['../step4'], { relativeTo: this.route });
    }
  }
}
```

---

#### **Step 4: Plans Per Subject**

```html
<!-- step4-plans-per-subject.component.html -->
<div class="step-container">
  <h2>Step 4: Select Plan for Each Subject</h2>
  
  <div *ngFor="let student of students" class="student-section">
    <h3>{{ student.name }}'s Plans</h3>
    
    <div *ngFor="let subject of getStudentSubjects(student.id)" class="subject-plan">
      <h4>{{ subject.name }}</h4>
      
      <div class="plan-selector">
        <!-- 10 Hours Plan -->
        <div 
          (click)="selectPlan(student.id, subject.id, 'Hours10')"
          [class.selected]="getSelectedPlan(student.id, subject.id) === 'Hours10'"
          class="plan-card">
          <h5>10 Hours</h5>
          <p>Over 12 weeks</p>
          <p class="price">${{ subject.basePrice }}</p>
          <span class="badge">Standard</span>
        </div>

        <!-- 20 Hours Plan -->
        <div 
          (click)="selectPlan(student.id, subject.id, 'Hours20')"
          [class.selected]="getSelectedPlan(student.id, subject.id) === 'Hours20'"
          class="plan-card">
          <h5>20 Hours</h5>
          <p>Over 12 weeks</p>
          <p class="price">
            <span class="original">${{ subject.basePrice * 2 }}</span>
            ${{ calculatePlanPrice(subject.basePrice, 'Hours20') }}
          </p>
          <span class="badge discount">5% OFF</span>
        </div>

        <!-- 30 Hours Plan -->
        <div 
          (click)="selectPlan(student.id, subject.id, 'Hours30')"
          [class.selected]="getSelectedPlan(student.id, subject.id) === 'Hours30'"
          class="plan-card">
          <h5>30 Hours</h5>
          <p>Over 12 weeks</p>
          <p class="price">
            <span class="original">${{ subject.basePrice * 3 }}</span>
            ${{ calculatePlanPrice(subject.basePrice, 'Hours30') }}
          </p>
          <span class="badge discount">10% OFF</span>
        </div>
      </div>
    </div>
  </div>

  <div class="nav-buttons">
    <button (click)="previousStep()">← Back</button>
    <button (click)="nextStep()" [disabled]="!canProceed()">Next →</button>
  </div>
</div>
```

```typescript
// step4-plans-per-subject.component.ts
export class Step4PlansPerSubjectComponent {
  students: any[] = [];
  studentSubjectPlans: Map<string, TutoringPlan> = new Map();  // key: "studentId_subjectId"

  selectPlan(studentId: number, subjectId: number, plan: TutoringPlan) {
    const key = `${studentId}_${subjectId}`;
    this.studentSubjectPlans.set(key, plan);
  }

  getSelectedPlan(studentId: number, subjectId: number): TutoringPlan | null {
    const key = `${studentId}_${subjectId}`;
    return this.studentSubjectPlans.get(key) || null;
  }

  calculatePlanPrice(basePrice: number, plan: TutoringPlan): number {
    switch (plan) {
      case 'Hours10':
        return basePrice;
      case 'Hours20':
        return basePrice * 2 * 0.95;  // 5% discount
      case 'Hours30':
        return basePrice * 3 * 0.90;  // 10% discount
      default:
        return basePrice;
    }
  }

  canProceed(): boolean {
    // Each student's each subject must have a plan selected
    return this.students.every(student => 
      this.getStudentSubjects(student.id).every(subject =>
        this.getSelectedPlan(student.id, subject.id) !== null
      )
    );
  }

  nextStep() {
    if (this.canProceed()) {
      this.stateService.setStudentPlans(this.studentSubjectPlans);
      this.router.navigate(['../step5'], { relativeTo: this.route });
    }
  }
}
```

---

#### **Step 5: Schedule Per Subject**

```html
<!-- step5-schedule-per-subject.component.html -->
<div class="step-container">
  <h2>Step 5: Select Time Slots</h2>
  
  <div *ngFor="let student of students" class="student-section">
    <h3>{{ student.name }}'s Schedule</h3>
    
    <div *ngFor="let subject of getStudentSubjects(student.id)" class="subject-schedule">
      <h4>{{ subject.name }} - {{ getRequiredSlots(student.id, subject.id) }} sessions needed</h4>
      
      <!-- Calendar View -->
      <div class="calendar-grid">
        <div *ngFor="let day of daysOfWeek" class="day-column">
          <h5>{{ day }}</h5>
          
          <div 
            *ngFor="let slot of getAvailableSlots(day, subject.id)"
            (click)="toggleTimeSlot(student.id, subject.id, slot)"
            [class.selected]="isSlotSelected(student.id, subject.id, slot.id)"
            [class.disabled]="!slot.isAvailable"
            class="time-slot">
            {{ slot.startTime }} - {{ slot.endTime }}
            <div *ngIf="isSlotSelected(student.id, subject.id, slot.id)" class="checkmark">✓</div>
          </div>
        </div>
      </div>

      <p class="slots-info">
        Selected: {{ getSelectedSlotsCount(student.id, subject.id) }} / {{ getRequiredSlots(student.id, subject.id) }}
      </p>
    </div>
  </div>

  <div class="nav-buttons">
    <button (click)="previousStep()">← Back</button>
    <button (click)="nextStep()" [disabled]="!canProceed()">Next: Review & Pay →</button>
  </div>
</div>
```

```typescript
// step5-schedule-per-subject.component.ts
export class Step5SchedulePerSubjectComponent {
  students: any[] = [];
  daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  availableTimeSlots: TimeSlot[] = [];
  selectedSlots: Map<string, Set<number>> = new Map();  // key: "studentId_subjectId", value: Set of slotIds

  ngOnInit() {
    this.loadAvailableTimeSlots();
  }

  getRequiredSlots(studentId: number, subjectId: number): number {
    const plan = this.stateService.getPlan(studentId, subjectId);
    switch (plan) {
      case 'Hours10': return 10;  // 10 sessions of 1 hour each
      case 'Hours20': return 20;
      case 'Hours30': return 30;
      default: return 10;
    }
  }

  toggleTimeSlot(studentId: number, subjectId: number, slot: TimeSlot) {
    if (!slot.isAvailable) return;

    const key = `${studentId}_${subjectId}`;
    if (!this.selectedSlots.has(key)) {
      this.selectedSlots.set(key, new Set());
    }

    const slots = this.selectedSlots.get(key)!;
    const requiredSlots = this.getRequiredSlots(studentId, subjectId);

    if (slots.has(slot.id)) {
      slots.delete(slot.id);
    } else {
      if (slots.size < requiredSlots) {
        slots.add(slot.id);
      } else {
        alert(`You can only select ${requiredSlots} time slots for this subject`);
      }
    }
  }

  isSlotSelected(studentId: number, subjectId: number, slotId: number): boolean {
    const key = `${studentId}_${subjectId}`;
    return this.selectedSlots.get(key)?.has(slotId) || false;
  }

  getSelectedSlotsCount(studentId: number, subjectId: number): number {
    const key = `${studentId}_${subjectId}`;
    return this.selectedSlots.get(key)?.size || 0;
  }

  canProceed(): boolean {
    // Each subject for each student must have exactly the required number of slots selected
    return this.students.every(student =>
      this.getStudentSubjects(student.id).every(subject => {
        const required = this.getRequiredSlots(student.id, subject.id);
        const selected = this.getSelectedSlotsCount(student.id, subject.id);
        return selected === required;
      })
    );
  }

  nextStep() {
    if (this.canProceed()) {
      this.stateService.setSchedules(this.selectedSlots);
      this.router.navigate(['../step6'], { relativeTo: this.route });
    }
  }
}
```

---

#### **Step 6: Review & Payment**

```html
<!-- step6-review-payment.component.html -->
<div class="step-container">
  <h2>Step 6: Review & Payment</h2>
  
  <!-- Order Summary -->
  <div class="order-summary">
    <h3>Order Details</h3>
    
    <div class="detail-row">
      <span>Teaching Type:</span>
      <span>{{ teachingType }}</span>
    </div>
    
    <div class="detail-row">
      <span>Academic Year:</span>
      <span>{{ academicYear }}</span>
    </div>
    
    <div class="detail-row">
      <span>Number of Students:</span>
      <span>{{ students.length }}</span>
    </div>
  </div>

  <!-- Students & Subjects -->
  <div *ngFor="let student of students" class="student-review">
    <h4>{{ student.name }}</h4>
    
    <table class="subjects-table">
      <thead>
        <tr>
          <th>Subject</th>
          <th>Plan</th>
          <th>Sessions</th>
          <th>Price</th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let subject of getStudentSubjects(student.id)">
          <td>{{ subject.name }}</td>
          <td>{{ getPlanText(student.id, subject.id) }}</td>
          <td>{{ getRequiredSlots(student.id, subject.id) }}</td>
          <td>${{ getSubjectPrice(student.id, subject.id) }}</td>
        </tr>
      </tbody>
    </table>
    
    <div class="student-total">
      Subtotal for {{ student.name }}: ${{ getStudentTotal(student.id) }}
    </div>
  </div>

  <!-- Price Breakdown -->
  <div class="price-breakdown">
    <h3>Price Breakdown</h3>
    
    <div class="breakdown-row">
      <span>Base Price:</span>
      <span>${{ priceCalculation.basePrice }}</span>
    </div>
    
    <div class="breakdown-row discount" *ngIf="priceCalculation.groupDiscount > 0">
      <span>Group Tutoring Discount (35%):</span>
      <span>-${{ priceCalculation.groupDiscount }}</span>
    </div>
    
    <div class="breakdown-row discount" *ngIf="priceCalculation.multipleStudentsDiscount > 0">
      <span>Multiple Students Discount:</span>
      <span>-${{ priceCalculation.multipleStudentsDiscount }}</span>
    </div>
    
    <div class="breakdown-row discount" *ngIf="priceCalculation.multipleSubjectsDiscount > 0">
      <span>Multiple Subjects Discount:</span>
      <span>-${{ priceCalculation.multipleSubjectsDiscount }}</span>
    </div>
    
    <div class="breakdown-row total">
      <span><strong>Total Price:</strong></span>
      <span><strong>${{ priceCalculation.finalPrice }}</strong></span>
    </div>
  </div>

  <!-- Schedule Summary -->
  <div class="schedule-summary">
    <h3>📅 Schedule Overview</h3>
    <button (click)="viewFullSchedule()">View Full Schedule</button>
  </div>

  <!-- Actions -->
  <div class="nav-buttons">
    <button (click)="previousStep()">← Back</button>
    <button 
      (click)="proceedToPayment()" 
      [disabled]="creatingOrder"
      class="btn-primary">
      {{ creatingOrder ? 'Processing...' : 'Proceed to Payment' }} →
    </button>
  </div>
</div>
```

```typescript
// step6-review-payment.component.ts
export class Step6ReviewPaymentComponent implements OnInit {
  students: any[] = [];
  priceCalculation: TutoringPriceResponse | null = null;
  creatingOrder = false;

  ngOnInit() {
    this.loadOrderSummary();
    this.calculateFinalPrice();
  }

  async calculateFinalPrice() {
    const request: CalculateTutoringPriceRequest = {
      teachingType: this.stateService.getTeachingType(),
      academicYearId: this.stateService.getAcademicYear(),
      studentSelections: this.buildStudentSelections()
    };

    this.tutoringService.calculatePrice(request).subscribe({
      next: (response) => {
        this.priceCalculation = response;
      },
      error: (error) => {
        console.error('Price calculation error:', error);
        alert('Failed to calculate price');
      }
    });
  }

  async proceedToPayment() {
    if (!this.priceCalculation) return;

    this.creatingOrder = true;

    const orderRequest: CreateTutoringOrderRequest = {
      teachingType: this.stateService.getTeachingType(),
      academicYearId: this.stateService.getAcademicYear(),
      termId: this.stateService.getTermId(),
      studentSelections: this.buildStudentSelections(),
      totalStudents: this.students.length,
      expectedPrice: this.priceCalculation.finalPrice
    };

    this.tutoringService.createOrder(orderRequest).subscribe({
      next: (response) => {
        // Save order info
        localStorage.setItem('pendingTutoringOrder', JSON.stringify({
          orderId: response.orderId,
          orderNumber: response.orderNumber,
          amount: response.totalAmount
        }));

        // Clear state
        this.stateService.clearState();

        // Redirect to Stripe
        window.location.href = response.stripeCheckoutUrl;
      },
      error: (error) => {
        console.error('Order creation error:', error);
        alert('Failed to create order');
        this.creatingOrder = false;
      }
    });
  }

  buildStudentSelections(): StudentSubjectSelection[] {
    return this.students.map(student => ({
      studentId: student.id,
      studentName: student.name,
      subjects: this.getStudentSubjects(student.id).map(subject => ({
        subjectId: subject.id,
        subjectName: subject.name,
        plan: this.stateService.getPlan(student.id, subject.id),
        basePrice: subject.basePrice,
        totalPrice: this.getSubjectPrice(student.id, subject.id),
        selectedTimeSlots: this.getSelectedTimeSlots(student.id, subject.id),
        requiredSlots: this.getRequiredSlots(student.id, subject.id)
      }))
    }));
  }
}
```

---

### **Phase 4: Services**

#### **tutoring.service.ts:**

```typescript
@Injectable({ providedIn: 'root' })
export class TutoringService {
  private apiUrl = `${environment.apiBaseUrl}/Tutoring`;

  constructor(private http: HttpClient) {}

  // Get available time slots for a subject
  getAvailableTimeSlots(
    subjectId: number, 
    academicYearId: number,
    startDate?: string,
    endDate?: string
  ): Observable<TimeSlot[]> {
    let params = new HttpParams()
      .set('subjectId', subjectId.toString())
      .set('academicYearId', academicYearId.toString());
    
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);

    return this.http.get<TimeSlot[]>(`${this.apiUrl}/time-slots`, { params });
  }

  // Calculate tutoring price
  calculatePrice(request: CalculateTutoringPriceRequest): Observable<TutoringPriceResponse> {
    return this.http.post<TutoringPriceResponse>(`${this.apiUrl}/calculate-price`, request);
  }

  // Create tutoring order
  createOrder(request: CreateTutoringOrderRequest): Observable<CreateTutoringOrderResponse> {
    return this.http.post<CreateTutoringOrderResponse>(`${this.apiUrl}/create-order`, request);
  }

  // Get booking confirmation
  getBookingConfirmation(orderId: number): Observable<BookingConfirmation> {
    return this.http.get<BookingConfirmation>(`${this.apiUrl}/booking/${orderId}`);
  }
}
```

#### **tutoring-discount.service.ts:**

```typescript
@Injectable({ providedIn: 'root' })
export class TutoringDiscountService {

  calculateGroupDiscount(isGroupTutoring: boolean, basePrice: number): number {
    return isGroupTutoring ? basePrice * 0.35 : 0;  // 35% for Group
  }

  calculateMultipleStudentsDiscount(studentCount: number, basePrice: number): number {
    if (studentCount <= 1) return 0;
    const discountPercent = Math.min(studentCount * 5, 20) / 100;  // 5% per student, max 20%
    return basePrice * discountPercent;
  }

  calculateMultipleSubjectsDiscount(subjectCount: number, basePrice: number): number {
    if (subjectCount <= 1) return 0;
    const discountPercent = Math.min(subjectCount * 5, 20) / 100;  // 5% per subject, max 20%
    return basePrice * discountPercent;
  }

  calculatePlanDiscount(plan: TutoringPlan, basePrice: number): number {
    switch (plan) {
      case 'Hours20': return basePrice * 2 * 0.05;  // 5% for 20hrs
      case 'Hours30': return basePrice * 3 * 0.10;  // 10% for 30hrs
      default: return 0;
    }
  }

  calculateTotalPrice(
    basePrice: number,
    isGroupTutoring: boolean,
    studentCount: number,
    subjectCount: number,
    plan: TutoringPlan,
    minPrice?: number
  ): number {
    let total = basePrice;

    // Apply plan multiplier
    switch (plan) {
      case 'Hours20': total = basePrice * 2; break;
      case 'Hours30': total = basePrice * 3; break;
    }

    // Apply plan discount
    const planDiscount = this.calculatePlanDiscount(plan, basePrice);
    total -= planDiscount;

    // Apply group discount
    if (isGroupTutoring) {
      total *= 0.65;  // 35% off
    }

    // Apply multiple students discount
    if (studentCount > 1) {
      const studentDiscountPercent = Math.min(studentCount * 5, 20) / 100;
      total *= (1 - studentDiscountPercent);
    }

    // Apply multiple subjects discount
    if (subjectCount > 1) {
      const subjectDiscountPercent = Math.min(subjectCount * 5, 20) / 100;
      total *= (1 - subjectDiscountPercent);
    }

    // Ensure minimum price
    if (minPrice && total < minPrice) {
      total = minPrice;
    }

    return Math.round(total * 100) / 100;  // Round to 2 decimals
  }
}
```

---

## 🔧 Backend Requirements {#backend-requirements}

### **New API Endpoints Needed:**

#### **1. Time Slots Management**

```http
GET /api/Tutoring/time-slots
Query Params:
  - subjectId: number
  - academicYearId: number
  - startDate: string (optional)
  - endDate: string (optional)
  - teachingType: OneToOne | GroupTutoring

Response:
[
  {
    "id": 1,
    "dayOfWeek": "Monday",
    "startTime": "14:00",
    "endTime": "15:00",
    "duration": 60,
    "isAvailable": true,
    "teacherId": 5,
    "maxStudents": 3
  }
]
```

#### **2. Calculate Tutoring Price**

```http
POST /api/Tutoring/calculate-price
Body:
{
  "teachingType": "GroupTutoring",
  "academicYearId": 1,
  "studentSelections": [
    {
      "studentId": 1,
      "studentName": "Ahmed",
      "subjects": [
        {
          "subjectId": 10,
          "subjectName": "Math",
          "plan": "Hours20",
          "basePrice": 100,
          "selectedTimeSlots": [...]
        }
      ]
    }
  ]
}

Response:
{
  "basePrice": 600.00,
  "groupDiscount": 210.00,
  "multipleStudentsDiscount": 30.00,
  "multipleSubjectsDiscount": 20.00,
  "totalDiscount": 260.00,
  "finalPrice": 340.00,
  "breakdown": [...]
}
```

#### **3. Create Tutoring Order**

```http
POST /api/Tutoring/create-order
Body:
{
  "teachingType": "GroupTutoring",
  "academicYearId": 1,
  "termId": 4,
  "studentSelections": [...],
  "totalStudents": 3,
  "expectedPrice": 340.00
}

Response:
{
  "orderId": 123,
  "orderNumber": "TUT-000123",
  "totalAmount": 340.00,
  "stripeSessionId": "cs_test_...",
  "stripeCheckoutUrl": "https://checkout.stripe.com/...",
  "bookingConfirmation": {
    "confirmat "confirmationCode": "TUT-ABC123",
    "scheduledSessions": [...]
  }
}
```

#### **4. Get Booking Confirmation**

```http
GET /api/Tutoring/booking/{orderId}

Response:
{
  "orderId": 123,
  "orderNumber": "TUT-000123",
  "confirmationCode": "TUT-ABC123",
  "parentName": "Parent Name",
  "students": [...],
  "totalAmount": 340.00,
  "paymentStatus": "Paid",
  "scheduledSessions": [
    {
      "studentName": "Ahmed",
      "subjectName": "Math",
      "teacherName": "Mr. Smith",
      "dateTime": "2025-01-20T14:00:00",
      "duration": 60,
      "location": "Online"
    }
  ]
}
```

---

### **Database Schema Changes:**

#### **New Tables:**

```sql
-- 1. Tutoring Plans
CREATE TABLE TutoringPlans (
    Id INT PRIMARY KEY IDENTITY,
    Name NVARCHAR(50) NOT NULL,  -- "10hrs", "20hrs", "30hrs"
    Hours INT NOT NULL,           -- 10, 20, 30
    DurationWeeks INT NOT NULL,   -- 12
    DiscountPercent DECIMAL(5,2), -- 0.00, 5.00, 10.00
    IsActive BIT DEFAULT 1
);

-- 2. Time Slots
CREATE TABLE TimeSlots (
    Id INT PRIMARY KEY IDENTITY,
    SubjectId INT FOREIGN KEY REFERENCES Subjects(Id),
    TeacherId INT FOREIGN KEY REFERENCES Users(Id),
    DayOfWeek NVARCHAR(20),      -- "Monday", "Tuesday", etc.
    StartTime TIME,               -- "14:00:00"
    EndTime TIME,                 -- "15:00:00"
    Duration INT,                 -- 60 (minutes)
    MaxStudents INT,              -- 1 for OneToOne, 3 for Group
    IsAvailable BIT DEFAULT 1,
    AcademicYearId INT FOREIGN KEY REFERENCES Years(Id),
    CreatedAt DATETIME DEFAULT GETDATE()
);

-- 3. Tutoring Orders
CREATE TABLE TutoringOrders (
    Id INT PRIMARY KEY IDENTITY,
    OrderNumber NVARCHAR(50) UNIQUE,
    ParentUserId INT FOREIGN KEY REFERENCES Users(Id),
    TeachingType NVARCHAR(20),   -- "OneToOne" or "GroupTutoring"
    AcademicYearId INT,
    TermId INT,
    TotalAmount DECIMAL(18,2),
    DiscountAmount DECIMAL(18,2),
    FinalAmount DECIMAL(18,2),
    OrderStatus NVARCHAR(20),    -- "Pending", "Paid", "Confirmed", "Cancelled"
    StripeSessionId NVARCHAR(255),
    ConfirmationCode NVARCHAR(50),
    CreatedAt DATETIME DEFAULT GETDATE(),
    PaidAt DATETIME NULL
);

-- 4. Tutoring Order Items (Per Student Per Subject)
CREATE TABLE TutoringOrderItems (
    Id INT PRIMARY KEY IDENTITY,
    TutoringOrderId INT FOREIGN KEY REFERENCES TutoringOrders(Id),
    StudentId INT FOREIGN KEY REFERENCES Students(Id),
    SubjectId INT FOREIGN KEY REFERENCES Subjects(Id),
    PlanId INT FOREIGN KEY REFERENCES TutoringPlans(Id),
    BasePrice DECIMAL(18,2),
    FinalPrice DECIMAL(18,2),
    RequiredSessions INT,
    CreatedAt DATETIME DEFAULT GETDATE()
);

-- 5. Tutoring Sessions (Scheduled)
CREATE TABLE TutoringSessions (
    Id INT PRIMARY KEY IDENTITY,
    TutoringOrderItemId INT FOREIGN KEY REFERENCES TutoringOrderItems(Id),
    TimeSlotId INT FOREIGN KEY REFERENCES TimeSlots(Id),
    SessionDate DATE,
    StartTime TIME,
    EndTime TIME,
    TeacherId INT FOREIGN KEY REFERENCES Users(Id),
    StudentId INT FOREIGN KEY REFERENCES Students(Id),
    SubjectId INT FOREIGN KEY REFERENCES Subjects(Id),
    Status NVARCHAR(20),         -- "Scheduled", "Completed", "Cancelled", "Rescheduled"
    MeetingLink NVARCHAR(500),   -- Zoom/Google Meet link
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME NULL
);

-- 6. Discount Rules
CREATE TABLE DiscountRules (
    Id INT PRIMARY KEY IDENTITY,
    RuleType NVARCHAR(50),       -- "GroupTutoring", "MultipleStudents", "MultipleSubjects"
    DiscountPercent DECIMAL(5,2),
    MinQuantity INT,
    MaxQuantity INT NULL,
    MaxDiscountPercent DECIMAL(5,2) NULL,
    IsActive BIT DEFAULT 1
);
```

---

## 💰 Discount Logic Implementation {#discount-logic}

### **Discount Calculation Order:**

```typescript
1. Calculate Base Price
   = Sum of all (SubjectBasePrice × PlanMultiplier)
   
2. Apply Plan Discounts
   - 10hrs: 0% discount (base)
   - 20hrs: 5% discount (on that subject)
   - 30hrs: 10% discount (on that subject)

3. Apply Group Tutoring Discount
   - If GroupTutoring: -35% on total

4. Apply Multiple Students Discount
   - 2 students: -5%
   - 3 students: -10%
   - Max: -20%

5. Apply Multiple Subjects Discount
   - 2 subjects: -5%
   - 3 subjects: -10%
   - Max: -20%

6. Check Minimum Price
   - If finalPrice < minPrice: finalPrice = minPrice

7. Final Price
```

### **Example Calculation:**

```
Scenario:
- Group Tutoring (3 students)
- Student 1: Math (20hrs), English (10hrs)
- Student 2: Math (10hrs)
- Student 3: Science (30hrs)

Calculation:
1. Base Price:
   - Math 20hrs: $100 × 2 = $200
   - English 10hrs: $100 × 1 = $100
   - Math 10hrs: $100 × 1 = $100
   - Science 30hrs: $120 × 3 = $360
   Total Base: $760

2. Plan Discounts:
   - Math 20hrs: $200 × 5% = -$10
   - Science 30hrs: $360 × 10% = -$36
   After Plan Discount: $714

3. Group Discount:
   - $714 × 35% = -$249.90
   After Group: $464.10

4. Multiple Students Discount (3 students = 10%):
   - $464.10 × 10% = -$46.41
   After Students: $417.69

5. Multiple Subjects (varies per student):
   - Student 1 has 2 subjects: 5% on their total
   - Calculate per student...
   
6. Final Price: ~$380-400 (depending on detailed calculation)
```

---

## 📅 Implementation Timeline {#timeline}

### **Phase 1: Foundation (Week 1-2)**
- ✅ Update data models
- ✅ Create TutoringService
- ✅ Create discount service
- ✅ Backend: Database schema
- ✅ Backend: Basic endpoints

### **Phase 2: Core Components (Week 3-4)**
- ✅ Step 1-2 components (Year/Type/Students)
- ✅ Step 3 component (Subjects per student)
- ✅ Backend: Time slots management
- ✅ Backend: Price calculation logic

### **Phase 3: Advanced Features (Week 5-6)**
- ✅ Step 4 component (Plans per subject)
- ✅ Step 5 component (Scheduling)
- ✅ Backend: Order creation
- ✅ Backend: Booking confirmation

### **Phase 4: Integration & Testing (Week 7-8)**
- ✅ Step 6 component (Review & Payment)
- ✅ Stripe integration
- ✅ Email notifications
- ✅ Testing & bug fixes

### **Phase 5: Deployment (Week 9)**
- ✅ UAT testing
- ✅ Performance optimization
- ✅ Production deployment

---

## 🚨 Critical Notes

### **Major Differences from Current System:**

1. **Per-Student Subject Selection** (NEW)
   - Current: All students get same subjects
   - New: Each student selects their own subjects

2. **Duration Plans** (NEW)
   - Current: No plans
   - New: 10hrs, 20hrs, 30hrs with different pricing

3. **Scheduling** (NEW)
   - Current: No scheduling
   - New: Must select exact time slots for each subject

4. **Complex Discount System** (NEW)
   - Current: Simple percentage
   - New: Multiple stacking discounts with rules

5. **Database Changes** (MAJOR)
   - Need 5+ new tables
   - Existing tables may need modifications

---

## ✅ Recommendations

### **1. Phased Rollout:**
- Keep old system running
- Deploy new system as "Tutoring Services" (separate module)
- Migrate gradually

### **2. Admin Panel:**
- Add time slot management interface
- Add discount rules configuration
- Add session scheduling/rescheduling

### **3. Teacher Portal:**
- View scheduled sessions
- Mark attendance
- Upload session materials

### **4. Student/Parent Portal:**
- View upcoming sessions
- Join session (meeting link)
- Reschedule requests

---

**END OF REQUIREMENTS ANALYSIS**

*Next: Begin Phase 1 implementation after approval*
