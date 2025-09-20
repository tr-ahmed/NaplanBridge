import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Interface definitions based on the API response
export interface User {
  id: number;
  userName: string;
  normalizedUserName: string;
  email: string;
  normalizedEmail: string;
  emailConfirmed: boolean;
  passwordHash: string;
  securityStamp: string;
  concurrencyStamp: string;
  phoneNumber: string;
  phoneNumberConfirmed: boolean;
  twoFactorEnabled: boolean;
  lockoutEnd: Date;
  lockoutEnabled: boolean;
  accessFailedCount: number;
  age: number;
  createdAt: Date;
  student: Student;
  students: Student[];
  notifications: Notification[];
  userRoles: UserRole[];
  teachings: Teaching[];
}

export interface Student {
  id: number;
  userId: number;
  user: string;
  parentId: number;
  parent: string;
  yearId: number;
  year: Year;
  reports: Report[];
  subscriptions: Subscription[];
  studentProgressions: StudentProgression[];
}

export interface Year {
  id: number;
  yearNumber: number;
  students: string[];
  subjects: Subject[];
}

export interface Subject {
  id: number;
  yearId: number;
  year: string;
  subjectNameId: number;
  subjectName: SubjectName;
  price: number;
  originalPrice: number;
  discountPercentage: number;
  posterUrl: string;
  posterPublicId: string;
  level: string;
  duration: number;
  terms: Term[];
  cartItems: CartItem[];
  teachings: string[];
}

export interface SubjectName {
  id: number;
  name: string;
  categoryId: number;
  category: Category;
  subjects: string[];
}

export interface Category {
  id: number;
  name: string;
  description: string;
  subjects: string[];
}

export interface Term {
  id: number;
  termNumber: number;
  startDate: string;
  subjectId: number;
  subject: string;
  weeks: Week[];
  exams: Exam[];
}

export interface Week {
  id: number;
  weekNumber: number;
  termId: number;
  term: string;
  lessons: string[];
}

export interface Exam {
  id: number;
  title: string;
  maxScore: number;
  startAt: Date;
  endAt: Date;
  termId: number;
  term: string;
  lessonId: number;
  lesson: string;
  questions: Question[];
}

export interface Question {
  id: number;
  text: string;
  videoMinute: number;
  examId: number;
  exam: string;
  options: Option[];
}

export interface Option {
  id: number;
  text: string;
  isCorrect: boolean;
  questionId: number;
  question: string;
}

export interface CartItem {
  id: number;
  quantity: number;
  cartId: number;
  cart: Cart;
  subjectId: number;
  subject: string;
}

export interface Cart {
  id: number;
  userId: number;
  user: string;
  cartItems: string[];
}

export interface Report {
  id: number;
  startDate: Date;
  endDate: Date;
  generatedAt: Date;
  reportType: number;
  summary: string;
  progressScore: number;
  lessonsCompleted: number;
  studentId: number;
  student: string;
}

export interface Subscription {
  id: number;
  startDate: Date;
  endDate: Date;
  subscriptionType: number;
  paymentStatus: number;
  paymentMethod: number;
  studentId: number;
  student: string;
}

export interface StudentProgression {
  id: number;
  hasWatched: boolean;
  hasCompletedQuestions: boolean;
  score: number;
  lessonId: number;
  lesson: Lesson;
  studentId: number;
  student: string;
}

export interface Lesson {
  id: number;
  title: string;
  posterUrl: string;
  posterPublicId: string;
  videoUrl: string;
  videoPublicId: string;
  description: string;
  weekId: number;
  week: Week;
  studentProgressions: string[];
  resources: Resource[];
  exams: Exam[];
}

export interface Resource {
  id: number;
  title: string;
  fileUrl: string;
  filePublicId: string;
  lessonId: number;
  lesson: string;
}

export interface Notification {
  id: number;
  title: string;
  message: string;
  sentAt: Date;
  isRead: boolean;
  userId: number;
  user: string;
}

export interface UserRole {
  userId: number;
  roleId: number;
  user: string;
  role: Role;
}

export interface Role {
  id: number;
  name: string;
  normalizedName: string;
  concurrencyStamp: string;
  userRoles: string[];
}

export interface Teaching {
  subjectId: number;
  subject: Subject;
  teacherId: number;
  teacher: string;
}

@Component({
  selector: 'app-student-details',
  templateUrl: './student-details.html',
  styleUrls: ['./student-details.scss'],
  standalone: false
})
export class StudentDetailsComponent implements OnInit {
  user: User | null = null;
  loading = false;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.getStudentDetails();
  }

  getStudentDetails(): void {
    this.loading = true;
    const id = this.route.snapshot.paramMap.get('id');
    
    if (!id) {
      this.error = 'No student ID provided';
      this.loading = false;
      return;
    }

    this.http.get<User>(`/api/User/${id}`).subscribe({
      next: (data) => {
        this.user = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load student details';
        this.loading = false;
        console.error('Error fetching student details:', err);
      }
    });
  }

  // Helper method to get the primary student record
  getPrimaryStudent(): Student | null {
    return this.user?.student || null;
  }

  // Calculate overall progress percentage
  calculateOverallProgress(): number {
    const student = this.getPrimaryStudent();
    if (!student || !student.studentProgressions || student.studentProgressions.length === 0) {
      return 0;
    }

    const completed = student.studentProgressions.filter(prog => prog.hasWatched && prog.hasCompletedQuestions).length;
    return Math.round((completed / student.studentProgressions.length) * 100);
  }

  // Get recent notifications
  getRecentNotifications(count: number = 5): Notification[] {
    if (!this.user?.notifications) return [];
    return this.user.notifications
      .sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime())
      .slice(0, count);
  }

  // Format date for display
  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString();
  }
}