export const environment = {
  production: false,
  apiBaseUrl: 'https://naplan2.runasp.net/api',
  useMock: false, // Set to true to use mock data only
  enableMockFallback: true, // Enable fallback to mock data on API failure
  apiTimeout: 10000, // API request timeout in milliseconds
  stripePublishableKey: 'pk_test_YOUR_STRIPE_PUBLISHABLE_KEY_HERE', // Replace with your actual Stripe key
  bunnyNet: {
    apiKey: 'YOUR_BUNNY_API_KEY',
    libraryId: 'YOUR_LIBRARY_ID',
    pullZone: 'YOUR_PULL_ZONE',
    storageZone: 'YOUR_STORAGE_ZONE'
  }
};
