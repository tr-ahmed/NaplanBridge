import { Injectable, signal } from '@angular/core';
import { Observable, Subject } from 'rxjs';

export interface ConfirmationDialogConfig {
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info' | 'success';
  icon?: string;
}

export interface ConfirmationDialogState extends ConfirmationDialogConfig {
  isOpen: boolean;
  id: string;
}

@Injectable({
  providedIn: 'root'
})
export class ConfirmationDialogService {
  private dialogState = signal<ConfirmationDialogState>({
    isOpen: false,
    id: '',
    title: 'Confirm Action',
    message: 'Are you sure you want to proceed?',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    type: 'warning'
  });

  private resultSubject = new Subject<boolean>();

  // Expose dialog state as readonly signal
  public state = this.dialogState.asReadonly();

  /**
   * Open confirmation dialog
   * @returns Observable<boolean> - true if confirmed, false if cancelled
   */
  confirm(config: ConfirmationDialogConfig = {}): Observable<boolean> {
    const id = this.generateId();

    this.dialogState.set({
      isOpen: true,
      id,
      title: config.title || 'Confirm Action',
      message: config.message || 'Are you sure you want to proceed?',
      confirmText: config.confirmText || 'Confirm',
      cancelText: config.cancelText || 'Cancel',
      type: config.type || 'warning',
      icon: config.icon
    });

    return new Observable<boolean>(observer => {
      const subscription = this.resultSubject.subscribe(result => {
        observer.next(result);
        observer.complete();
      });

      return () => subscription.unsubscribe();
    });
  }

  /**
   * Confirm delete action
   */
  confirmDelete(itemName: string = 'this item'): Observable<boolean> {
    return this.confirm({
      title: 'Delete Confirmation',
      message: `Are you sure you want to delete ${itemName}? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger'
    });
  }

  /**
   * Handle user confirmation
   */
  onConfirm(): void {
    this.resultSubject.next(true);
    this.close();
  }

  /**
   * Handle user cancellation
   */
  onCancel(): void {
    this.resultSubject.next(false);
    this.close();
  }

  /**
   * Close dialog
   */
  close(): void {
    this.dialogState.update(state => ({ ...state, isOpen: false }));
  }

  /**
   * Generate unique ID for dialog
   */
  private generateId(): string {
    return `dialog-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
