import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

/**
 * Service to test the exact same request that works in Swagger
 */
@Injectable({
  providedIn: 'root'
})
export class SwaggerTestService {
  private readonly baseUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  /**
   * Test the exact same login request that works in Swagger
   */
  testSwaggerLogin(): Observable<any> {
    const url = `${this.baseUrl}/Account/login`;

    // Exact same payload that works in Swagger
    const testData = {
      email: "user@example.com",
      password: "Aa123456"
    };

    console.log('🧪 Testing Swagger-identical request:');
    console.log('Environment API Base URL:', environment.apiBaseUrl);
    console.log('Constructed URL:', url);
    console.log('Request Data:', testData);
    console.log('Expected Response: { userName: "wael2", token: "...", roles: [...] }');

    return this.http.post(url, testData, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Test connectivity to the API base
   */
  testApiBase(): Observable<any> {
    const url = `${this.baseUrl}`;
    console.log('🔍 Testing API base:', url);
    return this.http.get(url, { responseType: 'text' });
  }

  /**
   * Test the Account controller path
   */
  testAccountPath(): Observable<any> {
    const url = `${this.baseUrl}/Account`;
    console.log('🔍 Testing Account path:', url);
    return this.http.get(url, { responseType: 'text' });
  }

  /**
   * Test direct external API call (bypassing proxy)
   */
  testDirectApiCall(): Observable<any> {
    const directUrl = 'https://naplanbridge.runasp.net/api/Account/login';

    const testData = {
      email: "user@example.com",
      password: "Aa123456"
    };

    console.log('🌐 Testing direct external API call:');
    console.log('Direct URL:', directUrl);
    console.log('Request Data:', testData);
    console.log('Note: This will likely fail due to CORS');

    return this.http.post(directUrl, testData, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Test different proxy endpoints
   */
  testProxyEndpoints(): { [key: string]: Observable<any> } {
    const testData = {
      email: "user@example.com",
      password: "Aa123456"
    };

    const endpoints = {
      'Standard Proxy': '/api/Account/login',
      'Without Base URL': '/Account/login',
      'With Full Path': '/api/Account/login',
      'Alternative Path': '/auth/login'
    };

    const tests: { [key: string]: Observable<any> } = {};

    Object.entries(endpoints).forEach(([name, endpoint]) => {
      console.log(`🔗 Testing ${name}: ${endpoint}`);
      tests[name] = this.http.post(endpoint, testData, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
    });

    return tests;
  }

  /**
   * Check current environment and configuration
   */
  getDebugInfo(): any {
    return {
      environment: {
        production: environment.production,
        apiBaseUrl: environment.apiBaseUrl
      },
      currentUrl: window.location.href,
      expectedProxyPath: '/api/Account/login',
      expectedTargetUrl: 'https://naplanbridge.runasp.net/api/Account/login',
      swaggerWorkingData: {
        email: "user@example.com",
        password: "Aa123456"
      }
    };
  }
}
