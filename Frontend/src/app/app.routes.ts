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

  // Rutas para ADMIN
   { 
    path: 'registro', 
    loadComponent: () => import('./componentes/registro/registro.component').then(m => m.RegistroComponent), 
    canActivate: [RoleGuard],
    data: { role: 'ADMIN' }
  },
  { 
    path: 'liquidaciones', 
    loadComponent: () => import('./componentes/liquidaciones-admin/liquidaciones-admin.component').then(m => m.LiquidacionesAdminComponent), 
    canActivate: [RoleGuard],
    data: { role: 'ADMIN' }
  },
  // { path: 'control-asistencia', loadComponent: () => import('./componentes/control-asistencia/control-asistencia.component').then(m => m.ControlAsistenciaComponent), canActivate: [RoleGuard] },


  // // Rutas para EMPLEADO
  // { path: 'perfil', loadComponent: () => import('./componentes/perfil/perfil.component').then(m => m.PerfilComponent) },
  { 
    path: 'pagos', 
    loadComponent: () => import('./componentes/pagos/pagos.component').then(m => m.PagosComponent),
    canActivate: [RoleGuard],
    data: { role: 'EMPLEADO' }
  },
  { 
    path: 'asistencia', 
    loadComponent: () => import('./componentes/asistencia/asistencia.component').then(m => m.AsistenciaComponent),
    canActivate: [RoleGuard],
    data: { role: 'EMPLEADO' }
  },

  // Rutas por defecto
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: '**', redirectTo: '/login', pathMatch: 'full' }
];