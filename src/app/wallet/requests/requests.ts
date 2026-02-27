import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { WalletService } from '../wallet.service';
import { Transaction } from '../../shared/models/models';

@Component({
  selector: 'app-requests',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="container">
      <h2>Money Requests</h2>

      <div class="request-form-card">
        <h3>Request Money</h3>
        <form [formGroup]="requestForm" (ngSubmit)="onRequestMoney()">
          <div class="form-row">
            <div class="form-group half">
              <label>Target Email</label>
              <input type="email" formControlName="targetEmail" placeholder="user@example.com">
            </div>
            <div class="form-group half">
              <label>Amount</label>
              <input type="number" formControlName="amount" placeholder="0.00">
            </div>
          </div>
          <button type="submit" [disabled]="requestForm.invalid" class="btn-primary">Send Request</button>
        </form>
      </div>

      <div class="requests-grid">
        <div class="requests-column">
          <h3>Incoming Requests</h3>
          <div *ngIf="incomingRequests.length === 0" class="no-data">No pending incoming requests.</div>
          
          <div *ngFor="let req of incomingRequests" class="req-card">
            <div class="req-header">
              <span>{{ req.description || 'From User ID: ' + req.senderId }}</span>
              <span class="amount">₹{{ req.amount }}</span>
            </div>
            <div class="req-date">{{ req.timestamp | date:'short' }}</div>
            
            <div *ngIf="req.status === 'PENDING'" class="req-actions">
              <input type="password" #pinInput placeholder="Enter PIN to Accept" class="pin-input">
              <button (click)="acceptRequest(req.transactionId, pinInput.value)" class="btn-sm btn-success">Accept</button>
              <button (click)="declineRequest(req.transactionId)" class="btn-sm btn-danger">Decline</button>
            </div>
            <div *ngIf="req.status !== 'PENDING'" class="status-badge {{req.status}}">
              {{req.status}}
            </div>
          </div>
        </div>

        <div class="requests-column">
          <h3>Outgoing Requests</h3>
          <div *ngIf="outgoingRequests.length === 0" class="no-data">No pending outgoing requests.</div>
          
          <div *ngFor="let req of outgoingRequests" class="req-card">
            <div class="req-header">
              <span>To User ID: {{ req.receiverId }}</span>
              <span class="amount">₹{{ req.amount }}</span>
            </div>
            <div class="req-date">{{ req.timestamp | date:'short' }}</div>
            <div class="status-badge {{req.status}}">
              {{req.status}}
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .container { max-width: 1000px; margin: 40px auto; padding: 20px; }
    .request-form-card { padding: 20px; border: 1px solid #ddd; background: #fafafa; border-radius: 8px; margin-bottom: 30px; }
    
    .requests-grid { display: flex; gap: 30px; }
    .requests-column { flex: 1; }
    
    .form-group { margin-bottom: 15px; }
    .form-row { display: flex; gap: 15px; }
    .half { flex: 1; }
    
    label { display: block; margin-bottom: 5px; font-weight: bold; }
    input { width: 100%; padding: 10px; box-sizing: border-box; border: 1px solid #ccc; border-radius: 4px; }
    
    button { padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; font-size: 14px; }
    .btn-primary { background: #007bff; color: white; width: 100%; font-size: 16px; margin-top: 10px; }
    .btn-primary:disabled { background: #ccc; cursor: not-allowed; }
    
    .btn-sm { padding: 6px 12px; font-size: 13px; margin-top: 10px;}
    .btn-success { background: #28a745; color: white; }
    .btn-danger { background: #dc3545; color: white; margin-left: 5px; }
    
    .req-card { border: 1px solid #eee; padding: 15px; border-radius: 6px; margin-bottom: 15px; background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
    .req-header { display: flex; justify-content: space-between; font-weight: bold; margin-bottom: 5px; }
    .amount { color: #007bff; font-size: 18px; }
    .req-date { font-size: 12px; color: #777; margin-bottom: 10px; }
    .req-actions { margin-top: 10px; }
    .pin-input { width: 100%; margin-bottom: 5px; padding: 8px;}
    
    .status-badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; margin-top: 5px; }
    .PENDING { background: #ffc107; color: #000; }
    .COMPLETED { background: #28a745; color: #fff; }
    .FAILED { background: #dc3545; color: #fff; }
    .no-data { color: #666; font-style: italic; }
  `]
})
export class RequestsComponent implements OnInit {
  incomingRequests: Transaction[] = [];
  outgoingRequests: Transaction[] = [];
  requestForm: FormGroup;

  constructor(private fb: FormBuilder, private walletService: WalletService) {
    this.requestForm = this.fb.group({
      targetEmail: ['', [Validators.required, Validators.email]],
      amount: ['', [Validators.required, Validators.min(1)]]
    });
  }

  ngOnInit() {
    this.loadIncoming();
    this.loadOutgoing();
  }

  loadIncoming() {
    // Backend's 'outgoing' = money outgoing from me = UI 'incoming request'
    this.walletService.getOutgoingRequests().subscribe(res => {
      if (res.data && res.data.content) this.incomingRequests = res.data.content;
    });
  }

  loadOutgoing() {
    // Backend's 'incoming' = money incoming to me = UI 'outgoing request'
    this.walletService.getIncomingRequests().subscribe(res => {
      if (res.data && res.data.content) this.outgoingRequests = res.data.content;
    });
  }

  onRequestMoney() {
    if (this.requestForm.valid) {
      this.walletService.requestMoney(this.requestForm.value).subscribe({
        next: () => {
          alert('Money request sent!');
          this.requestForm.reset();
          this.loadOutgoing();
        },
        error: (err) => alert('Failed to send request: ' + (err.error?.message || 'Unknown error'))
      });
    }
  }

  acceptRequest(txnId: number, pin: string) {
    if (!pin) { alert('Please enter your transaction PIN to accept'); return; }
    this.walletService.acceptRequest(txnId, pin).subscribe({
      next: () => {
        alert('Request accepted and paid successfully!');
        this.loadIncoming();
      },
      error: (err) => alert('Failed to accept: ' + (err.error?.message || 'Unknown error'))
    });
  }

  declineRequest(txnId: number) {
    this.walletService.declineRequest(txnId).subscribe({
      next: () => {
        alert('Request declined.');
        this.loadIncoming();
      },
      error: (err) => alert('Failed to decline: ' + (err.error?.message || 'Unknown error'))
    });
  }
}
