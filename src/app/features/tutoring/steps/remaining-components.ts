// Shared Components + Success/Cancel Pages

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

// ==================== SHARED: PRICE SUMMARY ====================
@Component({
  selector: 'app-price-summary',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="price-summary-container">
      <h3>Price Summary</h3>
      <div class="summary-content">
        <p>Price calculation will appear here...</p>
      </div>
    </div>
  `,
  styles: [`
    .price-summary-container {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      position: sticky;
      top: 2rem;
    }
    h3 { font-size: 1.25rem; font-weight: 700; margin-bottom: 1rem; }
  `]
})
export class PriceSummaryComponent {}

// ==================== SUCCESS PAGE ====================
@Component({
  selector: 'app-tutoring-success',
  standalone: true,
  imports: [CommonModule],
  styleUrls: ['./remaining-components.scss'],
  templateUrl: './remaining-components.html'
})
export class TutoringSuccessComponent {}

// ==================== CANCEL PAGE ====================
@Component({
  selector: 'app-tutoring-cancel',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="cancel-container">
      <div class="cancel-icon">✕</div>
      <h1>Booking Cancelled</h1>
      <p>Your tutoring booking was cancelled.</p>
    </div>
  `,
  styles: [`
    .cancel-container {
      text-align: center;
      padding: 4rem 2rem;
      background: white;
      border-radius: 12px;
      max-width: 600px;
      margin: 2rem auto;
    }
    .cancel-icon {
      font-size: 4rem;
      color: #f44336;
      margin-bottom: 1rem;
    }
    h1 { color: #333; margin-bottom: 1rem; }
    p { color: #666; }
  `]
})
export class TutoringCancelComponent {}
