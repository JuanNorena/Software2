import { Routes } from '@angular/router';
import { LoginComponent } from './componentes/login/login.component';
import { RoleGuard } from './guards/role.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent) },
  { path: 'recuperar-password', loadComponent: () => import('./recuperar-password/recuperar-password.component').then(m => m.RecuperarPasswordComponent) },
  {path: 'registro', loadComponent: () => import('./registro/registro.component').then(m => m.RegistroComponent), canActivate: [RoleGuard]},
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: '**', redirectTo: '/login', pathMatch: 'full' }
];