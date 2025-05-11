import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of, throwError } from 'rxjs';
import { tap, map, catchError } from 'rxjs/operators';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../environments/environment';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  private tokenSubject: BehaviorSubject<string | null>;
  private isBrowser: boolean;
  
  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) platformId: Object,
    private router: Router
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    const token = this.isBrowser ? localStorage.getItem('token') : null;
    this.tokenSubject = new BehaviorSubject<string | null>(token);
  }

  /**
   * Realiza el inicio de sesión del usuario
   * @param username Email o número de identificación del usuario
   * @param password Contraseña del usuario
   */
  login(username: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/auth/login`, { username, password })
      .pipe(
        tap(response => {
          if (response && response.token) {
            if (this.isBrowser) {
              localStorage.setItem('token', response.token);
              localStorage.setItem('usuario', JSON.stringify(response.usuario));
            }
            this.tokenSubject.next(response.token);
          }
        })
      );
  }

   /**
   * Cierra la sesión del usuario actual
   */
  logout(): Observable<any> {
    // Preparamos un observable que siempre limpiará los datos locales
    const cleanupFn = () => {
      if (this.isBrowser) {
        console.log('Limpiando datos de sesión...');
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('usuario');
      }
      this.tokenSubject.next(null);
      this.router.navigate(['/login'], { replaceUrl: true });
    };

    // Intentamos hacer logout en el servidor
    return this.http.post<any>(`${this.apiUrl}/auth/logout`, {})
      .pipe(
        tap(() => {
          console.log('Logout exitoso en el servidor');
          cleanupFn();
        }),
        catchError(error => {
          console.error('Error en logout:', error);
          // Aún con error, limpiamos localmente
          cleanupFn();
          return throwError(() => error);
        })
      );
  }

  /**
   * Obtiene el token de autenticación actual
   */
  getToken(): string | null {
    return this.tokenSubject.value;
  }

  /**
   * Verifica si el usuario está autenticado
   */
  isAuthenticated(): boolean {
    return !!this.tokenSubject.value;
  }

  /**
   * Obtiene los datos del usuario actual
   */
  getUserData(): any {
    if (!this.isBrowser) return null;
    const userData = localStorage.getItem('usuario');
    return userData ? JSON.parse(userData) : null;
  }

  /**
   * Obtiene el rol del usuario actual
   * @returns Rol del usuario o null si no está autenticado
   */
  getUserRole(): string | null {
    return this.getRolUsuario();
  }

  /**
   * Obtiene el rol del usuario actual (método original)
   * @returns Rol del usuario o null si no está autenticado
   */
  getRolUsuario(): string | null {
    const user = this.getUserData();
    return user?.rol || null;
  }

  /**
   * Obtiene el ID del usuario actual
   */
  getUserId(): string {
    const userData = this.getUserData();
    return userData ? userData._id || userData.id || '' : '';
  }

  /**
   * Verifica si un número de identificación pertenece al usuario actual
   * @param identificacion Número de identificación a verificar
   */
  verificarIdentificacion(identificacion: string): Observable<boolean> {
    const userData = this.getUserData();
    
    // Verificación simple si los datos están en localStorage
    if (userData && (userData.rut === identificacion || userData.dni === identificacion || userData.identificacion === identificacion)) {
      return of(true);
    }
    
    // Si no están en localStorage o no coinciden, verificar con el backend
    return this.http.post<any>(`${this.apiUrl}/usuarios/verificar-identificacion`, { 
      id: this.getUserId(), 
      identificacion 
    }).pipe(
      map(response => response.valido),
      catchError(error => {
        console.error('Error al verificar identificación:', error);
        return of(false);
      })
    );
  }

  /**
   * Solicita restablecimiento de contraseña
   * @param email Email del usuario
   */
  solicitarRestablecerPassword(email: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/auth/reset-password`, { email });
  }

  /**
   * Verifica código de restablecimiento
   * @param email Email del usuario
   * @param codigo Código de verificación
   */
  verificarCodigo(email: string, codigo: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/auth/verificar-codigo`, { email, codigo });
  }

  /**
   * Establece nueva contraseña
   * @param email Email del usuario
   * @param codigo Código de verificación
   * @param password Nueva contraseña
   */
  cambiarPassword(email: string, codigo: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/auth/cambiar-password`, { email, codigo, password });
  }
}