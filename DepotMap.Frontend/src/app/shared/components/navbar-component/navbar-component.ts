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
    new NavItem('Inventory',   '/inventory'),
    new NavItem('Warehouse',   '/warehouse'),
    new NavItem('Products',    '/products'),
    new NavItem('Procurement', '/procurement'),
    new NavItem('Orders',      '/orders'),
    new NavItem('Movements',   '/movements'),
    new NavItem('Users',       '/users'),
  ];
}

export class NavItem {
  label: string;
  route: string;

  constructor(label: string, route: string) {
    this.label = label;
    this.route = route;
  }
}
