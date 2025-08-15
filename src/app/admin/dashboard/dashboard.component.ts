import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent {
  admin = {
    name: 'إدارة النظام',
    totalUsers: 350,
    totalCourses: 45
  };
    isAddUserModalOpen = false;

  openAddUserModal() {
    this.isAddUserModalOpen = true;
  }

  closeAddUserModal() {
    this.isAddUserModalOpen = false;
  }

  handleUserCreated(user: any) {
    console.log('✅ User created:', user);
    this.isAddUserModalOpen = false;
    // هنا تقدر تعمل إعادة تحميل للـ Users list من API
  }
}
