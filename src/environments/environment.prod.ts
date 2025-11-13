export const environment = {
  production: true,
  apiBaseUrl: 'https://naplan2.runasp.net/api',
  frontendUrl: 'http://naplan.babaservice.online', // Production frontend URL
  useMock: false,
  enableMockFallback: false, // Disable mock fallback in production
  apiTimeout: 15000,
  stripePublishableKey: 'pk_live_YOUR_STRIPE_LIVE_KEY_HERE',

  // 🔇 Debug Logging Configuration
  enableDebugLogging: false, // Disable console.log in production

};
