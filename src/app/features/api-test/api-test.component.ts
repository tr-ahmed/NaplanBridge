import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SwaggerTestService } from '../../core/services/swagger-test.service';
import { ProxyTestService } from '../../core/services/proxy-test.service';
import { ApiDebugService } from '../../core/services/api-debug.service';

@Component({
  selector: 'app-api-test',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container mx-auto p-6 max-w-6xl">
      <h1 class="text-3xl font-bold mb-6 text-blue-600">🧪 API & Proxy Testing Dashboard</h1>
      
      <!-- Environment Info -->
      <div class="bg-gray-100 p-4 rounded-lg mb-6">
        <h2 class="text-xl font-bold mb-2">🔧 Environment Info</h2>
        <pre class="text-sm">{{ environmentInfo | json }}</pre>
      </div>

      <!-- Test Controls -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        
        <!-- Proxy Tests -->
        <div class="bg-blue-50 p-4 rounded-lg">
          <h3 class="text-lg font-bold mb-3">🔗 Proxy Tests</h3>
          <div class="space-y-2">
            <button (click)="testProxyConnection()" 
                    class="w-full bg-blue-500 text-white px-3 py-2 rounded hover:bg-blue-600">
              Test Proxy Connection
            </button>
            <button (click)="testLoginThroughProxy()" 
                    class="w-full bg-blue-500 text-white px-3 py-2 rounded hover:bg-blue-600">
              Test Login via Proxy
            </button>
            <button (click)="testNonProxied()" 
                    class="w-full bg-blue-500 text-white px-3 py-2 rounded hover:bg-blue-600">
              Test Non-Proxied Request
            </button>
          </div>
        </div>

        <!-- Swagger Tests -->
        <div class="bg-green-50 p-4 rounded-lg">
          <h3 class="text-lg font-bold mb-3">📋 Swagger Tests</h3>
          <div class="space-y-2">
            <button (click)="testSwaggerLogin()" 
                    class="w-full bg-green-500 text-white px-3 py-2 rounded hover:bg-green-600">
              Test Swagger Login
            </button>
            <button (click)="testApiBase()" 
                    class="w-full bg-green-500 text-white px-3 py-2 rounded hover:bg-green-600">
              Test API Base
            </button>
            <button (click)="testDirectApi()" 
                    class="w-full bg-green-500 text-white px-3 py-2 rounded hover:bg-green-600">
              Test Direct API Call
            </button>
          </div>
        </div>

        <!-- Debug Tests -->
        <div class="bg-yellow-50 p-4 rounded-lg">
          <h3 class="text-lg font-bold mb-3">🐛 Debug Tests</h3>
          <div class="space-y-2">
            <button (click)="testConnectivity()" 
                    class="w-full bg-yellow-500 text-white px-3 py-2 rounded hover:bg-yellow-600">
              Test Connectivity
            </button>
            <button (click)="testLoginEndpoint()" 
                    class="w-full bg-yellow-500 text-white px-3 py-2 rounded hover:bg-yellow-600">
              Test Login Endpoint
            </button>
            <button (click)="testLoginPost()" 
                    class="w-full bg-yellow-500 text-white px-3 py-2 rounded hover:bg-yellow-600">
              Test Login POST
            </button>
          </div>
        </div>
      </div>

      <!-- Clear Results -->
      <div class="mb-4">
        <button (click)="clearResults()" 
                class="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">
          🗑️ Clear Results
        </button>
      </div>

      <!-- Test Results -->
      <div class="space-y-4">
        <div *ngFor="let result of testResults" 
             class="border rounded-lg p-4"
             [ngClass]="{
               'border-green-500 bg-green-50': result.success,
               'border-red-500 bg-red-50': !result.success,
               'border-blue-500 bg-blue-50': result.type === 'info'
             }">
          <div class="flex justify-between items-start mb-2">
            <h4 class="font-bold">{{ result.title }}</h4>
            <span class="text-xs text-gray-500">{{ result.timestamp | date:'HH:mm:ss' }}</span>
          </div>
          <div class="text-sm mb-2">
            <strong>Status:</strong> 
            <span [ngClass]="{
              'text-green-600': result.success,
              'text-red-600': !result.success,
              'text-blue-600': result.type === 'info'
            }">
              {{ result.status }}
            </span>
          </div>
          <div class="text-sm">
            <strong>Details:</strong>
            <pre class="mt-1 bg-gray-100 p-2 rounded text-xs overflow-auto max-h-40">{{ result.details }}</pre>
          </div>
        </div>
      </div>

      <!-- Instructions -->
      <div class="mt-8 bg-gray-50 p-4 rounded-lg">
        <h3 class="text-lg font-bold mb-2">📝 How to Use</h3>
        <ol class="list-decimal list-inside space-y-1 text-sm">
          <li>Start by testing proxy connection to see if your proxy server is running</li>
          <li>Test login via proxy to see if the authentication endpoint works through proxy</li>
          <li>Compare with direct API calls to understand CORS issues</li>
          <li>Check browser Network tab to see actual requests being made</li>
          <li>Look for errors in browser console for detailed debugging</li>
        </ol>
      </div>
    </div>
  `,
  styles: [`
    pre {
      white-space: pre-wrap;
      word-break: break-all;
    }
  `]
})
export class ApiTestComponent implements OnInit {
  testResults: any[] = [];
  environmentInfo: any = {};

  constructor(
    private swaggerTest: SwaggerTestService,
    private proxyTest: ProxyTestService,
    private apiDebug: ApiDebugService
  ) {}

  ngOnInit(): void {
    this.environmentInfo = this.swaggerTest.getDebugInfo();
    this.addResult('info', '🚀 API Test Dashboard Loaded', 'Ready to test API endpoints', JSON.stringify(this.environmentInfo, null, 2));
  }

  // Proxy Tests
  testProxyConnection(): void {
    this.addResult('info', '🔗 Testing Proxy Connection', 'Starting proxy connection test...', 'Checking if proxy server is responding');
    
    this.proxyTest.testProxyConnection().subscribe({
      next: (response) => {
        this.addResult('success', '✅ Proxy Connection Success', 'Proxy is working correctly', JSON.stringify(response, null, 2));
      },
      error: (error) => {
        this.addResult('error', '❌ Proxy Connection Failed', 'Proxy server may not be running', JSON.stringify(error, null, 2));
      }
    });
  }

  testLoginThroughProxy(): void {
    this.addResult('info', '🔐 Testing Login Through Proxy', 'Testing authentication via proxy...', 'POST /api/Account/login');
    
    this.proxyTest.testLoginEndpointThroughProxy().subscribe({
      next: (response) => {
        this.addResult('success', '✅ Login Through Proxy Success', 'Authentication works via proxy', JSON.stringify(response, null, 2));
      },
      error: (error) => {
        this.addResult('error', '❌ Login Through Proxy Failed', 'Authentication failed via proxy', JSON.stringify(error, null, 2));
      }
    });
  }

  testNonProxied(): void {
    this.addResult('info', '📄 Testing Non-Proxied Request', 'Testing local file access...', 'Should serve local files, not proxy');
    
    this.proxyTest.testNonProxiedRequest().subscribe({
      next: (response) => {
        this.addResult('success', '✅ Non-Proxied Request Success', 'Local files served correctly', `Response status: ${response.status}`);
      },
      error: (error) => {
        this.addResult('error', '❌ Non-Proxied Request Failed', 'Local file access failed', JSON.stringify(error, null, 2));
      }
    });
  }

  // Swagger Tests
  testSwaggerLogin(): void {
    this.addResult('info', '📋 Testing Swagger Login', 'Testing exact same request as Swagger...', 'Using user@example.com / Aa123456');
    
    this.swaggerTest.testSwaggerLogin().subscribe({
      next: (response) => {
        this.addResult('success', '✅ Swagger Login Success', 'Same request as Swagger works', JSON.stringify(response, null, 2));
      },
      error: (error) => {
        this.addResult('error', '❌ Swagger Login Failed', 'Swagger-identical request failed', JSON.stringify(error, null, 2));
      }
    });
  }

  testApiBase(): void {
    this.addResult('info', '🌐 Testing API Base', 'Testing basic API connectivity...', 'GET to API root');
    
    this.swaggerTest.testApiBase().subscribe({
      next: (response) => {
        this.addResult('success', '✅ API Base Success', 'API base is accessible', response);
      },
      error: (error) => {
        this.addResult('error', '❌ API Base Failed', 'Cannot reach API base', JSON.stringify(error, null, 2));
      }
    });
  }

  testDirectApi(): void {
    this.addResult('info', '🌐 Testing Direct API Call', 'Testing direct external API call...', 'This will likely fail due to CORS');
    
    this.swaggerTest.testDirectApiCall().subscribe({
      next: (response) => {
        this.addResult('success', '✅ Direct API Success', 'Direct API call works (unexpected!)', JSON.stringify(response, null, 2));
      },
      error: (error) => {
        this.addResult('error', '❌ Direct API Failed (Expected)', 'CORS blocks direct API calls', JSON.stringify(error, null, 2));
      }
    });
  }

  // Debug Tests
  testConnectivity(): void {
    this.addResult('info', '🔌 Testing Connectivity', 'Testing basic connectivity...', 'Checking if API server responds');
    
    this.apiDebug.testConnectivity().subscribe({
      next: (response) => {
        this.addResult('success', '✅ Connectivity Success', 'API server is reachable', response);
      },
      error: (error) => {
        this.addResult('error', '❌ Connectivity Failed', 'Cannot reach API server', JSON.stringify(error, null, 2));
      }
    });
  }

  testLoginEndpoint(): void {
    this.addResult('info', '🔐 Testing Login Endpoint', 'Testing login endpoint with GET...', 'GET /Account/login');
    
    this.apiDebug.testLoginEndpoint().subscribe({
      next: (response) => {
        this.addResult('success', '✅ Login Endpoint Accessible', 'Login endpoint responds', response);
      },
      error: (error) => {
        this.addResult('error', '❌ Login Endpoint Failed', 'Cannot access login endpoint', JSON.stringify(error, null, 2));
      }
    });
  }

  testLoginPost(): void {
    this.addResult('info', '🔐 Testing Login POST', 'Testing login with POST request...', 'POST with test credentials');
    
    this.apiDebug.testLoginPost().subscribe({
      next: (response) => {
        this.addResult('success', '✅ Login POST Success', 'Login POST works', JSON.stringify(response, null, 2));
      },
      error: (error) => {
        this.addResult('error', '❌ Login POST Failed', 'Login POST failed', JSON.stringify(error, null, 2));
      }
    });
  }

  clearResults(): void {
    this.testResults = [];
    this.addResult('info', '🗑️ Results Cleared', 'Test results have been cleared', 'Ready for new tests');
  }

  private addResult(type: 'success' | 'error' | 'info', title: string, status: string, details: string): void {
    this.testResults.unshift({
      type,
      title,
      status,
      details,
      success: type === 'success',
      timestamp: new Date()
    });
  }
}
