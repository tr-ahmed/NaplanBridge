export const environment = {
  production: false,
  apiBaseUrl: 'https://localhost:44349/api',
  useMock: false, // Set to true to use mock data only
  enableMockFallback: true, // Enable fallback to mock data on API failure
  apiTimeout: 10000, // API request timeout in milliseconds
  stripePublishableKey: 'pk_test_YOUR_STRIPE_PUBLISHABLE_KEY_HERE', // Replace with your actual Stripe key

  // Bunny.net CDN & Stream Configuration
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
