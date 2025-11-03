import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { LoginRequest, AuthResponse, ApiResult } from '../../models/auth.models';

/**
 * Service to discover and test different API endpoints
 */
@Injectable({
  providedIn: 'root'
})
export class ApiEndpointDiscoveryService {

  // Possible login endpoints to test
  private readonly loginEndpoints = [
    '/api/Account/login',
    '/api/auth/login',
    '/api/user/login',
    '/api/authentication/login',
    '/api/v1/Account/login',
    '/auth/login',
    '/Account/login',
    '/api/Account/authenticate',
    '/api/Account/signin',
    '/login',
    '/signin',
    '/authenticate'
  ];

  // Possible registration endpoints to test
  private readonly registerEndpoints = [
    '/api/Account/register-parent',
    '/api/Account/register',
    '/api/auth/register',
    '/api/user/register',
    '/api/registration/parent',
    '/auth/register',
    '/Account/register',
    '/register'
  ];

  constructor(private http: HttpClient) {}

  /**
   * Test multiple login endpoints to find the working one
   */
  discoverLoginEndpoint(loginData: LoginRequest): Observable<{endpoint: string; response: any}> {
    return this.testEndpoints(this.loginEndpoints, loginData, 'POST');
  }

  /**
   * Test multiple registration endpoints to find the working one
   */
  discoverRegisterEndpoint(registerData: any): Observable<{endpoint: string; response: any}> {
    return this.testEndpoints(this.registerEndpoints, registerData, 'POST');
  }

  /**
   * Test a single endpoint with given data
   */
  testSingleEndpoint(endpoint: string, data: any, method: 'GET' | 'POST' = 'POST'): Observable<any> {
    console.log(`🔍 Testing endpoint: ${method} ${endpoint}`);

    if (method === 'GET') {
      return this.http.get(endpoint).pipe(
        catchError(error => {
          console.log(`❌ ${endpoint} failed:`, error.status, error.statusText);
          return throwError(() => error);
        })
      );
    } else {
      return this.http.post(endpoint, data).pipe(
        catchError(error => {
          console.log(`❌ ${endpoint} failed:`, error.status, error.statusText);
          return throwError(() => error);
        })
      );
    }
  }

  /**
   * Test multiple endpoints sequentially until one works
   */
  private testEndpoints(endpoints: string[], data: any, method: 'GET' | 'POST'): Observable<{endpoint: string; response: any}> {
    const testEndpoint = (index: number): Observable<{endpoint: string; response: any}> => {
      if (index >= endpoints.length) {
        return throwError(() => new Error('All endpoints failed'));
      }

      const endpoint = endpoints[index];
      console.log(`🔍 Testing endpoint ${index + 1}/${endpoints.length}: ${method} ${endpoint}`);

      return this.testSingleEndpoint(endpoint, data, method).pipe(
        switchMap(response => {
          console.log(`✅ SUCCESS! Found working endpoint: ${endpoint}`);
          return of({ endpoint, response });
        }),
        catchError(error => {
          console.log(`❌ Endpoint ${endpoint} failed: ${error.status}`);

          // If it's a validation error (400) or unauthorized (401),
          // the endpoint exists but credentials are wrong
          if (error.status === 400 || error.status === 401) {
            console.log(`✅ Endpoint ${endpoint} exists (got ${error.status})`);
            return of({ endpoint, response: { error: error.status, message: 'Endpoint found but credentials invalid' } });
          }

          // Continue to next endpoint
          return testEndpoint(index + 1);
        })
      );
    };

    return testEndpoint(0);
  }

  /**
   * Test GET requests to discover available endpoints
   */
  discoverAvailableEndpoints(): Observable<string[]> {
    const testEndpoints = [
      '/api',
      '/api/Account',
      '/api/auth',
      '/api/user',
      '/auth',
      '/swagger',
      '/swagger/index.html',
      '/api-docs',
      '/docs'
    ];

    const workingEndpoints: string[] = [];

    const testNext = (index: number): Observable<string[]> => {
      if (index >= testEndpoints.length) {
        return of(workingEndpoints);
      }

      const endpoint = testEndpoints[index];
      console.log(`🔍 Testing availability: GET ${endpoint}`);

      return this.http.get(endpoint, { responseType: 'text' }).pipe(
        switchMap(() => {
          console.log(`✅ Available: ${endpoint}`);
          workingEndpoints.push(endpoint);
          return testNext(index + 1);
        }),
        catchError(error => {
          if (error.status !== 404) {
            console.log(`✅ Available (${error.status}): ${endpoint}`);
            workingEndpoints.push(endpoint);
          } else {
            console.log(`❌ Not found: ${endpoint}`);
          }
          return testNext(index + 1);
        })
      );
    };

    return testNext(0);
  }

  /**
   * Get environment info for debugging
   */
  getDiscoveryInfo(): any {
    return {
      loginEndpoints: this.loginEndpoints,
      registerEndpoints: this.registerEndpoints,
      testData: {
        email: 'test@example.com',
        password: 'test123'
      }
    };
  }
}
