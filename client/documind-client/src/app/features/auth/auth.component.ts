import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-auth',
  imports: [FormsModule],
  template: `
    <div class="auth-container">
      <div class="auth-bg">
        <div class="grid-overlay"></div>
        <div class="glow glow-1"></div>
        <div class="glow glow-2"></div>
      </div>

      <div class="auth-card animate-fade-in">
        <div class="auth-header">
          <div class="logo-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="url(#authGrad)" opacity="0.9"/>
              <path d="M2 17L12 22L22 17" stroke="url(#authGrad)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M2 12L12 17L22 12" stroke="url(#authGrad)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <defs>
                <linearGradient id="authGrad" x1="2" y1="2" x2="22" y2="22">
                  <stop offset="0%" stop-color="#6366f1"/>
                  <stop offset="100%" stop-color="#8b5cf6"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <h1 class="auth-title">{{ isLogin() ? 'Welcome back' : 'Create account' }}</h1>
          <p class="auth-subtitle">{{ isLogin() ? 'Sign in to your DocuMind account' : 'Start your AI document journey' }}</p>
        </div>

        @if (error()) {
          <div class="error-banner animate-fade-in">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
            {{ error() }}
          </div>
        }

        <form (ngSubmit)="onSubmit()" class="auth-form">
          @if (!isLogin()) {
            <div class="form-group">
              <label class="form-label">Full Name</label>
              <input class="form-input" type="text" [(ngModel)]="fullName" name="fullName" placeholder="Rushikesh Chavan" required>
            </div>
          }

          <div class="form-group">
            <label class="form-label">Email</label>
            <input class="form-input" type="email" [(ngModel)]="email" name="email" placeholder="you@example.com" required>
          </div>

          <div class="form-group">
            <label class="form-label">Password</label>
            <input class="form-input" type="password" [(ngModel)]="password" name="password" placeholder="Min. 8 characters" required minlength="8">
          </div>

          <button type="submit" class="btn btn-primary submit-btn" [disabled]="loading()">
            @if (loading()) {
              <span class="spinner"></span>
              {{ isLogin() ? 'Signing in...' : 'Creating account...' }}
            } @else {
              {{ isLogin() ? 'Sign In' : 'Create Account' }}
            }
          </button>
        </form>

        <div class="auth-footer">
          <span class="text-muted">{{ isLogin() ? "Don't have an account?" : 'Already have an account?' }}</span>
          <button type="button" class="btn btn-ghost toggle-btn" (click)="toggleMode()">
            {{ isLogin() ? 'Sign Up' : 'Sign In' }}
          </button>
        </div>

        <div class="security-note">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          <span>AES-256 encrypted · Data stays local with Ollama</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      overflow: hidden;
    }

    .auth-bg {
      position: absolute;
      inset: 0;
      z-index: 0;
    }

    .grid-overlay {
      position: absolute;
      inset: 0;
      background-image:
        linear-gradient(rgba(99, 102, 241, 0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(99, 102, 241, 0.03) 1px, transparent 1px);
      background-size: 60px 60px;
    }

    .glow {
      position: absolute;
      border-radius: 50%;
      filter: blur(120px);
      opacity: 0.15;
    }

    .glow-1 {
      width: 600px;
      height: 600px;
      background: #6366f1;
      top: -200px;
      right: -100px;
    }

    .glow-2 {
      width: 400px;
      height: 400px;
      background: #8b5cf6;
      bottom: -100px;
      left: -100px;
    }

    .auth-card {
      position: relative;
      z-index: 1;
      width: 100%;
      max-width: 420px;
      padding: 40px;
      background: rgba(24, 24, 27, 0.8);
      backdrop-filter: blur(20px);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
    }

    .auth-header {
      text-align: center;
      margin-bottom: 32px;
    }

    .logo-icon {
      width: 56px;
      height: 56px;
      border-radius: 14px;
      background: rgba(99, 102, 241, 0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 16px;
    }

    .auth-title {
      font-size: 24px;
      font-weight: 700;
      margin-bottom: 8px;
      letter-spacing: -0.5px;
    }

    .auth-subtitle {
      color: var(--text-secondary);
      font-size: 14px;
    }

    .error-banner {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 14px;
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.2);
      border-radius: var(--radius-sm);
      color: var(--error);
      font-size: 13px;
      margin-bottom: 20px;
    }

    .auth-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
    }

    .submit-btn {
      width: 100%;
      padding: 12px;
      font-size: 14px;
      font-weight: 600;
      margin-top: 8px;
    }

    .spinner {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .auth-footer {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      margin-top: 24px;
      font-size: 13px;
    }

    .toggle-btn {
      font-size: 13px;
      font-weight: 600;
      color: var(--accent) !important;
      padding: 4px 8px;
    }

    .security-note {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      margin-top: 24px;
      padding-top: 20px;
      border-top: 1px solid var(--border);
      font-size: 11px;
      color: var(--text-muted);
    }

    @media (max-width: 480px) {
      .auth-card {
        margin: 12px;
        padding: 24px 20px;
        max-width: 100%;
      }
      .auth-title { font-size: 20px; }
      .auth-subtitle { font-size: 13px; }
      .logo-icon { width: 48px; height: 48px; margin-bottom: 12px; }
      .form-input { font-size: 16px; padding: 12px 14px; }
      .submit-btn { padding: 12px; font-size: 14px; }
      .auth-footer { flex-direction: column; gap: 2px; }
      .security-note {
        flex-direction: column;
        text-align: center;
        gap: 4px;
        span { font-size: 10px; }
      }
    }
  `],
})
export class AuthComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  isLogin = signal(true);
  loading = signal(false);
  error = signal('');

  fullName = '';
  email = '';
  password = '';

  toggleMode() {
    this.isLogin.update(v => !v);
    this.error.set('');
  }

  onSubmit() {
    this.loading.set(true);
    this.error.set('');

    const request = this.isLogin()
      ? this.authService.login(this.email, this.password)
      : this.authService.register(this.fullName, this.email, this.password);

    request.subscribe({
      next: () => {
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Something went wrong. Please try again.');
        this.loading.set(false);
      },
    });
  }
}
