import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { ApiService, DashboardData } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, SidebarComponent, DatePipe],
  template: `
    <div class="layout">
      <app-sidebar />
      <main class="main-content">
        <div class="page-header animate-fade-in">
          <div>
            <h1 class="page-title">Welcome back, {{ getFirstName() }}</h1>
            <p class="page-subtitle">Here's what's happening with your documents</p>
          </div>
          <a routerLink="/documents" class="btn btn-primary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Upload Document
          </a>
        </div>

        <!-- Stats Grid -->
        <div class="stats-grid animate-fade-in">
          <div class="stat-card glass-card">
            <div class="stat-icon" style="background: rgba(99, 102, 241, 0.1);">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ data()?.totalDocuments ?? 0 }}</span>
              <span class="stat-label">Total Documents</span>
            </div>
          </div>

          <div class="stat-card glass-card">
            <div class="stat-icon" style="background: rgba(34, 197, 94, 0.1);">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ data()?.processedDocuments ?? 0 }}</span>
              <span class="stat-label">Processed</span>
            </div>
          </div>

          <div class="stat-card glass-card">
            <div class="stat-icon" style="background: rgba(139, 92, 246, 0.1);">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ data()?.totalChats ?? 0 }}</span>
              <span class="stat-label">AI Conversations</span>
            </div>
          </div>

          <div class="stat-card glass-card">
            <div class="stat-icon" style="background: rgba(245, 158, 11, 0.1);">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ formatBytes(data()?.totalStorageUsed ?? 0) }}</span>
              <span class="stat-label">Storage Used</span>
            </div>
          </div>
        </div>

        <!-- Recent Documents -->
        <div class="section animate-fade-in" style="animation-delay: 0.1s;">
          <div class="section-header">
            <h2 class="section-title">Recent Documents</h2>
            <a routerLink="/documents" class="btn btn-ghost text-sm">View All →</a>
          </div>

          @if (data()?.recentDocuments?.length) {
            <div class="documents-table glass-card">
              <table>
                <thead>
                  <tr>
                    <th>Document</th>
                    <th>Status</th>
                    <th>Uploaded</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  @for (doc of data()?.recentDocuments; track doc.id) {
                    <tr>
                      <td>
                        <div class="doc-info">
                          <div class="doc-icon">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                          </div>
                          <span class="doc-name">{{ doc.fileName }}</span>
                        </div>
                      </td>
                      <td>
                        <span class="badge" [class]="getStatusClass(doc.status)">
                          <span class="dot" [class]="getStatusDotClass(doc.status)"></span>
                          {{ doc.status }}
                        </span>
                      </td>
                      <td class="text-muted text-sm">{{ doc.uploadedAt | date:'MMM d, y' }}</td>
                      <td>
                        <a [routerLink]="['/documents', doc.id]" class="btn btn-ghost btn-icon" title="View">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                        </a>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          } @else {
            <div class="empty-state glass-card">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              <h3>No documents yet</h3>
              <p class="text-muted">Upload your first document to get started with AI analysis</p>
              <a routerLink="/documents" class="btn btn-primary" style="margin-top: 16px;">Upload Document</a>
            </div>
          }
        </div>
      </main>
    </div>
  `,
  styles: [`
    .layout { display: flex; min-height: 100vh; }
    .main-content { flex: 1; margin-left: 260px; padding: 32px; }

    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 32px;
    }

    .page-title {
      font-size: 28px;
      font-weight: 700;
      letter-spacing: -0.5px;
      margin-bottom: 4px;
    }

    .page-subtitle {
      color: var(--text-secondary);
      font-size: 14px;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-bottom: 32px;
    }

    .stat-card {
      padding: 20px;
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .stat-icon {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .stat-info {
      display: flex;
      flex-direction: column;
    }

    .stat-value {
      font-size: 22px;
      font-weight: 700;
      letter-spacing: -0.5px;
    }

    .stat-label {
      font-size: 12px;
      color: var(--text-secondary);
      margin-top: 2px;
    }

    .section { margin-bottom: 32px; }

    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
    }

    .section-title {
      font-size: 16px;
      font-weight: 600;
    }

    .documents-table {
      overflow: hidden;
      table {
        width: 100%;
        border-collapse: collapse;
      }
      th {
        text-align: left;
        padding: 12px 16px;
        font-size: 11px;
        font-weight: 600;
        color: var(--text-muted);
        text-transform: uppercase;
        letter-spacing: 1px;
        border-bottom: 1px solid var(--border);
      }
      td {
        padding: 14px 16px;
        border-bottom: 1px solid var(--border);
      }
      tr:last-child td { border-bottom: none; }
      tr:hover td { background: rgba(255,255,255,0.02); }
    }

    .doc-info {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .doc-icon {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      background: rgba(99, 102, 241, 0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--accent);
    }

    .doc-name {
      font-weight: 500;
      font-size: 13px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      max-width: 200px;
    }

    .empty-state {
      padding: 60px 40px;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      h3 {
        font-size: 16px;
        font-weight: 600;
        margin-top: 8px;
      }
      p { font-size: 13px; }
    }

    @media (max-width: 1024px) {
      .stats-grid { grid-template-columns: repeat(2, 1fr); }
    }

    @media (max-width: 768px) {
      .main-content { margin-left: 0; }
      .page-header { flex-direction: column; align-items: flex-start; gap: 12px; }
      .page-title { font-size: 20px; }
      .stats-grid { grid-template-columns: repeat(2, 1fr); gap: 8px; }
      .stat-card { padding: 12px; }
      .stat-value { font-size: 16px; }
      .documents-table { overflow-x: auto; }
      .documents-table table { min-width: 480px; }
    }
  `],
})
export class DashboardComponent implements OnInit {
  private apiService = inject(ApiService);
  private authService = inject(AuthService);

  data = signal<DashboardData | null>(null);

  ngOnInit() {
    this.apiService.getDashboard().subscribe({
      next: (data) => this.data.set(data),
      error: () => this.data.set({
        totalDocuments: 0, processedDocuments: 0, totalChats: 0,
        totalStorageUsed: 0, recentActivity: [], recentDocuments: []
      }),
    });
  }

  getFirstName(): string {
    return this.authService.user()?.fullName?.split(' ')[0] || 'there';
  }

  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Ready': return 'badge-success';
      case 'Processing': return 'badge-warning';
      case 'Failed': return 'badge-error';
      default: return 'badge-info';
    }
  }

  getStatusDotClass(status: string): string {
    switch (status) {
      case 'Ready': return 'dot-success';
      case 'Processing': return 'dot-warning';
      case 'Failed': return 'dot-error';
      default: return '';
    }
  }
}
