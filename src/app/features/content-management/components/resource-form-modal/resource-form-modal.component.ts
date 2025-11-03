import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-resource-form-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-backdrop" [class.show]="isOpen" (click)="close.emit()"></div>
    <div class="modal" [class.show]="isOpen" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              <i class="fas fa-plus me-2"></i>
              Add Resource
            </h5>
            <button type="button" class="btn-close" (click)="close.emit()"></button>
          </div>
          <div class="modal-body">
            <p class="text-muted">Resource form will be implemented here...</p>
            <pre>{{ formData | json }}</pre>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" (click)="close.emit()">Cancel</button>
            <button type="button" class="btn btn-primary" (click)="submit.emit(formData)">Save Resource</button>
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
  @Output() submit = new EventEmitter<any>();
  @Output() isOpenChange = new EventEmitter<boolean>();
}
