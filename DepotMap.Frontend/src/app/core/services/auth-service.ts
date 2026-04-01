import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment.development';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private isLoggedIn$ = new BehaviorSubject<boolean>(this.isTokenValid());

  constructor(private http: HttpClient, private router: Router) { }

  private isTokenValid(): boolean {
    const token = this.getToken();
    if (!token) return false;

    try{
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiry = payload['exp'];
      const now = Math.floor(Date.now() / 1000);
      return expiry > now;
    }
    catch{
      return false
    }
  }

  login(identifier: string, password: string) {
    return this.http.post<{ token: string }>(
      `${environment.apiUrl}/auth/login`,
      { identifier, password }
    ).pipe(
      tap(res => {
        this.setToken(res.token)
        this.isLoggedIn$.next(true);
      })
    );
  }

  logout() {
    this.clearToken();
    this.isLoggedIn$.next(false);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  setToken(token: string): void {
    localStorage.setItem('token', token);
  }

  clearToken(): void {
    localStorage.removeItem('token');
  }

  isAuthenticated() {
    return this.isLoggedIn$.asObservable();
  }

  getRole(): string | null {
    const token = this.getToken();
    if (!token) return null;

    try{
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ?? null;
    }
    catch{
      return null;
    }

  }
}
