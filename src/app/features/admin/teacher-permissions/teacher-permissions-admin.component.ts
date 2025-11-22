import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../../core/services/toast.service';
import { TeacherPermissionsService, TeacherPermission, PendingApproval } from '../../../core/services/teacher-permissions.service';
import { SubjectService } from '../../../core/services/subject.service';
import { CategoryService } from '../../../core/services/category.service';
import { Subject } from '../../../models/subject.models';

// Temporary interfaces - Remove TeacherPermission and PendingApproval as they're imported

// Temporary service - REMOVED, using real TeacherPermissionsService instead

@Component({
  selector: 'app-teacher-permissions-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './teacher-permissions-admin.component.html',
  styleUrls: ['./teacher-permissions-admin.component.scss']
})
export class TeacherPermissionsAdminComponent implements OnInit {
  private toastService = inject(ToastService);
  private permissionsService = inject(TeacherPermissionsService);
  private subjectService = inject(SubjectService);
  private categoryService = inject(CategoryService);

  loading = signal(false);
  activeTab = signal<'permissions' | 'approvals'>('permissions');

  // Subject lookup map for resolving subject names
  private subjectNamesMap = new Map<number, string>();
  private yearNamesMap = new Map<number, string>();

  // Permissions data
  teachersWithPermissions = signal<any[]>([]);
  availableTeachers = signal<any[]>([]);
  availableYears = signal<any[]>([]);
  availableSubjects = signal<any[]>([]);
  filteredSubjects = signal<any[]>([]);

  // Approvals data
  pendingApprovals = signal<PendingApproval[]>([]);

  // Modals
  showGrantModal = signal(false);
  showApprovalDetailModal = signal(false);
  selectedApproval = signal<PendingApproval | null>(null);

  // Grant permission form
  grantForm = {
    teacherId: null as number | null,
    yearId: null as string | null,
    subjectId: null as number | null,
    canCreate: true,
    canEdit: true,
    canDelete: false
  };

  // Approval action
  rejectionReason = '';

  ngOnInit(): void {
    // Load years and subjects first to populate the lookup maps
    Promise.all([
      this.loadYearsMap(),
      this.loadSubjectsMap()
    ]).then(() => {
      this.loadData();
    });
  }

  /**
   * Load all years and create a lookup map
   */
  private async loadYearsMap(): Promise<void> {
    return new Promise((resolve) => {
      this.categoryService.getYears().subscribe({
        next: (years) => {
          years.forEach((year: any) => {
            this.yearNamesMap.set(year.id, year.name || `Year ${year.yearNumber}`);
          });
          console.log('✅ Year names map loaded:', this.yearNamesMap.size, 'years');
          resolve();
        },
        error: (err) => {
          console.error('❌ Failed to load years map:', err);
          resolve(); // Continue anyway
        }
      });
    });
  }

  /**
   * Load all subjects and create a lookup map
   */
  private async loadSubjectsMap(): Promise<void> {
    return new Promise((resolve) => {
      this.subjectService.getAllSubjects().subscribe({
        next: (subjects) => {
          subjects.items.forEach((subject: Subject) => {
            this.subjectNamesMap.set(subject.id, subject.subjectName);
          });
          console.log('✅ Subject names map loaded:', this.subjectNamesMap.size, 'subjects');
          resolve();
        },
        error: (err) => {
          console.error('❌ Failed to load subjects map:', err);
          resolve(); // Continue anyway
        }
      });
    });
  }

  loadData(): void {
    if (this.activeTab() === 'permissions') {
      this.loadTeachersWithPermissions();
    } else {
      this.loadPendingApprovals();
    }
  }

  loadTeachersWithPermissions(): void {
    this.loading.set(true);

    this.permissionsService.getAllTeachersWithPermissions().subscribe({
      next: (permissions: any) => {
        console.log('✅ Raw Permissions Response:', permissions);

        // Handle different response formats
        let permList = [];
        if (Array.isArray(permissions)) {
          permList = permissions;
        } else if (permissions && permissions.data && Array.isArray(permissions.data)) {
          permList = permissions.data;
        } else if (permissions && permissions.items && Array.isArray(permissions.items)) {
          permList = permissions.items;
        }

        console.log('Processed Permissions:', permList);

        // Group permissions by teacher
        const grouped = this.groupPermissionsByTeacher(permList);
        console.log('Grouped by Teacher:', grouped);
        this.teachersWithPermissions.set(grouped);
        this.loading.set(false);
      },
      error: (error: any) => {
        console.error('❌ Error loading teachers:', error);
        this.toastService.showError('Failed to load teachers permissions');
        this.loading.set(false);
      }
    });
  }

  private groupPermissionsByTeacher(permissions: TeacherPermission[]): any[] {
    const grouped = new Map<number, any>();

    permissions.forEach((perm: any, index: number) => {
      // Enhanced logging - show first item completely
      if (index === 0) {
        console.log('🔍 FIRST PERMISSION OBJECT - ALL PROPERTIES:', JSON.stringify(perm, null, 2));
        console.log('🔍 Object.keys():', Object.keys(perm));
      }

      // Handle different property names
      const teacherId = perm.teacherId || perm.teacher_id || perm.id;
      const teacherName = perm.teacherName || perm.teacher_name || perm.name || 'Unknown Teacher';
      const teacherEmail = perm.teacherEmail || perm.teacher_email || perm.email || '';

      // First try to get subject name from our loaded map using subjectId
      let subjectName = this.subjectNamesMap.get(perm.subjectId) || null;

      // If not found in map, try API response properties
      if (!subjectName || subjectName === 'Unknown') {
        subjectName =
          perm.subjectName ||
          perm.subject_name ||
          perm.subjectTitle ||
          perm.subject_title ||
          perm.subject?.name ||
          perm.subject?.title ||
          `Subject #${perm.subjectId}` ||
          'Unknown Subject';
      }      console.log(`📚 Permission ${index + 1}:`, {
        teacherId,
        teacherName,
        subjectName,
        rawSubjectId: perm.subjectId,
        allSubjectProps: {
          subjectName: perm.subjectName,
          subject_name: perm.subject_name,
          subjectTitle: perm.subjectTitle,
          subject: perm.subject
        }
      });

      if (!grouped.has(teacherId)) {
        grouped.set(teacherId, {
          teacherId: teacherId,
          teacherName: teacherName,
          email: teacherEmail,
          totalPermissions: 0,
          subjects: [],
          permissions: []
        });
      }

      const teacher = grouped.get(teacherId)!;
      teacher.totalPermissions++;
      if (!teacher.subjects.includes(subjectName)) {
        teacher.subjects.push(subjectName);
      }
      teacher.permissions.push(perm);
    });

    return Array.from(grouped.values());
  }

  loadPendingApprovals(): void {
    this.loading.set(true);

    this.permissionsService.getPendingApprovals().subscribe({
      next: (approvals: PendingApproval[]) => {
        this.pendingApprovals.set(approvals);
        this.loading.set(false);
      },
      error: (error: any) => {
        console.error('Error loading pending approvals:', error);
        this.toastService.showError('Failed to load pending approvals');
        this.loading.set(false);
      }
    });
  }

  switchTab(tab: 'permissions' | 'approvals'): void {
    this.activeTab.set(tab);
    this.loadData();
  }

  openGrantModal(): void {
    // Load teachers and subjects
    this.loading.set(true);
    this.showGrantModal.set(true);

    // Reset form
    this.grantForm.yearId = null;
    this.grantForm.subjectId = null;
    this.filteredSubjects.set([]);

    // Load with improved error handling and timeout
    const loader = Promise.all([
      this.loadAvailableTeachersPromise(),
      this.loadAvailableSubjectsPromise()
    ]);

    loader.finally(() => {
      this.loading.set(false);
    });
  }

  private loadAvailableTeachersPromise(): Promise<void> {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        console.warn('Teachers loading timeout - no data received after 5 seconds');
        // Try fallback if API is down
        if (this.availableTeachers().length === 0) {
          console.log('Using fallback data for teachers');
          this.availableTeachers.set([
            { id: 1, name: 'Ahmed Hassan', email: 'ahmed@example.com' },
            { id: 2, name: 'Fatima Ali', email: 'fatima@example.com' },
            { id: 3, name: 'Mohammed Sultan', email: 'mohammed@example.com' }
          ]);
          this.toastService.showWarning('Using demo data - API not responding');
        }
        resolve();
      }, 5000);

      this.permissionsService.getAvailableTeachers().subscribe({
        next: (teachers: any) => {
          clearTimeout(timeout);
          console.log('✅ Raw Teachers Response:', teachers);

          let teacherList = [];
          if (Array.isArray(teachers)) {
            teacherList = teachers;
          } else if (teachers && teachers.data && Array.isArray(teachers.data)) {
            teacherList = teachers.data;
          } else if (teachers && typeof teachers === 'object') {
            teacherList = Object.values(teachers).filter((t: any) => t && typeof t === 'object');
          }

          // Log first teacher to debug property names
          if (teacherList.length > 0) {
            console.log('First teacher raw data:', teacherList[0]);
          }

          // Normalize teacher data - detect actual property names
          teacherList = teacherList.map((teacher: any) => {
            // Try different property name combinations
            const name = teacher.name || teacher.fullName || teacher.displayName ||
                        teacher.userName || teacher.first_name || `${teacher.firstName || ''} ${teacher.lastName || ''}`.trim() ||
                        teacher.email?.split('@')[0] || 'Unknown';
            const email = teacher.email || teacher.emailAddress || teacher.email_address || '';

            console.log(`Teacher mapping: ${name} (${email})`, teacher);

            return {
              id: teacher.id,
              name: name,
              email: email
            };
          });

          console.log('✅ Processed Teachers:', teacherList);
          this.availableTeachers.set(teacherList);

          if (teacherList.length === 0) {
            this.toastService.showWarning('No teachers available in the system');
          }
          resolve();
        },
        error: (error: any) => {
          clearTimeout(timeout);
          console.error('❌ Error loading teachers:', error);
          this.toastService.showError(`Failed to load teachers: ${error?.status === 401 ? 'Unauthorized - Please login again' : error?.message || 'Unknown error'}`);
          this.availableTeachers.set([]);
          resolve();
        }
      });
    });
  }

  private loadAvailableYears(): void {
    // Extract unique years from available subjects
    const yearsSet = new Set<string>();
    const yearsList: any[] = [];

    this.availableSubjects().forEach((subject: any) => {
      if (subject.yearName && !yearsSet.has(subject.yearName)) {
        yearsSet.add(subject.yearName);
        yearsList.push({
          id: subject.id, // Use subject id as temporary year id
          name: subject.yearName
        });
      }
    });

    // Remove duplicates by name
    const yearMap = yearsList.reduce((map, year) => {
      if (!map.has(year.name)) {
        map.set(year.name, year);
      }
      return map;
    }, new Map<string, any>());

    const uniqueYears = Array.from(yearMap.values());

    this.availableYears.set(uniqueYears);
    console.log('✅ Available Years:', uniqueYears);
  }

  onYearSelected(yearName: string | null): void {
    // Filter subjects by selected year
    if (!yearName) {
      this.filteredSubjects.set([]);
      return;
    }

    const filtered = this.availableSubjects().filter(
      (subject: any) => subject.yearName === yearName
    );
    this.filteredSubjects.set(filtered);
    console.log(`✅ Filtered subjects for year "${yearName}":`, filtered);
  }

  private loadAvailableSubjectsPromise(): Promise<void> {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        console.warn('Subjects loading timeout - no data received after 5 seconds');
        // Try fallback if API is down
        if (this.availableSubjects().length === 0) {
          console.log('Using fallback data for subjects');
          this.availableSubjects.set([
            { id: 1, name: 'Mathematics', yearName: 'Grade 1' },
            { id: 2, name: 'English', yearName: 'Grade 1' },
            { id: 3, name: 'Science', yearName: 'Grade 1' }
          ]);
          this.toastService.showWarning('Using demo data - API not responding');
        }
        resolve();
      }, 5000);

      // Use SubjectService.getAllSubjects() which includes year information
      this.subjectService.getAllSubjects().subscribe({
        next: (response: any) => {
          clearTimeout(timeout);
          console.log('✅ Raw Subjects Response from SubjectService:', response);

          let subjectList = [];
          if (response && response.items && Array.isArray(response.items)) {
            subjectList = response.items;
          } else if (Array.isArray(response)) {
            subjectList = response;
          } else if (response && response.data && Array.isArray(response.data)) {
            subjectList = response.data;
          }

          // Log first subject to debug property names
          if (subjectList.length > 0) {
            console.log('First subject raw data:', subjectList[0]);
          }

          // Map subjects with year information
          subjectList = subjectList.map((subject: any) => {
            const name = subject.subjectName || subject.name || subject.title || 'Unknown';
            const yearId = subject.yearId;
            const yearName = this.yearNamesMap.get(yearId) || subject.yearName || subject.year?.name || 'N/A';

            console.log(`Subject mapping: ${name} (Year: ${yearName}, yearId: ${yearId})`, subject);

            return {
              id: subject.id,
              name: name,
              yearName: yearName
            };
          });

          console.log('✅ Processed Subjects:', subjectList);
          this.availableSubjects.set(subjectList);
          this.loadAvailableYears();

          if (subjectList.length === 0) {
            this.toastService.showWarning('No subjects available in the system');
          }
          resolve();
        },
        error: (error: any) => {
          clearTimeout(timeout);
          console.error('❌ Error loading subjects:', error);
          this.toastService.showError(`Failed to load subjects: ${error?.status === 401 ? 'Unauthorized - Please login again' : error?.message || 'Unknown error'}`);
          this.availableSubjects.set([]);
          resolve();
        }
      });
    });
  }

  loadAvailableTeachers(): void {
    // Kept for backwards compatibility
    this.loadAvailableTeachersPromise();
  }

  loadAvailableSubjects(): void {
    // Kept for backwards compatibility
    this.loadAvailableSubjectsPromise();
  }

  grantPermission(): void {
    if (!this.grantForm.teacherId || !this.grantForm.yearId || !this.grantForm.subjectId) {
      this.toastService.showWarning('Please select teacher, year, and subject');
      return;
    }

    this.loading.set(true);

    this.permissionsService.grantPermission(this.grantForm).subscribe({
      next: (permission: TeacherPermission) => {
        this.toastService.showSuccess('Permission granted successfully');
        this.closeGrantModal();
        this.loadTeachersWithPermissions();
        this.loading.set(false);
      },
      error: (error: any) => {
        console.error('Error granting permission:', error);
        this.toastService.showError('Failed to grant permission');
        this.loading.set(false);
      }
    });
  }

  revokePermission(permissionId: number): void {
    if (!confirm('Are you sure you want to revoke this permission?')) {
      return;
    }

    this.loading.set(true);

    this.permissionsService.revokePermission(permissionId).subscribe({
      next: () => {
        this.toastService.showSuccess('Permission revoked successfully');
        this.loadTeachersWithPermissions();
        this.loading.set(false);
      },
      error: (error: any) => {
        console.error('Error revoking permission:', error);
        this.toastService.showError('Failed to revoke permission');
        this.loading.set(false);
      }
    });
  }

  openApprovalDetail(approval: PendingApproval): void {
    this.selectedApproval.set(approval);
    this.rejectionReason = '';
    this.showApprovalDetailModal.set(true);
  }

  approveContent(): void {
    const approval = this.selectedApproval();
    if (!approval) return;

    this.loading.set(true);

    this.permissionsService.approveContent({
      itemType: approval.type,
      itemId: approval.id,
      action: 'Approve'
    }).subscribe({
      next: () => {
        this.toastService.showSuccess(`${approval.type} approved successfully`);
        this.closeApprovalDetailModal();
        this.loadPendingApprovals();
        this.loading.set(false);
      },
      error: (error: any) => {
        console.error('Error approving content:', error);
        this.toastService.showError('Failed to approve content');
        this.loading.set(false);
      }
    });
  }

  rejectContent(): void {
    const approval = this.selectedApproval();
    if (!approval) return;

    if (!this.rejectionReason.trim()) {
      this.toastService.showWarning('Please provide a rejection reason');
      return;
    }

    this.loading.set(true);

    this.permissionsService.approveContent({
      itemType: approval.type,
      itemId: approval.id,
      action: 'Reject',
      rejectionReason: this.rejectionReason
    }).subscribe({
      next: () => {
        this.toastService.showSuccess(`${approval.type} rejected successfully`);
        this.closeApprovalDetailModal();
        this.loadPendingApprovals();
        this.loading.set(false);
      },
      error: (error: any) => {
        console.error('Error rejecting content:', error);
        this.toastService.showError('Failed to reject content');
        this.loading.set(false);
      }
    });
  }

  closeGrantModal(): void {
    this.showGrantModal.set(false);
    this.grantForm = {
      teacherId: null,
      yearId: null,
      subjectId: null,
      canCreate: true,
      canEdit: true,
      canDelete: false
    };
    this.filteredSubjects.set([]);
  }

  closeApprovalDetailModal(): void {
    this.showApprovalDetailModal.set(false);
    this.selectedApproval.set(null);
    this.rejectionReason = '';
  }

  getPendingDaysColor(days: number): string {
    if (days <= 1) return 'text-green-600';
    if (days <= 3) return 'text-yellow-600';
    return 'text-red-600';
  }
}
