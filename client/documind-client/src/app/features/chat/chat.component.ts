import { Component, inject, OnInit, signal, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { ApiService, ChatMessage, ChatSession, DocumentDetail } from '../../core/services/api.service';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-chat',
  imports: [RouterLink, FormsModule, SidebarComponent, DatePipe],
  template: `
    <div class="layout">
      <app-sidebar />

      <!-- Sessions Panel -->
      <aside class="sessions-panel">
        <div class="sessions-header">
          <h3>Chat Sessions</h3>
          <button class="btn-icon-sm" (click)="createNewSession()" title="New Chat">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </button>
        </div>

        <div class="sessions-list">
          @if (!sessions().length) {
            <div class="sessions-empty">
              <p class="text-muted text-xs">No chat sessions yet. Send a message to start.</p>
            </div>
          }
          @for (session of sessions(); track session.id) {
            <div class="session-item"
                 [class.active]="activeSessionId() === session.id"
                 (click)="switchSession(session)">
              <div class="session-info">
                <span class="session-title">{{ session.title }}</span>
                <span class="session-meta text-xs text-muted">
                  {{ session.messageCount }} messages · {{ session.updatedAt | date:'MMM d' }}
                </span>
              </div>
              <button class="session-delete" (click)="deleteSession(session.id, $event)" title="Delete">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              </button>
            </div>
          }
        </div>

        <div class="sessions-footer">
          <a [routerLink]="['/documents', documentId]" class="btn btn-ghost btn-sm" style="width:100%; justify-content:center;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            View Document
          </a>
        </div>
      </aside>

      <main class="chat-main">
        <!-- Chat Header -->
        <div class="chat-header">
          <div class="chat-header-left">
            <a routerLink="/documents" class="btn btn-ghost btn-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
            </a>
            <div class="chat-doc-info">
              <h2 class="chat-title">{{ doc()?.fileName ?? 'Document Chat' }}</h2>
              <span class="chat-subtitle text-muted text-sm">
                @if (activeSessionId()) {
                  Session: {{ getActiveSessionTitle() }}
                } @else {
                  Start a new conversation
                }
              </span>
            </div>
          </div>
          <div class="chat-header-right">
            <span class="badge badge-success">
              <span class="dot dot-success"></span>
              AI Ready
            </span>
          </div>
        </div>

        <!-- Messages -->
        <div class="chat-messages" #messagesContainer>
          @if (!messages().length && !sending()) {
            <div class="chat-welcome animate-fade-in">
              <div class="welcome-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="1.5">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z"/>
                  <path d="M2 17L12 22L22 17"/>
                  <path d="M2 12L12 17L22 12"/>
                </svg>
              </div>
              <h3>Chat with your document</h3>
              <p class="text-muted">Ask anything about <strong>{{ doc()?.fileName }}</strong>. The AI will analyze the content and provide accurate answers.</p>
              <div class="suggestions">
                <button type="button" class="suggestion-chip" (click)="askSuggestion('Summarize this document')">Summarize this document</button>
                <button type="button" class="suggestion-chip" (click)="askSuggestion('What are the key points?')">What are the key points?</button>
                <button type="button" class="suggestion-chip" (click)="askSuggestion('Explain the main topic')">Explain the main topic</button>
              </div>
            </div>
          }

          @for (msg of messages(); track msg.id) {
            <div class="message animate-fade-in" [class.user]="msg.role === 'user'" [class.assistant]="msg.role === 'assistant'">
              <div class="message-avatar" [class.user-avatar]="msg.role === 'user'" [class.ai-avatar]="msg.role === 'assistant'">
                @if (msg.role === 'user') { U } @else {
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7L12 12L22 7L12 2Z"/><path d="M2 17L12 22L22 17"/><path d="M2 12L12 17L22 12"/></svg>
                }
              </div>
              <div class="message-content">
                <div class="message-header">
                  <span class="message-role">{{ msg.role === 'user' ? 'You' : 'DocuMind AI' }}</span>
                  <span class="message-time text-muted text-xs">{{ msg.timestamp | date:'h:mm a' }}</span>
                </div>
                <div class="message-text">{{ msg.content }}</div>
              </div>
            </div>
          }

          @if (sending()) {
            <div class="message assistant animate-fade-in">
              <div class="message-avatar ai-avatar">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7L12 12L22 7L12 2Z"/><path d="M2 17L12 22L22 17"/><path d="M2 12L12 17L22 12"/></svg>
              </div>
              <div class="message-content">
                <div class="message-header">
                  <span class="message-role">DocuMind AI</span>
                </div>
                <div class="typing-indicator">
                  <span></span><span></span><span></span>
                </div>
              </div>
            </div>
          }
        </div>

        <!-- Input -->
        <div class="chat-input-container">
          <form (ngSubmit)="sendMessage()" class="chat-input-form">
            <input
              class="chat-input"
              [(ngModel)]="newMessage"
              name="message"
              placeholder="Ask anything about your document..."
              [disabled]="sending()"
              autocomplete="off"
            >
            <button type="submit" class="btn btn-primary send-btn" [disabled]="!newMessage.trim() || sending()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </button>
          </form>
          <p class="input-hint text-xs text-muted">Powered by Ollama · Your data never leaves your machine</p>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .layout { display: flex; height: 100vh; overflow: hidden; }

    /* --- Sessions Panel --- */
    .sessions-panel {
      width: 260px;
      margin-left: 260px;
      border-right: 1px solid var(--border);
      background: var(--bg-secondary);
      display: flex;
      flex-direction: column;
      flex-shrink: 0;
    }

    .sessions-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px;
      border-bottom: 1px solid var(--border);
      h3 { font-size: 13px; font-weight: 600; }
    }

    .btn-icon-sm {
      width: 28px;
      height: 28px;
      border-radius: 6px;
      border: 1px solid var(--border);
      background: var(--bg-primary);
      color: var(--text-secondary);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: var(--transition);
      &:hover { border-color: var(--accent); color: var(--accent); }
    }

    .sessions-list {
      flex: 1;
      overflow-y: auto;
      padding: 8px;
    }

    .sessions-empty {
      padding: 20px 12px;
      text-align: center;
    }

    .session-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 12px;
      border-radius: 8px;
      cursor: pointer;
      transition: var(--transition);
      margin-bottom: 2px;

      &:hover { background: var(--bg-tertiary); }
      &.active {
        background: rgba(99, 102, 241, 0.08);
        border: 1px solid rgba(99, 102, 241, 0.2);
      }
    }

    .session-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
      flex: 1;
    }

    .session-title {
      font-size: 12px;
      font-weight: 500;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .session-meta { font-size: 11px; }

    .session-delete {
      width: 24px;
      height: 24px;
      border-radius: 4px;
      border: none;
      background: transparent;
      color: var(--text-muted);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: var(--transition);
      flex-shrink: 0;

      .session-item:hover & { opacity: 1; }
      &:hover { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
    }

    .sessions-footer {
      padding: 12px;
      border-top: 1px solid var(--border);
    }

    /* --- Chat Main --- */
    .chat-main {
      flex: 1;
      display: flex;
      flex-direction: column;
      height: 100vh;
      min-width: 0;
    }

    .chat-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 24px;
      border-bottom: 1px solid var(--border);
      background: var(--bg-secondary);
    }

    .chat-header-left { display: flex; align-items: center; gap: 12px; }
    .chat-title { font-size: 16px; font-weight: 600; }
    .chat-subtitle { display: block; }

    .chat-messages {
      flex: 1;
      overflow-y: auto;
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .chat-welcome {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 60px 20px;
      gap: 16px;
      flex: 1;

      .welcome-icon {
        width: 80px;
        height: 80px;
        border-radius: 20px;
        background: rgba(99, 102, 241, 0.1);
        display: flex;
        align-items: center;
        justify-content: center;
      }

      h3 { font-size: 20px; font-weight: 700; }
      p { max-width: 400px; font-size: 14px; line-height: 1.6; }
    }

    .suggestions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 8px;
      justify-content: center;
    }

    .suggestion-chip {
      padding: 8px 16px;
      border-radius: 20px;
      background: var(--bg-secondary);
      border: 1px solid var(--border);
      color: var(--text-secondary);
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      transition: var(--transition);
      font-family: inherit;
      &:hover {
        border-color: var(--accent);
        color: var(--accent);
        background: rgba(99, 102, 241, 0.05);
      }
    }

    .message {
      display: flex;
      gap: 12px;
      max-width: 80%;

      &.user { margin-left: auto; flex-direction: row-reverse; }
    }

    .message-avatar {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 600;
      flex-shrink: 0;

      &.user-avatar {
        background: var(--bg-tertiary);
        color: var(--text-secondary);
      }

      &.ai-avatar {
        background: rgba(99, 102, 241, 0.1);
        color: var(--accent);
      }
    }

    .message-content { min-width: 0; }

    .message-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 4px;
    }

    .message-role { font-size: 12px; font-weight: 600; }

    .message-text {
      font-size: 13px;
      line-height: 1.7;
      color: var(--text-primary);
      padding: 12px 16px;
      border-radius: var(--radius-md);
      white-space: pre-wrap;
      word-break: break-word;

      .user & {
        background: var(--accent);
        color: white;
        border-bottom-right-radius: 4px;
      }

      .assistant & {
        background: var(--bg-secondary);
        border: 1px solid var(--border);
        border-bottom-left-radius: 4px;
      }
    }

    .typing-indicator {
      display: flex;
      gap: 4px;
      padding: 16px;
      background: var(--bg-secondary);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      border-bottom-left-radius: 4px;

      span {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: var(--text-muted);
        animation: bounce 1.4s infinite ease-in-out both;

        &:nth-child(1) { animation-delay: -0.32s; }
        &:nth-child(2) { animation-delay: -0.16s; }
      }
    }

    @keyframes bounce {
      0%, 80%, 100% { transform: scale(0); }
      40% { transform: scale(1); }
    }

    .chat-input-container {
      padding: 16px 24px 12px;
      border-top: 1px solid var(--border);
      background: var(--bg-secondary);
    }

    .chat-input-form {
      display: flex;
      gap: 8px;
    }

    .chat-input {
      flex: 1;
      padding: 12px 16px;
      background: var(--bg-primary);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      color: var(--text-primary);
      font-family: inherit;
      font-size: 13px;
      outline: none;
      transition: var(--transition);

      &:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1); }
      &::placeholder { color: var(--text-muted); }
    }

    .send-btn {
      width: 44px;
      height: 44px;
      padding: 0;
      border-radius: var(--radius-md);
      flex-shrink: 0;
    }

    .input-hint {
      text-align: center;
      margin-top: 8px;
    }

    /* Mobile */
    @media (max-width: 768px) {
      .sessions-panel {
        display: none;
        position: fixed;
        left: 0;
        top: 0;
        height: 100vh;
        z-index: 130;
        margin-left: 0;
        width: 260px;

        &.show-mobile {
          display: flex;
        }
      }

      .chat-main {
        margin-left: 0;
      }

      .chat-header {
        padding: 12px 16px;
      }

      .chat-messages {
        padding: 16px;
      }

      .chat-input-container {
        padding: 12px 16px 8px;
      }

      .message {
        max-width: 95%;
      }

      .chat-welcome {
        padding: 30px 16px;
      }

      .suggestions {
        flex-direction: column;
        align-items: center;
      }
    }
  `],
})
export class ChatComponent implements OnInit, AfterViewChecked {
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef<HTMLDivElement>;

  private route = inject(ActivatedRoute);
  private apiService = inject(ApiService);

  documentId = '';
  doc = signal<DocumentDetail | null>(null);
  sessions = signal<ChatSession[]>([]);
  activeSessionId = signal<string | null>(null);
  messages = signal<ChatMessage[]>([]);
  sending = signal(false);
  newMessage = '';
  private shouldScroll = false;

  ngOnInit() {
    this.documentId = this.route.snapshot.paramMap.get('documentId') || '';
    if (this.documentId) {
      this.apiService.getDocument(this.documentId).subscribe({
        next: (doc) => this.doc.set(doc),
      });
      this.loadSessions();
    }
  }

  ngAfterViewChecked() {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  loadSessions() {
    this.apiService.getChatSessions(this.documentId).subscribe({
      next: (sessions) => {
        this.sessions.set(sessions);
        // Auto-select first session if none active
        if (sessions.length && !this.activeSessionId()) {
          this.switchSession(sessions[0]);
        }
      },
    });
  }

  switchSession(session: ChatSession) {
    this.activeSessionId.set(session.id);
    this.apiService.getChatHistory(session.id).subscribe({
      next: (msgs) => {
        this.messages.set(msgs);
        this.shouldScroll = true;
      },
    });
  }

  createNewSession() {
    this.activeSessionId.set(null);
    this.messages.set([]);
  }

  deleteSession(sessionId: string, event: Event) {
    event.stopPropagation();
    if (!confirm('Delete this chat session and all its messages?')) return;

    this.apiService.deleteChatSession(sessionId).subscribe({
      next: () => {
        if (this.activeSessionId() === sessionId) {
          this.activeSessionId.set(null);
          this.messages.set([]);
        }
        this.loadSessions();
      },
    });
  }

  getActiveSessionTitle(): string {
    const session = this.sessions().find(s => s.id === this.activeSessionId());
    return session?.title || 'New Chat';
  }

  sendMessage() {
    const message = this.newMessage.trim();
    if (!message || !this.doc()) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    };

    this.messages.update(msgs => [...msgs, userMsg]);
    this.newMessage = '';
    this.sending.set(true);
    this.shouldScroll = true;

    const sessionId = this.activeSessionId() || undefined;

    this.apiService.sendMessage(this.doc()!.id, message, sessionId).subscribe({
      next: (res) => {
        // If this was a new session (no active), set the returned session as active
        if (!this.activeSessionId() && res.sessionId) {
          this.activeSessionId.set(res.sessionId);
        }

        const aiMsg: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: res.response,
          timestamp: res.timestamp,
        };
        this.messages.update(msgs => [...msgs, aiMsg]);
        this.sending.set(false);
        this.shouldScroll = true;
        // Refresh sessions list to show the new/updated session
        this.loadSessions();
      },
      error: () => {
        const errorMsg: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: 'Sorry, I encountered an error processing your request. Please try again.',
          timestamp: new Date().toISOString(),
        };
        this.messages.update(msgs => [...msgs, errorMsg]);
        this.sending.set(false);
        this.shouldScroll = true;
      },
    });
  }

  askSuggestion(question: string) {
    this.newMessage = question;
    this.sendMessage();
  }

  private scrollToBottom() {
    try {
      const el = this.messagesContainer?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    } catch {}
  }
}
