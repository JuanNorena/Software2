import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class AsistenciaService {
  // Endpoint principal para asistencia
  private apiUrl = 'http://localhost:3000/api/asistencia';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  /**
   * Formato de token corregido para coincidir con authMiddleware.js
   * Ahora incluye el prefijo "Bearer " como lo espera el backend
   */
  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    
    if (!token) {
      console.warn('No hay token de autenticación disponible');
      return new HttpHeaders({
        'Content-Type': 'application/json'
      });
    }
    
    // SOLUCIÓN: Añadir el prefijo "Bearer " como lo espera el middleware
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  /**
   * Utilidad para depuración del token
   */
  debugToken(): void {
    const token = this.authService.getToken();
    console.log('Token actual:', token);
    
    if (token) {
      try {
        // Decodificar el payload del token
        const payload = token.split('.')[1];
        const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
        console.log('Contenido del token:', decoded);
        
        // Verificar si hay información del empleado
        if (decoded.empleadoId) {
          console.log('ID de empleado encontrado en token:', decoded.empleadoId);
        } else {
          console.warn('No se encontró ID de empleado en el token');
        }
      } catch (e) {
        console.error('Error al decodificar token:', e);
      }
    } else {
      console.warn('No hay token para depurar');
    }
  }

  /**
   * Obtiene el historial de asistencia del empleado autenticado
   */
  obtenerMiHistorial(fechaInicio?: string, fechaFin?: string): Observable<any[]> {
    // Debug del token antes de hacer la petición
    this.debugToken();
    
    let params = new HttpParams();
    if (fechaInicio) params = params.append('fechaInicio', fechaInicio);
    if (fechaFin) params = params.append('fechaFin', fechaFin);

    // Imprime la URL completa y los headers para debug
    const url = `${this.apiUrl}/mi-historial`;
    console.log('Enviando petición a:', url);
    console.log('Headers:', this.getHeaders());
    console.log('Params:', params.toString());

    return this.http.get<any[]>(url, { 
      headers: this.getHeaders(),
      params
    }).pipe(
      tap(data => console.log('Datos recibidos de mi-historial:', data)),
      catchError(error => {
        console.error('Error al obtener historial:', error);
        
        // Mostrar detalles del error
        if (error.error) {
          console.error('Detalles del error:', error.error);
        }
        
        // Si es error de autenticación, dar más información
        if (error.status === 401) {
          console.error('Error de autenticación. Verifica tu token y sesión.');
        }
        
        return of([]);
      })
    );
  }

  /**
   * Verifica si el empleado ya registró entrada o salida hoy
   * Este método ahora ha sido mejorado para evitar llamadas innecesarias
   * y para devolver información más precisa
   */
  verificarRegistroHoy(): Observable<{tieneEntrada: boolean, tieneSalida: boolean}> {
    console.log('Verificando registro de hoy...');
    const hoy = new Date();
    const fechaHoy = hoy.toISOString().split('T')[0]; // formato YYYY-MM-DD

    return new Observable(observer => {
      // Utilizar obtenerMiHistorial solo con la fecha de hoy para optimizar la consulta
      this.obtenerMiHistorial(fechaHoy, fechaHoy).subscribe(
        registros => {
          console.log('Registros de hoy recibidos:', registros);
          if (registros && registros.length > 0) {
            const registroHoy = registros[0];
            console.log('Registro de hoy encontrado:', registroHoy);
            observer.next({
              tieneEntrada: !!registroHoy.horaEntrada,
              tieneSalida: !!registroHoy.horaSalida
            });
          } else {
            console.log('No se encontró registro para hoy');
            observer.next({ tieneEntrada: false, tieneSalida: false });
          }
          observer.complete();
        },
        error => {
          console.error('Error al verificar registro de hoy:', error);
          observer.next({ tieneEntrada: false, tieneSalida: false });
          observer.complete();
        }
      );
    });
  }

  /**
   * Registra la entrada del empleado autenticado 
   * Ahora usa la nueva ruta /mi-entrada que no requiere ID
   */
  registrarMiEntrada(): Observable<any> {
    console.log('Iniciando registro de entrada...');
    
    // Ya no necesitamos obtener el ID del empleado
    // El backend lo extraerá del token JWT
    
    // Usar la nueva ruta que hemos añadido al backend
    return this.http.post<any>(`${this.apiUrl}/mi-entrada`, {}, { 
      headers: this.getHeaders()
    }).pipe(
      tap(response => console.log('Respuesta del servidor (entrada):', response)),
      catchError(error => {
        console.error('Error al registrar entrada:', error);
        return of({ error: error.message || 'Error al registrar entrada' });
      })
    );
  }

  /**
   * Registra la salida del empleado autenticado
   * Ahora usa la nueva ruta /mi-salida que no requiere ID
   */
  registrarMiSalida(): Observable<any> {
    console.log('Iniciando registro de salida...');
    
    // Ya no necesitamos obtener el ID del empleado
    // El backend lo extraerá del token JWT
    
    // Usar la nueva ruta que hemos añadido al backend
    return this.http.post<any>(`${this.apiUrl}/mi-salida`, {}, { 
      headers: this.getHeaders()
    }).pipe(
      tap(response => console.log('Respuesta del servidor (salida):', response)),
      catchError(error => {
        console.error('Error al registrar salida:', error);
        return of({ error: error.message || 'Error al registrar salida' });
      })
    );
  }
}