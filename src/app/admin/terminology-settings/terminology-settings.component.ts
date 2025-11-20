/**
 * Terminology Settings Component
 * Admin page for managing customizable terminology (Term/Week labels)
 */

import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TerminologyService } from '../../core/services/terminology.service';
import { TerminologyConfig, TERMINOLOGY_PRESETS, DEFAULT_TERMINOLOGY } from '../../models/terminology.models';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-terminology-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './terminology-settings.component.html',
  styleUrls: ['./terminology-settings.component.scss']
})
export class TerminologySettingsComponent implements OnInit {
  private readonly terminologyService = inject(TerminologyService);

  // State
  loading = true;
  saving = false;
  currentConfig: TerminologyConfig = DEFAULT_TERMINOLOGY;
  formData: TerminologyConfig = { ...DEFAULT_TERMINOLOGY };
  presets = TERMINOLOGY_PRESETS;
  hasChanges = false;

  // Available presets
  presetOptions = [
    { key: 'standard', label: 'Standard (Term/Week)', value: 'standard' },
    { key: 'parts', label: 'Parts/Sessions', value: 'parts' },
    { key: 'modules', label: 'Modules/Lessons', value: 'modules' },
    { key: 'units', label: 'Units/Topics', value: 'units' }
  ];

  ngOnInit(): void {
    this.loadTerminology();
  }

  /**
   * Load current terminology configuration
   */
  loadTerminology(): void {
    this.loading = true;

    this.terminologyService.fetchTerminologyFromServer().subscribe({
      next: (config) => {
        this.currentConfig = config;
        this.formData = { ...config };
        this.hasChanges = false;
        this.loading = false;
      },
      error: (error) => {
        console.error('Failed to load terminology:', error);
        // Use default if fetch fails
        this.currentConfig = { ...DEFAULT_TERMINOLOGY };
        this.formData = { ...DEFAULT_TERMINOLOGY };
        this.loading = false;
      }
    });
  }

  /**
   * Detect changes in form
   */
  onFormChange(): void {
    this.hasChanges = JSON.stringify(this.formData) !== JSON.stringify(this.currentConfig);
  }

  /**
   * Apply a preset configuration
   */
  applyPreset(presetKey: string): void {
    const preset = this.presets[presetKey as keyof typeof TERMINOLOGY_PRESETS];
    if (preset) {
      this.formData = { ...preset };
      this.onFormChange();
    }
  }

  /**
   * Save terminology configuration
   */
  saveTerminology(): void {
    if (!this.hasChanges) {
      Swal.fire('Info', 'No changes to save.', 'info');
      return;
    }

    this.saving = true;

    this.terminologyService.updateTerminology(this.formData).subscribe({
      next: () => {
        this.saving = false;
        this.currentConfig = { ...this.formData };
        this.hasChanges = false;
        Swal.fire('Success', 'Terminology configuration updated successfully!', 'success');
      },
      error: (error) => {
        this.saving = false;
        console.error('Failed to save terminology:', error);
        Swal.fire('Error', 'Failed to save terminology configuration. Please try again.', 'error');
      }
    });
  }

  /**
   * Reset to defaults
   */
  resetToDefaults(): void {
    Swal.fire({
      title: 'Reset to Defaults?',
      text: 'This will reset all terminology to standard English labels.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, reset',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33'
    }).then((result) => {
      if (result.isConfirmed) {
        this.saving = true;

        this.terminologyService.resetTerminology().subscribe({
          next: (config) => {
            this.saving = false;
            this.currentConfig = config;
            this.formData = { ...config };
            this.hasChanges = false;
            Swal.fire('Success', 'Terminology reset to defaults!', 'success');
          },
          error: (error) => {
            this.saving = false;
            console.error('Failed to reset terminology:', error);
            Swal.fire('Error', 'Failed to reset terminology. Please try again.', 'error');
          }
        });
      }
    });
  }

  /**
   * Discard changes
   */
  discardChanges(): void {
    this.formData = { ...this.currentConfig };
    this.hasChanges = false;
  }

  /**
   * Get preview of format
   */
  getTermPreview(): string {
    return `${this.formData.termLabel} 1`;
  }

  getWeekPreview(): string {
    return `${this.formData.weekLabel} 5`;
  }

  getTermWeekPreview(): string {
    return `${this.formData.termLabel} 1 - ${this.formData.weekLabel} 5`;
  }
}
