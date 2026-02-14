import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { ApiService, DashboardData, AnalyticsData } from '../../core/services/api.service';
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
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ data()?.totalDocuments ?? 0 }}</span>
              <span class="stat-label">Total Documents</span>
            </div>
          </div>

          <div class="stat-card glass-card">
            <div class="stat-icon" style="background: rgba(34, 197, 94, 0.1);">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ data()?.processedDocuments ?? 0 }}</span>
              <span class="stat-label">Processed</span>
            </div>
          </div>

          <div class="stat-card glass-card">
            <div class="stat-icon" style="background: rgba(139, 92, 246, 0.1);">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ analytics()?.totalMessages ?? data()?.totalChats ?? 0 }}</span>
              <span class="stat-label">AI Messages</span>
            </div>
          </div>

          <div class="stat-card glass-card">
            <div class="stat-icon" style="background: rgba(245, 158, 11, 0.1);">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ formatBytes(data()?.totalStorageUsed ?? 0) }}</span>
              <span class="stat-label">Storage Used</span>
            </div>
          </div>
        </div>

        <!-- Charts Row -->
        @if (analytics()) {
          <div class="charts-grid animate-fade-in" style="animation-delay: 0.05s;">
            <!-- Document Types -->
            <div class="chart-card glass-card">
              <h3 class="chart-title">Documents by Type</h3>
              @if (analytics()!.documentsByType.length) {
                <div class="donut-chart">
                  <div class="donut-visual">
                    <svg viewBox="0 0 120 120" class="donut-svg">
                      @for (seg of getDonutSegments(); track seg.type) {
                        <circle cx="60" cy="60" r="50" fill="none" [attr.stroke]="seg.color" stroke-width="12"
                          [attr.stroke-dasharray]="seg.dashArray" [attr.stroke-dashoffset]="seg.dashOffset"
                          transform="rotate(-90 60 60)" class="donut-segment"/>
                      }
                    </svg>
                    <div class="donut-center">
                      <span class="donut-total">{{ analytics()!.totalDocuments }}</span>
                      <span class="donut-label">Total</span>
                    </div>
                  </div>
                  <div class="donut-legend">
                    @for (item of analytics()!.documentsByType; track item.type) {
                      <div class="legend-item">
                        <span class="legend-dot" [style.background]="item.color"></span>
                        <span class="legend-label">{{ item.type }}</span>
                        <span class="legend-count">{{ item.count }}</span>
                      </div>
                    }
                  </div>
                </div>
              } @else {
                <div class="chart-empty">No documents yet</div>
              }
            </div>

            <!-- Activity -->
            <div class="chart-card glass-card">
              <h3 class="chart-title">Activity (Last 7 Days)</h3>
              <div class="bar-chart">
                @for (point of analytics()!.chatActivity; track point.date) {
                  <div class="bar-col">
                    <div class="bar-stack">
                      <div class="bar bar-messages" [style.height.px]="getBarHeight(point.messages)" title="{{ point.messages }} messages"></div>
                      <div class="bar bar-docs" [style.height.px]="getBarHeight(point.documents)" title="{{ point.documents }} documents"></div>
                    </div>
                    <span class="bar-label">{{ point.date.split(' ')[1] }}</span>
                  </div>
                }
              </div>
              <div class="bar-legend">
                <div class="legend-item"><span class="legend-dot" style="background: var(--accent);"></span><span class="legend-label">Messages</span></div>
                <div class="legend-item"><span class="legend-dot" style="background: #22c55e;"></span><span class="legend-label">Documents</span></div>
              </div>
            </div>
          </div>
        }

        <!-- Recent Documents -->
        <div class="section animate-fade-in" style="animation-delay: 0.1s;">
          <div class="section-header">
            <h2 class="section-title">Recent Documents</h2>
            <a routerLink="/documents" class="btn btn-ghost text-sm">View All</a>
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
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 32px;
    }
    .page-title { font-size: 28px; font-weight: 700; letter-spacing: -0.5px; margin-bottom: 4px; }
    .page-subtitle { color: var(--text-secondary); font-size: 14px; }

    .stats-grid {
      display: grid; grid-template-columns: repeat(4, 1fr);
      gap: 16px; margin-bottom: 24px;
    }
    .stat-card { padding: 20px; display: flex; align-items: center; gap: 16px; }
    .stat-icon {
      width: 44px; height: 44px; border-radius: 12px;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .stat-info { display: flex; flex-direction: column; }
    .stat-value { font-size: 22px; font-weight: 700; letter-spacing: -0.5px; }
    .stat-label { font-size: 12px; color: var(--text-secondary); margin-top: 2px; }

    /* Charts */
    .charts-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
    .chart-card { padding: 24px; }
    .chart-title { font-size: 14px; font-weight: 600; margin-bottom: 20px; }
    .chart-empty { text-align: center; color: var(--text-muted); font-size: 13px; padding: 40px; }

    .donut-chart { display: flex; align-items: center; gap: 24px; }
    .donut-visual { position: relative; width: 120px; height: 120px; flex-shrink: 0; }
    .donut-svg { width: 100%; height: 100%; }
    .donut-segment { transition: all 0.5s ease; }
    .donut-center { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center; }
    .donut-total { font-size: 20px; font-weight: 700; display: block; }
    .donut-label { font-size: 10px; color: var(--text-muted); }
    .donut-legend { display: flex; flex-direction: column; gap: 8px; }
    .legend-item { display: flex; align-items: center; gap: 8px; font-size: 12px; }
    .legend-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
    .legend-label { color: var(--text-secondary); flex: 1; }
    .legend-count { font-weight: 600; }

    .bar-chart { display: flex; align-items: flex-end; justify-content: space-around; height: 130px; gap: 8px; padding-bottom: 24px; }
    .bar-col { display: flex; flex-direction: column; align-items: center; gap: 6px; flex: 1; }
    .bar-stack { display: flex; flex-direction: column; gap: 2px; align-items: center; }
    .bar { width: 22px; border-radius: 4px 4px 0 0; min-height: 2px; transition: height 0.5s ease; }
    .bar-messages { background: var(--accent); }
    .bar-docs { background: #22c55e; }
    .bar-label { font-size: 11px; color: var(--text-muted); }
    .bar-legend { display: flex; gap: 16px; justify-content: center; margin-top: 12px; }

    /* Sections */
    .section { margin-bottom: 32px; }
    .section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
    .section-title { font-size: 16px; font-weight: 600; }

    .documents-table {
      overflow: hidden;
      table { width: 100%; border-collapse: collapse; }
      th { text-align: left; padding: 12px 16px; font-size: 11px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid var(--border); }
      td { padding: 14px 16px; border-bottom: 1px solid var(--border); }
      tr:last-child td { border-bottom: none; }
      tr:hover td { background: rgba(255,255,255,0.02); }
    }
    .doc-info { display: flex; align-items: center; gap: 10px; }
    .doc-icon { width: 32px; height: 32px; border-radius: 8px; background: rgba(99, 102, 241, 0.1); display: flex; align-items: center; justify-content: center; color: var(--accent); flex-shrink: 0; }
    .doc-name { font-weight: 500; font-size: 13px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 200px; }

    .empty-state {
      padding: 60px 40px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 12px;
      h3 { font-size: 16px; font-weight: 600; margin-top: 8px; }
      p { font-size: 13px; }
    }

    @media (max-width: 1024px) {
      .stats-grid { grid-template-columns: repeat(2, 1fr); }
      .charts-grid { grid-template-columns: 1fr; }
    }

    @media (max-width: 768px) {
      .main-content { margin-left: 0; }
      .page-header { flex-direction: column; align-items: flex-start; gap: 12px; }
      .page-title { font-size: 20px; }
      .stats-grid { grid-template-columns: repeat(2, 1fr); gap: 8px; }
      .stat-card { padding: 12px; }
      .stat-value { font-size: 16px; }
      .charts-grid { grid-template-columns: 1fr; }
      .chart-card { padding: 16px; }
      .donut-chart { flex-direction: column; align-items: center; }
      .donut-visual { width: 100px; height: 100px; }
      .donut-legend { flex-direction: row; flex-wrap: wrap; gap: 10px; justify-content: center; }
      .bar { width: 16px; }
      .documents-table { overflow-x: auto; }
      .documents-table table { min-width: 480px; }
    }
  `],
})
export class DashboardComponent implements OnInit {
  private apiService = inject(ApiService);
  private authService = inject(AuthService);

  data = signal<DashboardData | null>(null);
  analytics = signal<AnalyticsData | null>(null);
  private maxAct = 1;

  ngOnInit() {
    this.apiService.getDashboard().subscribe({
      next: (d) => this.data.set(d),
      error: () => this.data.set({
        totalDocuments: 0, processedDocuments: 0, totalChats: 0,
        totalStorageUsed: 0, recentActivity: [], recentDocuments: []
      }),
    });

    this.apiService.getAnalytics().subscribe({
      next: (a) => {
        this.analytics.set(a);
        this.maxAct = Math.max(...a.chatActivity.map(p => Math.max(p.messages, p.documents)), 1);
      },
      error: () => {},
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

  getBarHeight(value: number): number {
    return this.maxAct > 0 ? Math.max(2, (value / this.maxAct) * 100) : 2;
  }

  getDonutSegments(): { type: string; color: string; dashArray: string; dashOffset: string }[] {
    const total = this.analytics()?.totalDocuments || 0;
    if (total === 0) return [];
    const circumference = 2 * Math.PI * 50;
    const segments: { type: string; color: string; dashArray: string; dashOffset: string }[] = [];
    let offset = 0;
    for (const item of this.analytics()!.documentsByType) {
      const pct = item.count / total;
      const segLen = pct * circumference;
      segments.push({
        type: item.type, color: item.color,
        dashArray: `${segLen} ${circumference - segLen}`,
        dashOffset: `${-offset}`,
      });
      offset += segLen;
    }
    return segments;
  }
}
