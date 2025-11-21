import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-resource-form-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-backdrop" [class.show]="isOpen" (click)="cancel.emit()"></div>
    <div class="modal" [class.show]="isOpen" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              <i class="fas fa-plus me-2"></i>
              Add Resource
            </h5>
            <button type="button" class="btn-close" (click)="cancel.emit()"></button>
          </div>
          <div class="modal-body">
            <form #resourceForm="ngForm">
              <!-- Title Field -->
              <div class="mb-3">
                <label for="resourceTitle" class="form-label">
                  Resource Title <span class="text-danger">*</span>
                </label>
                <input
                  type="text"
                  class="form-control"
                  id="resourceTitle"
                  name="title"
                  [(ngModel)]="title"
                  placeholder="Enter resource title"
                  required
                  #titleInput="ngModel">
                <div class="invalid-feedback" [class.d-block]="titleInput.invalid && titleInput.touched">
                  Title is required
                </div>
              </div>

              <!-- File Upload Field -->
              <div class="mb-3">
                <label for="resourceFile" class="form-label">
                  Select File <span class="text-danger">*</span>
                </label>
                <input
                  type="file"
                  class="form-control"
                  id="resourceFile"
                  (change)="onFileSelected($event)"
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip,.rar">
                <small class="form-text text-muted">
                  Supported formats: PDF, Word, PowerPoint, Excel, Text, ZIP, RAR
                </small>
                @if (selectedFile()) {
                  <div class="mt-2 p-2 bg-light rounded">
                    <i class="fas fa-file me-2"></i>
                    <strong>{{ selectedFile()?.name }}</strong>
                    <small class="text-muted ms-2">({{ getFileSize(selectedFile()?.size || 0) }})</small>
                  </div>
                }
                @if (fileError()) {
                  <div class="text-danger mt-1">{{ fileError() }}</div>
                }
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" (click)="cancel.emit()">
              <i class="fas fa-times me-2"></i>
              Cancel
            </button>
            <button 
              type="button" 
              class="btn btn-primary" 
              (click)="handleSave()"
              [disabled]="!title || !selectedFile()">
              <i class="fas fa-save me-2"></i>
              Save Resource
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-backdrop {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.5);
      z-index: 1060;
      
      &.show {
        display: block;
      }
    }

    .modal {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 1070;
      overflow: auto;

      &.show {
        display: block;
      }
    }

    .modal-dialog {
      margin: 1.75rem auto;
    }
  `]
})
export class ResourceFormModalComponent {
  @Input() isOpen: boolean = false;
  @Input() formData: any = {};

  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<{ title: string; file: File }>();
  @Output() cancel = new EventEmitter<void>();
  @Output() isOpenChange = new EventEmitter<boolean>();

  title: string = '';
  selectedFile = signal<File | null>(null);
  fileError = signal<string>('');

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      
      // Validate file size (max 50MB)
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (file.size > maxSize) {
        this.fileError.set('File size must be less than 50MB');
        this.selectedFile.set(null);
        return;
      }

      this.fileError.set('');
      this.selectedFile.set(file);
    }
  }

  handleSave(): void {
    if (this.title && this.selectedFile()) {
      const file = this.selectedFile()!;
      console.log('🔵 Saving resource:', { title: this.title, fileName: file.name, fileSize: file.size });
      this.save.emit({
        title: this.title,
        file: file
      });
      // Don't reset immediately - let parent component reset after successful save
    }
  }

  resetForm(): void {
    this.title = '';
    this.selectedFile.set(null);
    this.fileError.set('');
  }

  getFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }
}
