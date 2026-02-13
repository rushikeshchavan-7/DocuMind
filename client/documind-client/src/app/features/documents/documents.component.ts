import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { ApiService, DocumentDto } from '../../core/services/api.service';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-documents',
  imports: [RouterLink, SidebarComponent, DatePipe],
  template: `
    <div class="layout">
      <app-sidebar />
      <main class="main-content">
        <div class="page-header animate-fade-in">
          <div>
            <h1 class="page-title">Documents</h1>
            <p class="page-subtitle">Manage and analyze your documents with AI</p>
          </div>
          <button class="btn btn-primary" (click)="triggerUpload()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            Upload Document
          </button>
          <input #fileInput type="file" accept=".pdf,.txt,.docx,.pptx,.ppt,.xlsx,.xls" hidden (change)="onFileSelected($event)">
        </div>

        <!-- Upload Area -->
        <div class="upload-zone glass-card animate-fade-in"
             (dragover)="onDragOver($event)"
             (dragleave)="isDragging.set(false)"
             (drop)="onDrop($event)"
             [class.dragging]="isDragging()">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          <p class="upload-text">Drag and drop your document here, or <span class="upload-link" (click)="triggerUpload()">browse</span></p>
          <p class="upload-hint">Supports PDF, TXT, DOCX, PPTX, XLSX · Max 50MB · AES-256 Encrypted</p>
        </div>

        @if (uploading()) {
          <div class="upload-progress glass-card animate-fade-in">
            <div class="progress-info">
              <span class="font-medium">Uploading & Processing...</span>
              <span class="text-muted text-sm">Extracting text and generating AI embeddings</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill"></div>
            </div>
          </div>
        }

        <!-- Documents Grid -->
        @if (documents().length) {
          <div class="docs-grid">
            @for (doc of documents(); track doc.id) {
              <div class="doc-card glass-card animate-fade-in">
                <div class="doc-card-header">
                  <div class="doc-type-icon" [class]="getTypeIconClass(doc.contentType)">
                    <span class="type-label">{{ getFileExtLabel(doc.contentType) }}</span>
                  </div>
                  <span class="badge" [class]="getStatusClass(doc.status)">
                    <span class="dot" [class]="getStatusDotClass(doc.status)"></span>
                    {{ doc.status }}
                  </span>
                </div>
                <h3 class="doc-card-title">{{ doc.fileName }}</h3>
                <div class="doc-card-meta">
                  <span>{{ formatBytes(doc.fileSize) }}</span>
                  <span>·</span>
                  <span>{{ doc.uploadedAt | date:'MMM d' }}</span>
                  @if (doc.pageCount) {
                    <span>·</span>
                    <span>{{ doc.pageCount }} pages</span>
                  }
                </div>
                <div class="doc-card-actions">
                  @if (doc.status === 'Ready') {
                    <a [routerLink]="['/chat', doc.id]" class="btn btn-primary btn-sm">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                      Chat with AI
                    </a>
                  }
                  <button class="btn btn-secondary btn-sm" (click)="viewDocument(doc)">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    View
                  </button>
                  <button class="btn btn-ghost btn-sm" (click)="downloadDoc(doc)">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  </button>
                  <button class="btn btn-danger btn-sm" (click)="deleteDoc(doc.id)">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                  </button>
                </div>
              </div>
            }
          </div>
        } @else if (!uploading()) {
          <div class="empty-state glass-card animate-fade-in">
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="1.2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
            <h3>No documents uploaded</h3>
            <p class="text-muted text-sm">Upload your first document to start chatting with AI</p>
          </div>
        }
      </main>
    </div>
  `,
  styles: [`
    .layout { display: flex; min-height: 100vh; }
    .main-content { flex: 1; margin-left: 260px; padding: 32px; }

    .page-header {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 24px;
    }
    .page-title { font-size: 28px; font-weight: 700; letter-spacing: -0.5px; margin-bottom: 4px; }
    .page-subtitle { color: var(--text-secondary); font-size: 14px; }

    .upload-zone {
      padding: 40px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      text-align: center;
      border: 2px dashed var(--border);
      background: transparent;
      margin-bottom: 24px;
      cursor: pointer;
      transition: var(--transition);

      &:hover, &.dragging {
        border-color: var(--accent);
        background: rgba(99, 102, 241, 0.03);
      }
    }

    .upload-text { font-size: 14px; color: var(--text-secondary); }
    .upload-link { color: var(--accent); font-weight: 600; cursor: pointer; &:hover { text-decoration: underline; } }
    .upload-hint { font-size: 12px; color: var(--text-muted); }

    .upload-progress {
      padding: 16px 20px;
      margin-bottom: 24px;
    }
    .progress-info { display: flex; justify-content: space-between; margin-bottom: 10px; }
    .progress-bar { height: 4px; background: var(--bg-tertiary); border-radius: 2px; overflow: hidden; }
    .progress-fill {
      height: 100%;
      width: 60%;
      background: var(--accent-gradient);
      border-radius: 2px;
      animation: progress 2s ease-in-out infinite;
    }
    @keyframes progress {
      0% { width: 0%; }
      50% { width: 80%; }
      100% { width: 100%; }
    }

    .docs-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 16px;
    }

    .doc-card {
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .doc-card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .doc-type-icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.5px;
      text-transform: uppercase;

      &.type-pdf { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
      &.type-txt { background: rgba(107, 114, 128, 0.1); color: #6b7280; }
      &.type-docx { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
      &.type-pptx { background: rgba(249, 115, 22, 0.1); color: #f97316; }
      &.type-xlsx { background: rgba(34, 197, 94, 0.1); color: #22c55e; }
      &.type-default { background: rgba(99, 102, 241, 0.1); color: var(--accent); }
    }

    .doc-card-title {
      font-size: 14px;
      font-weight: 600;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .doc-card-meta {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: var(--text-muted);
    }

    .doc-card-actions {
      display: flex;
      gap: 8px;
      margin-top: 4px;
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
  `],
})
export class DocumentsComponent implements OnInit {
  private apiService = inject(ApiService);

  documents = signal<DocumentDto[]>([]);
  uploading = signal(false);
  isDragging = signal(false);

  ngOnInit() {
    this.loadDocuments();
  }

  loadDocuments() {
    this.apiService.getDocuments().subscribe({
      next: (docs) => this.documents.set(docs),
      error: () => this.documents.set([]),
    });
  }

  triggerUpload() {
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    input?.click();
  }

  onFileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) this.uploadFile(file);
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragging.set(true);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragging.set(false);
    const file = event.dataTransfer?.files[0];
    if (file) this.uploadFile(file);
  }

  uploadFile(file: File) {
    this.uploading.set(true);
    this.apiService.uploadDocument(file).subscribe({
      next: () => {
        this.uploading.set(false);
        this.loadDocuments();
      },
      error: () => this.uploading.set(false),
    });
  }

  viewDocument(doc: DocumentDto) {
    this.apiService.downloadDocument(doc.id).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
      },
    });
  }

  downloadDoc(doc: DocumentDto) {
    this.apiService.downloadDocument(doc.id).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = doc.fileName;
        a.click();
        URL.revokeObjectURL(url);
      },
    });
  }

  deleteDoc(id: string) {
    if (confirm('Are you sure you want to delete this document?')) {
      this.apiService.deleteDocument(id).subscribe(() => this.loadDocuments());
    }
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
      'application/vnd.ms-excel': 'XLS',
      'application/vnd.ms-powerpoint': 'PPT',
    };
    return map[contentType] || 'FILE';
  }

  getTypeIconClass(contentType: string): string {
    const map: Record<string, string> = {
      'application/pdf': 'type-pdf',
      'text/plain': 'type-txt',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'type-docx',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'type-pptx',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'type-xlsx',
      'application/vnd.ms-excel': 'type-xlsx',
      'application/vnd.ms-powerpoint': 'type-pptx',
    };
    return map[contentType] || 'type-default';
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
