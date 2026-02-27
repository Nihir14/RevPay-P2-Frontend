import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BusinessProfileService } from '../business-profile.service';
import { LoanService } from '../loan.service';
import { BusinessAnalyticsService, BusinessSummaryDTO } from '../analytics.service';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-business-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dashboard-header">
      <h2>Business Dashboard</h2>
      <p>Welcome to your business command center.</p>
    </div>
    
    @if (!isVerified) {
      <div class="alert alert-warning">
        Your business profile is pending Admin approval. Dashboard metrics may not fully populate until verified.
      </div>
    }

    <div class="metrics-grid">
      <!-- Analytics Stats -->
      <div class="metric-card">
        <h3>Total Revenue</h3>
        <p class="value" style="color: #198754;">₹{{ summary?.totalReceived || 0 }}</p>
      </div>
      <div class="metric-card">
        <h3>Total Paid / Expenses</h3>
        <p class="value" style="color: #dc3545;">₹{{ summary?.totalSent || 0 }}</p>
      </div>
      <div class="metric-card">
        <h3>Pending Amounts</h3>
        <p class="value" style="color: #fd7e14;">₹{{ summary?.pendingAmount || 0 }}</p>
      </div>
      <div class="metric-card">
        <h3>Transactions</h3>
        <p class="value" style="color: #004d99;">{{ summary?.totalTransactionCount || 0 }}</p>
      </div>

      <!-- Loan Stats -->
      <div class="metric-card">
        <h3>Total Outstanding Debt</h3>
        <p class="value text-warning">₹{{ outstandingDebt }}</p>
      </div>
      <div class="metric-card">
        <h3>Pending Loan Emis</h3>
        <p class="value text-warning">₹{{ pendingEmis }}</p>
      </div>
      <div class="metric-card">
        <h3>Latest Loan Status</h3>
        <p class="value" [ngClass]="latestLoanStatus === 'APPROVED' ? 'text-success' : 'text-warning'">
          {{ latestLoanStatus || 'No Active Loans' }}
        </p>
        <p style="font-size: 12px; margin-top: 5px; color: #666;" *ngIf="latestLoanStatus === 'PENDING'">Waiting for Admin Approval</p>
      </div>
      
      <!-- Profile Status -->
      <div class="metric-card">
        <h3>Business Status</h3>
        <p class="value" [ngClass]="isVerified ? 'text-success' : 'text-warning'">
          {{ isVerified ? 'Verified' : 'Pending Verification' }}
        </p>
      </div>
    </div>
    
    <div class="dashboard-sections">
      <div class="section-card">
        <h3>Outstanding Invoices</h3>
        <div class="placeholder-box">
          <p><i>Invoice tracking module active. View Invoices tab for details.</i></p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-header { margin-bottom: 20px; }
    .alert-warning { background: #fff3cd; color: #856404; padding: 15px; border-radius: 5px; border: 1px solid #ffeeba; margin-bottom: 20px; }
    .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
    .metric-card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); text-align: center; }
    .metric-card h3 { margin: 0; color: #666; font-size: 15px; }
    .metric-card .value { font-size: 26px; font-weight: bold; margin: 10px 0 0 0; }
    .text-success { color: #198754 !important; }
    .text-warning { color: #fd7e14 !important; }
    
    .dashboard-sections { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
    .section-card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
    .section-card h3 { margin-top: 0; font-size: 16px; border-bottom: 1px solid #eee; padding-bottom: 10px; }
    .placeholder-box { background: #f8f9fa; padding: 30px; text-align: center; border-radius: 4px; border: 1px dashed #ccc; color: #6c757d; }
  `]
})
export class BusinessDashboardComponent implements OnInit {
  isVerified = false;
  profileId = 0;

  outstandingDebt = 0;
  pendingEmis = 0;
  latestLoanStatus = '';
  summary: BusinessSummaryDTO | null = null;
  userId: number | null = null;

  constructor(
    private profileService: BusinessProfileService,
    private loanService: LoanService,
    private analyticsService: BusinessAnalyticsService,
    private authService: AuthService
  ) { }

  ngOnInit() {
    this.userId = this.authService.getUserId();

    this.profileService.getMyProfile().subscribe({
      next: (res) => {
        this.isVerified = res.data.isVerified;
        this.profileId = res.data.profileId;
        if (this.isVerified) {
          this.loadMetrics();
        }
      },
      error: (err) => console.error('Failed to load profile', err)
    });
  }

  loadMetrics() {
    // Load Loan metrics
    this.loanService.getAnalytics().subscribe({
      next: (res) => {
        if (res.data) {
          this.outstandingDebt = res.data.totalOutstanding || 0;
          this.pendingEmis = res.data.totalPending || 0;
        }
      }
    });

    // Load Latest Loan for status
    this.loanService.getMyLoans(0, 1).subscribe({
      next: (res) => {
        if (res.data && res.data.content && res.data.content.length > 0) {
          this.latestLoanStatus = res.data.content[0].status;
        }
      }
    });

    // Load Business Analytics Summary
    if (this.userId) {
      this.analyticsService.getSummary(this.userId).subscribe({
        next: (res) => {
          this.summary = res.data;
        }
      });
    }
  }
}
