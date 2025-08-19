import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AddUserModalComponent } from "../add-user-modal/add-user-modal";
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, AddUserModalComponent, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  sidebarCollapsed = false;

  toggleSidebar() {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  
  // User data
  admin = {
    name: 'Admin',
    totalUsers: 0,
    totalCourses: 0
  };
  isAddUserModalOpen = false;
  loading = false;
  users: any[] = [];
  errorMessage: string | null = null;
  searchTerm = '';
  selectedRole: string = '';

  // Pagination
  pageSize = 5;
  currentPage = signal(1);
window: any;

  constructor(private http: HttpClient) {}
  ngOnDestroy(): void {
    throw new Error('Method not implemented.');
  }

  ngOnInit() {
    this.fetchUsers();
  }








  // User data methods
  fetchUsers() {
    this.loading = true;
    this.errorMessage = null;
    this.http.get<any[]>(`${environment.apiBaseUrl}/Admin/users-with-roles`)
      .subscribe({
        next: (data) => {
          this.users = data || [];
          this.admin.totalUsers = this.users.length;
          this.loading = false;
          this.currentPage.set(1);
        },
        error: (err) => {
          this.errorMessage = 'Failed to load users. Please try again later.';
          this.loading = false;
        }
      });
  }

  filterByRole() {
    this.currentPage.set(1); // Reset to first page when filtering
  }

  // Pagination methods
  get startIndex() {
    return (this.currentPage() - 1) * this.pageSize + 1;
  }

  get endIndex() {
    return Math.min(this.currentPage() * this.pageSize, this.filteredUsers.length);
  }

  availableRoles = ['Admin', 'Teacher', 'Parent', 'Student'];

  get filteredUsers() {
    let users = this.users;
    if (this.selectedRole) {
      users = users.filter(u => u.roles?.includes(this.selectedRole));
    }
    if (this.searchTerm?.trim()) {
      const term = this.searchTerm.trim().toLowerCase();
      users = users.filter(u =>
        (u.userName && u.userName.toLowerCase().includes(term)) ||
        (u.email && u.email.toLowerCase().includes(term))
      );
    }
    return users;
  }

  get totalPages() {
    return Math.ceil(this.filteredUsers.length / this.pageSize) || 1;
  }

  get pagedUsers() {
    const start = (this.currentPage() - 1) * this.pageSize;
    return this.filteredUsers.slice(start, start + this.pageSize);
  }

  getVisiblePages(): number[] {
    const current = this.currentPage();
    const total = this.totalPages;
    const range = 2;
    
    if (total <= 5) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    
    let start = Math.max(1, current - range);
    let end = Math.min(total, current + range);
    
    const pages = [];
    
    if (start > 1) {
      pages.push(1);
      if (start > 2) pages.push(-1);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    if (end < total) {
      if (end < total - 1) pages.push(-1);
      pages.push(total);
    }
    
    return pages;
  }

  // User management methods
  openAddUserModal() {
    this.isAddUserModalOpen = true;
  }

  closeAddUserModal() {
    this.isAddUserModalOpen = false;
  }

  handleUserCreated(newUser: any) {
    this.users.unshift(newUser);
    this.admin.totalUsers = this.users.length;
    this.currentPage.set(1);
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage.set(page);
    }
  }

  async editUserRoles(user: any) {
    const availableRoles = ['Admin', 'Teacher', 'Parent', 'Student', 'Member'];
    
    const { value: selectedRoles } = await Swal.fire({
      title: 'Edit User Roles',
      html: `
        <div style="text-align: left;">
          <label style="font-weight: bold; display: block; margin-bottom: 10px;">
            Roles for <strong>${user.userName}</strong>
          </label>
          ${availableRoles.map(role => `
            <label style="display: block; margin-bottom: 5px; cursor: pointer;">
              <input type="checkbox" value="${role}" 
                     ${user.roles.includes(role) ? 'checked' : ''} 
                     style="margin-right: 8px;" />
              ${role}
            </label>
          `).join('')}
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Update',
      preConfirm: () => {
        const roles = [...document.querySelectorAll('input[type="checkbox"]:checked')]
                     .map((el: any) => el.value);
        return roles.length ? roles : Swal.showValidationMessage('Select at least one role');
      }
    });

    if (!selectedRoles) return;

    try {
      const authToken = localStorage.getItem('authToken') || '';
      const rolesQueryParam = selectedRoles.join(',');
      
      await this.http.post(
        `${environment.apiBaseUrl}/Admin/edit-user-roles/${encodeURIComponent(user.userName)}?roles=${encodeURIComponent(rolesQueryParam)}`,
        null,
        {
          headers: new HttpHeaders({
            'accept': '*/*',
            'Authorization': `Bearer ${authToken}`
          })
        }
      ).toPromise();

      user.roles = selectedRoles;
      Swal.fire('Success!', 'Roles updated successfully', 'success');
      
    } catch (error: unknown) {
      console.error('API Error:', error);
      let errorMsg = 'Failed to update roles. Please try again.';
      
      if (error instanceof HttpErrorResponse) {
        if (error.status === 401) {
          errorMsg = 'Session expired. Please login again.';
        } else if (error.error?.message) {
          errorMsg = error.error.message;
        }
      } else if (error instanceof Error) {
        errorMsg = error.message;
      }
      
      Swal.fire('Error!', errorMsg, 'error');
    }
  }

  deleteUser(user: any) {
    Swal.fire({
      title: `Delete ${user.userName}?`,
      text: "This action cannot be undone!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Delete',
      confirmButtonColor: '#e8326b',
      cancelButtonText: 'Cancel',
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        this.http.delete(`${environment.apiBaseUrl}/Admin/delete-user/${user.id}`)
          .subscribe({
            next: () => {
              this.users = this.users.filter(u => u.id !== user.id);
              this.admin.totalUsers = this.users.length;
              if (this.pagedUsers.length === 0 && this.currentPage() > 1) {
                this.currentPage.set(this.currentPage() - 1);
              }
              Swal.fire('Deleted!', 'User has been deleted.', 'success');
            },
            error: () => {
              Swal.fire('Error!', 'Failed to delete user. Please try again.', 'error');
            }
          });
      }
    });
  }

  clearSearch() {
    this.searchTerm = '';
    this.selectedRole = '';
    this.currentPage.set(1);
  }

  // Role counts
  get totalTeachers(): number {
    return this.users.filter(user => user.roles.includes('Teacher')).length;
  }

  get totalParents(): number {
    return this.users.filter(user => user.roles.includes('Parent')).length;
  }

  get totalStudents(): number {
    return this.users.filter(user => user.roles.includes('Student')).length;
  }

  get totalAdmin(): number {
    return this.users.filter(user => user.roles.includes('Admin')).length;
  }

  // Add this method to fix the error
  onRoleFilterChange() {
    this.currentPage.set(1);
  }

  
}