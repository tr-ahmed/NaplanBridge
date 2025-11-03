/**
 * Teacher Sessions Dashboard Component
 * For teachers to view their upcoming and past sessions
 */

import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SessionService } from '../../../core/services/session.service';
import { ToastService } from '../../../core/services/toast.service';
import { PrivateSessionDto } from '../../../models/session.models';

@Component({
  selector: 'app-teacher-sessions',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './teacher-sessions.component.html',
  styleUrl: './teacher-sessions.component.scss'
})
export class TeacherSessionsComponent implements OnInit {
  private sessionService = inject(SessionService);
  private toastService = inject(ToastService);

  upcomingSessions = signal<PrivateSessionDto[]>([]);
  pastSessions = signal<PrivateSessionDto[]>([]);
  loading = signal<boolean>(true);
  activeTab = signal<'upcoming' | 'history'>('upcoming');

  ngOnInit(): void {
    this.loadSessions();
  }

  loadSessions(): void {
    this.loading.set(true);

    // Load upcoming sessions
    this.sessionService.getTeacherUpcomingSessions().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.upcomingSessions.set(response.data);
        }
      },
      error: (error) => console.error('Error loading upcoming sessions:', error)
    });

    // Load past sessions
    this.sessionService.getTeacherSessionHistory().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.pastSessions.set(response.data);
        }
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading session history:', error);
        this.loading.set(false);
      }
    });
  }

  formatDateTime(dateTime: string): string {
    const { date, time, dayOfWeek } = this.sessionService.formatSessionDateTime(dateTime);
    return `${dayOfWeek}، ${date} - ${time}`;
  }

  getStatusClass(status: string): string {
    const classes: { [key: string]: string } = {
      'Confirmed': 'bg-green-100 text-green-800',
      'Completed': 'bg-blue-100 text-blue-800',
      'Cancelled': 'bg-red-100 text-red-800'
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
  }

  getStatusText(status: string): string {
    const texts: { [key: string]: string } = {
      'Confirmed': 'Confirmed',
      'Completed': 'Completed',
      'Cancelled': 'Cancelled'
    };
    return texts[status] || status;
  }

  setTab(tab: 'upcoming' | 'history'): void {
    this.activeTab.set(tab);
  }
}
