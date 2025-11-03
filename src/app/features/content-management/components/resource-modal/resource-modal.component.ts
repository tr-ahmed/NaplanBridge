import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Resource } from '../../../../core/services/content.service';

@Component({
  selector: 'app-resource-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-backdrop" [class.show]="isOpen" (click)="close.emit()"></div>
    <div class="modal" [class.show]="isOpen" tabindex="-1">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              <i class="fas fa-file-alt me-2"></i>
              Manage Resources - {{ lesson?.title || 'Lesson' }}
            </h5>
            <button type="button" class="btn-close" (click)="close.emit()"></button>
          </div>
          <div class="modal-body">
            <button class="btn btn-primary mb-3" (click)="addResource.emit()">
              <i class="fas fa-plus me-2"></i>
              Add Resource
            </button>
            
            @if (resources.length > 0) {
              <div class="list-group">
                @for (resource of resources; track resource.id) {
                  <div class="list-group-item d-flex justify-content-between align-items-center">
                    <div>
                      <i class="fas fa-file me-2"></i>
                      <strong>{{ resource.title }}</strong>
                    </div>
                    <button 
                      class="btn btn-sm btn-outline-danger" 
                      (click)="deleteResource.emit(resource)">
                      <i class="fas fa-trash"></i>
                    </button>
                  </div>
                }
              </div>
            } @else {
              <p class="text-muted text-center py-4">No resources yet</p>
            }
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" (click)="close.emit()">Close</button>
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
      z-index: 1040;
      
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
      z-index: 1050;
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
export class ResourceModalComponent {
  @Input() isOpen: boolean = false;
  @Input() lesson: any = null;
  @Input() resources: Resource[] = [];

  @Output() close = new EventEmitter<void>();
  @Output() addResource = new EventEmitter<void>();
  @Output() deleteResource = new EventEmitter<Resource>();
  @Output() isOpenChange = new EventEmitter<boolean>();
}
