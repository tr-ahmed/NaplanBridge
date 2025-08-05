import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-https-test',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-4 border rounded bg-blue-50">
      <h3 class="text-lg font-semibold mb-2">🔒 HTTPS Connection Test</h3>
      <p class="mb-2"><strong>Environment:</strong> {{ environment.production ? 'Production' : 'Development' }}</p>
      <p class="mb-2"><strong>API Base URL:</strong> {{ environment.apiBaseUrl }}</p>
      <p class="mb-4"><strong>Expected Login URL:</strong> {{ fullLoginUrl }}</p>

      <button
        (click)="testConnection()"
        class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mr-2"
        [disabled]="isLoading">
        {{ isLoading ? 'Testing...' : 'Test Connection' }}
      </button>

      <div *ngIf="testResult" class="mt-4 p-3 rounded"
           [ngClass]="testResult.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'">
        <p><strong>{{ testResult.success ? '✅ Success' : '❌ Error' }}</strong></p>
        <p>{{ testResult.message }}</p>
        <pre *ngIf="testResult.details" class="mt-2 text-sm">{{ testResult.details }}</pre>
      </div>
    </div>
  `
})
export class HttpsTestComponent {
  environment = environment;
  fullLoginUrl = `${environment.apiBaseUrl}/Account/login`;
  isLoading = false;
  testResult: { success: boolean; message: string; details?: string } | null = null;

  constructor(private http: HttpClient) {}

  testConnection(): void {
    this.isLoading = true;
    this.testResult = null;

    // Test a simple GET request to check HTTPS connectivity
    const testUrl = `${environment.apiBaseUrl}/health`; // Assuming there's a health endpoint

    this.http.get(testUrl, { observe: 'response', responseType: 'text' }).subscribe({
      next: (response) => {
        this.testResult = {
          success: true,
          message: `Successfully connected to API over HTTPS`,
          details: `Status: ${response.status} ${response.statusText}`
        };
        this.isLoading = false;
      },
      error: (error) => {
        let errorMessage = 'Connection failed';
        let details = '';

        if (error.status === 0) {
          errorMessage = 'Network error - likely CORS or connection issue';
          details = 'This could be due to:\n1. CORS policy blocking the request\n2. Server not accessible\n3. Invalid SSL certificate';
        } else {
          errorMessage = `HTTP Error ${error.status}`;
          details = error.message || error.statusText;
        }

        this.testResult = {
          success: false,
          message: errorMessage,
          details: details
        };
        this.isLoading = false;
      }
    });
  }
}
