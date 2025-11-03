/**
 * User Management Component
 * CRUD operations for managing all system users
 */

import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { ToastService } from '../../core/services/toast.service';

interface User {
  id: number;
  name: string;
  email: string;
  role: 'Student' | 'Teacher' | 'Parent' | 'Admin';
  status: 'Active' | 'Inactive' | 'Suspended';
  createdAt: Date;
  lastLogin?: Date;
  phone?: string;
}

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-management.component.html',
  styleUrl: './user-management.component.scss'
})
export class UserManagementComponent implements OnInit {
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  loading = signal<boolean>(true);
  users = signal<User[]>([]);
  selectedUsers = signal<number[]>([]);

  // Filters
  searchQuery = signal<string>('');
  roleFilter = signal<string>('All');
  statusFilter = signal<string>('All');

  // Modal
  showModal = signal<boolean>(false);
  editingUser = signal<User | null>(null);

  // Computed
  filteredUsers = computed(() => {
    let filtered = this.users();

    const query = this.searchQuery().toLowerCase();
    if (query) {
      filtered = filtered.filter(u =>
        u.name.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query)
      );
    }

    const role = this.roleFilter();
    if (role !== 'All') {
      filtered = filtered.filter(u => u.role === role);
    }

    const status = this.statusFilter();
    if (status !== 'All') {
      filtered = filtered.filter(u => u.status === status);
    }

    return filtered;
  });

  totalUsers = computed(() => this.users().length);
  activeUsers = computed(() => this.users().filter(u => u.status === 'Active').length);

  ngOnInit(): void {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser && currentUser.role === 'Admin') {
      this.loadUsers();
    } else {
      this.router.navigate(['/login']);
    }
  }

  loadUsers(): void {
    this.loading.set(true);
    // Mock data
    setTimeout(() => {
      const mockUsers: User[] = Array.from({ length: 25 }, (_, i) => ({
        id: i + 1,
        name: `User ${i + 1}`,
        email: `user${i + 1}@example.com`,
        role: ['Student', 'Teacher', 'Parent', 'Admin'][i % 4] as any,
        status: ['Active', 'Inactive', 'Suspended'][i % 3] as any,
        createdAt: new Date(2025, 0, i + 1),
        lastLogin: i % 3 === 0 ? new Date(2025, 9, 24) : undefined,
        phone: `+1234567${String(i).padStart(3, '0')}`
      }));
      this.users.set(mockUsers);
      this.loading.set(false);
    }, 500);
  }

  createUser(): void {
    this.editingUser.set(null);
    this.showModal.set(true);
  }

  editUser(user: User): void {
    this.editingUser.set(user);
    this.showModal.set(true);
  }

  deleteUser(userId: number): void {
    if (confirm('Delete this user? This action cannot be undone.')) {
      this.users.update(users => users.filter(u => u.id !== userId));
      this.toastService.showSuccess('User deleted successfully');
    }
  }

  deleteSelected(): void {
    const count = this.selectedUsers().length;
    if (count === 0) return;

    if (confirm(`Delete ${count} selected user(s)?`)) {
      this.users.update(users =>
        users.filter(u => !this.selectedUsers().includes(u.id))
      );
      this.selectedUsers.set([]);
      this.toastService.showSuccess(`${count} user(s) deleted`);
    }
  }

  toggleUserSelection(userId: number): void {
    this.selectedUsers.update(selected => {
      if (selected.includes(userId)) {
        return selected.filter(id => id !== userId);
      }
      return [...selected, userId];
    });
  }

  selectAll(): void {
    const allIds = this.filteredUsers().map(u => u.id);
    this.selectedUsers.set(allIds);
  }

  clearSelection(): void {
    this.selectedUsers.set([]);
  }

  onSubmitUser(form: any): void {
    if (form.valid) {
      const userData: Partial<User> = {
        name: form.value.name,
        email: form.value.email,
        role: form.value.role,
        status: form.value.status,
        phone: form.value.phone,
        createdAt: this.editingUser()?.createdAt || new Date()
      };
      this.saveUser(userData);
    }
  }

  saveUser(userData: Partial<User>): void {
    if (this.editingUser()) {
      // Update
      this.users.update(users =>
        users.map(u => u.id === this.editingUser()!.id ? { ...u, ...userData } : u)
      );
      this.toastService.showSuccess('User updated successfully');
    } else {
      // Create
      const newId = Math.max(...this.users().map(u => u.id), 0) + 1;
      const newUser: User = {
        ...(userData as User),
        id: newId
      };
      this.users.update(users => [...users, newUser]);
      this.toastService.showSuccess('User created successfully');
    }
    this.showModal.set(false);
  }

  closeModal(): void {
    this.showModal.set(false);
  }

  getRoleBadgeClass(role: string): string {
    const classes: Record<string, string> = {
      'Student': 'bg-blue-100 text-blue-800',
      'Teacher': 'bg-green-100 text-green-800',
      'Parent': 'bg-purple-100 text-purple-800',
      'Admin': 'bg-red-100 text-red-800'
    };
    return classes[role] || 'bg-gray-100 text-gray-800';
  }

  getStatusBadgeClass(status: string): string {
    const classes: Record<string, string> = {
      'Active': 'bg-green-100 text-green-800',
      'Inactive': 'bg-gray-100 text-gray-800',
      'Suspended': 'bg-red-100 text-red-800'
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
  }
}
