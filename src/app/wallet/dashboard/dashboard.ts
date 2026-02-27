import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { WalletService } from '../wallet.service';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  template: `
    <div class="dashboard container my-5">
      <div class="dashboard-header d-flex justify-content-between align-items-center mb-4">
        <h2 class="m-0 fw-bold">Dashboard</h2>
      </div>
      
      <!-- Balance Card Premium Enhancement -->
      <div class="card premium-balance-card mb-4 text-white shadow-lg border-0" style="background: linear-gradient(135deg, #0d6efd 0%, #0dcaf0 100%);">
        <div class="card-body p-5">
          <h4 class="fw-normal mb-2" style="opacity: 0.9;">Current Balance</h4>
          <h1 class="display-4 fw-bold m-0 balance-amount">₹{{ balance | number:'1.2-2' }}</h1>
        </div>
      </div>
      
      <div class="actions d-flex gap-3 mb-5">
        <button (click)="showAddFunds = !showAddFunds" class="btn btn-success btn-lg flex-fill shadow-sm fw-bold">
          <i class="fas fa-plus-circle me-2"></i> Add Funds
        </button>
        <button routerLink="/send-money" class="btn btn-primary btn-lg flex-fill shadow-sm fw-bold">
          <i class="fas fa-paper-plane me-2"></i> Send Money
        </button>
      </div>

      <!-- ADD FUNDS FORM -->
      <div *ngIf="showAddFunds" class="add-funds-panel card border-0 shadow-sm mb-5">
        <div class="card-body p-4">
            <h4 class="text-success mb-4 fw-bold"><i class="fas fa-wallet me-2"></i>Deposit Money to Wallet</h4>
            <ng-container *ngIf="cards.length > 0; else noCardsTemplate">
              <form [formGroup]="addFundsForm" (ngSubmit)="onAddFunds()">
                <div class="mb-3">
                  <label class="form-label fw-bold">Amount to Deposit (₹)</label>
                  <input type="number" formControlName="amount" class="form-control form-control-lg" placeholder="e.g. 500.00">
                </div>
                <div class="mb-3">
                  <label class="form-label fw-bold">Select Funding Source</label>
                  <select formControlName="cardId" class="form-select form-select-lg">
                    <option value="">-- Choose a Saved Card --</option>
                    <option *ngFor="let card of cards" [value]="card.id">
                      {{ card.cardType }} ending in {{ card.partialCardNumber }}
                    </option>
                  </select>
                </div>
                <div class="mb-4">
                  <label class="form-label fw-bold">Description (Optional)</label>
                  <input type="text" formControlName="description" class="form-control" placeholder="E.g. Monthly Savings Transfer">
                </div>
                <button type="submit" [disabled]="addFundsForm.invalid" class="btn btn-success btn-lg w-100 fw-bold">
                  Confirm Deposit <i class="fas fa-check-circle ms-2"></i>
                </button>
              </form>
            </ng-container>
            <ng-template #noCardsTemplate>
              <div class="no-cards-msg text-center p-5 bg-light rounded border border-warning">
                <i class="fas fa-exclamation-triangle text-warning fs-1 mb-3"></i>
                <h5 class="fw-bold mb-3">No Payment Methods Found</h5>
                <p class="text-muted mb-4">You need to link a credit or debit card before you can deposit funds into your RevPay wallet.</p>
                <button routerLink="/cards" class="btn btn-primary btn-lg px-4"><i class="fas fa-credit-card me-2"></i> Link a Card Now</button>
              </div>
            </ng-template>
        </div>
      </div>

      <h3 class="fw-bold mb-4">Recent Transactions</h3>
      <div class="card border-0 shadow-sm">
        <ul class="list-group list-group-flush rounded">
          <li *ngIf="transactions.length === 0" class="list-group-item text-center text-muted p-5 bg-light" style="font-style: italic;">
            <i class="fas fa-receipt fs-2 mb-3 text-secondary" style="opacity: 0.5;"></i><br>
            No recent transactions found.
          </li>
          <li *ngFor="let txn of transactions" class="list-group-item txn-item p-3 d-flex justify-content-between align-items-center">
            <div class="d-flex align-items-center">
              <span class="badge rounded-pill me-3 px-3 py-2" [ngClass]="txn.type">{{ txn.type }}</span> 
              <span class="fw-medium text-dark">{{ sanitizeDescription(txn.description) }}</span>
            </div>
            <div [class.text-success]="!isOutgoing(txn)" [class.text-danger]="isOutgoing(txn)" class="fw-bold fs-5">
              {{ isOutgoing(txn) ? '-' : '+' }}₹{{ abs(txn.amount) | number:'1.2-2' }}
            </div>
          </li>
        </ul>
      </div>
      
      <div class="text-center mt-4 mb-5">
        <a routerLink="/transactions" class="btn btn-outline-primary fw-bold px-4 rounded-pill">View Full History <i class="fas fa-arrow-right ms-2"></i></a>
      </div>
    </div>
  `,
  styles: [`
      .premium-balance-card { border-radius: 16px; position: relative; overflow: hidden; }
      .premium-balance-card::before {
        content: ''; position: absolute; top: -50%; left: -50%; width: 200%; height: 200%;
        background: radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 60%);
        opacity: 0.5; pointer-events: none;
      }
      .balance-amount { letter-spacing: -1px; text-shadow: 0 2px 4px rgba(0,0,0,0.1); }
      
      .txn-item { transition: background-color 0.2s ease, transform 0.2s ease; cursor: default; }
      .txn-item:hover { background-color: #f8f9fa; transform: translateX(5px); border-left: 3px solid #007bff !important; }
      
      .badge { font-size: 0.7rem; letter-spacing: 0.5px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); background-color: #e9ecef; color: #495057; border: 1px solid #dee2e6; text-transform: uppercase;}
      /* Custom badge colors mapping to transaction types */
      .DEPOSIT, .ADD_FUNDS { background-color: #d1e7dd !important; color: #0f5132 !important; border: 1px solid #badbcc; }
      .TRANSFER { background-color: #cff4fc !important; color: #055160 !important; border: 1px solid #b6effb; }
      .PAYMENT { background-color: #fff3cd !important; color: #664d03 !important; border: 1px solid #ffecb5; }
      .WITHDRAWAL { background-color: #f8d7da !important; color: #842029 !important; border: 1px solid #f5c2c7; }
      .REQUEST { background-color: #e2e3e5 !important; color: #41464b !important; border: 1px solid #d3d6d8; }
      .LOAN_DISBURSEMENT { background-color: #e0cffc !important; color: #3b0a96 !important; border: 1px solid #ccb2fc; }
  `]
})
export class DashboardComponent implements OnInit {
  balance: number = 0;
  transactions: any[] = [];
  cards: any[] = [];

  showAddFunds: boolean = false;
  addFundsForm: FormGroup;
  currentUserId: number | null = null;

  constructor(private fb: FormBuilder, private walletService: WalletService, private authService: AuthService) {
    this.currentUserId = this.authService.getUserId();
    this.addFundsForm = this.fb.group({
      amount: ['', [Validators.required, Validators.min(1)]],
      cardId: ['', Validators.required],
      description: ['']
    });
  }

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.walletService.getBalance().subscribe(res => {
      if (res.data) this.balance = res.data;
    });
    this.walletService.getTransactions(0, 15).subscribe(res => {
      if (res.data && res.data.content) {
        this.transactions = res.data.content
          .filter((txn: any) => txn.type !== 'REQUEST')
          .slice(0, 5);
      }
    });
    this.walletService.getCards(0, 50).subscribe(res => {
      if (res.data && res.data.content) this.cards = res.data.content;
    });
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

  onAddFunds() {
    if (this.addFundsForm.valid) {
      // Create a payload omitting cardId if the backend AddFunds payload doesn't actually use it,
      // but for UX we enforced them picking it. 
      // If the backend DOES require a source, we pass it. Assuming we just pass it along:
      this.walletService.addFunds(this.addFundsForm.value).subscribe({
        next: () => {
          alert('Funds added successfully!');
          this.addFundsForm.reset({ cardId: '' });
          this.showAddFunds = false;
          this.loadData(); // Refresh balance and txns
        },
        error: (err) => alert('Failed to add funds: ' + (err.error?.message || 'Unknown error'))
      });
    }
  }

  abs(value: number): number {
    return Math.abs(value);
  }

  sanitizeDescription(desc: string): string {
    if (!desc) return 'No description provided';
    if (desc === 'Added via: null' || desc === 'Added via: ' || desc === 'Added via: null ') {
      return 'Added Funds';
    }
    return desc;
  }
}
