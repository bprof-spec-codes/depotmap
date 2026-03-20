import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';

export const authGuard: CanActivateFn = () => {
  const router = inject(Router);
  const token = localStorage.getItem('token');

  if (!token) {
    router.navigate(['/']);
    return false;
  }

  try {
    const decoded: any = jwtDecode(token);
    const isExpired = decoded.exp * 1000 < Date.now();  //más mértékegységben van ezért meg kell szorozni 1000-el

    if (isExpired) {
      localStorage.removeItem('token');
      router.navigate(['/']);
      return false;
    }

    return true;

  }
  catch (e) {
    // érvénytelen token
    localStorage.removeItem('token');
    router.navigate(['/']);
    return false;
  }

};
