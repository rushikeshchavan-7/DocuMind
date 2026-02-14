import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { ApiService, SearchResult } from '../../core/services/api.service';

@Component({
  selector: 'app-search',
  imports: [RouterLink, FormsModule, SidebarComponent],
  template: `
    <div class="layout">
      <app-sidebar />
      <main class="main-content">
        <div class="page-header animate-fade-in">
          <div>
            <h1 class="page-title">Smart Search</h1>
            <p class="page-subtitle">AI-powered semantic search across all your documents</p>
          </div>
        </div>

        <!-- Search Bar -->
        <div class="search-bar glass-card animate-fade-in">
          <div class="search-input-wrap">
            <svg class="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input
              class="search-input"
              [(ngModel)]="query"
              name="query"
              placeholder="Search across all documents... e.g. 'revenue data', 'project timeline'"
              (keydown.enter)="search()"
              autocomplete="off"
            >
            <button class="btn btn-primary search-btn" (click)="search()" [disabled]="searching() || !query.trim()">
              @if (searching()) {
                <span class="spinner"></span>
              } @else {
                Search
              }
            </button>
          </div>
        </div>

        <!-- Results -->
        @if (hasSearched() && !searching()) {
          <div class="results-header animate-fade-in">
            <span class="results-count">{{ results().length }} result{{ results().length !== 1 ? 's' : '' }} found</span>
          </div>
        }

        @if (results().length) {
          <div class="results-list">
            @for (result of results(); track result.documentId + result.score) {
              <div class="result-card glass-card animate-fade-in">
                <div class="result-header">
                  <div class="result-doc">
                    <div class="result-type-icon" [class]="getTypeClass(result.contentType)">
                      {{ getTypeLabel(result.contentType) }}
                    </div>
                    <div class="result-doc-info">
                      <span class="result-doc-name">{{ result.documentName }}</span>
                      <span class="result-doc-type text-xs text-muted">{{ getTypeLabel(result.contentType) }} Document</span>
                    </div>
                  </div>
                  <div class="result-score">
                    <div class="score-bar">
                      <div class="score-fill" [style.width.%]="result.score"></div>
                    </div>
                    <span class="score-label">{{ result.score }}%</span>
                  </div>
                </div>
                <p class="result-snippet">{{ result.snippet }}</p>
                <div class="result-actions">
                  <a [routerLink]="['/chat', result.documentId]" class="btn btn-primary btn-sm">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    Chat with AI
                  </a>
                  <a [routerLink]="['/documents', result.documentId]" class="btn btn-secondary btn-sm">View Details</a>
                </div>
              </div>
            }
          </div>
        } @else if (hasSearched() && !searching()) {
          <div class="empty-state glass-card animate-fade-in">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <h3>No results found</h3>
            <p class="text-muted text-sm">Try different keywords or upload more documents</p>
          </div>
        } @else if (!hasSearched()) {
          <div class="empty-state glass-card animate-fade-in">
            <div class="search-hero-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="1.5">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                <path d="M11 8v6M8 11h6" stroke-opacity="0.5"/>
              </svg>
            </div>
            <h3>Semantic AI Search</h3>
            <p class="text-muted text-sm">Search by meaning, not just keywords. Our AI understands context and finds relevant information across all your documents.</p>
            <div class="search-tips">
              <button class="tip-chip" (click)="query = 'key findings and conclusions'; search()">Key findings</button>
              <button class="tip-chip" (click)="query = 'contact information'; search()">Contact info</button>
              <button class="tip-chip" (click)="query = 'financial data and numbers'; search()">Financial data</button>
            </div>
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

    .search-bar { padding: 6px; margin-bottom: 24px; }

    .search-input-wrap {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 4px 4px 4px 16px;
    }

    .search-icon { flex-shrink: 0; }

    .search-input {
      flex: 1;
      padding: 12px 0;
      background: transparent;
      border: none;
      color: var(--text-primary);
      font-family: inherit;
      font-size: 15px;
      outline: none;
      &::placeholder { color: var(--text-muted); }
    }

    .search-btn {
      padding: 10px 24px;
      flex-shrink: 0;
    }

    .spinner {
      width: 16px; height: 16px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .results-header {
      margin-bottom: 16px;
    }
    .results-count {
      font-size: 13px;
      color: var(--text-secondary);
      font-weight: 500;
    }

    .results-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .result-card { padding: 20px; }

    .result-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
    }

    .result-doc {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .result-type-icon {
      width: 36px; height: 36px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.5px;

      &.type-pdf { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
      &.type-txt { background: rgba(107, 114, 128, 0.1); color: #6b7280; }
      &.type-docx { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
      &.type-pptx { background: rgba(249, 115, 22, 0.1); color: #f97316; }
      &.type-xlsx { background: rgba(34, 197, 94, 0.1); color: #22c55e; }
      &.type-default { background: rgba(99, 102, 241, 0.1); color: var(--accent); }
    }

    .result-doc-name { font-size: 14px; font-weight: 600; display: block; }

    .result-score {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .score-bar {
      width: 60px; height: 6px;
      background: var(--bg-tertiary);
      border-radius: 3px;
      overflow: hidden;
    }
    .score-fill {
      height: 100%;
      background: var(--accent-gradient);
      border-radius: 3px;
    }
    .score-label {
      font-size: 12px;
      font-weight: 600;
      color: var(--accent);
      min-width: 40px;
      text-align: right;
    }

    .result-snippet {
      font-size: 13px;
      line-height: 1.7;
      color: var(--text-secondary);
      margin-bottom: 16px;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .result-actions {
      display: flex;
      gap: 8px;
    }

    .btn-sm { padding: 6px 12px; font-size: 12px; }

    .empty-state {
      padding: 60px 40px;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      h3 { font-size: 16px; font-weight: 600; margin-top: 8px; }
    }

    .search-hero-icon {
      width: 80px; height: 80px;
      border-radius: 20px;
      background: rgba(99, 102, 241, 0.1);
      display: flex; align-items: center; justify-content: center;
    }

    .search-tips {
      display: flex;
      gap: 8px;
      margin-top: 8px;
      flex-wrap: wrap;
      justify-content: center;
    }

    .tip-chip {
      padding: 8px 16px;
      border-radius: 20px;
      background: var(--bg-secondary);
      border: 1px solid var(--border);
      color: var(--text-secondary);
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      font-family: inherit;
      transition: var(--transition);
      &:hover { border-color: var(--accent); color: var(--accent); }
    }

    .result-doc-name {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      max-width: 200px;
    }

    @media (max-width: 768px) {
      .main-content { margin-left: 0; }
      .page-title { font-size: 20px; }
      .search-bar { padding: 4px; }
      .search-input-wrap {
        flex-direction: column;
        padding: 10px;
        gap: 8px;
      }
      .search-icon { display: none; }
      .search-input { font-size: 14px; padding: 10px 0; }
      .search-btn { width: 100%; padding: 10px; }
      .result-card { padding: 14px; }
      .result-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 10px;
      }
      .result-doc-name { max-width: 100%; }
      .result-score { align-self: flex-start; }
      .result-snippet { font-size: 12px; }
      .result-actions {
        flex-wrap: wrap;
        .btn-sm { flex: 1; min-width: 0; justify-content: center; }
      }
      .empty-state { padding: 40px 16px; }
      .search-tips { flex-direction: column; align-items: stretch; }
      .tip-chip { text-align: center; }
    }
  `],
})
export class SearchComponent {
  private apiService = inject(ApiService);

  query = '';
  results = signal<SearchResult[]>([]);
  searching = signal(false);
  hasSearched = signal(false);

  search() {
    if (!this.query.trim()) return;
    this.searching.set(true);
    this.hasSearched.set(true);

    this.apiService.smartSearch(this.query).subscribe({
      next: (results) => {
        this.results.set(results);
        this.searching.set(false);
      },
      error: () => {
        this.results.set([]);
        this.searching.set(false);
      },
    });
  }

  getTypeLabel(contentType: string): string {
    const map: Record<string, string> = {
      'application/pdf': 'PDF',
      'text/plain': 'TXT',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PPTX',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLSX',
    };
    return map[contentType] || 'FILE';
  }

  getTypeClass(contentType: string): string {
    const map: Record<string, string> = {
      'application/pdf': 'type-pdf',
      'text/plain': 'type-txt',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'type-docx',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'type-pptx',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'type-xlsx',
    };
    return map[contentType] || 'type-default';
  }
}
