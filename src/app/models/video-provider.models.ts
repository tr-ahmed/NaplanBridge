/**
 * Video Provider Models
 * Models for Video Provider Management System
 */

export type VideoProviderType = 'Cloudinary' | 'BunnyNet' | 'Mux';

export interface ProviderStatus {
  isConfigured: boolean;
  configurationMessage: string;
  lastChecked: string;
}

export interface VideoProviderDto {
  activeProvider: VideoProviderType;
  availableProviders: VideoProviderType[];
  providersStatus: {
    [key in VideoProviderType]: ProviderStatus;
  };
}

export interface SwitchVideoProviderDto {
  provider: VideoProviderType;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface ProviderConfiguration {
  provider: VideoProviderType;
  displayName: string;
  description: string;
  icon: string;
  features: string[];
  costSavings?: string;
}

export const VIDEO_PROVIDERS: ProviderConfiguration[] = [
  {
    provider: 'Cloudinary',
    displayName: 'Cloudinary',
    description: 'Current video hosting provider with reliable CDN delivery',
    icon: 'cloud',
    features: [
      'Global CDN distribution',
      'Automatic transcoding',
      'Image and video management',
      'Easy integration'
    ]
  },
  {
    provider: 'BunnyNet',
    displayName: 'Bunny.net',
    description: 'Cost-effective video streaming solution (90% cheaper)',
    icon: 'videocam',
    features: [
      'HLS streaming support',
      'Ultra-low latency',
      'Global edge network',
      '10x cost savings'
    ],
    costSavings: 'Save up to 90% on video hosting costs'
  },
  {
    provider: 'Mux',
    displayName: 'Mux',
    description: 'Premium video infrastructure with advanced analytics',
    icon: 'analytics',
    features: [
      'Advanced video analytics',
      'Adaptive bitrate streaming',
      'Low latency live streaming',
      'Professional-grade quality'
    ]
  }
];
