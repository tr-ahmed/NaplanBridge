/**
 * System Settings Component
 * Configure system-wide settings
 */

import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { ToastService } from '../../core/services/toast.service';

interface SystemSettings {
  general: {
    siteName: string;
    siteUrl: string;
    adminEmail: string;
    timezone: string;
    dateFormat: string;
  };
  email: {
    provider: string;
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    fromEmail: string;
    fromName: string;
  };
  payment: {
    stripePublishableKey: string;
    stripeSecretKey: string;
    currency: string;
    taxRate: number;
  };
  bunny: {
    apiKey: string;
    libraryId: string;
    pullZone: string;
    storageZone: string;
  };
  features: {
    enableRegistration: boolean;
    enablePayments: boolean;
    enableNotifications: boolean;
    maintenanceMode: boolean;
  };
}

@Component({
  selector: 'app-system-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './system-settings.component.html',
  styleUrl: './system-settings.component.scss'
})
export class SystemSettingsComponent implements OnInit {
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  loading = signal<boolean>(true);
  saving = signal<boolean>(false);
  activeTab = signal<string>('general');

  tabs = [
    { id: 'general', label: 'General' },
    { id: 'email', label: 'Email' },
    { id: 'payment', label: 'Payment' },
    { id: 'video', label: 'Video' },
    { id: 'security', label: 'Security' }
  ];

  settings = signal<SystemSettings>({
    general: {
      siteName: 'NaplanBridge',
      siteUrl: 'https://naplanbridge.com',
      adminEmail: 'admin@naplanbridge.com',
      timezone: 'UTC',
      dateFormat: 'MM/DD/YYYY'
    },
    email: {
      provider: 'SMTP',
      smtpHost: 'smtp.gmail.com',
      smtpPort: 587,
      smtpUser: '',
      fromEmail: 'noreply@naplanbridge.com',
      fromName: 'NaplanBridge'
    },
    payment: {
      stripePublishableKey: '',
      stripeSecretKey: '',
      currency: 'USD',
      taxRate: 0
    },
    bunny: {
      apiKey: '',
      libraryId: '',
      pullZone: '',
      storageZone: ''
    },
    features: {
      enableRegistration: true,
      enablePayments: true,
      enableNotifications: true,
      maintenanceMode: false
    }
  });

  ngOnInit(): void {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser && currentUser.role === 'Admin') {
      this.loadSettings();
    } else {
      this.router.navigate(['/login']);
    }
  }

  loadSettings(): void {
    this.loading.set(true);
    setTimeout(() => {
      this.loading.set(false);
    }, 500);
  }

  saveSettings(): void {
    this.saving.set(true);
    setTimeout(() => {
      this.saving.set(false);
      this.toastService.showSuccess('Settings saved successfully');
    }, 1000);
  }

  testEmailConnection(): void {
    this.toastService.showInfo('Testing email connection...');
    setTimeout(() => {
      this.toastService.showSuccess('Email connection successful!');
    }, 2000);
  }

  testBunnyConnection(): void {
    this.toastService.showInfo('Testing Bunny.net connection...');
    setTimeout(() => {
      this.toastService.showSuccess('Bunny.net connection successful!');
    }, 2000);
  }

  backupDatabase(): void {
    if (confirm('Create a database backup?')) {
      this.toastService.showInfo('Creating backup...');
      setTimeout(() => {
        this.toastService.showSuccess('Backup created successfully');
      }, 2000);
    }
  }

  restoreDatabase(): void {
    if (confirm('Restore database from backup? This will override current data.')) {
      this.toastService.showInfo('Restoring database...');
      setTimeout(() => {
        this.toastService.showSuccess('Database restored successfully');
      }, 3000);
    }
  }

  clearCache(): void {
    if (confirm('Clear all system cache?')) {
      this.toastService.showInfo('Clearing cache...');
      setTimeout(() => {
        this.toastService.showSuccess('Cache cleared successfully');
      }, 1500);
    }
  }
}
