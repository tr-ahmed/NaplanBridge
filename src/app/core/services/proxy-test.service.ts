import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

/**
 * Simple service to test if the proxy is working
 */
@Injectable({
  providedIn: 'root'
})
export class ProxyTestService {

  constructor(private http: HttpClient) {}

  /**
   * Test if proxy is forwarding requests correctly
   * Makes a simple GET request to the API root
   */
  testProxyConnection(): Observable<any> {
    const testUrl = '/api';
    console.log('🔍 Testing proxy connection to:', testUrl);
    console.log('Expected: Request should be forwarded to https://naplanbridge.runasp.net/api');

    return this.http.get(testUrl, {
      responseType: 'text',
      observe: 'response'
    });
  }

  /**
   * Test the exact login endpoint through proxy
   */
  testLoginEndpointThroughProxy(): Observable<any> {
    const loginUrl = '/api/Account/login';
    const testData = {
      email: "user@example.com",
      password: "Aa123456"
    };

    console.log('🧪 Testing login endpoint through proxy:');
    console.log('URL:', loginUrl);
    console.log('Data:', testData);
    console.log('Expected: Should forward to https://naplanbridge.runasp.net/api/Account/login');

    return this.http.post(loginUrl, testData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Test what happens when we make a request that should NOT be proxied
   */
  testNonProxiedRequest(): Observable<any> {
    const nonApiUrl = '/assets/img/logo.png';
    console.log('📄 Testing non-proxied request to:', nonApiUrl);
    console.log('Expected: Should serve local file, not proxy');

    return this.http.get(nonApiUrl, {
      responseType: 'blob',
      observe: 'response'
    });
  }

  /**
   * Get current environment and proxy info
   */
  getProxyTestInfo(): any {
    return {
      currentOrigin: window.location.origin,
      testEndpoints: {
        proxyTest: '/api',
        loginTest: '/api/Account/login',
        localTest: '/assets/img/logo.png'
      },
      expectedBehavior: {
        '/api/*': 'Should be proxied to https://naplanbridge.runasp.net',
        '/assets/*': 'Should serve local files'
      },
      howToVerify: [
        '1. Check Network tab in DevTools',
        '2. Look for requests to localhost:4200/api/* (not external URL)',
        '3. Verify response comes from proxy target',
        '4. No CORS errors should appear'
      ]
    };
  }
}
