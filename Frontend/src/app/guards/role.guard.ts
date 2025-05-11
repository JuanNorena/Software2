// guards/role.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean | UrlTree {
    // Verificar si el usuario está autenticado
    if (!this.authService.isAuthenticated()) {
      console.log('Usuario no autenticado, redirigiendo a login');
      return this.router.parseUrl('/login');
    }
    
    const userRole = this.authService.getUserRole();
    console.log(`Verificando acceso para ruta ${state.url}, rol del usuario: ${userRole}`);
    
    // Rutas exclusivas para ADMIN
    if (route.routeConfig?.path === 'registro' || 
        route.routeConfig?.path === 'control-asistencia' || 
        route.routeConfig?.path === 'liquidaciones') {
      
      if (userRole !== 'ADMIN') {
        console.log('Acceso denegado: Ruta solo para ADMIN');
        return this.router.parseUrl('/dashboard');
      }
    }
    
    // Rutas exclusivas para EMPLEADO
    if (route.routeConfig?.path === 'pagos' || 
        route.routeConfig?.path === 'asistencia' || 
        route.routeConfig?.path === 'perfil') {
      
      if (userRole !== 'EMPLEADO') {
        console.log('Acceso denegado: Ruta solo para EMPLEADO');
        return this.router.parseUrl('/dashboard');
      }
    }
    
    return true;
  }
}