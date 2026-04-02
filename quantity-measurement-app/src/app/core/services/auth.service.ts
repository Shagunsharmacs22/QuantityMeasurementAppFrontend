import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private base = environment.authUrl;

  constructor(private http: HttpClient, private router: Router) {}

  register(payload: { name: string; email: string; password: string; provider: string }) {
    return this.http.post<{ token: string }>(`${this.base}/register`, payload);
  }

  login(payload: { email: string; password: string }) {
    return this.http.post<{ token: string }>(`${this.base}/login`, payload);
  }

  googleLogin() {
    window.location.href = `${this.base}/google`;
  }

  saveToken(token: string) {
  if (typeof window !== 'undefined')
    localStorage.setItem('token', token);
}

  logout() {
    localStorage.clear();
    this.router.navigate(['/auth']);
  }

  isLoggedIn(): boolean {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem('token');
  }
  getUserInfo(): { name: string; email: string } | null {
      if (typeof window === 'undefined') return null;
  const token = localStorage.getItem('token');
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return { name: payload.name || payload.sub || '', email: payload.email || '' };
  } catch {
    return null;
  }
}
}