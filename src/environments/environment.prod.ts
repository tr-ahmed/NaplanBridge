export const environment = {
  production: true,
  apiBaseUrl: 'https://localhost:44349/api',
  useMock: false,
  enableMockFallback: false, // Disable mock fallback in production
  apiTimeout: 15000,
  stripePublishableKey: 'pk_live_YOUR_STRIPE_LIVE_KEY_HERE',

  // Bunny.net CDN & Stream Configuration (Production)
  bunnyNet: {
    // Stream Configuration
    stream: {
      libraryId: '525022',
      apiKey: 'b05fbe57-f7de-4872-88cf5fd802cb-897e-48cf',
      cdnHostname: 'vz-9161a4ae-e6d.b-cdn.net',
      pullZone: 'vz-9161a4ae-e6d'
    },
    // Storage Configuration (if needed)
    storage: {
      storageZone: 'YOUR_STORAGE_ZONE', // Add if using BunnyStorage
      accessKey: 'YOUR_STORAGE_ACCESS_KEY' // Add if using BunnyStorage
    },
    // API Configuration
    apiUrl: 'https://video.bunnycdn.com/library/525022',
    webhookUrl: '' // Add webhook URL for video status notifications
  }
};
