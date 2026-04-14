import { Component, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthService } from './core/services/auth-service';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  standalone: false,
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('DepotMap.Frontend');
  isLoggedIn$: Observable<boolean>;

  isSidebarCollapsed = false;

  constructor(private authService: AuthService) {
    this.authService.refreshAuthState();
    this.isLoggedIn$ = this.authService.isAuthenticated();
  }

  onSidebarCollapsedChange(collapsed: boolean): void {
    this.isSidebarCollapsed = collapsed;
  }
}
