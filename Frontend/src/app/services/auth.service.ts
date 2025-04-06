import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/api';
  private tokenSubject: BehaviorSubject<string | null>;
  private isBrowser: boolean;
  
  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    const token = this.isBrowser ? localStorage.getItem('token') : null;
    this.tokenSubject = new BehaviorSubject<string | null>(token);
  }

  login(username: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/auth/login`, { username, password })
      .pipe(
        tap(response => {
          if (response && response.token) {
            if (this.isBrowser) {
              localStorage.setItem('token', response.token);
              localStorage.setItem('usuario', JSON.stringify(response.usuario));
            }
            this.tokenSubject.next(response.token);
          }
        })
      );
  }

  logout(): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/auth/logout`, {})
      .pipe(
        tap(() => {
          if (this.isBrowser) {
            localStorage.removeItem('token');
            localStorage.removeItem('usuario');
          }
          this.tokenSubject.next(null);
        })
      );
  }

  getToken(): string | null {
    return this.tokenSubject.value;
  }

  isAuthenticated(): boolean {
    return !!this.tokenSubject.value;
  }

  getUserData(): any {
    if (!this.isBrowser) return null;
    const userData = localStorage.getItem('usuario');
    return userData ? JSON.parse(userData) : null;
  }
}