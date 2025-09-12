import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

/**
 * Debug service to test API connectivity and endpoints
 */
@Injectable({
  providedIn: 'root'
})
export class ApiDebugService {
  private readonly baseUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  /**
   * Test basic connectivity to the API server
   */
  testConnectivity(): Observable<any> {
    console.log('Testing connectivity to:', this.baseUrl);
    return this.http.get(`${this.baseUrl}/health`, { responseType: 'text' });
  }

  /**
   * Test the login endpoint with a simple GET request
   */
  testLoginEndpoint(): Observable<any> {
    const url = `${this.baseUrl}/Account/login`;
    console.log('Testing login endpoint:', url);
    return this.http.get(url, { responseType: 'text' });
  }

  /**
   * Test the registration endpoint with a simple GET request
   */
  testRegisterEndpoint(): Observable<any> {
    const url = `${this.baseUrl}/Account/register-parent`;
    console.log('Testing register endpoint:', url);
    return this.http.get(url, { responseType: 'text' });
  }

  /**
   * Test login with minimal data to see response
   */
  testLoginPost(): Observable<any> {
    const url = `${this.baseUrl}/Account/login`;
    const testData = {
      email: "test@test.com",
      password: "test123"
    };
    console.log('Testing login POST to:', url, 'with data:', testData);
    return this.http.post(url, testData);
  }

  /**
   * Get current environment info
   */
  getEnvironmentInfo(): any {
    return {
      baseUrl: this.baseUrl,
      environment: environment,
      fullLoginUrl: `${this.baseUrl}/Account/login`,
      fullRegisterUrl: `${this.baseUrl}/Account/register-parent`
    };
  }
}
