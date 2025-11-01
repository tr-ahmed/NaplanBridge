/**
 * Student Sessions Component
 * للطلاب لعرض حصصهم القادمة والانضمام إليها
 */

import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SessionService } from '../../../core/services/session.service';
import { ToastService } from '../../../core/services/toast.service';
import { PrivateSessionDto } from '../../../models/session.models';

@Component({
  selector: 'app-student-sessions',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './student-sessions.component.html',
  styleUrl: './student-sessions.component.scss'
})
export class StudentSessionsComponent implements OnInit {
  private sessionService = inject(SessionService);
  private toastService = inject(ToastService);

  sessions = signal<PrivateSessionDto[]>([]);
  loading = signal<boolean>(true);

  ngOnInit(): void {
    this.loadSessions();
  }

  loadSessions(): void {
    this.loading.set(true);

    this.sessionService.getStudentUpcomingSessions().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.sessions.set(response.data);
        }
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading sessions:', error);
        this.toastService.showError('فشل في تحميل الحصص');
        this.loading.set(false);
      }
    });
  }

  formatDateTime(dateTime: string): string {
    const { date, time, dayOfWeek } = this.sessionService.formatSessionDateTime(dateTime);
    return `${dayOfWeek}، ${date} - ${time}`;
  }

  canJoinSession(dateTime: string): boolean {
    return this.sessionService.canJoinSession(dateTime);
  }

  getMinutesUntil(dateTime: string): number {
    return this.sessionService.getMinutesUntilSession(dateTime);
  }
}
