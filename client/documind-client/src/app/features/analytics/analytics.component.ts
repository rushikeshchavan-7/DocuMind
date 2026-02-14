import { Component, inject, OnInit, signal } from '@angular/core';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { ApiService, AnalyticsData } from '../../core/services/api.service';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-analytics',
  imports: [SidebarComponent, DatePipe],
  template: `
    <div class="layout">
      <app-sidebar />
      <main class="main-content">
        <div class="page-header animate-fade-in">
          <div>
            <h1 class="page-title">Analytics</h1>
            <p class="page-subtitle">Insights into your document activity and AI usage</p>
          </div>
        </div>

        @if (data()) {
          <!-- Overview Stats -->
          <div class="stats-row animate-fade-in">
            <div class="stat-card glass-card">
              <div class="stat-icon icon-purple">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              </div>
              <div class="stat-data">
                <span class="stat-value">{{ data()!.totalDocuments }}</span>
                <span class="stat-label">Total Documents</span>
              </div>
            </div>
            <div class="stat-card glass-card">
              <div class="stat-icon icon-green">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <div class="stat-data">
                <span class="stat-value">{{ data()!.processedDocuments }}</span>
                <span class="stat-label">Processed</span>
              </div>
            </div>
            <div class="stat-card glass-card">
              <div class="stat-icon icon-blue">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              </div>
              <div class="stat-data">
                <span class="stat-value">{{ data()!.totalChatSessions }}</span>
                <span class="stat-label">Chat Sessions</span>
              </div>
            </div>
            <div class="stat-card glass-card">
              <div class="stat-icon icon-orange">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              </div>
              <div class="stat-data">
                <span class="stat-value">{{ data()!.totalMessages }}</span>
                <span class="stat-label">Total Messages</span>
              </div>
            </div>
            <div class="stat-card glass-card">
              <div class="stat-icon icon-red">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
              </div>
              <div class="stat-data">
                <span class="stat-value">{{ formatBytes(data()!.totalStorageUsed) }}</span>
                <span class="stat-label">Storage Used</span>
              </div>
            </div>
          </div>

          <div class="charts-grid">
            <!-- Document Types Chart -->
            <div class="chart-card glass-card animate-fade-in">
              <h3 class="chart-title">Documents by Type</h3>
              @if (data()!.documentsByType.length) {
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
                      <span class="donut-total">{{ data()!.totalDocuments }}</span>
                      <span class="donut-label">Total</span>
                    </div>
                  </div>
                  <div class="donut-legend">
                    @for (item of data()!.documentsByType; track item.type) {
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

            <!-- Activity Chart -->
            <div class="chart-card glass-card animate-fade-in">
              <h3 class="chart-title">Activity (Last 7 Days)</h3>
              <div class="bar-chart">
                @for (point of data()!.chatActivity; track point.date) {
                  <div class="bar-col">
                    <div class="bar-stack">
                      <div class="bar bar-messages" [style.height.px]="getBarHeight(point.messages, maxActivity())" title="{{ point.messages }} messages"></div>
                      <div class="bar bar-docs" [style.height.px]="getBarHeight(point.documents, maxActivity())" title="{{ point.documents }} documents"></div>
                    </div>
                    <span class="bar-label">{{ point.date.split(' ')[1] }}</span>
                  </div>
                }
              </div>
              <div class="bar-legend">
                <div class="legend-item">
                  <span class="legend-dot" style="background: var(--accent);"></span>
                  <span class="legend-label">Messages</span>
                </div>
                <div class="legend-item">
                  <span class="legend-dot" style="background: #22c55e;"></span>
                  <span class="legend-label">Documents</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Recent Chat Sessions -->
          <div class="section animate-fade-in">
            <h3 class="section-title">Recent Chat Sessions</h3>
            @if (data()!.recentSessions.length) {
              <div class="sessions-table glass-card">
                <table>
                  <thead>
                    <tr>
                      <th>Session</th>
                      <th>Document</th>
                      <th>Messages</th>
                      <th>Last Active</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (session of data()!.recentSessions; track session.id) {
                      <tr>
                        <td class="session-title-cell">{{ session.title }}</td>
                        <td class="text-muted text-sm">{{ session.documentName }}</td>
                        <td><span class="badge badge-info">{{ session.messageCount }}</span></td>
                        <td class="text-muted text-sm">{{ session.updatedAt | date:'MMM d, h:mm a' }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            } @else {
              <div class="chart-empty glass-card" style="padding: 40px;">No chat sessions yet</div>
            }
          </div>
        } @else {
          <div class="loading-grid">
            <div class="skeleton" style="height: 100px;"></div>
            <div class="skeleton" style="height: 100px;"></div>
            <div class="skeleton" style="height: 100px;"></div>
            <div class="skeleton" style="height: 300px; grid-column: span 2;"></div>
          </div>
        }
      </main>
    </div>
  `,
  styles: [`
    .layout { display: flex; min-height: 100vh; }
    .main-content { flex: 1; margin-left: 260px; padding: 32px; }

    .page-header { margin-bottom: 24px; }
    .page-title { font-size: 28px; font-weight: 700; letter-spacing: -0.5px; margin-bottom: 4px; }
    .page-subtitle { color: var(--text-secondary); font-size: 14px; }

    .stats-row {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 12px;
      margin-bottom: 24px;
    }

    .stat-card {
      padding: 16px;
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .stat-icon {
      width: 40px; height: 40px;
      border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
      &.icon-purple { background: rgba(99, 102, 241, 0.1); color: #6366f1; }
      &.icon-green { background: rgba(34, 197, 94, 0.1); color: #22c55e; }
      &.icon-blue { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
      &.icon-orange { background: rgba(249, 115, 22, 0.1); color: #f97316; }
      &.icon-red { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
    }

    .stat-data { display: flex; flex-direction: column; }
    .stat-value { font-size: 20px; font-weight: 700; letter-spacing: -0.5px; }
    .stat-label { font-size: 11px; color: var(--text-muted); }

    .charts-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 24px;
    }

    .chart-card {
      padding: 24px;
    }
    .chart-title {
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 20px;
    }

    .chart-empty {
      text-align: center;
      color: var(--text-muted);
      font-size: 13px;
      padding: 40px;
    }

    /* Donut Chart */
    .donut-chart {
      display: flex;
      align-items: center;
      gap: 24px;
    }
    .donut-visual {
      position: relative;
      width: 120px;
      height: 120px;
      flex-shrink: 0;
    }
    .donut-svg {
      width: 100%;
      height: 100%;
    }
    .donut-segment {
      transition: all 0.5s ease;
    }
    .donut-center {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      text-align: center;
    }
    .donut-total { font-size: 20px; font-weight: 700; display: block; }
    .donut-label { font-size: 10px; color: var(--text-muted); }

    .donut-legend {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
    }
    .legend-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      flex-shrink: 0;
    }
    .legend-label { color: var(--text-secondary); flex: 1; }
    .legend-count { font-weight: 600; }

    /* Bar Chart */
    .bar-chart {
      display: flex;
      align-items: flex-end;
      justify-content: space-around;
      height: 150px;
      gap: 8px;
      padding-bottom: 24px;
    }
    .bar-col {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      flex: 1;
    }
    .bar-stack {
      display: flex;
      flex-direction: column;
      gap: 2px;
      align-items: center;
    }
    .bar {
      width: 24px;
      border-radius: 4px 4px 0 0;
      min-height: 2px;
      transition: height 0.5s ease;
    }
    .bar-messages { background: var(--accent); }
    .bar-docs { background: #22c55e; }
    .bar-label { font-size: 11px; color: var(--text-muted); }
    .bar-legend {
      display: flex;
      gap: 16px;
      justify-content: center;
      margin-top: 12px;
    }

    /* Sessions Table */
    .section { margin-bottom: 24px; }
    .section-title { font-size: 16px; font-weight: 600; margin-bottom: 16px; }

    .sessions-table {
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
        font-size: 13px;
        border-bottom: 1px solid var(--border);
      }
      tr:last-child td { border-bottom: none; }
      tr:hover td { background: rgba(255,255,255,0.02); }
    }
    .session-title-cell {
      font-weight: 500;
      max-width: 300px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .loading-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
    }

    .session-title-cell, td.text-muted {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    @media (max-width: 1200px) {
      .stats-row { grid-template-columns: repeat(3, 1fr); }
    }
    @media (max-width: 768px) {
      .main-content { margin-left: 0; }
      .page-title { font-size: 20px; }
      .stats-row { grid-template-columns: repeat(2, 1fr); gap: 8px; }
      .stat-card { padding: 12px; gap: 10px; }
      .stat-value { font-size: 16px; }
      .stat-label { font-size: 10px; }
      .charts-grid { grid-template-columns: 1fr; }
      .chart-card { padding: 16px; }
      .donut-chart { flex-direction: column; align-items: center; }
      .donut-visual { width: 100px; height: 100px; }
      .donut-legend { flex-direction: row; flex-wrap: wrap; gap: 10px; justify-content: center; }
      .bar { width: 18px; }
      .bar-label { font-size: 10px; }
      .sessions-table {
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
        table { min-width: 480px; }
      }
      .session-title-cell { max-width: 150px; }
      .loading-grid { grid-template-columns: 1fr; }
      .loading-grid .skeleton:last-child { grid-column: span 1; }
    }
  `],
})
export class AnalyticsComponent implements OnInit {
  private apiService = inject(ApiService);
  data = signal<AnalyticsData | null>(null);
  maxActivity = signal(1);

  ngOnInit() {
    this.apiService.getAnalytics().subscribe({
      next: (data) => {
        this.data.set(data);
        const max = Math.max(...data.chatActivity.map(p => Math.max(p.messages, p.documents)), 1);
        this.maxActivity.set(max);
      },
      error: () => this.data.set({
        totalDocuments: 0, processedDocuments: 0, failedDocuments: 0,
        totalChatSessions: 0, totalMessages: 0, totalStorageUsed: 0,
        documentsByType: [], documentsByStatus: [], chatActivity: [], recentSessions: []
      }),
    });
  }

  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  getBarHeight(value: number, max: number): number {
    return max > 0 ? Math.max(2, (value / max) * 120) : 2;
  }

  getDonutSegments(): { type: string; color: string; dashArray: string; dashOffset: string }[] {
    const total = this.data()?.totalDocuments || 0;
    if (total === 0) return [];

    const circumference = 2 * Math.PI * 50; // r=50
    const segments: { type: string; color: string; dashArray: string; dashOffset: string }[] = [];
    let offset = 0;

    for (const item of this.data()!.documentsByType) {
      const pct = item.count / total;
      const segmentLength = pct * circumference;
      segments.push({
        type: item.type,
        color: item.color,
        dashArray: `${segmentLength} ${circumference - segmentLength}`,
        dashOffset: `${-offset}`,
      });
      offset += segmentLength;
    }

    return segments;
  }
}
