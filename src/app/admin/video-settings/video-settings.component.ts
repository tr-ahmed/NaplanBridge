/**
 * Video Settings Component (TypeScript)
 * Admin page for managing video provider configuration and switching
 */

import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VideoProviderService } from '../../core/services/video-provider.service';
import {
  VideoProviderDto,
  VideoProviderType,
  ProviderStatus,
  VIDEO_PROVIDERS,
  ProviderConfiguration
} from '../../models/video-provider.models';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-video-settings',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: './video-settings.component.html',
  styleUrls: ['./video-settings.component.scss']
})
export class VideoSettingsComponent implements OnInit {
  private readonly videoProviderService = inject(VideoProviderService);

  // State
  loading = true;
  switching = false;
  activeProvider: VideoProviderType | null = null;
  providersStatus: { [key in VideoProviderType]?: ProviderStatus } = {};
  providerConfigs = VIDEO_PROVIDERS;

  // Last refresh time
  lastRefreshed: Date | null = null;

  ngOnInit(): void {
    this.loadProviderData();
  }

  /**
   * Load provider data from API
   */
  loadProviderData(): void {
    this.loading = true;

    this.videoProviderService.getActiveProvider().subscribe({
      next: (response) => {
        if (response.success) {
          this.activeProvider = response.data.activeProvider;
          this.providersStatus = response.data.providersStatus;
          this.lastRefreshed = new Date();
        } else {
          this.showError('Failed to load provider data');
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading providers:', error);
        this.showError('Failed to load video providers. Please check your connection.');
        this.loading = false;
      }
    });
  }

  /**
   * Switch to a different video provider
   */
  switchProvider(provider: VideoProviderType): void {
    // Check if provider is configured
    const status = this.providersStatus[provider];
    if (!status?.isConfigured) {
      this.showError(`${provider} is not properly configured. Please check your settings.`);
      return;
    }

    // Show confirmation dialog
    const providerConfig = this.getProviderConfig(provider);

    Swal.fire({
      title: `Switch to ${providerConfig?.displayName || provider}?`,
      html: `
        <div class="text-start">
          <p class="mb-3">${providerConfig?.description || ''}</p>
          <p class="mb-2"><strong>This will affect:</strong></p>
          <ul class="text-muted">
            <li>All new video uploads will use ${provider}</li>
            <li>Existing videos remain on their current provider</li>
            <li>Video playback components may need updates</li>
          </ul>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Switch Provider',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#28a745',
      cancelButtonColor: '#6c757d'
    }).then((result) => {
      if (result.isConfirmed) {
        this.performSwitch(provider);
      }
    });
  }

  /**
   * Perform the actual switch
   */
  private performSwitch(provider: VideoProviderType): void {
    this.switching = true;

    this.videoProviderService.switchProvider(provider).subscribe({
      next: (response) => {
        if (response.success) {
          this.activeProvider = response.data.activeProvider;
          this.providersStatus = response.data.providersStatus;
          this.showSuccess(`Successfully switched to ${provider}`);
        } else {
          this.showError(response.message || 'Failed to switch provider');
        }
        this.switching = false;
      },
      error: (error) => {
        console.error('Error switching provider:', error);
        const message = error.error?.message || 'Failed to switch provider';
        this.showError(message);
        this.switching = false;
      }
    });
  }

  /**
   * Refresh provider status
   */
  refreshStatus(): void {
    this.loadProviderData();
    this.showSuccess('Provider status refreshed');
  }

  /**
   * Get provider configuration by type
   */
  getProviderConfig(provider: VideoProviderType): ProviderConfiguration | undefined {
    return this.providerConfigs.find(p => p.provider === provider);
  }

  /**
   * Get status for a provider
   */
  getProviderStatus(provider: VideoProviderType): ProviderStatus | undefined {
    return this.providersStatus[provider];
  }

  /**
   * Check if provider is active
   */
  isActiveProvider(provider: VideoProviderType): boolean {
    return this.activeProvider === provider;
  }

  /**
   * Get status color for badge
   */
  getStatusColor(provider: VideoProviderType): string {
    const status = this.providersStatus[provider];
    if (!status) return 'basic';
    return status.isConfigured ? 'primary' : 'warn';
  }

  /**
   * Get status icon
   */
  getStatusIcon(provider: VideoProviderType): string {
    const status = this.providersStatus[provider];
    if (!status) return 'help';
    return status.isConfigured ? 'check_circle' : 'error';
  }

  /**
   * Format last checked time
   */
  formatLastChecked(lastChecked: string): string {
    const date = new Date(lastChecked);
    return date.toLocaleString();
  }

  /**
   * Show success message
   */
  private showSuccess(message: string): void {
    Swal.fire({
      icon: 'success',
      title: 'Success',
      text: message,
      timer: 3000,
      showConfirmButton: false,
      toast: true,
      position: 'top-end'
    });
  }

  /**
   * Show error message
   */
  private showError(message: string): void {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: message,
      confirmButtonText: 'Close',
      confirmButtonColor: '#dc3545'
    });
  }
}
