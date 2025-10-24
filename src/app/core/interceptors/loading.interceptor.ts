/**
 * Loading Interceptor
 * Shows/hides global loading spinner during HTTP requests
 * Tracks number of pending requests
 * NOTE: Currently disabled due to TypeScript module resolution issue
 */

import { HttpInterceptorFn } from '@angular/common/http';
// import { inject } from '@angular/core';
// import { finalize } from 'rxjs';
// import { LoadingService } from '../services/loading.service';

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  // Temporarily disabled - just pass through requests
  return next(req);

  /* Original implementation - uncomment when TypeScript issue is resolved
  const loadingService = inject(LoadingService);

  // Skip loading indicator for specific URLs (optional)
  const skipLoading = req.headers.has('X-Skip-Loading');

  if (skipLoading) {
    // Remove the custom header before sending the request
    req = req.clone({
      headers: req.headers.delete('X-Skip-Loading')
    });
    return next(req);
  }

  // Show loading indicator
  loadingService.show();

  return next(req).pipe(
    finalize(() => {
      // Hide loading indicator when request completes (success or error)
      loadingService.hide();
    })
  );
  */
};
