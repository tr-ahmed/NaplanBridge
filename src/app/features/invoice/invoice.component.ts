import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { SubscriptionService } from '../../core/services/subscription.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-invoice',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './invoice.component.html',
  styleUrls: ['./invoice.component.scss']
})
export class InvoiceComponent implements OnInit {
  orderId = signal<number | null>(null);
  invoiceData = signal<any>(null);
  loading = signal<boolean>(true);
  error = signal<string | null>(null);
  private toastService = inject(ToastService);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private subscriptionService: SubscriptionService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('orderId');
    if (id) {
      this.orderId.set(Number(id));
      this.loadInvoice(Number(id));
    } else {
      this.error.set('Order ID not provided');
      this.loading.set(false);
    }
  }

  loadInvoice(orderId: number): void {
    console.log('📄 Loading invoice for order:', orderId);
    this.loading.set(true);
    this.error.set(null);

    this.subscriptionService.downloadInvoice(orderId)
      .subscribe({
        next: (data) => {
          console.log('✅ Invoice loaded:', data);
          this.invoiceData.set(data);
          this.loading.set(false);
        },
        error: (err) => {
          console.error('❌ Failed to load invoice:', err);
          this.error.set('Failed to load invoice. Please try again.');
          this.loading.set(false);
        }
      });
  }

  print(): void {
    window.print();
  }

  async downloadPDF(): Promise<void> {
    const data = this.invoiceData();
    if (!data) {
      this.toastService.showError('No invoice data available');
      return;
    }

    try {
      console.log('📥 Generating PDF...');

      // Create HTML content for PDF
      const pdfContent = this.generatePDFContent(data);

      // Create a temporary iframe for PDF generation
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      document.body.appendChild(iframe);

      const iframeDoc = iframe.contentWindow?.document;
      if (!iframeDoc) {
        throw new Error('Failed to create iframe document');
      }

      // Write content to iframe
      iframeDoc.open();
      iframeDoc.write(pdfContent);
      iframeDoc.close();

      // Wait for content to load
      await new Promise(resolve => setTimeout(resolve, 500));

      // Trigger print to PDF
      iframe.contentWindow?.print();

      // Clean up after a delay
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);

      console.log('✅ PDF download initiated');
    } catch (error) {
      console.error('❌ PDF generation failed:', error);
      this.toastService.showError('Failed to generate PDF. Please try using the Print button instead.');
    }
  }

  private generatePDFContent(data: any): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice #${data.orderId}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: Arial, sans-serif;
      padding: 40px;
      color: #333;
    }

    .invoice-container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
    }

    .invoice-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 2px solid #e5e7eb;
    }

    .company-info h1 {
      font-size: 32px;
      font-weight: bold;
      color: #1f2937;
      margin-bottom: 10px;
    }

    .company-info p {
      color: #6b7280;
      margin: 5px 0;
    }

    .invoice-info {
      text-align: right;
    }

    .invoice-number {
      font-size: 24px;
      font-weight: bold;
      color: #1f2937;
      margin-bottom: 10px;
    }

    .status-badge {
      display: inline-block;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 30px;
    }

    .status-paid {
      background-color: #d1fae5;
      color: #065f46;
    }

    .status-pending {
      background-color: #fef3c7;
      color: #92400e;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin: 30px 0;
    }

    th {
      background-color: #f9fafb;
      padding: 12px;
      text-align: left;
      font-size: 12px;
      font-weight: 600;
      color: #6b7280;
      text-transform: uppercase;
      border-bottom: 1px solid #e5e7eb;
    }

    td {
      padding: 16px 12px;
      border-bottom: 1px solid #f3f4f6;
    }

    .text-right {
      text-align: right;
    }

    .totals {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 2px solid #e5e7eb;
    }

    .totals-table {
      width: 300px;
      margin-left: auto;
    }

    .totals-table tr {
      border: none;
    }

    .totals-table td {
      padding: 8px 0;
      border: none;
    }

    .total-row {
      font-size: 18px;
      font-weight: bold;
      padding-top: 12px !important;
      border-top: 1px solid #e5e7eb !important;
    }

    .payment-info {
      margin-top: 40px;
      padding: 20px;
      background-color: #f9fafb;
      border-radius: 8px;
    }

    .payment-info h3 {
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 15px;
    }

    .payment-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
    }

    .payment-item label {
      display: block;
      color: #6b7280;
      font-size: 12px;
      margin-bottom: 5px;
    }

    .payment-item p {
      font-weight: 500;
    }

    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      color: #6b7280;
      font-size: 12px;
    }

    @media print {
      body {
        padding: 0;
      }
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <!-- Header -->
    <div class="invoice-header">
      <div class="company-info">
        <h1>INVOICE</h1>
        <p><strong>NaplanBridge</strong></p>
        <p>Educational Platform</p>
        <p>support@naplanbridge.com</p>
      </div>
      <div class="invoice-info">
        <div class="invoice-number">#${data.orderId}</div>
        <p>${this.formatDate(data.orderDate)}</p>
      </div>
    </div>

    <!-- Status -->
    <div>
      <span class="status-badge ${data.status === 'Paid' ? 'status-paid' : 'status-pending'}">
        ${data.status}
      </span>
    </div>

    <!-- Items Table -->
    <table>
      <thead>
        <tr>
          <th>Description</th>
          <th>Student</th>
          <th class="text-right">Price</th>
        </tr>
      </thead>
      <tbody>
        ${data.items.map((item: any) => `
          <tr>
            <td>${item.planName}</td>
            <td>${item.studentName}</td>
            <td class="text-right">$${item.price.toFixed(2)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <!-- Totals -->
    <div class="totals">
      <table class="totals-table">
        <tr>
          <td>Subtotal:</td>
          <td class="text-right">$${data.totalAmount.toFixed(2)}</td>
        </tr>
        <tr>
          <td>Tax (0%):</td>
          <td class="text-right">$0.00</td>
        </tr>
        <tr class="total-row">
          <td>Total:</td>
          <td class="text-right">$${data.totalAmount.toFixed(2)}</td>
        </tr>
      </table>
    </div>

    <!-- Payment Info -->
    <div class="payment-info">
      <h3>Payment Information</h3>
      <div class="payment-grid">
        <div class="payment-item">
          <label>Payment Method:</label>
          <p>${data.paymentMethod}</p>
        </div>
        <div class="payment-item">
          <label>Payment Date:</label>
          <p>${this.formatDate(data.paymentDate)}</p>
        </div>
        ${data.transactionId ? `
          <div class="payment-item" style="grid-column: 1 / -1;">
            <label>Transaction ID:</label>
            <p style="font-family: monospace; font-size: 11px;">${data.transactionId}</p>
          </div>
        ` : ''}
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p>Thank you for your business!</p>
      <p style="margin-top: 5px;">This is an electronic invoice. No signature required.</p>
    </div>
  </div>
</body>
</html>
    `.trim();
  }

  goBack(): void {
    this.router.navigate(['/parent/subscriptions']);
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}
