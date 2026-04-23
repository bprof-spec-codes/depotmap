import { Component, EventEmitter, Output } from '@angular/core';
import { AuthService } from '../../../core/services/auth-service';
import { map, Observable, shareReplay, startWith, filter, switchMap } from 'rxjs';
import { ProfileService } from '../../../core/services/profile-service';
import { OwnProfileModel } from '../../../models/own-profile.model';
import { Router } from '@angular/router';

@Component({
  selector: 'app-navbar-component',
  standalone: false,
  templateUrl: './navbar-component.html',
  styleUrl: './navbar-component.scss',
})
export class NavbarComponent {
  isLoggedIn$!: Observable<boolean>;
  isManager$!: Observable<boolean>;
  user$!: Observable<OwnProfileModel>;

  isCollapsed = false;
  profileMenuOpen = false;
  readonly appName = 'DepotMap';

  @Output() collapsedChange = new EventEmitter<boolean>();

  navItems: NavItem[] = [
    new NavItem('Készlet', '/inventory', 'bi-box-seam'),
    new NavItem('Raktár', '/warehouses', 'bi-building'),
    new NavItem('Termékek', '/products', 'bi-box'),
    new NavItem('Beszerzések', '/procurement', 'bi-truck'),
    new NavItem('Rendelések', '/orders', 'bi-bag-check'),
    new NavItem('Mozgatások', '/movements', 'bi-arrow-left-right'),
    new NavItem('Felhasználók', '/users', 'bi-people', true),
  ];

  constructor(
    private authService: AuthService,
    private profileService: ProfileService,
    private router: Router
  ) {
    this.isLoggedIn$ = this.authService.isAuthenticated();

    this.isManager$ = this.isLoggedIn$.pipe(
      map(() => this.authService.getRole() === 'Manager'),
      startWith(this.authService.getRole() === 'Manager')
    );

    this.user$ = this.isLoggedIn$.pipe(
      filter(loggedIn => loggedIn),
      switchMap(() => this.profileService.getOwnProfile())
    );

    this.collapsedChange.emit(this.isCollapsed);
  }

  toggleSidebar(): void {
    this.isCollapsed = !this.isCollapsed;
    this.profileMenuOpen = false;
    this.collapsedChange.emit(this.isCollapsed);
  }

  toggleProfileMenu(): void {
    this.profileMenuOpen = !this.profileMenuOpen;
  }

  closeProfileMenu(): void {
    this.profileMenuOpen = false;
  }

  onLogout(): void {
    this.profileMenuOpen = false;
    this.authService.logout();
  }

  goToSettings(): void {
    this.profileMenuOpen = false;
    this.router.navigate(['/settings']);
  }
}

export class NavItem {
  label: string;
  route: string;
  icon: string;
  managerOnly: boolean;

  constructor(label: string, route: string, icon: string, managerOnly = false) {
    this.label = label;
    this.route = route;
    this.icon = icon;
    this.managerOnly = managerOnly;
  }
}