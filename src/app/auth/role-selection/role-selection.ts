// role-selection.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-role-selection',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './role-selection.html',
  styleUrls: ['./role-selection.scss']
})
export class RoleSelectionComponent implements OnInit {
  availableRoles: string[] = [];
  userName: string = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const userRoles = this.authService.userRoles();
    
    // Filter roles to remove Member if there are other roles
    this.availableRoles = userRoles.filter(role => 
      role.toLowerCase() !== 'member' || userRoles.length === 1
    );
    
    const currentUser = this.authService.currentUser();
    this.userName = currentUser?.userName || 'User';
  }

  selectRole(role: string): void {
    try {
      this.authService.selectUserRole(role);
    } catch (error) {
      console.error('Error selecting role:', error);
    }
  }

  getRoleIcon(role: string): string {
    const roleLower = role.toLowerCase();
    switch(roleLower) {
      case 'admin': return 'fas fa-cogs';
      case 'teacher': return 'fas fa-chalkboard-teacher';
      case 'parent': return 'fas fa-user-friends';
      case 'student': return 'fas fa-graduation-cap';
      default: return 'fas fa-user';
    }
  }

  getRoleDisplayName(role: string): string {
    const roleLower = role.toLowerCase();
    switch(roleLower) {
      case 'admin': return 'Administrator';
      case 'teacher': return 'Teacher';
      case 'parent': return 'Parent';
      case 'student': return 'Student';
      default: return role;
    }
  }

  getRoleDescription(role: string): string {
    const roleLower = role.toLowerCase();
    switch(roleLower) {
      case 'admin': return 'Manage users and system settings';
      case 'teacher': return 'Manage classes, students, and lessons';
      case 'parent': return 'Monitor your children\'s performance';
      case 'student': return 'Access your classes and learning materials';
      default: return 'Access the system';
    }
  }

  logout(): void {
    this.authService.logout();
  }
}