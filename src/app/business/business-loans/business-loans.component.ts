import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { LoanService, LoanDTO, LoanAnalyticsDTO } from '../loan.service';
import { BusinessProfileService } from '../business-profile.service';

@Component({
  selector: 'app-business-loans',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="header">
      <h2>Business Credit & Loans</h2>
      @if (isVerified) {
        <button class="btn-success" (click)="showApplyForm = !showApplyForm">
          {{ showApplyForm ? 'Cancel Application' : 'Apply for Loan' }}
        </button>
      }
    </div>

    @if (!isVerified) {
      <div class="alert alert-warning">
        Your business profile is pending Admin approval. You cannot apply for loans yet.
      </div>
    } @else {
      <!-- Analytics Grid -->
      <div class="analytics-grid">
        <div class="stat-card">
          <h4>Total Outstanding</h4>
          <p class="amount">₹{{ (analytics?.totalOutstanding || 0) | number:'1.2-2' }}</p>
        </div>
        <div class="stat-card">
          <h4>Total Paid</h4>
          <p class="amount text-success">₹{{ (analytics?.totalPaid || 0) | number:'1.2-2' }}</p>
        </div>
        <div class="stat-card">
          <h4>Pending Instalments</h4>
          <p class="amount text-warning">₹{{ (analytics?.totalPending || 0) | number:'1.2-2' }}</p>
        </div>
      </div>

      <!-- Apply Form -->
      @if (showApplyForm) {
        <div class="apply-form-container">
          <h3>New Loan Application</h3>
          <p class="help-text">Applying for a new credit line requires Admin approval. Interest rates are determined by the platform based on profile verification.</p>
          <form [formGroup]="loanForm" (ngSubmit)="applyForLoan()">
            <div class="form-row">
              <div class="form-group">
                 <label>Amount (₹)</label>
                 <input type="number" formControlName="amount" min="1000" max="1000000" step="100">
                 <span class="error-text" *ngIf="loanForm.get('amount')?.invalid && loanForm.get('amount')?.touched">Minimum amount is ₹1,000.</span>
              </div>
              <div class="form-group">
                 <label>Tenure (Months)</label>
                 <input type="number" formControlName="tenureMonths" min="3" max="60">
                 <span class="error-text" *ngIf="loanForm.get('tenureMonths')?.invalid && loanForm.get('tenureMonths')?.touched">Tenure must be between 3 and 60 months.</span>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                 <label>Purpose</label>
                 <input type="text" formControlName="purpose" placeholder="E.g., Equipment purchase, working capital">
                 <span class="error-text" *ngIf="loanForm.get('purpose')?.invalid && loanForm.get('purpose')?.touched">Purpose is required.</span>
              </div>
              <div class="form-group">
                 <label>Loan Type</label>
                 <select formControlName="loanType">
                  <option value="WORKING_CAPITAL">Working Capital</option>
                  <option value="EXPANSION">Business Expansion</option>
                  <option value="EQUIPMENT">Equipment Finance</option>
                </select>
              </div>
            </div>
            <button type="submit" class="btn-primary" [disabled]="loanForm.invalid">Submit Application</button>
          </form>
        </div>
      }

      <!-- My Loans List -->
      <div class="loans-list-container">
        <h3>Active / Past Loans</h3>
        @if (loans.length === 0) {
          <p>You have no loan history.</p>
        } @else {
          <div class="loan-cards">
            @for (loan of loans; track loan.loanId) {
              <div class="loan-card">
                <div class="loan-header">
                  <h5>{{ loan.purpose }}</h5>
                  <span class="badge" [ngClass]="loan.status">{{ loan.status }}</span>
                </div>
                <div class="loan-details">
                  <p><strong>Amount:</strong> ₹{{ loan.amount | number:'1.2-2' }}</p>
                  <p><strong>Approved Rate:</strong> {{ loan.interestRate ? loan.interestRate + '%' : 'Pending Approval' }}</p>
                  <p><strong>Tenure:</strong> {{ loan.tenureMonths }} months</p>
                  <p *ngIf="['APPROVED', 'ACTIVE'].includes(loan.status)"><strong>Monthly EMI:</strong> ₹{{ loan.emiAmount | number:'1.2-2' }}</p>
                  <p *ngIf="['APPROVED', 'ACTIVE'].includes(loan.status)"><strong>Remaining Balance:</strong> ₹{{ loan.remainingAmount | number:'1.2-2' }}</p>
                </div>
                @if (['APPROVED', 'ACTIVE'].includes(loan.status) && loan.remainingAmount > 0) {
                  <div class="repayment-actions">
                    <button class="btn-sm btn-repay" (click)="repayEmi(loan.loanId, loan.emiAmount)">Pay Monthly EMI (₹{{ loan.emiAmount | number:'1.2-2' }})</button>
                    <button class="btn-sm btn-preclose" (click)="precloseLoan(loan.loanId, loan.remainingAmount)">Preclose Loan</button>
                  </div>
                }
              </div>
            }
          </div>
        }
      </div>
    }
  `,
  styles: [`
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .btn-success { background: #198754; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; }
    .btn-success:hover { background: #157347; }
    .btn-primary { background: #0d6efd; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; }
    .btn-primary:disabled { background: #6c757d; cursor: not-allowed; }
    .btn-repay { background: #ffc107; color: #000; border: none; padding: 10px 15px; border-radius: 4px; cursor: pointer; font-weight: bold; width: 100%; margin-bottom: 10px; }
    .btn-repay:hover { background: #e0a800; }
    .btn-preclose { background: #dc3545; color: white; border: none; padding: 10px 15px; border-radius: 4px; cursor: pointer; font-weight: bold; width: 100%; }
    .btn-preclose:hover { background: #c82333; }
    
    .repayment-actions { margin-top: 15px; border-top: 1px solid #eee; padding-top: 15px; }
    
    .analytics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 20px; }
    .stat-card { background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); border-left: 4px solid #0d6efd; }
    .stat-card h4 { margin: 0 0 10px 0; color: #666; font-size: 14px; }
    .stat-card .amount { font-size: 24px; font-weight: bold; margin: 0; color: #333; }
    .text-success { color: #198754 !important; }
    .text-warning { color: #fd7e14 !important; }

    .apply-form-container { background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #ddd; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
    .help-text { font-size: 13px; color: #666; margin-bottom: 15px; }
    .form-row { display: flex; gap: 15px; margin-bottom: 15px; }
    .form-group { flex: 1; display: flex; flex-direction: column; }
    .form-group label { margin-bottom: 5px; font-weight: bold; font-size: 14px; }
    .form-group input, .form-group select { padding: 8px; border: 1px solid #ccc; border-radius: 4px; }
    .error-text { color: #dc3545; font-size: 12px; margin-top: 5px; }
    
    .loans-list-container { background: #f8f9fa; padding: 20px; border-radius: 8px; }
    .loan-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 15px; }
    .loan-card { background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .loan-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #eee; padding-bottom: 10px; margin-bottom: 10px; }
    .loan-header h5 { margin: 0; font-size: 16px; color: #004d99; }
    .loan-details p { margin: 5px 0; font-size: 14px; }
    
    .badge { padding: 4px 8px; border-radius: 12px; font-size: 11px; font-weight: bold; }
    .badge.PENDING { background: #fff3cd; color: #856404; }
    .badge.APPROVED, .badge.ACTIVE { background: #d1e7dd; color: #0f5132; }
    .badge.REJECTED { background: #f8d7da; color: #842029; }
    .badge.CLOSED { background: #e2e3e5; color: #383d41; }
  `]
})
export class BusinessLoansComponent implements OnInit {
  isVerified = false;
  showApplyForm = false;
  loanForm: FormGroup;

  analytics: LoanAnalyticsDTO | null = null;
  loans: LoanDTO[] = [];

  constructor(
    private loanService: LoanService,
    private profileService: BusinessProfileService,
    private fb: FormBuilder
  ) {
    this.loanForm = this.fb.group({
      amount: ['', [Validators.required, Validators.min(1000)]],
      tenureMonths: ['', [Validators.required, Validators.min(3), Validators.max(60)]],
      purpose: ['', Validators.required],
      loanType: ['WORKING_CAPITAL', Validators.required]
    });
  }

  ngOnInit() {
    this.profileService.getMyProfile().subscribe({
      next: (res) => {
        this.isVerified = res.data.isVerified;
        if (this.isVerified) {
          this.loadDashboardData();
        }
      },
      error: (err) => console.error(err)
    });
  }

  loadDashboardData() {
    // Load Analytics
    this.loanService.getAnalytics().subscribe({
      next: (res) => this.analytics = res.data,
      error: (err) => console.error(err)
    });

    // Load Loans
    this.loanService.getMyLoans(0, 50).subscribe({
      next: (res) => this.loans = res.data.content,
      error: (err) => console.error(err)
    });
  }

  applyForLoan() {
    if (this.loanForm.valid) {
      const payload = { ...this.loanForm.value, idempotencyKey: Date.now().toString() };
      this.loanService.applyForLoan(payload).subscribe({
        next: () => {
          this.showApplyForm = false;
          this.loanForm.reset();
          this.loadDashboardData();
          alert("Loan application submitted successfully and is pending admin approval!");
        },
        error: (err) => alert("Failed to apply for loan: " + (err.error?.message || "Error"))
      });
    }
  }

  repayEmi(loanId: number, emiAmount: number) {
    if (confirm(`Pay the scheduled Monthly EMI of ₹${emiAmount.toFixed(2)} from your wallet balance?`)) {
      const pin = prompt("Please enter your transaction PIN to confirm EMI payment:");
      if (!pin) {
        alert("Payment cancelled: PIN is required.");
        return;
      }

      this.loanService.repayLoan(loanId, emiAmount, pin, false).subscribe({
        next: () => {
          this.loadDashboardData();
          alert("Monthly EMI paid successfully!");
        },
        error: (err) => alert("Failed to pay EMI: " + (err.error?.message || "Insufficient balance or error"))
      });
    }
  }

  precloseLoan(loanId: number, remainingAmount: number) {
    if (confirm(`Are you sure you want to preclose this loan? This will deduct the remaining balance of ₹${remainingAmount.toFixed(2)} from your wallet.`)) {
      const pin = prompt("Please enter your transaction PIN to confirm Loan Preclosure:");
      if (!pin) {
        alert("Payment cancelled: PIN is required.");
        return;
      }

      this.loanService.repayLoan(loanId, remainingAmount, pin, true).subscribe({
        next: () => {
          this.loadDashboardData();
          alert("Loan preclosed successfully!");
        },
        error: (err) => alert("Failed to preclose loan: " + (err.error?.message || "Insufficient balance or error"))
      });
    }
  }
}
