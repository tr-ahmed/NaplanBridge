import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-preview-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-backdrop" [class.show]="isOpen" (click)="close.emit()"></div>
    <div class="modal" [class.show]="isOpen" tabindex="-1">
      <div class="modal-dialog modal-xl">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              <i class="fas fa-eye me-2"></i>
              Preview: {{ preview?.title || 'Content' }}
            </h5>
            <button type="button" class="btn-close" (click)="close.emit()"></button>
          </div>
          <div class="modal-body">
            @if (preview) {
              <div class="preview-content">
                <h4>{{ preview.title }}</h4>
                @if (preview.description) {
                  <p class="text-muted">{{ preview.description }}</p>
                }
                @if (preview.posterUrl) {
                  <img [src]="preview.posterUrl" class="img-fluid mb-3" alt="Poster">
                }
                <div class="row">
                  @if (preview.videoUrl) {
                    <div class="col-12 mb-3">
                      <video [src]="preview.videoUrl" controls class="w-100"></video>
                    </div>
                  }
                </div>
                <pre class="bg-light p-3 rounded">{{ preview | json }}</pre>
              </div>
            } @else {
              <p class="text-muted text-center py-4">No preview available</p>
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

    .preview-content {
      img {
        max-height: 400px;
        object-fit: cover;
      }
    }
  `]
})
export class PreviewModalComponent {
  @Input() isOpen: boolean = false;
  @Input() preview: any = null;

  @Output() close = new EventEmitter<void>();
  @Output() isOpenChange = new EventEmitter<boolean>();
}
