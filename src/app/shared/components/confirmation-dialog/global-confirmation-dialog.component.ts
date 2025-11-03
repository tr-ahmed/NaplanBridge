import { Component, inject } from '@angular/core';
import { ConfirmationDialogComponent } from './confirmation-dialog.component';
import { ConfirmationDialogService } from './confirmation-dialog.service';

@Component({
  selector: 'app-global-confirmation-dialog',
  standalone: true,
  imports: [ConfirmationDialogComponent],
  template: `
    <app-confirmation-dialog
      [isOpen]="dialogService.state().isOpen"
      [title]="dialogService.state().title || ''"
      [message]="dialogService.state().message || ''"
      [confirmText]="dialogService.state().confirmText || ''"
      [cancelText]="dialogService.state().cancelText || ''"
      [type]="dialogService.state().type || 'warning'"
      [icon]="dialogService.state().icon"
      (confirmed)="dialogService.onConfirm()"
      (cancelled)="dialogService.onCancel()">
    </app-confirmation-dialog>
  `
})
export class GlobalConfirmationDialogComponent {
  dialogService = inject(ConfirmationDialogService);
}
