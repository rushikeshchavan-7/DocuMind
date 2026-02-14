import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface DashboardData {
  totalDocuments: number;
  processedDocuments: number;
  totalChats: number;
  totalStorageUsed: number;
  recentActivity: { action: string; description: string; timestamp: string }[];
  recentDocuments: { id: string; fileName: string; status: string; uploadedAt: string }[];
}

export interface DocumentDto {
  id: string;
  fileName: string;
  contentType: string;
  fileSize: number;
  status: string;
  pageCount: number;
  uploadedAt: string;
  processedAt: string | null;
  chatMessageCount: number;
}

export interface DocumentDetail extends DocumentDto {
  extractedText: string | null;
  recentMessages: ChatMessage[];
}

export interface ChatMessage {
  id: string;
  role: string;
  content: string;
  timestamp: string;
}

export interface ChatResponse {
  response: string;
  sources: string[];
  timestamp: string;
  sessionId: string;
}

export interface ChatSession {
  id: string;
  title: string;
  documentId: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
}

export interface SearchResult {
  documentId: string;
  documentName: string;
  contentType: string;
  snippet: string;
  score: number;
}

export interface AnalyticsData {
  totalDocuments: number;
  processedDocuments: number;
  failedDocuments: number;
  totalChatSessions: number;
  totalMessages: number;
  totalStorageUsed: number;
  documentsByType: { type: string; count: number; color: string }[];
  documentsByStatus: { status: string; count: number }[];
  chatActivity: { date: string; messages: number; documents: number }[];
  recentSessions: { id: string; title: string; documentName: string; messageCount: number; updatedAt: string }[];
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly api = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Dashboard
  getDashboard(): Observable<DashboardData> {
    return this.http.get<DashboardData>(`${this.api}/dashboard`);
  }

  // Analytics
  getAnalytics(): Observable<AnalyticsData> {
    return this.http.get<AnalyticsData>(`${this.api}/dashboard/analytics`);
  }

  // Documents
  getDocuments(): Observable<DocumentDto[]> {
    return this.http.get<DocumentDto[]>(`${this.api}/documents`);
  }

  getDocument(id: string): Observable<DocumentDetail> {
    return this.http.get<DocumentDetail>(`${this.api}/documents/${id}`);
  }

  uploadDocument(file: File): Observable<DocumentDto> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<DocumentDto>(`${this.api}/documents/upload`, formData);
  }

  deleteDocument(id: string): Observable<void> {
    return this.http.delete<void>(`${this.api}/documents/${id}`);
  }

  reprocessDocument(id: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.api}/documents/${id}/reprocess`, {});
  }

  getDocumentDownloadUrl(id: string): string {
    return `${this.api}/documents/${id}/download`;
  }

  downloadDocument(id: string): Observable<Blob> {
    return this.http.get(`${this.api}/documents/${id}/download`, { responseType: 'blob' });
  }

  // Search
  smartSearch(query: string): Observable<SearchResult[]> {
    return this.http.post<SearchResult[]>(`${this.api}/search`, { query });
  }

  // Chat
  sendMessage(documentId: string, message: string, sessionId?: string): Observable<ChatResponse> {
    return this.http.post<ChatResponse>(`${this.api}/chat`, { documentId, message, sessionId });
  }

  getChatHistory(sessionId: string): Observable<ChatMessage[]> {
    return this.http.get<ChatMessage[]>(`${this.api}/chat/${sessionId}/history`);
  }

  // Chat Sessions
  getChatSessions(documentId: string): Observable<ChatSession[]> {
    return this.http.get<ChatSession[]>(`${this.api}/chat/sessions/${documentId}`);
  }

  createChatSession(documentId: string, title?: string): Observable<ChatSession> {
    return this.http.post<ChatSession>(`${this.api}/chat/sessions`, { documentId, title });
  }

  deleteChatSession(sessionId: string): Observable<void> {
    return this.http.delete<void>(`${this.api}/chat/sessions/${sessionId}`);
  }
}
