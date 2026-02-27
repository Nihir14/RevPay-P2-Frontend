import { Component, ElementRef, ViewChild, HostListener, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { AuthService } from '../../auth/auth.service';
import { NotificationService, NotificationDTO } from '../notification.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <nav class="navbar">
      <div class="logo-container" [routerLink]="getDashboardRoute()" style="cursor: pointer; display: flex; align-items: center;">
        <h3 class="m-0 fw-bold" style="letter-spacing: -1px;">Rev<span style="color: #ffeb3b;">Pay</span></h3>
      </div>
      <div class="links" *ngIf="authService.isLoggedIn()">
        <a [routerLink]="getDashboardRoute()">Dashboard</a>
        <a routerLink="/cards">Cards</a>
        <a routerLink="/transactions">History</a>
        <a routerLink="/requests">Requests</a>
        <a *ngIf="authService.getUserRole() === 'BUSINESS' || authService.getUserRole() === 'ROLE_BUSINESS'" routerLink="/business/dashboard" class="business-link">Business Hub</a>
        <a *ngIf="authService.getUserRole() === 'ADMIN' || authService.getUserRole() === 'ROLE_ADMIN'" routerLink="/admin/dashboard" class="admin-link">Admin Panel</a>
        <div class="notification-container" (click)="toggleNotifications($event)">
          <div class="notification-icon" title="Notifications" #bellIcon>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
              <path d="M8 16a2 2 0 0 0 2-2H6a2 2 0 0 0 2 2zM8 1.918l-.797.161A4.002 4.002 0 0 0 4 6c0 .628-.134 2.197-.459 3.742-.16.767-.376 1.566-.663 2.258h10.244c-.287-.692-.502-1.49-.663-2.258C12.134 8.197 12 6.628 12 6a4.002 4.002 0 0 0-3.203-3.92L8 1.917zM14.22 12c.223.447.481.801.78 1H1c.299-.199.557-.553.78-1C2.68 10.252 3 8.188 3 6c0-2.42 1.72-4.44 4.005-4.901a1 1 0 1 1 1.99 0A5.002 5.002 0 0 1 13 6c0 2.188.32 4.252.78 5.995z"/>
            </svg>
            <span class="notification-dot" *ngIf="unreadCount > 0">{{ unreadCount }}</span>
          </div>
          <div class="notification-dropdown" *ngIf="showNotifications" (click)="$event.stopPropagation()">
            <div class="notification-header d-flex flex-column">
                <div class="d-flex justify-content-between align-items-center mb-2">
                  <span class="fw-bold fs-6">Notifications</span>
                  <div class="form-check form-switch m-0">
                    <input class="form-check-input" type="checkbox" role="switch" id="notifSwitch" [checked]="notificationsEnabled" (change)="toggleNotificationSystem()" style="cursor: pointer;">
                    <label class="form-check-label text-muted" style="font-size: 12px;" for="notifSwitch">{{ notificationsEnabled ? 'Enabled' : 'Disabled' }}</label>
                  </div>
                </div>
                <div class="d-flex justify-content-between" *ngIf="notificationsEnabled">
                   <span class="badge bg-secondary" style="font-size: 10px;">{{ unreadCount }} Unread</span>
                   <button class="btn btn-sm btn-outline-primary p-1" style="font-size: 10px;" (click)="testNotification()">+ Test Alert</button>
                </div>
            </div>
            <div class="notification-list" *ngIf="notificationsEnabled">
              <div class="notification-item" *ngIf="notifications.length === 0">
                <div class="title text-center text-muted my-3">No notifications found.</div>
              </div>
              <div class="notification-item" 
                   *ngFor="let n of notifications" 
                   [class.unread]="!n.isRead"
                   (click)="markAsRead(n)">
                <div class="title">{{ n.message }}</div>
                <div class="time">{{ n.createdAt | date:'shortTime' }} &bull; {{ n.createdAt | date:'MMM d' }}</div>
              </div>
            </div>
            <div class="notification-list p-3 text-center text-muted" *ngIf="!notificationsEnabled">
                Notifications are currently disabled.
            </div>
          </div>
        </div>
        <a routerLink="/profile" class="profile-link">{{ authService.getUserEmail() || 'Profile' }}</a>
        <button (click)="logout()">Logout</button>
      </div>
      <div class="links" *ngIf="!authService.isLoggedIn()">
        <a routerLink="/login">Login</a>
        <a routerLink="/register">Register</a>
      </div>
    </nav>
  `,
  styles: [`
    .navbar { display: flex; justify-content: space-between; padding: 15px; background: #007bff; color: white; align-items: center; }
    .links { display: flex; align-items: center; }
    .links a, .links button { color: white; margin-left: 15px; text-decoration: none; background: none; border: none; cursor: pointer; font-size: 16px; }
    .profile-link { font-weight: bold; text-decoration: underline !important;}
    .admin-link { font-weight: bold; color: #ffeb3b !important; }
    .business-link { font-weight: bold; color: #0dcaf0 !important; }
    .notification-container { position: relative; }
    .notification-icon { position: relative; color: white; margin-left: 15px; cursor: pointer; display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 50%; transition: background 0.2s; }
    .notification-icon:hover { background: rgba(255, 255, 255, 0.2); }
    .notification-dot { position: absolute; top: -5px; right: -5px; min-width: 18px; height: 18px; background-color: #dc3545; border-radius: 9px; color: white; font-size: 11px; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 2px solid #007bff; padding: 0 4px; }
    .notification-dropdown { position: absolute; top: 45px; right: 0; width: 350px; background: white; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 1000; overflow: hidden; color: #333; }
    .notification-header { padding: 12px 15px; font-weight: bold; border-bottom: 1px solid #eee; background: #f8f9fa; }
    .notification-list { max-height: 350px; overflow-y: auto; }
    .notification-item { padding: 12px 15px; border-bottom: 1px solid #eee; cursor: pointer; transition: background 0.2s; }
    .notification-item:hover { background: #f8f9fa; }
    .notification-item.unread { background: #e9ecef; border-left: 3px solid #007bff; }
    .notification-item .title { font-size: 14px; font-weight: 500; margin-bottom: 4px; line-height: 1.3;}
    .notification-item .time { font-size: 11px; color: #6c757d; }
  `]
})
export class NavbarComponent implements OnInit, OnDestroy {
  showNotifications = false;
  notificationsEnabled: boolean = true;
  notifications: NotificationDTO[] = [];
  unreadCount = 0;
  private authSub?: Subscription;

  @ViewChild('bellIcon') bellIcon?: ElementRef;

  constructor(
    public authService: AuthService,
    private router: Router,
    private notificationService: NotificationService
  ) { }

  ngOnInit() {
    const savedToggle = localStorage.getItem('notificationsEnabled');
    if (savedToggle !== null) {
      this.notificationsEnabled = savedToggle === 'true';
    }

    if (this.authService.isLoggedIn() && this.notificationsEnabled) {
      this.loadNotifications();
    }
    this.authSub = this.authService.authStatusChanged.subscribe(isLoggedIn => {
      if (isLoggedIn && this.notificationsEnabled) {
        this.loadNotifications();
      } else {
        this.clearNotifications();
      }
    });
  }

  clearNotifications() {
    this.notifications = [];
    this.unreadCount = 0;
    this.showNotifications = false;
  }

  ngOnDestroy() {
    if (this.authSub) {
      this.authSub.unsubscribe();
    }
  }

  loadNotifications() {
    this.notificationService.getNotifications(0, 20).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.notifications = res.data.content;
          this.unreadCount = this.notifications.filter(n => !n.isRead).length;
        }
      },
      error: (err) => console.error('Failed to load notifications', err)
    });
  }

  markAsRead(notification: NotificationDTO) {
    if (!notification.isRead) {
      this.notificationService.markAsRead(notification.id).subscribe({
        next: () => {
          notification.isRead = true;
          this.unreadCount = Math.max(0, this.unreadCount - 1);
        },
        error: (err) => console.error('Failed to mark notification as read', err)
      });
    }
  }

  testNotification() {
    this.notificationService.testNotification().subscribe({
      next: () => {
        this.loadNotifications(); // Reload to show the new notification
      },
      error: (err) => console.error('Test notification failed', err)
    });
  }

  toggleNotifications(event: Event) {
    event.stopPropagation();
    this.showNotifications = !this.showNotifications;
    // Auto refresh when opening if enabled
    if (this.showNotifications && this.notificationsEnabled) {
      this.loadNotifications();
    }
  }

  toggleNotificationSystem() {
    this.notificationsEnabled = !this.notificationsEnabled;
    localStorage.setItem('notificationsEnabled', this.notificationsEnabled.toString());

    if (this.notificationsEnabled) {
      this.loadNotifications();
    } else {
      this.notifications = [];
      this.unreadCount = 0;
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (this.showNotifications && this.bellIcon && !this.bellIcon.nativeElement.contains(event.target)) {
      this.showNotifications = false;
    }
  }

  getDashboardRoute(): string {
    const role = this.authService.getUserRole();
    if (role === 'ADMIN' || role === 'ROLE_ADMIN') {
      return '/admin/dashboard';
    }
    // Both USER and BUSINESS roles should land on the personal wallet dashboard
    return '/dashboard';
  }

  logout() { this.authService.logout(); this.router.navigate(['/login']); }
}
