import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { SubjectService } from '../../../core/services/subject.service';
import { TutoringService } from '../../../core/services/tutoring.service';
import { ToastService } from '../../../core/services/toast.service';
import { forkJoin } from 'rxjs';

type TabType = 'overview' | 'pricing' | 'teachers' | 'discounts' | 'reports';

interface TeacherWithPriority {
  id: number;
  name: string;
  email: string;
  priority: number;
  subjects: string[];
  isActive: boolean;
  totalBookings: number;
  avgRating: number;
  isEditing?: boolean;
  newPriority?: number;
}

interface SubjectPricing {
  id: number;
  subjectName: string;
  categoryName: string;
  selfLearningPrice: number;
  tutoringPricePerHour: number | null;
  isAvailableForTutoring: boolean;
  isEditing?: boolean;
  newTutoringPrice?: number;
}

interface DiscountRule {
  id: string;
  name: string;
  type: 'group' | 'hours' | 'multiSubject';
  percentage: number;
  condition: string;
  isActive: boolean;
}

interface TutoringStats {
  totalRevenue: number;
  totalOrders: number;
  totalSessions: number;
  completedSessions: number;
  activeStudents: number;
  activeTeachers: number;
  averageOrderValue: number;
}

// ✅ Advanced Reports Interfaces
interface RevenueBySubject {
  subjectId: number;
  subjectName: string;
  revenue: number;
  sessions: number;
  percentage: number;
}

interface TeacherPerformance {
  teacherId: number;
  teacherName: string;
  totalSessions: number;
  completedSessions: number;
  cancelledSessions: number;
  totalRevenue: number;
  avgRating: number;
  completionRate: number;
  avgSessionDuration: number;
}

interface BookingTrend {
  date: string;
  bookings: number;
  revenue: number;
  sessions: number;
}

interface StudentEngagement {
  totalStudents: number;
  newStudents: number;
  returningStudents: number;
  avgSessionsPerStudent: number;
  topSubjects: { name: string; count: number }[];
}

interface SessionTypeDistribution {
  oneToOne: number;
  group: number;
  total: number;
}

interface CancellationStats {
  total: number;
  byStudent: number;
  byTeacher: number;
  refundAmount: number;
  cancellationRate: number;
}

interface AdvancedReportData {
  summary: {
    totalRevenue: number;
    totalOrders: number;
    totalSessions: number;
    completedSessions: number;
    cancelledSessions: number;
    pendingSessions: number;
    averageOrderValue: number;
    revenueGrowth: number;
    bookingGrowth: number;
  };
  revenueBySubject: RevenueBySubject[];
  teacherPerformance: TeacherPerformance[];
  bookingTrends: BookingTrend[];
  studentEngagement: StudentEngagement;
  sessionTypeDistribution: SessionTypeDistribution;
  cancellationStats: CancellationStats;
  peakHours: { hour: number; bookings: number }[];
  peakDays: { day: string; bookings: number }[];
}

@Component({
  selector: 'app-admin-tutoring-dashboard',
  standalone: true,
  templateUrl: './admin-tutoring-dashboard.component.html',
  styleUrls: ['./admin-tutoring-dashboard.component.scss'],
  imports: [CommonModule, FormsModule, RouterModule],
})
export class AdminTutoringDashboardComponent implements OnInit {
  // Tabs
  tabs = [
    // { id: 'overview' as TabType, label: 'Overview' },
    { id: 'pricing' as TabType, label: 'Pricing' },
    { id: 'teachers' as TabType, label: 'Teachers' },
    { id: 'discounts' as TabType, label: 'Discounts' }
    // { id: 'reports' as TabType, label: 'Reports' }
  ];

  activeTab = signal<TabType>('pricing');

  // Stats
  stats: TutoringStats = {
    totalRevenue: 125000,
    totalOrders: 342,
    totalSessions: 1250,
    completedSessions: 980,
    activeStudents: 156,
    activeTeachers: 28,
    averageOrderValue: 365.50
  };

  // Pricing
  subjects: SubjectPricing[] = [];
  filteredSubjects: SubjectPricing[] = [];
  pricingSearch = '';
  showOnlyTutoringEnabled = false;
  loadingPricing = signal(false);
  loadingStats = signal(false);
  saving = signal(false);

  // Teachers
  teachers: TeacherWithPriority[] = [];
  filteredTeachers: TeacherWithPriority[] = [];
  teacherSearch = '';
  teacherSort = 'priority-desc';
  loadingTeachers = signal(false);

  // Discounts
  groupDiscount: DiscountRule = {
    id: 'group',
    name: 'Group Tutoring',
    type: 'group',
    percentage: 35,
    condition: 'Group tutoring sessions',
    isActive: true
  };

  hoursDiscount: DiscountRule = {
    id: 'hours',
    name: 'Hours Package',
    type: 'hours',
    percentage: 0,
    condition: 'Based on hours booked',
    isActive: true
  };

  hoursDiscountTiers = {
    tier20: 5,
    tier30: 10
  };

  multiSubjectDiscount: DiscountRule = {
    id: 'multiSubject',
    name: 'Multiple Subjects',
    type: 'multiSubject',
    percentage: 0,
    condition: 'Multiple subjects booked',
    isActive: true
  };

  multiSubjectTiers = {
    tier2: 5,
    tier3: 10,
    tier4: 15,
    tier5: 20
  };

  multiStudentsDiscount: DiscountRule = {
    id: 'multiStudents',
    name: 'Multiple Students',
    type: 'group', // reuse type since interface doesn't have multiStudents
    percentage: 0,
    condition: 'Multiple students registered',
    isActive: true
  };

  multiStudentsTiers = {
    tier2: 5,
    tier3: 10,
    tier4: 15,
    max: 20
  };

  // Reports
  reportPeriods = ['Today', 'This Week', 'This Month', 'This Quarter', 'This Year'];
  selectedPeriod = 'This Month';
  loadingReports = signal(false);
  reportStartDate = '';
  reportEndDate = '';

  // Math for template
  Math = Math;

  // Report Data
  reportData: AdvancedReportData = {
    summary: {
      totalRevenue: 0,
      totalOrders: 0,
      totalSessions: 0,
      completedSessions: 0,
      cancelledSessions: 0,
      pendingSessions: 0,
      averageOrderValue: 0,
      revenueGrowth: 0,
      bookingGrowth: 0
    },
    revenueBySubject: [],
    teacherPerformance: [],
    bookingTrends: [],
    studentEngagement: {
      totalStudents: 0,
      newStudents: 0,
      returningStudents: 0,
      avgSessionsPerStudent: 0,
      topSubjects: []
    },
    sessionTypeDistribution: {
      oneToOne: 0,
      group: 0,
      total: 0
    },
    cancellationStats: {
      total: 0,
      byStudent: 0,
      byTeacher: 0,
      refundAmount: 0,
      cancellationRate: 0
    },
    peakHours: [],
    peakDays: []
  };

  constructor(
    private subjectService: SubjectService,
    private tutoringService: TutoringService,
    private toastService: ToastService,
    private router: Router
  ) { }

  ngOnInit(): void {
    // Load real data from APIs
    this.loadStatistics();
    this.loadPricing();
    this.loadTeachers();
    this.loadDiscountRules();
  }

  // Statistics Methods
  loadStatistics(): void {
    this.loadingStats.set(true);
    this.tutoringService.getTutoringStats().subscribe({
      next: (data: TutoringStats) => {
        this.stats = data;
        this.loadingStats.set(false);
        console.log('✅ Loaded tutoring statistics:', data);
      },
      error: (err: any) => {
        console.error('❌ Error loading statistics:', err);
        this.loadingStats.set(false);
        this.toastService.showError('Failed to load statistics');
        // Keep mock data for display
      }
    });
  }

  // Pricing Methods
  loadPricing(): void {
    this.loadingPricing.set(true);
    this.subjectService.getAllSubjects().subscribe({
      next: (response: any) => {
        const data = response.data || response.items || response || [];

        if (!Array.isArray(data) || data.length === 0) {
          console.warn('⚠️ No subjects data returned from API');
          this.toastService.showWarning('No subjects found');
          this.subjects = [];
          this.filterPricing();
          this.loadingPricing.set(false);
          return;
        }

        this.subjects = data.map((s: any) => ({
          id: s.id,
          subjectName: s.subjectName || s.name || 'Unknown',
          categoryName: s.categoryName || 'General',
          selfLearningPrice: Number(s.price) || 0,
          tutoringPricePerHour: s.tutoringPricePerHour !== null && s.tutoringPricePerHour !== undefined ? Number(s.tutoringPricePerHour) : null,
          isAvailableForTutoring: s.tutoringPricePerHour !== null && s.tutoringPricePerHour !== undefined && s.tutoringPricePerHour > 0,
          isEditing: false
        }));

        this.filterPricing();
        this.loadingPricing.set(false);
        console.log('✅ Loaded subjects:', this.subjects.length);
      },
      error: (err: any) => {
        console.error('❌ Error loading subjects:', err);
        this.loadingPricing.set(false);
        this.subjects = [];
        this.filterPricing();
        this.toastService.showError('Failed to load subjects. Please check backend connection.');
      }
    });
  }

  filterPricing(): void {
    this.filteredSubjects = this.subjects.filter(s => {
      const matchesSearch = !this.pricingSearch ||
        s.subjectName.toLowerCase().includes(this.pricingSearch.toLowerCase()) ||
        s.categoryName.toLowerCase().includes(this.pricingSearch.toLowerCase());
      const matchesTutoring = !this.showOnlyTutoringEnabled || s.isAvailableForTutoring;
      return matchesSearch && matchesTutoring;
    });
  }

  editPricing(subject: SubjectPricing): void {
    subject.isEditing = true;
    subject.newTutoringPrice = subject.tutoringPricePerHour || undefined;
  }

  savePricing(subject: SubjectPricing): void {
    const newPrice = subject.newTutoringPrice !== undefined ? subject.newTutoringPrice : null;

    this.subjectService.updateTutoringPrice(subject.id, newPrice).subscribe({
      next: (response: any) => {
        subject.tutoringPricePerHour = newPrice;
        subject.isAvailableForTutoring = newPrice !== null && newPrice > 0;
        subject.isEditing = false;
        this.toastService.showSuccess(`Pricing updated for ${subject.subjectName}`);
        this.filterPricing();
        console.log('✅ Tutoring price updated:', response);
      },
      error: (err: any) => {
        console.error('❌ Error updating tutoring price:', err);
        subject.isEditing = false;
        this.toastService.showError('Failed to update tutoring price');
      }
    });
  }

  cancelPricingEdit(subject: SubjectPricing): void {
    subject.isEditing = false;
    subject.newTutoringPrice = undefined;
  }

  hasPricingChanges(): boolean {
    return this.subjects.some(s => s.isEditing);
  }

  saveAllPricing(): void {
    this.saving.set(true);
    const editedSubjects = this.subjects.filter(s => s.isEditing);

    if (editedSubjects.length === 0) {
      this.saving.set(false);
      return;
    }

    // Create array of update observables
    const updateRequests = editedSubjects.map(subject => {
      const newPrice = subject.newTutoringPrice !== undefined ? subject.newTutoringPrice : null;
      return this.subjectService.updateTutoringPrice(subject.id, newPrice);
    });

    // Execute all updates in parallel
    forkJoin(updateRequests).subscribe({
      next: (responses: any[]) => {
        // Update all subjects with new values
        editedSubjects.forEach((subject, index) => {
          const newPrice = subject.newTutoringPrice !== undefined ? subject.newTutoringPrice : null;
          subject.tutoringPricePerHour = newPrice;
          subject.isAvailableForTutoring = newPrice !== null && newPrice > 0;
          subject.isEditing = false;
        });

        this.saving.set(false);
        this.toastService.showSuccess(`Successfully updated ${editedSubjects.length} subject(s)`);
        this.filterPricing();
        console.log('✅ All pricing changes saved');
      },
      error: (err: any) => {
        console.error('❌ Error saving pricing:', err);
        this.saving.set(false);
        this.toastService.showError('Failed to save some pricing changes');

        // Reset editing state for all subjects
        editedSubjects.forEach(subject => {
          subject.isEditing = false;
        });
      }
    });
  }

  // Teachers Methods
  loadTeachers(): void {
    this.loadingTeachers.set(true);

    // Using TutoringService to get teachers with priority
    this.tutoringService.getTeachersWithPriority('priority', 'desc', 1, 100).subscribe({
      next: (response: any) => {
        const data = response.data || response.items || response.teachers || [];

        if (!Array.isArray(data) || data.length === 0) {
          console.warn('⚠️ No teachers data returned from API');
          this.toastService.showWarning('No teachers found');
          this.teachers = [];
          this.filterTeachers();
          this.loadingTeachers.set(false);
          return;
        }

        this.teachers = data.map((t: any) => ({
          id: t.id,
          name: t.name || t.fullName || 'Unknown',
          email: t.email || '',
          priority: t.priority || 5,
          subjects: t.subjects || [],
          isActive: t.isActive !== undefined ? t.isActive : true,
          totalBookings: t.totalBookings || 0,
          avgRating: t.avgRating || 0
        }));

        this.filterTeachers();
        this.loadingTeachers.set(false);
        console.log('✅ Loaded teachers:', this.teachers.length);
      },
      error: (err: any) => {
        console.error('❌ Error loading teachers:', err);
        this.loadingTeachers.set(false);
        this.teachers = [];
        this.filterTeachers();
        this.toastService.showError('Failed to load teachers. Please check backend connection.');
      }
    });
  }

  filterTeachers(): void {
    this.filteredTeachers = this.teachers.filter(t => {
      return !this.teacherSearch ||
        t.name.toLowerCase().includes(this.teacherSearch.toLowerCase()) ||
        t.email.toLowerCase().includes(this.teacherSearch.toLowerCase());
    });
    this.sortTeachers();
  }

  sortTeachers(): void {
    const [field, direction] = this.teacherSort.split('-');
    this.filteredTeachers.sort((a, b) => {
      let comparison = 0;
      if (field === 'priority') {
        comparison = a.priority - b.priority;
      } else if (field === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (field === 'rating') {
        comparison = a.avgRating - b.avgRating;
      }
      return direction === 'desc' ? -comparison : comparison;
    });
  }

  editTeacher(teacher: TeacherWithPriority): void {
    teacher.isEditing = true;
    teacher.newPriority = teacher.priority;
  }

  saveTeacher(teacher: TeacherWithPriority): void {
    const newPriority = teacher.newPriority || teacher.priority;

    this.tutoringService.updateTeacherPriority(teacher.id, newPriority).subscribe({
      next: () => {
        teacher.priority = newPriority;
        teacher.isEditing = false;
        this.toastService.showSuccess(`Priority updated for ${teacher.name}`);
        this.sortTeachers();
      },
      error: (err: any) => {
        console.error('❌ Error updating teacher priority:', err);
        teacher.isEditing = false;
        this.toastService.showError('Failed to update teacher priority');
      }
    });
  }

  cancelTeacherEdit(teacher: TeacherWithPriority): void {
    teacher.isEditing = false;
    teacher.newPriority = undefined;
  }

  getPriorityClass(priority: number): string {
    if (priority >= 8) return 'high';
    if (priority >= 5) return 'medium';
    return 'low';
  }

  // Discounts Methods
  loadDiscountRules(): void {
    this.tutoringService.getDiscountRules().subscribe({
      next: (response: any) => {
        const data = response.data || response;

        if (data.groupDiscount) {
          this.groupDiscount.isActive = data.groupDiscount.isActive;
          this.groupDiscount.percentage = data.groupDiscount.percentage;
        }

        if (data.hoursDiscount) {
          this.hoursDiscount.isActive = data.hoursDiscount.isActive;
          if (data.hoursDiscount.tiers) {
            this.hoursDiscountTiers.tier20 = data.hoursDiscount.tiers.hours20 || 5;
            this.hoursDiscountTiers.tier30 = data.hoursDiscount.tiers.hours30 || 10;
          }
        }

        if (data.multiSubjectDiscount) {
          this.multiSubjectDiscount.isActive = data.multiSubjectDiscount.isActive;
          if (data.multiSubjectDiscount.tiers) {
            this.multiSubjectTiers.tier2 = data.multiSubjectDiscount.tiers.subjects2 || 5;
            this.multiSubjectTiers.tier3 = data.multiSubjectDiscount.tiers.subjects3 || 10;
            this.multiSubjectTiers.tier4 = data.multiSubjectDiscount.tiers.subjects4 || 15;
            this.multiSubjectTiers.tier5 = data.multiSubjectDiscount.tiers.subjects5 || 20;
          }
        }

        if (data.multiStudentsDiscount) {
          this.multiStudentsDiscount.isActive = data.multiStudentsDiscount.isActive;
          if (data.multiStudentsDiscount.tiers) {
            this.multiStudentsTiers.tier2 = data.multiStudentsDiscount.tiers.students2 || 5;
            this.multiStudentsTiers.tier3 = data.multiStudentsDiscount.tiers.students3 || 10;
            this.multiStudentsTiers.tier4 = data.multiStudentsDiscount.tiers.students4 || 15;
            this.multiStudentsTiers.max = data.multiStudentsDiscount.tiers.maxPercentage || 20;
          }
        }

        console.log('✅ Loaded discount rules:', data);
      },
      error: (err: any) => {
        console.error('❌ Error loading discount rules:', err);
        // Keep default values on error
      }
    });
  }

  saveDiscountRule(rule: DiscountRule): void {
    // Build the request body based on the discount rules structure
    const discountRules = {
      groupDiscount: {
        isActive: this.groupDiscount.isActive,
        percentage: this.groupDiscount.percentage
      },
      hoursDiscount: {
        isActive: this.hoursDiscount.isActive,
        tiers: {
          hours20: this.hoursDiscountTiers.tier20,
          hours30: this.hoursDiscountTiers.tier30
        }
      },
      multiSubjectDiscount: {
        isActive: this.multiSubjectDiscount.isActive,
        tiers: {
          subjects2: this.multiSubjectTiers.tier2,
          subjects3: this.multiSubjectTiers.tier3,
          subjects4: this.multiSubjectTiers.tier4,
          subjects5: this.multiSubjectTiers.tier5
        }
      },
      multiStudentsDiscount: {
        isActive: this.multiStudentsDiscount.isActive,
        tiers: {
          students2: this.multiStudentsTiers.tier2,
          students3: this.multiStudentsTiers.tier3,
          students4: this.multiStudentsTiers.tier4,
          maxPercentage: this.multiStudentsTiers.max
        }
      }
    };

    // Debug: Log current values
    console.log('📤 Saving discount rules with values:', JSON.stringify(discountRules, null, 2));
    console.log('🔍 Component state:', {
      groupDiscount: this.groupDiscount,
      hoursDiscountTiers: this.hoursDiscountTiers,
      multiSubjectTiers: this.multiSubjectTiers,
      multiStudentsTiers: this.multiStudentsTiers
    });

    this.tutoringService.updateDiscountRules(discountRules).subscribe({
      next: (response: any) => {
        this.toastService.showSuccess(`Discount rules updated successfully!`);
        console.log('✅ Discount rules saved:', response);
      },
      error: (err: any) => {
        console.error('❌ Error saving discount rules:', err);
        this.toastService.showError('Failed to save discount rules');
      }
    });
  }

  saveMultiStudentsDiscount(): void {
    // Just call saveDiscountRule which includes all discounts including multiStudents
    this.saveDiscountRule(this.multiStudentsDiscount);
  }

  // Reports Methods
  loadReports(): void {
    this.loadingReports.set(true);

    // Calculate date range based on selected period
    const { startDate, endDate } = this.getDateRange(this.selectedPeriod);

    // ✅ Use real API
    this.tutoringService.getTutoringReports(startDate, endDate, this.selectedPeriod).subscribe({
      next: (response: any) => {
        const data = response.data || response;
        this.reportData = data;
        this.loadingReports.set(false);
        console.log('✅ Loaded report data for period:', this.selectedPeriod, data);
      },
      error: (err: any) => {
        console.error('❌ Error loading reports:', err);
        this.loadingReports.set(false);
        this.toastService.showError('Failed to load reports');

        // Keep empty state for error
        this.reportData = this.getEmptyReportData();
      }
    });
  }

  loadReportsCustomDate(): void {
    if (!this.reportStartDate || !this.reportEndDate) {
      this.toastService.showWarning('Please select both start and end dates');
      return;
    }

    this.loadingReports.set(true);
    this.selectedPeriod = 'Custom';

    // ✅ Use real API with custom dates
    this.tutoringService.getTutoringReports(this.reportStartDate, this.reportEndDate).subscribe({
      next: (response: any) => {
        const data = response.data || response;
        this.reportData = data;
        this.loadingReports.set(false);
        console.log('✅ Loaded custom date report:', data);
      },
      error: (err: any) => {
        console.error('❌ Error loading custom date report:', err);
        this.loadingReports.set(false);
        this.toastService.showError('Failed to load reports');
        this.reportData = this.getEmptyReportData();
      }
    });
  }

  getEmptyReportData(): AdvancedReportData {
    return {
      summary: {
        totalRevenue: 0,
        totalOrders: 0,
        totalSessions: 0,
        completedSessions: 0,
        cancelledSessions: 0,
        pendingSessions: 0,
        averageOrderValue: 0,
        revenueGrowth: 0,
        bookingGrowth: 0
      },
      revenueBySubject: [],
      teacherPerformance: [],
      bookingTrends: [],
      studentEngagement: {
        totalStudents: 0,
        newStudents: 0,
        returningStudents: 0,
        avgSessionsPerStudent: 0,
        topSubjects: []
      },
      sessionTypeDistribution: {
        oneToOne: 0,
        group: 0,
        total: 0
      },
      cancellationStats: {
        total: 0,
        byStudent: 0,
        byTeacher: 0,
        refundAmount: 0,
        cancellationRate: 0
      },
      peakHours: [],
      peakDays: []
    };
  }

  getDateRange(period: string): { startDate: string; endDate: string } {
    const now = new Date();
    let startDate = new Date();
    const endDate = now.toISOString().split('T')[0];

    switch (period) {
      case 'Today':
        startDate = now;
        break;
      case 'This Week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'This Month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'This Quarter':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case 'This Year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate
    };
  }

  // Report Helper Methods
  getBarHeight(bookings: number): number {
    const max = Math.max(...this.reportData.bookingTrends.map(t => t.bookings));
    return max > 0 ? (bookings / max) * 100 : 0;
  }

  getSessionPercent(type: 'oneToOne' | 'group'): string {
    const total = this.reportData.sessionTypeDistribution.total;
    if (total === 0) return '0';
    const value = this.reportData.sessionTypeDistribution[type];
    return ((value / total) * 100).toFixed(1);
  }

  getPeakPercent(bookings: number): number {
    const max = Math.max(...this.reportData.peakHours.map(h => h.bookings));
    return max > 0 ? (bookings / max) * 100 : 0;
  }

  getDayPercent(bookings: number): number {
    const max = Math.max(...this.reportData.peakDays.map(d => d.bookings));
    return max > 0 ? (bookings / max) * 100 : 0;
  }

  formatHour(hour: number): string {
    const suffix = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:00 ${suffix}`;
  }

  exportReport(format: 'pdf' | 'excel'): void {
    const { startDate, endDate } = this.getDateRange(this.selectedPeriod);

    this.toastService.showInfo(`Preparing ${format.toUpperCase()} export...`);

    this.tutoringService.exportReports(format, startDate, endDate, 'summary,revenue,teachers,students').subscribe({
      next: (blob: Blob) => {
        // Create download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `tutoring-report-${this.selectedPeriod}-${new Date().getTime()}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
        link.click();
        window.URL.revokeObjectURL(url);

        this.toastService.showSuccess(`Report exported successfully!`);
      },
      error: (err: any) => {
        console.error('❌ Error exporting report:', err);
        this.toastService.showError('Failed to export report');
      }
    });
  }
}
