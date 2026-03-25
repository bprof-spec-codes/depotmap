import { Component } from '@angular/core';
import { AuthService } from '../../../core/services/auth-service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-navbar-component',
  standalone: false,
  templateUrl: './navbar-component.html',
  styleUrl: './navbar-component.scss',
})
export class NavbarComponent {
  isLoggedIn$!: Observable<boolean>;

  navItems: NavItem[] = [
    new NavItem('Készlet', '/inventory'),
    new NavItem('Raktár', '/warehouse'),
    new NavItem('Termékek', '/products'),
    new NavItem('Beszerzések', '/procurement'),
    new NavItem('Rendelések', '/orders'),
    new NavItem('Mozgatások', '/movements'),
    new NavItem('Felhasználók', '/users'),
  ];

  constructor(private authService: AuthService) {
    this.isLoggedIn$ = this.authService.isAuthenticated();
  }
}

export class NavItem {
  label: string;
  route: string;

  constructor(label: string, route: string) {
    this.label = label;
    this.route = route;
  }
}
