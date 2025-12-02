import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AddUserModalComponent } from "../add-user-modal/add-user-modal";
import { EditTeacherModalComponent } from "../edit-teacher-modal/edit-teacher-modal";
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
import { RouterLink } from '@angular/router';
import { AdminSidebarComponent } from '../../shared/components/admin-sidebar/admin-sidebar.component';


@Component({
  selector: 'app-user-managment',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule, AddUserModalComponent, EditTeacherModalComponent],
  templateUrl: './user-managment.html',
  styleUrls: ['./user-managment.scss']
})
export class UserManagmentComponent implements OnInit, OnDestroy {
  // User data
  admin = {
    name: 'Admin',
    totalUsers: 0,
    totalCourses: 0
  };
  isAddUserModalOpen = false;
  isEditTeacherModalOpen = false;
  selectedTeacher: any = null;
  isUserDetailsModalOpen = false;
  selectedUserDetails: any = null;
  loading = false;
  users: any[] = [];
  errorMessage: string | null = null;
  searchTerm = '';
  selectedRole: string = '';

  // Pagination
  pageSize = 5;
  currentPage = signal(1);
  window: any;

  // The current user's name (fetched from the authentication service)
  userName: string = 'Admin User';

  constructor(
    private http: HttpClient,
    private authService: AuthService

  ) { }

  ngOnDestroy(): void {
  }

  ngOnInit() {
    this.fetchUsers();

    // Get the username from the authentication service if available
    // If you are using a signal for currentUser, call it as a function to access the value
    const currentUser = this.authService.currentUser?.();
    this.userName = currentUser?.userName ?? 'Admin ';
  }








  // User data methods
  fetchUsers() {
    this.loading = true;
    this.errorMessage = null;
    this.http.get<any[]>(`${environment.apiBaseUrl}/Admin/users-with-roles`)
      .subscribe({
        next: (data) => {
          console.log('📦 Raw users data from API:', data);

          // Ensure each user has isActive property (default to true if not present)
          this.users = (data || []).map(user => ({
            ...user,
            isActive: user.isActive !== undefined ? user.isActive : true
          }));

          console.log('✅ Processed users with isActive:', this.users);
          this.admin.totalUsers = this.users.length;
          this.loading = false;
          this.currentPage.set(1);
        },
        error: (err) => {
          console.error('❌ Error fetching users:', err);
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
    // Re-fetch users to ensure all data (including email) is loaded correctly
    this.fetchUsers();
  }

  openEditTeacherModal(teacher: any) {
    console.log('🔑 Opening edit modal for teacher:', teacher);

    // Fetch complete teacher details from API (includes age, phone, salary, iban)
    this.loading = true;
    this.http.get(`${environment.apiBaseUrl}/User/${teacher.id}`)
      .subscribe({
        next: (fullTeacherData: any) => {
          console.log('✅ Fetched complete teacher data:', fullTeacherData);

          // Combine data from list and API (API returns array, take first item)
          const teacherData = Array.isArray(fullTeacherData) ? fullTeacherData[0] : fullTeacherData;

          this.selectedTeacher = {
            ...teacher,
            ...teacherData,
            // Ensure critical fields are populated
            age: teacherData.age || teacher.age || null,
            phoneNumber: teacherData.phoneNumber || teacher.phoneNumber || '',
            salary: teacherData.salary || teacher.salary || null,
            iban: teacherData.iban || teacher.iban || ''
          };

          console.log('📝 Final selectedTeacher object:', this.selectedTeacher);
          this.isEditTeacherModalOpen = true;
          this.loading = false;
        },
        error: (err) => {
          console.error('❌ Error fetching teacher details:', err);
          // Fallback: use data from list (may be incomplete)
          this.selectedTeacher = teacher;
          this.isEditTeacherModalOpen = true;
          this.loading = false;
          Swal.fire({
            icon: 'warning',
            title: 'Incomplete Data',
            text: 'Could not load all teacher details. Some fields may be empty.',
            timer: 3000
          });
        }
      });
  }

  closeEditTeacherModal() {
    this.isEditTeacherModalOpen = false;
    this.selectedTeacher = null;
  }

  handleTeacherUpdated(updatedTeacher: any) {
    // Re-fetch users to get updated data
    this.fetchUsers();
  }

  /**
   * View user details - Load complete data from API
   */
  viewUserDetails(user: any) {
    console.log('🔍 Opening user details for:', user.userName);

    // Show loading state
    this.loading = true;

    // Fetch complete user details from API
    this.http.get(`${environment.apiBaseUrl}/User/${user.id}`)
      .subscribe({
        next: (fullUserData: any) => {
          console.log('✅ Fetched complete user data:', fullUserData);

          // API may return array or single object
          const userData = Array.isArray(fullUserData) ? fullUserData[0] : fullUserData;

          // Combine data from list and API
          this.selectedUserDetails = {
            ...user,
            ...userData,
            // Ensure all fields are populated
            age: userData.age || user.age || null,
            phoneNumber: userData.phoneNumber || user.phoneNumber || '',
            salary: userData.salary || user.salary || null,
            iban: userData.iban || user.iban || '',
            lastLoginDate: userData.lastLoginDate || user.lastLoginDate || null,
            emailConfirmed: userData.emailConfirmed ?? user.emailConfirmed ?? false,
            createdAt: userData.createdAt || user.createdAt || null,
            isActive: userData.isActive ?? user.isActive ?? true
          };

          console.log('📝 Final selectedUserDetails:', this.selectedUserDetails);
          this.isUserDetailsModalOpen = true;
          this.loading = false;
        },
        error: (err) => {
          console.error('❌ Error fetching user details:', err);
          // Fallback: use data from list (may be incomplete)
          this.selectedUserDetails = user;
          this.isUserDetailsModalOpen = true;
          this.loading = false;

          Swal.fire({
            icon: 'warning',
            title: 'Incomplete Data',
            text: 'Could not load all user details. Some fields may be empty.',
            timer: 3000,
            toast: true,
            position: 'top-end',
            showConfirmButton: false
          });
        }
      });
  }

  closeUserDetailsModal() {
    this.isUserDetailsModalOpen = false;
    this.selectedUserDetails = null;
  }

  formatDate(dateString: string | null | undefined): string {
    if (!dateString) return 'Never';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid Date';
    }
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage.set(page);
    }
  }

  /**
   * Change user email
   */
  async changeUserEmail(user: any) {
    const { value: newEmail } = await Swal.fire({
      title: 'Change Email',
      html: `
        <div style="text-align: left;">
          <label style="font-weight: bold; display: block; margin-bottom: 10px;">
            Change email for <strong>${user.userName}</strong>
          </label>
          <label style="display: block; margin-bottom: 5px; color: #666;">
            Current Email: <strong>${user.email || 'Not set'}</strong>
          </label>
          <input type="email" id="newEmail" class="swal2-input" placeholder="Enter new email"
                 style="width: 90%; margin: 10px auto;" required>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Update Email',
      cancelButtonText: 'Cancel',
      preConfirm: () => {
        const emailInput = (document.getElementById('newEmail') as HTMLInputElement);
        const email = emailInput?.value?.trim();

        if (!email) {
          Swal.showValidationMessage('Please enter an email address');
          return false;
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          Swal.showValidationMessage('Please enter a valid email address');
          return false;
        }

        return email;
      }
    });

    if (!newEmail) return;

    try {
      const authToken = localStorage.getItem('authToken') || '';
      const response: any = await this.http.put(
        `${environment.apiBaseUrl}/Admin/change-user-email/${user.id}`,
        { newEmail },
        {
          headers: new HttpHeaders({
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          })
        }
      ).toPromise();

      // Update local user object with response data
      if (response?.data) {
        user.email = response.data.email;
        user.userName = response.data.userName;
      } else {
        user.email = newEmail;
      }

      Swal.fire('Success!', response?.message || 'Email updated successfully', 'success');

    } catch (error: unknown) {
      console.error('API Error:', error);
      let errorMsg = 'Failed to update email. Please try again.';

      if (error instanceof HttpErrorResponse) {
        if (error.status === 401) {
          errorMsg = 'Session expired. Please login again.';
        } else if (error.status === 403) {
          errorMsg = 'Access denied. Admin role required.';
        } else if (error.status === 404) {
          errorMsg = 'User not found.';
        } else if (error.status === 400 && error.error?.errors?.length > 0) {
          // Handle validation errors from backend
          const validationErrors = error.error.errors.map((e: any) => e.description).join('\n');
          errorMsg = validationErrors;
        } else if (error.error?.message) {
          errorMsg = error.error.message;
        }
      } else if (error instanceof Error) {
        errorMsg = error.message;
      }

      Swal.fire('Error!', errorMsg, 'error');
    }
  }

  /**
   * Change user password
   */
  async changeUserPassword(user: any) {
    const { value: formValues } = await Swal.fire({
      title: 'Change Password',
      html: `
        <div style="text-align: left;">
          <label style="font-weight: bold; display: block; margin-bottom: 10px;">
            Change password for <strong>${user.userName}</strong>
          </label>
          <input type="password" id="newPassword" class="swal2-input"
                 placeholder="Enter new password"
                 style="width: 90%; margin: 10px auto;" required>
          <input type="password" id="confirmPassword" class="swal2-input"
                 placeholder="Confirm new password"
                 style="width: 90%; margin: 10px auto;" required>
          <p style="font-size: 12px; color: #666; margin: 10px 20px;">
            Password must be at least 6 characters long
          </p>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Update Password',
      cancelButtonText: 'Cancel',
      preConfirm: () => {
        const newPasswordInput = (document.getElementById('newPassword') as HTMLInputElement);
        const confirmPasswordInput = (document.getElementById('confirmPassword') as HTMLInputElement);
        const newPassword = newPasswordInput?.value;
        const confirmPassword = confirmPasswordInput?.value;

        if (!newPassword || !confirmPassword) {
          Swal.showValidationMessage('Please fill in both password fields');
          return false;
        }

        if (newPassword.length < 6) {
          Swal.showValidationMessage('Password must be at least 6 characters long');
          return false;
        }

        if (newPassword !== confirmPassword) {
          Swal.showValidationMessage('Passwords do not match');
          return false;
        }

        return newPassword;
      }
    });

    if (!formValues) return;

    try {
      const authToken = localStorage.getItem('authToken') || '';
      const response: any = await this.http.put(
        `${environment.apiBaseUrl}/Admin/change-user-password/${user.id}`,
        { newPassword: formValues },
        {
          headers: new HttpHeaders({
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          })
        }
      ).toPromise();

      Swal.fire('Success!', response?.message || 'Password updated successfully', 'success');

    } catch (error: unknown) {
      console.error('API Error:', error);
      let errorMsg = 'Failed to update password. Please try again.';

      if (error instanceof HttpErrorResponse) {
        if (error.status === 401) {
          errorMsg = 'Session expired. Please login again.';
        } else if (error.status === 403) {
          errorMsg = 'Access denied. Admin role required.';
        } else if (error.status === 404) {
          errorMsg = 'User not found.';
        } else if (error.status === 400 && error.error?.errors?.length > 0) {
          // Handle password validation errors from backend
          const validationErrors = error.error.errors.map((e: any) => e.description).join('\n');
          Swal.fire({
            title: 'Password Requirements',
            html: `<div style="text-align: left;">${validationErrors.replace(/\n/g, '<br>')}</div>`,
            icon: 'error'
          });
          return;
        } else if (error.error?.message) {
          errorMsg = error.error.message;
        }
      } else if (error instanceof Error) {
        errorMsg = error.message;
      }

      Swal.fire('Error!', errorMsg, 'error');
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
        const popup = Swal.getPopup();
        if (!popup) return Swal.showValidationMessage('Unable to read role selections');

        const roles = [...popup.querySelectorAll('input[type="checkbox"]:checked')]
          .map((el: any) => el.value);

        return roles.length ? roles : Swal.showValidationMessage('Select at least one role');
      }
    });

    if (!selectedRoles) return;

    try {
      const authToken = localStorage.getItem('authToken') || '';
      const rolesQueryParam = selectedRoles.join(',');
      await this.http.put(
        `${environment.apiBaseUrl}/Admin/edit-user-roles/${encodeURIComponent(user.userName)}?roles=${encodeURIComponent(rolesQueryParam)}`,
        null,
        {
          headers: new HttpHeaders({
            'accept': '*/*',
            'Authorization': `Bearer ${authToken}`
          })
        }
      ).toPromise()

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
  isOpen = false;

  toggleMenu() {
    this.isOpen = !this.isOpen;
  }

  closeMenu() {
    this.isOpen = false;
  }

  // ============================================
  // User Active/Inactive Management
  // ============================================

  /**
   * Activate user account
   */
  activateUser(user: any) {
    if (user.isActive) {
      Swal.fire('Info', 'User is already active', 'info');
      return;
    }

    Swal.fire({
      title: `Activate ${user.userName}?`,
      text: 'This user will be able to login and use the platform.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Activate',
      confirmButtonColor: '#10b981',
      cancelButtonText: 'Cancel',
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        this.loading = true;
        this.http.put(`${environment.apiBaseUrl}/Admin/activate-user/${user.id}`, null)
          .subscribe({
            next: (response: any) => {
              user.isActive = true;
              this.loading = false;
              Swal.fire('Success!', response.message || 'User has been activated successfully', 'success');
            },
            error: (error) => {
              this.loading = false;
              const errorMsg = error.error?.message || 'Failed to activate user. Please try again.';
              Swal.fire('Error!', errorMsg, 'error');
            }
          });
      }
    });
  }

  /**
   * Deactivate user account
   */
  deactivateUser(user: any) {
    // Prevent deactivating admin users
    if (user.roles.includes('Admin')) {
      Swal.fire('Not Allowed', 'Cannot deactivate admin users for security reasons.', 'warning');
      return;
    }

    if (!user.isActive) {
      Swal.fire('Info', 'User is already inactive', 'info');
      return;
    }

    Swal.fire({
      title: `Deactivate ${user.userName}?`,
      text: 'This user will not be able to login until reactivated.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Deactivate',
      confirmButtonColor: '#f59e0b',
      cancelButtonText: 'Cancel',
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        this.loading = true;
        this.http.put(`${environment.apiBaseUrl}/Admin/deactivate-user/${user.id}`, null)
          .subscribe({
            next: (response: any) => {
              user.isActive = false;
              this.loading = false;
              Swal.fire('Success!', response.message || 'User has been deactivated successfully', 'success');
            },
            error: (error) => {
              this.loading = false;
              const errorMsg = error.error?.message || 'Failed to deactivate user. Please try again.';
              Swal.fire('Error!', errorMsg, 'error');
            }
          });
      }
    });
  }

  /**
   * Toggle user active/inactive status
   */
  toggleUserStatus(user: any) {
    if (user.isActive) {
      this.deactivateUser(user);
    } else {
      this.activateUser(user);
    }
  }

}
