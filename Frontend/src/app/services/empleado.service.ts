import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EmpleadoService {
  private apiUrl = `${environment.apiUrl}`;

  constructor(private http: HttpClient) { }

  /**
   * Obtiene todos los empleados (solo para admin)
   * @returns Observable con la lista de empleados
   */
  obtenerEmpleados(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/empleados`).pipe(
      catchError(this.handleError<any[]>('obtenerEmpleados', []))
    );
  }

  /**
   * Obtiene un empleado específico por su ID
   * @param empleadoId ID del empleado
   * @returns Observable con los datos del empleado
   */
  obtenerEmpleado(empleadoId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/empleados/${empleadoId}`).pipe(
      catchError(this.handleError<any>('obtenerEmpleado'))
    );
  }

  /**
   * Crea un nuevo empleado
   * @param empleadoData Datos del empleado a crear
   * @returns Observable con el empleado creado
   */
  crearEmpleado(empleadoData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/empleados`, empleadoData).pipe(
      catchError(this.handleError<any>('crearEmpleado'))
    );
  }

  /**
   * Actualiza un empleado existente
   * @param empleadoId ID del empleado
   * @param empleadoData Datos actualizados del empleado
   * @returns Observable con el empleado actualizado
   */
  actualizarEmpleado(empleadoId: string, empleadoData: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/empleados/${empleadoId}`, empleadoData).pipe(
      catchError(this.handleError<any>('actualizarEmpleado'))
    );
  }

  /**
   * Elimina un empleado
   * @param empleadoId ID del empleado a eliminar
   * @returns Observable con la respuesta de eliminación
   */
  eliminarEmpleado(empleadoId: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/empleados/${empleadoId}`).pipe(
      catchError(this.handleError<any>('eliminarEmpleado'))
    );
  }

  /**
   * Maneja errores de las peticiones HTTP
   * @param operation Nombre de la operación que falló
   * @param result Valor opcional para devolver como observable
   */
  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed:`, error);
      
      // Devolver un resultado vacío para continuar la ejecución
      return of(result as T);
    };
  }
}