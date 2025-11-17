import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NotificationTemplateService } from '../../core/services/notification-template.service';
import {
  NotificationTemplateDto,
  TemplateCounts,
  TemplateFilterParams,
  EVENT_CATEGORIES,
  NOTIFICATION_CHANNELS,
  CATEGORY_ICONS,
  CHANNEL_ICONS,
  EventCategory,
  NotificationChannel
} from '../../models/notification-template.models';

@Component({
  selector: 'app-template-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './template-list.component.html',
  styleUrls: ['./template-list.component.scss']
})
export class TemplateListComponent implements OnInit {
  // Data
  templates = signal<NotificationTemplateDto[]>([]);
  counts = signal<TemplateCounts | null>(null);

  // Filters
  selectedCategory = signal<string>('all');
  selectedChannel = signal<string>('all');
  selectedStatus = signal<string>('all');
  searchQuery = signal<string>('');

  // UI State
  loading = signal(false);
  error = signal<string | null>(null);
  viewMode = signal<'grid' | 'list'>('grid');

  // Constants for template
  categories = EVENT_CATEGORIES;
  channels = NOTIFICATION_CHANNELS;
  categoryIcons = CATEGORY_ICONS;
  channelIcons = CHANNEL_ICONS;

  constructor(
    private templateService: NotificationTemplateService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadTemplates();
    this.loadCounts();
  }

  /**
   * Load all templates
   */
  loadTemplates() {
    this.loading.set(true);
    this.error.set(null);

    const filters = this.buildFilters();

    this.templateService.getAllTemplates(filters).subscribe({
      next: (response: any) => {
        this.templates.set(response.data);
        this.loading.set(false);
      },
      error: (error: any) => {
        console.error('Failed to load templates:', error);
        this.error.set('Failed to load templates');
        this.loading.set(false);
      }
    });
  }

  /**
   * Load template counts/statistics
   */
  loadCounts() {
    this.templateService.getTemplateCounts().subscribe({
      next: (response: any) => {
        this.counts.set(response.data);
      },
      error: (error: any) => {
        console.error('Failed to load counts:', error);
      }
    });
  }

  /**
   * Build filter parameters
   */
  private buildFilters(): TemplateFilterParams {
    const filters: TemplateFilterParams = {};

    if (this.selectedCategory() !== 'all') {
      filters.category = this.selectedCategory();
    }

    if (this.selectedChannel() !== 'all') {
      filters.channel = this.selectedChannel() as NotificationChannel;
    }

    if (this.selectedStatus() !== 'all') {
      filters.isActive = this.selectedStatus() === 'active';
    }

    return filters;
  }

  /**
   * Filter change handler
   */
  onFilterChange() {
    this.loadTemplates();
  }

  /**
   * Search handler
   */
  onSearch() {
    // Filter templates locally by search query
    // Or implement server-side search
    this.loadTemplates();
  }

  /**
   * Navigate to editor
   */
  editTemplate(template: NotificationTemplateDto) {
    this.router.navigate(['/admin/templates/edit', template.id]);
  }

  /**
   * Toggle template status
   */
  toggleStatus(template: NotificationTemplateDto, event: Event) {
    event.stopPropagation();

    this.templateService.toggleTemplateStatus(
      template.id,
      !template.isActive
    ).subscribe({
      next: (response: any) => {
        template.isActive = response.data.isActive;
      },
      error: (error: any) => {
        console.error('Failed to toggle status:', error);
      }
    });
  }

  /**
   * Reset template to default
   */
  resetTemplate(template: NotificationTemplateDto, event: Event) {
    event.stopPropagation();

    if (confirm(`Reset "${template.eventName}" to default settings?`)) {
      this.templateService.resetTemplate(template.id).subscribe({
        next: () => {
          this.loadTemplates();
        },
        error: (error: any) => {
          console.error('Failed to reset template:', error);
        }
      });
    }
  }

  /**
   * Get category icon
   */
  getCategoryIcon(category?: string): string {
    if (!category) return 'fa-bell';
    const found = this.categoryIcons.find((c: any) => c.category === category);
    return found ? found.icon : 'fa-bell';
  }

  /**
   * Get category color
   */
  getCategoryColor(category?: string): string {
    if (!category) return '#6b7280';
    const found = this.categoryIcons.find((c: any) => c.category === category);
    return found ? found.color : '#6b7280';
  }

  /**
   * Get enabled channels for template
   */
  getEnabledChannels(template: NotificationTemplateDto): string[] {
    const channels: string[] = [];
    if (template.sendInApp) channels.push('InApp');
    if (template.sendEmail) channels.push('Email');
    if (template.sendSMS) channels.push('SMS');
    if (template.sendPush) channels.push('Push');
    return channels;
  }

  /**
   * Get filtered templates for display
   */
  get filteredTemplates(): NotificationTemplateDto[] {
    let filtered = this.templates();

    // Apply search filter
    const query = this.searchQuery().toLowerCase();
    if (query) {
      filtered = filtered.filter(t =>
        t.eventName.toLowerCase().includes(query) ||
        t.eventKey.toLowerCase().includes(query) ||
        t.eventCategory?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }

  /**
   * Get channel icon safely
   */
  getChannelIcon(channel: string): string {
    const icons: any = this.channelIcons;
    return icons[channel]?.icon || 'fa-bell';
  }

  /**
   * Get channel color safely
   */
  getChannelColor(channel: string): string {
    const icons: any = this.channelIcons;
    return icons[channel]?.color || '#6b7280';
  }

  /**
   * Change view mode
   */
  setViewMode(mode: 'grid' | 'list') {
    this.viewMode.set(mode);
  }
}
