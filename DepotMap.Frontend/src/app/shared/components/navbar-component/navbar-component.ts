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

  // sidebar state
  isCollapsed = false;
  profileMenuOpen = false;
  readonly appName = 'DepotMap';

  navItems: NavItem[] = [
    new NavItem('Készlet', '/inventory', 'bi-box-seam'),
    new NavItem('Raktár', '/warehouses', 'bi-building'),
    new NavItem('Termékek', '/products', 'bi-box'),
    new NavItem('Beszerzések', '/procurement', 'bi-truck'),
    new NavItem('Rendelések', '/orders', 'bi-bag-check'),
    new NavItem('Mozgatások', '/movements', 'bi-arrow-left-right'),
    new NavItem('Felhasználók', '/users', 'bi-people'),
  ];

  constructor(private authService: AuthService) {
    this.isLoggedIn$ = this.authService.isAuthenticated();
  }

  // sidebar össze/kinyitás
  toggleSidebar(): void {
    this.isCollapsed = !this.isCollapsed;
    this.profileMenuOpen = false;
  }

  // profil menü toggle
  toggleProfileMenu(): void {
    this.profileMenuOpen = !this.profileMenuOpen;
  }

  closeProfileMenu(): void {
    this.profileMenuOpen = false;
  }

  // logout
  onLogout(): void {
    this.profileMenuOpen = false;
    this.authService.logout();
  }



  // user név tokenből
  getUserDisplayName(): string {
  return 'Kiss Éva ';
}
}

// NAV ITEM MODEL
export class NavItem {
  label: string;
  route: string;
  icon: string;

  constructor(label: string, route: string, icon: string) {
    this.label = label;
    this.route = route;
    this.icon = icon;
  }
}
