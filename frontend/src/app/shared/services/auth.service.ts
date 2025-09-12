// src/app/core/services/auth.service.ts
import {inject, Injectable} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { map, Observable } from 'rxjs';
import { TokenService } from './token.service';
import {Router} from '@angular/router';

export interface LoginRequest { email: string; password: string; }
export interface RegisterRequest { email: string; password: string; zipCode: string; displayName?: string; }
export interface AuthResponse { token: string; userId: number; email: string; displayName?: string; roles?: string[]; }
const KEY = 'auth_token';

@Injectable({ providedIn: 'root' })


export class AuthService {
  private key = 'auth_token';

  get token(): string | null {
    return localStorage.getItem(this.key);
  }

  set token(value: string | null) {
    if (value) localStorage.setItem(this.key, value);
    else localStorage.removeItem(this.key);
  }
  setToken(token: string | null) {
    if (!token) {
      localStorage.removeItem(KEY);
    } else {
      localStorage.setItem(KEY, token);
    }
  }

  isAuthenticated(): boolean {
    const t = this.token;
    if (!t) return false;

    try {
      const payload = JSON.parse(atob(t.split('.')[1]));
      const expSec = Number(payload?.exp);
      if (!expSec) return true;
      const nowSec = Math.floor(Date.now() / 1000);
      return expSec > nowSec;
    } catch {
      return false;
    }
  }



  private base = `${environment.apiUrl}/auth`;

  constructor(private http: HttpClient, private tokens: TokenService) {}

  login(req: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.base}/login`, req)
      .pipe(map(res => { this.tokens.set(res.token); return res; }));
  }


  register(req: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.base}/register`, req).pipe(
      map(res => {
        this.tokens.set(res.token);
        return res;
      })
    );
  }
  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    this.tokens.clear();

  }


}
