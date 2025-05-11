// interceptors/auth.interceptor.ts
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const token = authService.getToken();
  
  let authReq = req;
  if (token) {
    authReq = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`)
    });
  }
  
  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Si el error es de autorización (401) o prohibido (403)
      if (error.status === 401 || error.status === 403) {
        console.error('Error de autenticación:', error);
        
        // Limpiar datos y redirigir a login
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
          localStorage.removeItem('usuario');
          sessionStorage.removeItem('token');
          sessionStorage.removeItem('usuario');
        }
        
        // Redirigir al login
        router.navigate(['/login'], { replaceUrl: true });
      }
      
      return throwError(() => error);
    })
  );
};