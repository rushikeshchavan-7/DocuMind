import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  template: `
    <!-- Mobile Hamburger -->
    <button class="hamburger" (click)="toggleMobile()" [class.open]="mobileOpen()">
      <span></span><span></span><span></span>
    </button>

    <!-- Overlay -->
    @if (mobileOpen()) {
      <div class="sidebar-overlay" (click)="mobileOpen.set(false)"></div>
    }

    <aside class="sidebar" [class.mobile-open]="mobileOpen()">
      <div class="sidebar-header">
        <div class="logo">
          <div class="logo-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="url(#grad1)" opacity="0.9"/>
              <path d="M2 17L12 22L22 17" stroke="url(#grad1)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M2 12L12 17L22 12" stroke="url(#grad1)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <defs>
                <linearGradient id="grad1" x1="2" y1="2" x2="22" y2="22">
                  <stop offset="0%" stop-color="#6366f1"/>
                  <stop offset="100%" stop-color="#8b5cf6"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <span class="logo-text">DocuMind</span>
        </div>
      </div>

      <nav class="sidebar-nav">
        <div class="nav-section">
          <span class="nav-label">MAIN</span>
          <a routerLink="/dashboard" routerLinkActive="active" class="nav-item" (click)="closeMobile()">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="3" width="7" height="7" rx="1"/>
              <rect x="14" y="3" width="7" height="7" rx="1"/>
              <rect x="3" y="14" width="7" height="7" rx="1"/>
              <rect x="14" y="14" width="7" height="7" rx="1"/>
            </svg>
            <span>Dashboard</span>
          </a>
          <a routerLink="/documents" routerLinkActive="active" class="nav-item" (click)="closeMobile()">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
            <span>Documents</span>
          </a>
        </div>

        <div class="nav-section">
          <span class="nav-label">AI TOOLS</span>
          <a routerLink="/search" routerLinkActive="active" class="nav-item" (click)="closeMobile()">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <span>Smart Search</span>
          </a>
          <a routerLink="/analytics" routerLinkActive="active" class="nav-item" (click)="closeMobile()">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="20" x2="18" y2="10"/>
              <line x1="12" y1="20" x2="12" y2="4"/>
              <line x1="6" y1="20" x2="6" y2="14"/>
            </svg>
            <span>Analytics</span>
          </a>
        </div>
      </nav>

      <div class="sidebar-footer">
        <div class="user-info">
          <div class="avatar">{{ getInitials() }}</div>
          <div class="user-details">
            <span class="user-name">{{ auth.user()?.fullName }}</span>
            <span class="user-email">{{ auth.user()?.email }}</span>
          </div>
        </div>
        <button class="btn-ghost btn-icon logout-btn" (click)="auth.logout()" title="Logout">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
        </button>
      </div>
    </aside>
  `,
  styles: [`
    .sidebar {
      width: 260px;
      height: 100vh;
      background: var(--bg-secondary);
      border-right: 1px solid var(--border);
      display: flex;
      flex-direction: column;
      position: fixed;
      left: 0;
      top: 0;
      z-index: 100;
    }

    .sidebar-header {
      padding: 20px;
      border-bottom: 1px solid var(--border);
    }

    .logo {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .logo-icon {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      background: rgba(99, 102, 241, 0.1);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .logo-text {
      font-size: 18px;
      font-weight: 700;
      background: var(--accent-gradient);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      letter-spacing: -0.5px;
    }

    .sidebar-nav {
      flex: 1;
      padding: 16px 12px;
      overflow-y: auto;
    }

    .nav-section {
      margin-bottom: 24px;
    }

    .nav-label {
      display: block;
      font-size: 10px;
      font-weight: 600;
      color: var(--text-muted);
      letter-spacing: 1.5px;
      padding: 0 12px;
      margin-bottom: 8px;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 9px 12px;
      border-radius: var(--radius-sm);
      color: var(--text-secondary);
      transition: var(--transition);
      font-size: 13px;
      font-weight: 500;
      text-decoration: none;
      cursor: pointer;
      margin-bottom: 2px;

      &:hover:not(.disabled) {
        background: var(--bg-tertiary);
        color: var(--text-primary);
      }

      &.active {
        background: rgba(99, 102, 241, 0.1);
        color: var(--accent);
        svg { stroke: var(--accent); }
      }

      &.disabled {
        opacity: 0.4;
        cursor: default;
      }

      svg { flex-shrink: 0; }
    }

    .sidebar-footer {
      padding: 16px;
      border-top: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 10px;
      min-width: 0;
    }

    .avatar {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      background: var(--accent-gradient);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 600;
      color: white;
      flex-shrink: 0;
    }

    .user-details {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    .user-name {
      font-size: 12px;
      font-weight: 600;
      color: var(--text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .user-email {
      font-size: 11px;
      color: var(--text-muted);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .logout-btn {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      background: transparent;
      border: none;
      color: var(--text-muted);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: var(--transition);
      cursor: pointer;
      &:hover {
        background: rgba(239, 68, 68, 0.1);
        color: var(--error);
      }
    }

    /* Hamburger - hidden on desktop */
    .hamburger {
      display: none;
      position: fixed;
      top: 12px;
      left: 12px;
      z-index: 200;
      width: 40px;
      height: 40px;
      border: 1px solid var(--border);
      border-radius: 8px;
      background: var(--bg-secondary);
      cursor: pointer;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 5px;
      padding: 10px;

      span {
        display: block;
        width: 18px;
        height: 2px;
        background: var(--text-primary);
        border-radius: 1px;
        transition: var(--transition);
      }

      &.open span:nth-child(1) { transform: rotate(45deg) translate(5px, 5px); }
      &.open span:nth-child(2) { opacity: 0; }
      &.open span:nth-child(3) { transform: rotate(-45deg) translate(5px, -5px); }
    }

    .sidebar-overlay {
      display: none;
    }

    /* Mobile */
    @media (max-width: 768px) {
      .hamburger {
        display: flex;
      }

      .sidebar {
        transform: translateX(-100%);
        transition: transform 0.3s ease;
        z-index: 150;

        &.mobile-open {
          transform: translateX(0);
        }
      }

      .sidebar-overlay {
        display: block;
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.5);
        z-index: 140;
      }
    }
  `],
})
export class SidebarComponent {
  auth = inject(AuthService);
  mobileOpen = signal(false);

  getInitials(): string {
    const name = this.auth.user()?.fullName || '';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  toggleMobile() {
    this.mobileOpen.update(v => !v);
  }

  closeMobile() {
    this.mobileOpen.set(false);
  }
}
