/**
 * Video Provider Service
 * Manages video provider switching and configuration for admin
 */

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  VideoProviderDto,
  SwitchVideoProviderDto,
  ApiResponse,
  ProviderStatus,
  VideoProviderType
} from '../../models/video-provider.models';

@Injectable({
  providedIn: 'root'
})
export class VideoProviderService {
  private readonly baseUrl = `${environment.apiBaseUrl}/videoprovider`;
  private readonly http = inject(HttpClient);

  /**
   * Get active video provider and status of all providers
   * GET /api/videoprovider/active
   */
  getActiveProvider(): Observable<ApiResponse<VideoProviderDto>> {
    return this.http.get<ApiResponse<VideoProviderDto>>(`${this.baseUrl}/active`);
  }

  /**
   * Switch to a different video provider
   * POST /api/videoprovider/switch
   * @param provider The provider to switch to (Cloudinary, BunnyNet, or Mux)
   */
  switchProvider(provider: VideoProviderType): Observable<ApiResponse<VideoProviderDto>> {
    const dto: SwitchVideoProviderDto = { provider };
    return this.http.post<ApiResponse<VideoProviderDto>>(`${this.baseUrl}/switch`, dto);
  }

  /**
   * Get configuration status of all providers
   * GET /api/videoprovider/status
   */
  getProvidersStatus(): Observable<ApiResponse<{ [key in VideoProviderType]: ProviderStatus }>> {
    return this.http.get<ApiResponse<{ [key in VideoProviderType]: ProviderStatus }>>(
      `${this.baseUrl}/status`
    );
  }

  /**
   * Check if a specific provider is properly configured
   * GET /api/videoprovider/check/{provider}
   * @param provider The provider to check (Cloudinary, BunnyNet, or Mux)
   */
  checkProviderConfiguration(provider: VideoProviderType): Observable<ApiResponse<boolean>> {
    return this.http.get<ApiResponse<boolean>>(`${this.baseUrl}/check/${provider}`);
  }

  /**
   * Get provider display name with icon
   */
  getProviderDisplayInfo(provider: VideoProviderType): { name: string; icon: string; color: string } {
    const providerMap = {
      'Cloudinary': { name: 'Cloudinary', icon: 'cloud', color: 'primary' },
      'BunnyNet': { name: 'Bunny.net', icon: 'videocam', color: 'accent' },
      'Mux': { name: 'Mux', icon: 'analytics', color: 'warn' }
    };
    return providerMap[provider] || { name: provider, icon: 'help', color: 'basic' };
  }
}
