import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { WalletService } from '../wallet.service';
import { Transaction } from '../../shared/models/models';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="container">
      <div class="header-row">
        <h2>Transaction History</h2>
        <button type="button" class="btn-primary" (click)="exportToPdf()" [disabled]="isExporting">
          {{ isExporting ? 'Exporting...' : 'Export to PDF' }}
        </button>
      </div>
      
      <div class="filter-card">
        <h3>Filter Transactions</h3>
        <form [formGroup]="filterForm" (ngSubmit)="applyFilter()" class="filter-form">
          <div class="form-row">
            <div class="form-group quarter">
              <label>Type</label>
              <select formControlName="type">
                <option value="">All Types</option>
                <option value="TRANSFER">Transfer</option>
                <option value="DEPOSIT">Deposit</option>
                <option value="WITHDRAWAL">Withdrawal</option>
                <option value="PAYMENT">Payment</option>
              </select>
            </div>
            
            <div class="form-group quarter">
              <label>Status</label>
              <select formControlName="status">
               <option value="">All Statuses</option>
               <option value="PENDING">Pending</option>
               <option value="COMPLETED">Completed</option>
               <option value="FAILED">Failed</option>
               <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
            
            <div class="form-group quarter">
              <label>Min Amount</label>
              <input type="number" formControlName="minAmount" placeholder="0.00">
            </div>
            
            <div class="form-group quarter">
              <label>Max Amount</label>
              <input type="number" formControlName="maxAmount" placeholder="0.00">
            </div>
          </div>
          
          <div class="form-row">
             <div class="form-group half">
              <label>Start Date</label>
              <input type="datetime-local" formControlName="startDate">
            </div>
            <div class="form-group half">
              <label>End Date</label>
              <input type="datetime-local" formControlName="endDate">
            </div>
          </div>

          <div class="filter-actions">
            <button type="submit" class="btn-primary">Apply Filters</button>
            <button type="button" class="btn-outline" (click)="resetFilter()">Clear</button>
          </div>
        </form>
      </div>

      <div class="transactions-list">
        <div *ngIf="transactions.length === 0" class="no-data">No transactions found.</div>
        
        <table *ngIf="transactions.length > 0" class="txn-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Ref #</th>
              <th>Description</th>
              <th>Type</th>
              <th>Status</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let txn of transactions">
              <td>{{ txn.timestamp | date:'short' }}</td>
              <td class="ref">{{ txn.transactionRef }}</td>
              <td>{{ sanitizeDescription(txn.description) }}</td>
              <td><span class="badge badge-type">{{ txn.type }}</span></td>
              <td><span class="badge badge-status" [ngClass]="txn.status">{{ txn.status }}</span></td>
              <td class="amount fw-bold" [class.text-success]="!isOutgoing(txn)" [class.text-danger]="isOutgoing(txn)">
                {{ isOutgoing(txn) ? '-' : '+' }}₹{{ abs(txn.amount) | number:'1.2-2' }}
              </td>
            </tr>
          </tbody>
        </table>
        
        <div class="pagination" *ngIf="totalPages > 1">
          <button [disabled]="currentPage === 0" (click)="changePage(currentPage - 1)">&laquo; Prev</button>
          <span>Page {{currentPage + 1}} of {{totalPages}}</span>
          <button [disabled]="currentPage >= totalPages - 1" (click)="changePage(currentPage + 1)">Next &raquo;</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .container { max-width: 1000px; margin: 40px auto; padding: 20px; }
    .header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .header-row h2 { margin: 0; }
    
    .filter-card { padding: 20px; border: 1px solid #ddd; background: #fafafa; border-radius: 8px; margin-bottom: 30px; }
    .filter-form { display: flex; flex-direction: column; gap: 15px; }
    .form-row { display: flex; gap: 15px; }
    .quarter { flex: 1; }
    .half { flex: 2; }
    
    label { display: block; margin-bottom: 5px; font-weight: bold; font-size: 14px; }
    input, select { width: 100%; padding: 8px; box-sizing: border-box; border: 1px solid #ccc; border-radius: 4px; }
    
    .filter-actions { display: flex; gap: 10px; margin-top: 10px; }
    button { padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer; font-size: 14px; }
    .btn-primary { background: #007bff; color: white; }
    .btn-outline { background: transparent; border: 1px solid #6c757d; color: #6c757d; }
    
    .transactions-list { background: #fff; border-radius: 8px; box-shadow: 0 1px 4px rgba(0,0,0,0.1); overflow: hidden; }
    .no-data { padding: 20px; text-align: center; color: #666; font-style: italic; }
    
    .txn-table { width: 100%; border-collapse: collapse; }
    .txn-table th, .txn-table td { padding: 12px 15px; text-align: left; border-bottom: 1px solid #eee; }
    .txn-table th { background: #f8f9fa; font-weight: 600; color: #444; }
    .txn-table tbody tr:hover { background: #fbfbfb; }
    
    .ref { font-family: monospace; color: #666; font-size: 12px; }
    .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; }
    .badge-type { background: #e9ecef; color: #495057; border: 1px solid #dee2e6; }
    
    .COMPLETED { background: #28a745; color: #fff; }
    .PENDING { background: #ffc107; color: #000; }
    .FAILED { background: #dc3545; color: #fff; }
    .CANCELLED { background: #6c757d; color: #fff; }
    
    .amount { text-align: right; }
    .fw-bold { font-weight: bold; }
    .text-success { color: #28a745; }
    .text-danger { color: #dc3545; }
    
    .pagination { display: flex; justify-content: space-between; align-items: center; padding: 15px; border-top: 1px solid #eee; background: #fff; }
    .pagination button { background: #f8f9fa; border: 1px solid #ddd; color: #333; }
    .pagination button:disabled { opacity: 0.5; cursor: not-allowed; }
  `]
})
export class TransactionsComponent implements OnInit {
  transactions: Transaction[] = [];
  filterForm: FormGroup;
  currentPage = 0;
  totalPages = 1;
  pageSize = 20;
  isExporting = false;
  currentUserId: number | null = null;

  constructor(private fb: FormBuilder, private walletService: WalletService, private authService: AuthService) {
    this.currentUserId = this.authService.getUserId();
    this.filterForm = this.fb.group({
      type: [''],
      status: [''],
      minAmount: [null],
      maxAmount: [null],
      startDate: [''],
      endDate: ['']
    });
  }

  ngOnInit() {
    this.loadTransactions();
  }

  loadTransactions() {
    // If form has any values, use filter method
    const formVals = this.filterForm.value;
    const isFiltering = Object.values(formVals).some(v => v !== '' && v !== null);

    if (isFiltering) {
      // We append page data if using filter using Spring's pageable
      const payload = { ...formVals, page: this.currentPage, size: this.pageSize };

      // Convert local datetime to ISO so Spring accepts it (remove Z and ms if any)
      if (payload.startDate) {
        const d = new Date(payload.startDate);
        // build yyyy-MM-dd'T'HH:mm:ss format local time
        payload.startDate = d.getFullYear() + '-' +
          String(d.getMonth() + 1).padStart(2, '0') + '-' +
          String(d.getDate()).padStart(2, '0') + 'T' +
          String(d.getHours()).padStart(2, '0') + ':' +
          String(d.getMinutes()).padStart(2, '0') + ':00';
      }
      if (payload.endDate) {
        const d = new Date(payload.endDate);
        payload.endDate = d.getFullYear() + '-' +
          String(d.getMonth() + 1).padStart(2, '0') + '-' +
          String(d.getDate()).padStart(2, '0') + 'T' +
          String(d.getHours()).padStart(2, '0') + ':' +
          String(d.getMinutes()).padStart(2, '0') + ':00';
      }

      this.walletService.filterTransactions(payload).subscribe({
        next: (res) => this.handleResponse(res),
        error: (err) => console.error("Failed to filter", err)
      });
    } else {
      this.walletService.getTransactions(this.currentPage, this.pageSize).subscribe({
        next: (res) => this.handleResponse(res),
        error: (err) => console.error("Failed to fetch all", err)
      });
    }
  }

  handleResponse(res: any) {
    if (res.data && res.data.content) {
      this.transactions = res.data.content.filter((txn: any) => txn.type !== 'REQUEST');
      this.totalPages = res.data.totalPages || 1;
    }
  }

  applyFilter() {
    this.currentPage = 0;
    this.loadTransactions();
  }

  resetFilter() {
    this.filterForm.reset({ type: '', status: '', startDate: '', endDate: '' });
    this.currentPage = 0;
    this.loadTransactions();
  }

  changePage(pageIndex: number) {
    if (pageIndex >= 0 && pageIndex < this.totalPages) {
      this.currentPage = pageIndex;
      this.loadTransactions();
    }
  }

  isOutgoing(txn: any): boolean {
    if (txn.senderId && txn.receiverId && txn.senderId !== txn.receiverId) {
      return Number(txn.senderId) === Number(this.currentUserId);
    }
    if (txn.type === 'ADD_FUNDS' || txn.type === 'DEPOSIT') {
      return false;
    }
    if (txn.type === 'WITHDRAWAL') {
      return true;
    }
    if (txn.type === 'LOAN_DISBURSEMENT') {
      const role = this.authService.getUserRole();
      return role === 'ADMIN' || role === 'ROLE_ADMIN';
    }
    if (txn.type === 'LOAN_REPAYMENT') {
      const role = this.authService.getUserRole();
      return role !== 'ADMIN' && role !== 'ROLE_ADMIN';
    }
    return txn.type === 'SEND' || txn.type === 'PAYMENT' || txn.type === 'TRANSFER' || txn.type === 'INVOICE_PAYMENT';
  }

  abs(val: number): number {
    return Math.abs(val);
  }

  sanitizeDescription(desc: string): string {
    if (!desc) return 'No description provided';
    if (desc === 'Added via: null' || desc === 'Added via: ' || desc === 'Added via: null ') {
      return 'Added Funds';
    }
    return desc;
  }

  exportToPdf() {
    this.isExporting = true;
    this.walletService.exportTransactionPdf().subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `revpay_transactions_${new Date().getTime()}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        this.isExporting = false;
      },
      error: (err) => {
        console.error("Failed to export PDF", err);
        alert("Failed to export PDF. Please try again later.");
        this.isExporting = false;
      }
    });
  }
}
