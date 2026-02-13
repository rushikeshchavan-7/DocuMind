import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  expiresAt: string;
  user: User;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = environment.apiUrl;

  private currentUser = signal<User | null>(this.loadUser());
  readonly user = this.currentUser.asReadonly();
  readonly isAuthenticated = computed(() => !!this.currentUser());

  constructor(private http: HttpClient, private router: Router) {}

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, { email, password }).pipe(
      tap(res => this.handleAuth(res))
    );
  }

  register(fullName: string, email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/register`, { fullName, email, password }).pipe(
      tap(res => this.handleAuth(res))
    );
  }

  logout(): void {
    localStorage.removeItem('dm_token');
    localStorage.removeItem('dm_user');
    this.currentUser.set(null);
    this.router.navigate(['/auth']);
  }

  getToken(): string | null {
    return localStorage.getItem('dm_token');
  }

  private handleAuth(res: AuthResponse): void {
    localStorage.setItem('dm_token', res.token);
    localStorage.setItem('dm_user', JSON.stringify(res.user));
    this.currentUser.set(res.user);
  }

  private loadUser(): User | null {
    try {
      const user = localStorage.getItem('dm_user');
      return user ? JSON.parse(user) : null;
    } catch {
      return null;
    }
  }
}
