import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  NotificationTemplateDto,
  EventTemplateDto,
  UpdateNotificationTemplateDto,
  BulkUpdateEventTemplatesDto,
  TemplatePreviewDto,
  PreviewTemplateDto,
  TestSendNotificationDto,
  TemplateHistoryDto,
  TemplateFilterParams,
  TemplateCounts,
  ApiResponse
} from '../../models/notification-template.models';

@Injectable({
  providedIn: 'root'
})
export class NotificationTemplateService {
  private readonly apiUrl = `${environment.apiBaseUrl}/NotificationTemplates`;

  constructor(private http: HttpClient) {}

  // ============================================
  // 1. GET ALL TEMPLATES
  // ============================================

  /**
   * Get all notification templates with optional filters
   */
  getAllTemplates(filters?: TemplateFilterParams): Observable<ApiResponse<NotificationTemplateDto[]>> {
    let params = new HttpParams();

    if (filters) {
      if (filters.eventKey) params = params.set('eventKey', filters.eventKey);
      if (filters.channel) params = params.set('channel', filters.channel);
      if (filters.isActive !== undefined) params = params.set('isActive', filters.isActive.toString());
      if (filters.category) params = params.set('category', filters.category);
    }

    console.log('API Request - Filters:', filters);
    console.log('API Request - Params:', params.toString());

    return this.http.get<ApiResponse<NotificationTemplateDto[]>>(this.apiUrl, { params });
  }

  // ============================================
  // 2. GET EVENT TEMPLATES
  // ============================================

  /**
   * Get templates for a specific event
   */
  getEventTemplates(eventKey: string): Observable<ApiResponse<EventTemplateDto>> {
    return this.http.get<ApiResponse<EventTemplateDto>>(`${this.apiUrl}/event/${eventKey}`);
  }

  // ============================================
  // 3. GET TEMPLATE BY ID
  // ============================================

  /**
   * Get a single template by ID
   */
  getTemplateById(templateId: number): Observable<ApiResponse<NotificationTemplateDto>> {
    return this.http.get<ApiResponse<NotificationTemplateDto>>(`${this.apiUrl}/${templateId}`);
  }

  // ============================================
  // 4. UPDATE TEMPLATE
  // ============================================

  /**
   * Update a notification template
   */
  updateTemplate(
    templateId: number,
    data: UpdateNotificationTemplateDto
  ): Observable<ApiResponse<NotificationTemplateDto>> {
    return this.http.put<ApiResponse<NotificationTemplateDto>>(
      `${this.apiUrl}/${templateId}`,
      data
    );
  }

  // ============================================
  // 5. PREVIEW TEMPLATE
  // ============================================

  /**
   * Preview template with sample variables
   */
  previewTemplate(
    templateId: number,
    sampleVariables: { [key: string]: string }
  ): Observable<ApiResponse<TemplatePreviewDto>> {
    const body: PreviewTemplateDto = { sampleVariables };
    return this.http.post<ApiResponse<TemplatePreviewDto>>(
      `${this.apiUrl}/${templateId}/preview`,
      body
    );
  }

  // ============================================
  // 6. LIVE DEMO (NEW - Real Data!)
  // ============================================

  /**
   * Get live demo with real data from database
   */
  getLiveDemo(
    templateId: number,
    sampleUserId?: number
  ): Observable<ApiResponse<TemplatePreviewDto>> {
    let params = new HttpParams();
    if (sampleUserId) {
      params = params.set('sampleUserId', sampleUserId.toString());
    }

    return this.http.get<ApiResponse<TemplatePreviewDto>>(
      `${this.apiUrl}/${templateId}/live-demo`,
      { params }
    );
  }

  // ============================================
  // 7. GET EVENT VARIABLES
  // ============================================

  /**
   * Get available variables for an event
   */
  getEventVariables(eventKey: string): Observable<ApiResponse<string[]>> {
    return this.http.get<ApiResponse<string[]>>(
      `${this.apiUrl}/event/${eventKey}/variables`
    );
  }

  // ============================================
  // 8. RESET TEMPLATE TO DEFAULT
  // ============================================

  /**
   * Reset template to default values
   */
  resetTemplate(templateId: number): Observable<ApiResponse<NotificationTemplateDto>> {
    return this.http.post<ApiResponse<NotificationTemplateDto>>(
      `${this.apiUrl}/${templateId}/reset`,
      {}
    );
  }

  // ============================================
  // 9. TEST SEND NOTIFICATION
  // ============================================

  /**
   * Send a test notification
   */
  testSendNotification(
    templateId: number,
    data: TestSendNotificationDto
  ): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(
      `${this.apiUrl}/${templateId}/test-send`,
      data
    );
  }

  // ============================================
  // 10. BULK UPDATE EVENT TEMPLATES
  // ============================================

  /**
   * Bulk update all templates for an event
   */
  bulkUpdateEventTemplates(
    eventKey: string,
    data: BulkUpdateEventTemplatesDto
  ): Observable<ApiResponse<NotificationTemplateDto[]>> {
    return this.http.put<ApiResponse<NotificationTemplateDto[]>>(
      `${this.apiUrl}/event/${eventKey}`,
      data
    );
  }

  // ============================================
  // 11. GET TEMPLATE HISTORY
  // ============================================

  /**
   * Get audit log/history for a template
   */
  getTemplateHistory(templateId: number): Observable<ApiResponse<TemplateHistoryDto[]>> {
    return this.http.get<ApiResponse<TemplateHistoryDto[]>>(
      `${this.apiUrl}/${templateId}/history`
    );
  }

  // ============================================
  // 12. GET TEMPLATE COUNTS
  // ============================================

  /**
   * Get template statistics and counts
   */
  getTemplateCounts(): Observable<ApiResponse<TemplateCounts>> {
    return this.http.get<ApiResponse<TemplateCounts>>(
      `${this.apiUrl}/pending-counts`
    );
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  /**
   * Toggle template active status
   */
  toggleTemplateStatus(templateId: number, isActive: boolean): Observable<ApiResponse<NotificationTemplateDto>> {
    return this.updateTemplate(templateId, { isActive });
  }

  /**
   * Enable/Disable channel for template
   */
  updateChannelStatus(
    templateId: number,
    channel: 'Email' | 'SMS' | 'InApp' | 'Push',
    enabled: boolean
  ): Observable<ApiResponse<NotificationTemplateDto>> {
    const update: UpdateNotificationTemplateDto = {};

    switch (channel) {
      case 'Email':
        update.sendEmail = enabled;
        break;
      case 'SMS':
        update.sendSMS = enabled;
        break;
      case 'InApp':
        update.sendInApp = enabled;
        break;
      case 'Push':
        update.sendPush = enabled;
        break;
    }

    return this.updateTemplate(templateId, update);
  }

  /**
   * Get templates by category
   */
  getTemplatesByCategory(category: string): Observable<ApiResponse<NotificationTemplateDto[]>> {
    return this.getAllTemplates({ category });
  }

  /**
   * Get active templates only
   */
  getActiveTemplates(): Observable<ApiResponse<NotificationTemplateDto[]>> {
    return this.getAllTemplates({ isActive: true });
  }

  /**
   * Search templates by event key
   */
  searchTemplates(eventKey: string): Observable<ApiResponse<NotificationTemplateDto[]>> {
    return this.getAllTemplates({ eventKey });
  }
}
