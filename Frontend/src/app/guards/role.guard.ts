import { Injectable } from '@angular/core';
import {
  CanActivate,
  Router,
  UrlTree
} from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): boolean | UrlTree {
    const usuario = this.authService.getUserData();
    
    if (usuario?.rol === 'ADMIN') {
      return true;
    }

    // Si no es admin, redirige al dashboard
    return this.router.parseUrl('/dashboard');
  }
}
