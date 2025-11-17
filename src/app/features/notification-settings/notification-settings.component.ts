import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../core/services/notification.service';
import { NotificationPreference } from '../../models/notification.models';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-notification-settings',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification-settings.component.html',
  styleUrls: ['./notification-settings.component.scss']
})
export class NotificationSettingsComponent implements OnInit {
  preferences: NotificationPreference[] = [];
  isLoading = true;
  isSaving = false;

  // Group preferences by category
  categorizedPreferences: Map<string, NotificationPreference[]> = new Map();

  constructor(
    private notificationService: NotificationService,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.loadPreferences();
  }

  async loadPreferences() {
    try {
      this.isLoading = true;
      const response = await this.notificationService.getPreferences().toPromise();
      this.preferences = response?.preferences || [];

      // Group by category
      this.categorizePreferences();
    } catch (error) {
      console.error('Failed to load preferences:', error);
      this.toastService.showError('Failed to load notification preferences');
    } finally {
      this.isLoading = false;
    }
  }

  private categorizePreferences() {
    this.categorizedPreferences.clear();

    this.preferences.forEach(pref => {
      if (!this.categorizedPreferences.has(pref.category)) {
        this.categorizedPreferences.set(pref.category, []);
      }
      this.categorizedPreferences.get(pref.category)!.push(pref);
    });
  }

  async updatePreference(preference: NotificationPreference, channel: string) {
    try {
      this.isSaving = true;

      const dto = {
        eventKey: preference.eventKey,
        enableEmail: channel === 'email' ? !preference.enableEmail : preference.enableEmail,
        enableInApp: channel === 'inApp' ? !preference.enableInApp : preference.enableInApp,
        enableSMS: channel === 'sms' ? !preference.enableSMS : preference.enableSMS,
        enablePush: channel === 'push' ? !preference.enablePush : preference.enablePush
      };

      await this.notificationService.updatePreference(dto).toPromise();

      // Update local state
      if (channel === 'email') preference.enableEmail = !preference.enableEmail;
      if (channel === 'inApp') preference.enableInApp = !preference.enableInApp;
      if (channel === 'sms') preference.enableSMS = !preference.enableSMS;
      if (channel === 'push') preference.enablePush = !preference.enablePush;

      this.toastService.showSuccess('Preference updated successfully');
    } catch (error) {
      console.error('Failed to update preference:', error);
      this.toastService.showError('Failed to update preference');
      // Reload to revert changes
      await this.loadPreferences();
    } finally {
      this.isSaving = false;
    }
  }

  getCategoryIcon(category: string): string {
    const icons: {[key: string]: string} = {
      'Student': 'fa-user-graduate',
      'Discussion': 'fa-comments',
      'Content': 'fa-file-alt',
      'Registration': 'fa-user-plus',
      'Exam': 'fa-clipboard-check',
      'Payment': 'fa-credit-card',
      'Refund': 'fa-undo',
      'System': 'fa-cog'
    };

    return icons[category] || 'fa-bell';
  }

  getCategories(): string[] {
    return Array.from(this.categorizedPreferences.keys());
  }
}
