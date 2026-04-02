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

    const payload = JSON.parse(atob(token.split('.')[1]));
    const expiry = payload['exp'];
    const now = Math.floor(Date.now() / 1000);

    return expiry > now;
  }

  login(identifier: string, password: string) {
    return this.http.post<{ token: string }>(
      `${environment.apiUrl}/auth/login`,
      { identifier, password }
    ).pipe(
      tap(res => {
        localStorage.setItem('token', res.token);
        this.isLoggedIn$.next(true);
      })
    );
  }

  logout() {
    localStorage.removeItem('token');
    this.isLoggedIn$.next(false);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isAuthenticated() {
    return this.isLoggedIn$.asObservable();
  }

  getRole(): string | null {
    const token = this.getToken();
    if (!token) return null;
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ?? null;
  }

  getUserId(): string | null {
    const token = this.getToken();
    if (!token) return null;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      // A .NET általában a 'nameidentifier' kulcs alatt küldi az ID-t
      return payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] 
          || payload['nameid'] 
          || payload['sub'] 
          || null;
    } catch (e) {
      return null;
    }
  }
}
