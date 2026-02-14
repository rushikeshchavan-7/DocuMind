import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { ApiService, DocumentDetail } from '../../core/services/api.service';
import { DatePipe, DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-document-detail',
  imports: [RouterLink, SidebarComponent, DatePipe, DecimalPipe],
  template: `
    <div class="layout">
      <app-sidebar />
      <main class="main-content">
        @if (doc()) {
          <div class="page-header animate-fade-in">
            <div>
              <a routerLink="/documents" class="back-link">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
                Back to Documents
              </a>
              <h1 class="page-title">{{ doc()!.fileName }}</h1>
            </div>
            <div class="header-actions">
              <button class="btn btn-secondary" (click)="viewOriginal()">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                View Original
              </button>
              <button class="btn btn-secondary" (click)="downloadOriginal()">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Download
              </button>
              @if (doc()!.status === 'Ready') {
                <a [routerLink]="['/chat', doc()!.id]" class="btn btn-primary">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                  Chat with AI
                </a>
              }
            </div>
          </div>

          <div class="detail-grid animate-fade-in">
            <div class="info-card glass-card">
              <h3>Document Info</h3>
              <div class="info-list">
                <div class="info-row"><span class="info-label">Status</span><span class="badge" [class]="getStatusClass(doc()!.status)">{{ doc()!.status }}</span></div>
                <div class="info-row"><span class="info-label">Size</span><span>{{ formatBytes(doc()!.fileSize) }}</span></div>
                <div class="info-row"><span class="info-label">Pages</span><span>{{ doc()!.pageCount != null ? doc()!.pageCount : 'N/A' }}</span></div>
                <div class="info-row"><span class="info-label">Type</span><span class="type-badge">{{ getFileExtLabel(doc()!.contentType) }}</span></div>
                <div class="info-row"><span class="info-label">Uploaded</span><span>{{ doc()!.uploadedAt | date:'MMM d, y h:mm a' }}</span></div>
                @if (doc()!.processedAt) {
                  <div class="info-row"><span class="info-label">Processed</span><span>{{ doc()!.processedAt | date:'MMM d, y h:mm a' }}</span></div>
                }
                <div class="info-row"><span class="info-label">Messages</span><span>{{ doc()!.chatMessageCount }}</span></div>
              </div>
            </div>

            @if (doc()!.extractedText) {
              <div class="text-card glass-card">
                <div class="text-card-header">
                  <h3>Extracted Text Preview</h3>
                  <span class="text-muted text-xs">{{ doc()!.extractedText!.length | number }} characters</span>
                </div>
                <div class="text-preview">{{ doc()!.extractedText!.substring(0, 3000) }}{{ (doc()!.extractedText!.length > 3000) ? '...' : '' }}</div>
              </div>
            }
          </div>
        } @else {
          <div class="loading">
            <div class="skeleton" style="height: 32px; width: 300px; margin-bottom: 24px;"></div>
            <div class="skeleton" style="height: 200px; width: 100%;"></div>
          </div>
        }
      </main>
    </div>
  `,
  styles: [`
    .layout { display: flex; min-height: 100vh; }
    .main-content { flex: 1; margin-left: 260px; padding: 32px; }

    .page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 24px; }
    .page-title { font-size: 24px; font-weight: 700; letter-spacing: -0.5px; }
    .back-link {
      display: inline-flex; align-items: center; gap: 6px;
      font-size: 13px; color: var(--text-secondary); margin-bottom: 8px;
      &:hover { color: var(--accent); }
    }

    .header-actions { display: flex; gap: 8px; align-items: center; }

    .detail-grid { display: grid; grid-template-columns: 1fr 2fr; gap: 20px; }

    .info-card, .text-card {
      padding: 24px;
      h3 { font-size: 14px; font-weight: 600; margin-bottom: 16px; }
    }

    .text-card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; h3 { margin-bottom: 0; } }

    .info-list { display: flex; flex-direction: column; gap: 12px; }
    .info-row {
      display: flex; align-items: center; justify-content: space-between;
      font-size: 13px;
    }
    .info-label { color: var(--text-muted); }

    .type-badge {
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.5px;
      background: rgba(99, 102, 241, 0.1);
      color: var(--accent);
    }

    .text-preview {
      font-size: 12px; line-height: 1.7; color: var(--text-secondary);
      max-height: 500px; overflow-y: auto;
      white-space: pre-wrap; word-break: break-word;
      padding: 16px;
      background: var(--bg-primary);
      border-radius: var(--radius-sm);
      border: 1px solid var(--border);
    }

    .loading { padding: 20px; }

    @media (max-width: 1024px) {
      .detail-grid { grid-template-columns: 1fr; }
    }

    @media (max-width: 768px) {
      .main-content { margin-left: 0; }
      .page-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
      }
      .page-title {
        font-size: 18px;
        word-break: break-word;
        overflow-wrap: break-word;
      }
      .header-actions {
        flex-wrap: wrap;
        width: 100%;
        gap: 6px;
        .btn { flex: 1; min-width: 0; justify-content: center; font-size: 12px; }
      }
      .detail-grid { grid-template-columns: 1fr; gap: 12px; }
      .info-card, .text-card { padding: 16px; }
      .info-row { font-size: 12px; }
      .text-preview { font-size: 11px; max-height: 300px; }
    }
  `],
})
export class DocumentDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private apiService = inject(ApiService);

  doc = signal<DocumentDetail | null>(null);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.apiService.getDocument(id).subscribe({
        next: (doc) => this.doc.set(doc),
      });
    }
  }

  viewOriginal() {
    if (!this.doc()) return;
    this.apiService.downloadDocument(this.doc()!.id).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
      },
    });
  }

  downloadOriginal() {
    if (!this.doc()) return;
    this.apiService.downloadDocument(this.doc()!.id).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = this.doc()!.fileName;
        a.click();
        URL.revokeObjectURL(url);
      },
    });
  }

  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  getFileExtLabel(contentType: string): string {
    const map: Record<string, string> = {
      'application/pdf': 'PDF',
      'text/plain': 'TXT',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PPTX',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLSX',
    };
    return map[contentType] || 'FILE';
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Ready': return 'badge-success';
      case 'Processing': return 'badge-warning';
      case 'Failed': return 'badge-error';
      default: return 'badge-info';
    }
  }
}
