import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProxyTestService } from '../core/services/proxy-test.service';
import { SwaggerTestService } from '../core/services/swagger-test.service';
import { ApiDebugService } from '../core/services/api-debug.service';

@Component({
  selector: 'app-api-test',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container mx-auto p-6 max-w-4xl">
      <h1 class="text-3xl font-bold mb-6 text-blue-600">🧪 API Testing Dashboard</h1>
      
      <!-- Environment Info -->
      <div class="bg-gray-100 rounded-lg p-4 mb-6">
        <h2 class="text-xl font-semibold mb-3">🔧 Current Configuration</h2>
        <pre class="bg-white p-3 rounded text-sm overflow-x-auto">{{ debugInfo | json }}</pre>
      </div>

      <!-- Test Controls -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <button 
          (click)="runProxyTests()" 
          class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-lg font-medium">
          🔗 Run Proxy Tests
        </button>
        
        <button 
          (click)="runSwaggerTests()" 
          class="bg-green-500 hover:bg-green-600 text-white px-4 py-3 rounded-lg font-medium">
          📋 Run Swagger Tests
        </button>
        
        <button 
          (click)="runDebugTests()" 
          class="bg-purple-500 hover:bg-purple-600 text-white px-4 py-3 rounded-lg font-medium">
          🐛 Run Debug Tests
        </button>
      </div>

      <!-- Test Results -->
      <div class="space-y-6">
        
        <!-- Proxy Test Results -->
        <div *ngIf="proxyResults.length > 0" class="bg-white border border-gray-200 rounded-lg p-4">
          <h3 class="text-lg font-semibold mb-3 text-blue-600">🔗 Proxy Test Results</h3>
          <div class="space-y-3">
            <div *ngFor="let result of proxyResults" 
                 class="p-3 rounded border-l-4"
                 [ngClass]="result.success ? 'bg-green-50 border-green-400' : 'bg-red-50 border-red-400'">
              <div class="font-medium">{{ result.test }}</div>
              <div class="text-sm text-gray-600 mt-1">{{ result.message }}</div>
              <div *ngIf="result.data" class="text-xs bg-gray-100 p-2 mt-2 rounded overflow-x-auto">
                <pre>{{ result.data | json }}</pre>
              </div>
            </div>
          </div>
        </div>

        <!-- Swagger Test Results -->
        <div *ngIf="swaggerResults.length > 0" class="bg-white border border-gray-200 rounded-lg p-4">
          <h3 class="text-lg font-semibold mb-3 text-green-600">📋 Swagger Test Results</h3>
          <div class="space-y-3">
            <div *ngFor="let result of swaggerResults" 
                 class="p-3 rounded border-l-4"
                 [ngClass]="result.success ? 'bg-green-50 border-green-400' : 'bg-red-50 border-red-400'">
              <div class="font-medium">{{ result.test }}</div>
              <div class="text-sm text-gray-600 mt-1">{{ result.message }}</div>
              <div *ngIf="result.data" class="text-xs bg-gray-100 p-2 mt-2 rounded overflow-x-auto">
                <pre>{{ result.data | json }}</pre>
              </div>
            </div>
          </div>
        </div>

        <!-- Debug Test Results -->
        <div *ngIf="debugResults.length > 0" class="bg-white border border-gray-200 rounded-lg p-4">
          <h3 class="text-lg font-semibold mb-3 text-purple-600">🐛 Debug Test Results</h3>
          <div class="space-y-3">
            <div *ngFor="let result of debugResults" 
                 class="p-3 rounded border-l-4"
                 [ngClass]="result.success ? 'bg-green-50 border-green-400' : 'bg-red-50 border-red-400'">
              <div class="font-medium">{{ result.test }}</div>
              <div class="text-sm text-gray-600 mt-1">{{ result.message }}</div>
              <div *ngIf="result.data" class="text-xs bg-gray-100 p-2 mt-2 rounded overflow-x-auto">
                <pre>{{ result.data | json }}</pre>
              </div>
            </div>
          </div>
        </div>

        <!-- Instructions -->
        <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 class="text-lg font-semibold mb-3 text-yellow-700">📝 How to Use</h3>
          <ol class="list-decimal list-inside space-y-2 text-sm">
            <li><strong>Proxy Tests:</strong> Check if Angular's proxy configuration is working</li>
            <li><strong>Swagger Tests:</strong> Test the exact same requests that work in Swagger</li>
            <li><strong>Debug Tests:</strong> Basic connectivity and endpoint testing</li>
            <li>Open DevTools → Network tab to see actual HTTP requests</li>
            <li>Look for requests to <code>localhost:4200/api/*</code> (proxied) vs external URLs (direct)</li>
          </ol>
        </div>
      </div>
    </div>
  `
})
export class ApiTestComponent {
  debugInfo: any = {};
  proxyResults: any[] = [];
  swaggerResults: any[] = [];
  debugResults: any[] = [];

  constructor(
    private proxyTest: ProxyTestService,
    private swaggerTest: SwaggerTestService,
    private apiDebug: ApiDebugService
  ) {
    this.debugInfo = {
      ...this.swaggerTest.getDebugInfo(),
      ...this.proxyTest.getProxyTestInfo(),
      ...this.apiDebug.getEnvironmentInfo()
    };
  }

  runProxyTests(): void {
    this.proxyResults = [];
    console.log('🔗 Starting Proxy Tests...');

    // Test 1: Proxy Connection
    this.proxyTest.testProxyConnection().subscribe({
      next: (response) => {
        this.proxyResults.push({
          test: 'Proxy Connection Test',
          success: true,
          message: 'Proxy is forwarding requests successfully',
          data: response
        });
      },
      error: (error) => {
        this.proxyResults.push({
          test: 'Proxy Connection Test',
          success: false,
          message: `Proxy connection failed: ${error.message}`,
          data: error
        });
      }
    });

    // Test 2: Login Endpoint Through Proxy
    this.proxyTest.testLoginEndpointThroughProxy().subscribe({
      next: (response) => {
        this.proxyResults.push({
          test: 'Login Endpoint Through Proxy',
          success: true,
          message: 'Login endpoint accessible through proxy',
          data: response
        });
      },
      error: (error) => {
        this.proxyResults.push({
          test: 'Login Endpoint Through Proxy',
          success: false,
          message: `Login endpoint failed: ${error.message}`,
          data: error
        });
      }
    });

    // Test 3: Non-Proxied Request
    this.proxyTest.testNonProxiedRequest().subscribe({
      next: (response) => {
        this.proxyResults.push({
          test: 'Non-Proxied Request (Local Asset)',
          success: true,
          message: 'Local assets served correctly (not proxied)',
          data: 'Asset loaded successfully'
        });
      },
      error: (error) => {
        this.proxyResults.push({
          test: 'Non-Proxied Request (Local Asset)',
          success: false,
          message: `Local asset failed: ${error.message}`,
          data: error
        });
      }
    });
  }

  runSwaggerTests(): void {
    this.swaggerResults = [];
    console.log('📋 Starting Swagger Tests...');

    // Test 1: Swagger-Identical Login
    this.swaggerTest.testSwaggerLogin().subscribe({
      next: (response) => {
        this.swaggerResults.push({
          test: 'Swagger-Identical Login Request',
          success: true,
          message: '✅ Login request successful - same as Swagger!',
          data: response
        });
      },
      error: (error) => {
        this.swaggerResults.push({
          test: 'Swagger-Identical Login Request',
          success: false,
          message: `❌ Login failed: ${error.message}`,
          data: error
        });
      }
    });

    // Test 2: API Base
    this.swaggerTest.testApiBase().subscribe({
      next: (response) => {
        this.swaggerResults.push({
          test: 'API Base Connection',
          success: true,
          message: 'API base URL accessible',
          data: response
        });
      },
      error: (error) => {
        this.swaggerResults.push({
          test: 'API Base Connection',
          success: false,
          message: `API base failed: ${error.message}`,
          data: error
        });
      }
    });

    // Test 3: Account Path
    this.swaggerTest.testAccountPath().subscribe({
      next: (response) => {
        this.swaggerResults.push({
          test: 'Account Controller Path',
          success: true,
          message: 'Account controller accessible',
          data: response
        });
      },
      error: (error) => {
        this.swaggerResults.push({
          test: 'Account Controller Path',
          success: false,
          message: `Account controller failed: ${error.message}`,
          data: error
        });
      }
    });

    // Test 4: Direct API Call (will likely fail due to CORS)
    this.swaggerTest.testDirectApiCall().subscribe({
      next: (response) => {
        this.swaggerResults.push({
          test: 'Direct External API Call',
          success: true,
          message: '⚠️ Direct call worked (unexpected - CORS should block this)',
          data: response
        });
      },
      error: (error) => {
        this.swaggerResults.push({
          test: 'Direct External API Call',
          success: false,
          message: `Expected CORS failure: ${error.message}`,
          data: error
        });
      }
    });
  }

  runDebugTests(): void {
    this.debugResults = [];
    console.log('🐛 Starting Debug Tests...');

    // Test 1: Connectivity
    this.apiDebug.testConnectivity().subscribe({
      next: (response) => {
        this.debugResults.push({
          test: 'Basic Connectivity',
          success: true,
          message: 'API server is reachable',
          data: response
        });
      },
      error: (error) => {
        this.debugResults.push({
          test: 'Basic Connectivity',
          success: false,
          message: `Connectivity failed: ${error.message}`,
          data: error
        });
      }
    });

    // Test 2: Login Endpoint GET
    this.apiDebug.testLoginEndpoint().subscribe({
      next: (response) => {
        this.debugResults.push({
          test: 'Login Endpoint (GET)',
          success: true,
          message: 'Login endpoint responds to GET',
          data: response
        });
      },
      error: (error) => {
        this.debugResults.push({
          test: 'Login Endpoint (GET)',
          success: false,
          message: `Login GET failed: ${error.message}`,
          data: error
        });
      }
    });

    // Test 3: Login POST
    this.apiDebug.testLoginPost().subscribe({
      next: (response) => {
        this.debugResults.push({
          test: 'Login POST Test',
          success: true,
          message: 'Login POST successful',
          data: response
        });
      },
      error: (error) => {
        this.debugResults.push({
          test: 'Login POST Test',
          success: false,
          message: `Login POST failed: ${error.message}`,
          data: error
        });
      }
    });
  }
}
