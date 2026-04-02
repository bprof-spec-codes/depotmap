import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map, take } from 'rxjs/operators';
import { AuthService } from '../services/auth-service';

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.isAuthenticated().pipe(
    take(1),
    map((isLoggedIn) => {
      const role = authService.getRole();

      if (isLoggedIn && (role === 'Admin' || role === 'Szuperadmin')) {
        return true;
      }

      return router.createUrlTree(['/login']);
    })
  );
};