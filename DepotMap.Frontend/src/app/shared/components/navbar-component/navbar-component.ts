import { ChangeDetectorRef, Component, EventEmitter, Output } from '@angular/core';
import { AuthService } from '../../../core/services/auth-service';
import { Observable } from 'rxjs';
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

  // sidebar state
  isCollapsed = false;
  profileMenuOpen = false;
  readonly appName = 'DepotMap';
  user: Observable<OwnProfileModel>
  @Output() collapsedChange = new EventEmitter<boolean>();

  navItems: NavItem[] = [
    new NavItem('Készlet', '/inventory', 'bi-box-seam'),
    new NavItem('Raktár', '/warehouses', 'bi-building'),
    new NavItem('Termékek', '/products', 'bi-box'),
    new NavItem('Beszerzések', '/procurement', 'bi-truck'),
    new NavItem('Rendelések', '/orders', 'bi-bag-check'),
    new NavItem('Mozgatások', '/movements', 'bi-arrow-left-right'),
    new NavItem('Felhasználók', '/users', 'bi-people'),
  ];

  constructor(private authService: AuthService, private profileService: ProfileService, private router: Router) {
    this.isLoggedIn$ = this.authService.isAuthenticated();
    this.user = this.profileService.getOwnProfile();
    this.collapsedChange.emit(this.isCollapsed);

  }

  // sidebar össze/kinyitás
  toggleSidebar(): void {
    this.isCollapsed = !this.isCollapsed;
    this.profileMenuOpen = false;
    this.collapsedChange.emit(this.isCollapsed);
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

  goToSettings(): void {
    this.profileMenuOpen = false;
    this.router.navigate(['/settings']);
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
