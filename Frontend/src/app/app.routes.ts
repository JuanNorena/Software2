import { Routes } from '@angular/router';
import { LoginComponent } from './componentes/login/login.component';
import { RoleGuard } from './guards/role.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', loadComponent: () => import('./componentes/dashboard/dashboard.component').then(m => m.DashboardComponent) },

  // Recuperación de contraseña
  { path: 'password', loadComponent: () => import('./componentes/password/password.component').then(m => m.PasswordComponent) },
  { path: 'verificar-codigo', loadComponent: () => import('./componentes/verificar-codigo/verificar-codigo.component').then(m => m.VerificarCodigoComponent) },
  { path: 'cambiar-password', loadComponent: () => import('./componentes/cambiar-password/cambiar-password.component').then(m => m.CambiarPasswordComponent) },

  // Registro con guard
  { path: 'registro', loadComponent: () => import('./registro/registro.component').then(m => m.RegistroComponent), canActivate: [RoleGuard] },

  // Rutas por defecto
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: '**', redirectTo: '/login', pathMatch: 'full' }
];
