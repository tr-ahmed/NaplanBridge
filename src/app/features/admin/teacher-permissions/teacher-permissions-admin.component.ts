import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../../core/services/toast.service';

// Temporary interfaces
export interface TeacherPermission {
  id: number;
  teacherId: number;
  teacherName: string;
  teacherEmail: string;
  subjectId: number;
  subjectName: string;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  isActive: boolean;
}

export interface PendingApproval {
  id: number;
  type: string;
  title: string;
  subjectName: string;
  createdBy: string;
  createdByEmail: string;
  createdAt: Date;
  pendingDays: number;
  weekNumber?: number;
  termNumber?: number;
}

// Temporary service
class MockTeacherPermissionsService {
  getAllTeachersWithPermissions() {
    return { subscribe: (callbacks: any) => {
      setTimeout(() => callbacks.next([]), 500);
    }};
  }

  getPendingApprovals() {
    return { subscribe: (callbacks: any) => {
      setTimeout(() => callbacks.next([]), 500);
    }};
  }

  getAvailableTeachers() {
    return { subscribe: (callbacks: any) => {
      setTimeout(() => callbacks.next([]), 500);
    }};
  }

  getAvailableSubjects() {
    return { subscribe: (callbacks: any) => {
      setTimeout(() => callbacks.next([]), 500);
    }};
  }

  grantPermission(form: any) {
    return { subscribe: (callbacks: any) => {
      setTimeout(() => callbacks.next({}), 500);
    }};
  }

  revokePermission(id: any) {
    return { subscribe: (callbacks: any) => {
      setTimeout(() => callbacks.next({}), 500);
    }};
  }

  approveContent(action: any) {
    return { subscribe: (callbacks: any) => {
      setTimeout(() => callbacks.next({}), 500);
    }};
  }
}

@Component({
  selector: 'app-teacher-permissions-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './teacher-permissions-admin.component.html',
  styleUrls: ['./teacher-permissions-admin.component.scss']
})
export class TeacherPermissionsAdminComponent implements OnInit {
  private toastService = inject(ToastService);
  private permissionsService = new MockTeacherPermissionsService();

  loading = signal(false);
  activeTab = signal<'permissions' | 'approvals'>('permissions');

  // Permissions data
  teachersWithPermissions = signal<any[]>([]);
  availableTeachers = signal<any[]>([]);
  availableSubjects = signal<any[]>([]);

  // Approvals data
  pendingApprovals = signal<PendingApproval[]>([]);

  // Modals
  showGrantModal = signal(false);
  showApprovalDetailModal = signal(false);
  selectedApproval = signal<PendingApproval | null>(null);

  // Grant permission form
  grantForm = {
    teacherId: null as number | null,
    subjectId: null as number | null,
    canCreate: true,
    canEdit: true,
    canDelete: false
  };

  // Approval action
  rejectionReason = '';

  ngOnInit(): void {
    this.loadData();
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
      next: (permissions: TeacherPermission[]) => {
        // Group permissions by teacher
        const grouped = this.groupPermissionsByTeacher(permissions);
        this.teachersWithPermissions.set(grouped);
        this.loading.set(false);
      },
      error: (error: any) => {
        console.error('Error loading teachers:', error);
        this.toastService.showError('Failed to load teachers permissions');
        this.loading.set(false);
      }
    });
  }

  private groupPermissionsByTeacher(permissions: TeacherPermission[]): any[] {
    const grouped = new Map<number, any>();

    permissions.forEach(perm => {
      if (!grouped.has(perm.teacherId)) {
        grouped.set(perm.teacherId, {
          teacherId: perm.teacherId,
          teacherName: perm.teacherName,
          email: perm.teacherEmail,
          totalPermissions: 0,
          subjects: [],
          permissions: []
        });
      }

      const teacher = grouped.get(perm.teacherId)!;
      teacher.totalPermissions++;
      teacher.subjects.push(perm.subjectName);
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
    this.loadAvailableTeachers();
    this.loadAvailableSubjects();
    this.showGrantModal.set(true);
  }

  loadAvailableTeachers(): void {
    this.permissionsService.getAvailableTeachers().subscribe({
      next: (teachers: any) => {
        this.availableTeachers.set(teachers);
      },
      error: (error: any) => {
        console.error('Error loading teachers:', error);
      }
    });
  }

  loadAvailableSubjects(): void {
    this.permissionsService.getAvailableSubjects().subscribe({
      next: (subjects: any) => {
        this.availableSubjects.set(subjects);
      },
      error: (error: any) => {
        console.error('Error loading subjects:', error);
      }
    });
  }

  grantPermission(): void {
    if (!this.grantForm.teacherId || !this.grantForm.subjectId) {
      this.toastService.showWarning('Please select teacher and subject');
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
      subjectId: null,
      canCreate: true,
      canEdit: true,
      canDelete: false
    };
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
