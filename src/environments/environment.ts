export const environment = {
  production: false,
  // apiBaseUrl: 'https://localhost:44349/api',
  apiBaseUrl: 'https://naplan2.runasp.net/api',
  frontendUrl: 'http://localhost:4200', // Frontend URL for callbacks
  useMock: false, // Set to true to use mock data only
  enableMockFallback: true, // Enable fallback to mock data on API failure
  apiTimeout: 10000, // API request timeout in milliseconds
  stripePublishableKey: 'pk_test_YOUR_STRIPE_PUBLISHABLE_KEY_HERE', // Replace with your actual Stripe key

  // 🔇 Debug Logging Configuration
  enableDebugLogging: false, // Disable console.log for cleaner development experience


};
