import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NotificationTemplateService } from '../../core/services/notification-template.service';
import { ToastService } from '../../core/services/toast.service';
import {
  NotificationTemplateDto,
  UpdateNotificationTemplateDto,
  TemplatePreviewDto,
  CHANNEL_ICONS
} from '../../models/notification-template.models';

@Component({
  selector: 'app-template-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './template-editor.component.html',
  styleUrls: ['./template-editor.component.scss']
})
export class TemplateEditorComponent implements OnInit {
  // Template Data
  template = signal<NotificationTemplateDto | null>(null);
  templateId = signal<number>(0);

  // Form Data
  formData = signal<UpdateNotificationTemplateDto>({});

  // Available Variables
  availableVariables = signal<string[]>([]);

  // UI State
  loading = signal(false);
  saving = signal(false);
  activeTab = signal<'inapp' | 'email' | 'sms' | 'push'>('inapp');

  // Preview
  showPreview = signal(false);
  previewData = signal<TemplatePreviewDto | null>(null);
  previewLoading = signal(false);

  // Live Demo
  showLiveDemo = signal(false);
  liveDemoData = signal<TemplatePreviewDto | null>(null);
  liveDemoLoading = signal(false);

  // Test Send
  showTestDialog = signal(false);

  // Constants
  channelIcons = CHANNEL_ICONS;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private templateService: NotificationTemplateService,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      const id = +params['id'];
      if (id) {
        this.templateId.set(id);
        this.loadTemplate();
        this.loadVariables();
      }
    });
  }

  /**
   * Load template data
   */
  loadTemplate() {
    this.loading.set(true);

    this.templateService.getTemplateById(this.templateId()).subscribe({
      next: (response) => {
        this.template.set(response.data);
        this.initializeForm();
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Failed to load template:', error);
        this.toastService.showError('Failed to load template');
        this.loading.set(false);
      }
    });
  }

  /**
   * Load available variables for this event
   */
  loadVariables() {
    const template = this.template();
    if (!template) return;

    this.templateService.getEventVariables(template.eventKey).subscribe({
      next: (response) => {
        this.availableVariables.set(response.data);
      },
      error: (error) => {
        console.error('Failed to load variables:', error);
      }
    });
  }

  /**
   * Initialize form with template data
   */
  initializeForm() {
    const template = this.template();
    if (!template) return;

    this.formData.set({
      inAppTitle: template.inAppTitle,
      inAppMessage: template.inAppMessage,
      emailSubject: template.emailSubject,
      emailBody: template.emailBody,
      smsMessage: template.smsMessage,
      pushTitle: template.pushTitle,
      pushBody: template.pushBody,
      sendInApp: template.sendInApp,
      sendEmail: template.sendEmail,
      sendSMS: template.sendSMS,
      sendPush: template.sendPush,
      isActive: template.isActive,
      delayMinutes: template.delayMinutes
    });
  }

  /**
   * Save template changes
   */
  saveTemplate() {
    this.saving.set(true);

    this.templateService.updateTemplate(
      this.templateId(),
      this.formData()
    ).subscribe({
      next: (response: any) => {
        this.template.set(response.data);
        this.toastService.showSuccess('Template updated successfully!');
        this.saving.set(false);
      },
      error: (error: any) => {
        console.error('Failed to save template:', error);
        this.toastService.showError('Failed to save template');
        this.saving.set(false);
      }
    });
  }  /**
   * Reset template to default
   */
  resetToDefault() {
    if (!confirm('Reset this template to default settings? This cannot be undone.')) {
      return;
    }

    this.templateService.resetTemplate(this.templateId()).subscribe({
      next: () => {
        this.toastService.showSuccess('Template reset to default');
        this.loadTemplate();
      },
      error: (error: any) => {
        console.error('Failed to reset template:', error);
        this.toastService.showError('Failed to reset template');
      }
    });
  }

  /**
   * Preview with sample data
   */
  previewTemplate() {
    this.previewLoading.set(true);

    // Build sample variables
    const sampleVars = this.buildSampleVariables();

    this.templateService.previewTemplate(
      this.templateId(),
      sampleVars
    ).subscribe({
      next: (response: any) => {
        this.previewData.set(response.data);
        this.showPreview.set(true);
        this.previewLoading.set(false);
      },
      error: (error: any) => {
        console.error('Failed to preview:', error);
        this.toastService.showError('Failed to generate preview');
        this.previewLoading.set(false);
      }
    });
  }

  /**
   * Show live demo with real data
   */
  openLiveDemo() {
    this.liveDemoLoading.set(true);

    this.templateService.getLiveDemo(this.templateId()).subscribe({
      next: (response: any) => {
        this.liveDemoData.set(response.data);
        this.showLiveDemo.set(true);
        this.liveDemoLoading.set(false);
      },
      error: (error: any) => {
        console.error('Failed to load live demo:', error);
        this.toastService.showError('Failed to load live demo');
        this.liveDemoLoading.set(false);
      }
    });
  }

  /**
   * Build sample variables for preview
   */
  private buildSampleVariables(): { [key: string]: string } {
    const vars: { [key: string]: string } = {};

    this.availableVariables().forEach(varName => {
      vars[varName] = this.getSampleValue(varName);
    });

    return vars;
  }

  /**
   * Get sample value for a variable
   */
  private getSampleValue(varName: string): string {
    const samples: { [key: string]: string } = {
      studentName: 'John Doe',
      teacherName: 'Ms. Smith',
      replyAuthor: 'Teacher Johnson',
      questionPreview: 'What is the difference between variables and constants?',
      lessonTitle: 'Introduction to Algebra',
      courseName: 'Mathematics 101',
      examTitle: 'Midterm Exam',
      contentTitle: 'Chapter 5 Summary',
      paymentAmount: '$99.99',
      userName: 'Jane Doe'
    };

    return samples[varName] || `Sample ${varName}`;
  }

  /**
   * Insert variable at cursor position
   */
  insertVariable(varName: string, field: 'inAppMessage' | 'emailBody' | 'smsMessage' | 'pushBody') {
    const form = this.formData();
    const currentValue = form[field] || '';
    const variable = `{${varName}}`;

    // Simple append for now - could enhance with cursor position
    this.formData.set({
      ...form,
      [field]: currentValue + variable
    });
  }

  /**
   * Update form field
   */
  updateField(field: keyof UpdateNotificationTemplateDto, value: any) {
    this.formData.set({
      ...this.formData(),
      [field]: value
    });
  }

  /**
   * Toggle channel
   */
  toggleChannel(channel: 'InApp' | 'Email' | 'SMS' | 'Push') {
    const form = this.formData();
    const field = `send${channel}` as keyof UpdateNotificationTemplateDto;

    this.formData.set({
      ...form,
      [field]: !form[field]
    });
  }

  /**
   * Navigate back to list
   */
  goBack() {
    this.router.navigate(['/admin/templates']);
  }

  /**
   * Open test send dialog
   */
  openTestDialog() {
    this.showTestDialog.set(true);
  }

  /**
   * Close preview
   */
  closePreview() {
    this.showPreview.set(false);
  }

  /**
   * Close live demo
   */
  closeLiveDemo() {
    this.showLiveDemo.set(false);
  }
}
