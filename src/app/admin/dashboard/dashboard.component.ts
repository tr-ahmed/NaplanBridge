import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AddUserModalComponent } from "../add-user-modal/add-user-modal";

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, AddUserModalComponent],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent {
  admin = {
    name: 'إدارة النظام',
    totalUsers: 350,
    totalCourses: 45
  };
    isAddUserModalOpen = false;
  loading = false;
  users: any[] = []; // يجب أن تكون مصفوفة
  errorMessage: string | null = null;

  openAddUserModal() {
    this.isAddUserModalOpen = true;
  }

  closeAddUserModal() {
    this.isAddUserModalOpen = false;
  }

  handleUserCreated(newUser: any) {
    // أضف المدرس الجديد مباشرة أو أعد تحميل القائمة من الـ API
    this.users.push(newUser);
  }
}
