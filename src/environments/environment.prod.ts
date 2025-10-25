export const environment = {
  production: true,
  apiBaseUrl: 'https://naplan2.runasp.net/api',
  useMock: false,
  enableMockFallback: false, // Disable mock fallback in production
  apiTimeout: 15000,
  stripePublishableKey: 'pk_live_YOUR_STRIPE_LIVE_KEY_HERE',
  bunnyNet: {
    apiKey: 'YOUR_BUNNY_API_KEY',
    libraryId: 'YOUR_LIBRARY_ID',
    pullZone: 'YOUR_PULL_ZONE',
    storageZone: 'YOUR_STORAGE_ZONE'
  }
};
