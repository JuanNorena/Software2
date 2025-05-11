import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class LiquidacionService {
  private apiUrl = `${environment.apiUrl}`;

  constructor(private http: HttpClient) { }

  /**
   * Obtiene todas las liquidaciones (solo para admin)
   * @returns Observable con las liquidaciones
   */
  obtenerLiquidaciones(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/liquidaciones-sueldo`).pipe(
      catchError(this.handleError<any[]>('obtenerLiquidaciones', []))
    );
  }

  /**
   * Obtiene liquidaciones pendientes de aprobación
   * @returns Observable con las liquidaciones pendientes
   */
  obtenerLiquidacionesPendientes(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/liquidaciones-sueldo/pendientes`).pipe(
      catchError(this.handleError<any[]>('obtenerLiquidacionesPendientes', []))
    );
  }

  /**
   * Genera liquidación para un empleado específico
   * @param empleadoId ID del empleado
   * @param mes Mes (1-12)
   * @param anio Año
   * @returns Observable con la liquidación generada
   */
  generarLiquidacion(empleadoId: string, mes: number, anio: number): Observable<any> {
    const datos = {
      empleadoId,
      mes,
      anio
    };

    return this.http.post<any>(`${this.apiUrl}/liquidaciones-sueldo/generar`, datos).pipe(
      catchError(error => {
        console.error('Error al generar liquidación:', error);
        throw error;
      })
    );
  }

  /**
   * Genera liquidaciones para todos los empleados de una empresa
   * @param datos Datos para generar liquidaciones (mes, anio, empresaRut)
   * @returns Observable con los resultados de la generación
   */
  generarLiquidacionesEmpresa(datos: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/liquidaciones-sueldo/generar-empresa`, datos).pipe(
      catchError(error => {
        console.error('Error al generar liquidaciones:', error);
        throw error;
      })
    );
  }

  /**
   * Aprueba una liquidación
   * @param liquidacionId ID de la liquidación
   * @returns Observable con la liquidación aprobada
   */
  aprobarLiquidacion(liquidacionId: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/liquidaciones-sueldo/${liquidacionId}/aprobar`, {}).pipe(
      catchError(error => {
        console.error('Error al aprobar liquidación:', error);
        throw error;
      })
    );
  }

  /**
   * Rechaza una liquidación
   * @param liquidacionId ID de la liquidación
   * @param motivo Motivo del rechazo
   * @returns Observable con la liquidación rechazada
   */
  rechazarLiquidacion(liquidacionId: string, motivo: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/liquidaciones-sueldo/${liquidacionId}/rechazar`, { motivo }).pipe(
      catchError(error => {
        console.error('Error al rechazar liquidación:', error);
        throw error;
      })
    );
  }

  /**
   * Procesa el pago de una liquidación
   * @param liquidacionId ID de la liquidación
   * @param datosPago Datos para el pago (método, banco, etc.)
   * @returns Observable con el resultado del pago
   */
  procesarPagoLiquidacion(liquidacionId: string, datosPago: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/liquidaciones-sueldo/${liquidacionId}/pagar`, datosPago).pipe(
      catchError(error => {
        console.error('Error al procesar pago:', error);
        throw error;
      })
    );
  }

  /**
   * Procesa el pago de nómina (múltiples liquidaciones)
   * @param datosPago Datos para el pago (liquidacionesIds, método, banco, etc.)
   * @returns Observable con el resultado del pago
   */
  procesarPagoNomina(datosPago: any): Observable<any> {
  return this.http.post<any>(`${this.apiUrl}/liquidaciones-sueldo/pagar-nomina`, datosPago).pipe(
    catchError(error => {
      console.error('Error al procesar pago de nómina:', error);
      throw error;
    })
  );
}

  /**
   * Obtiene el historial completo de liquidaciones con filtros
   * @param filtros Filtros a aplicar (desde, hasta, estado, etc.)
   * @returns Observable con las liquidaciones filtradas
   */
  obtenerHistoricoLiquidaciones(filtros: any = {}): Observable<any> {
    // Construir parámetros de consulta
    const params = new URLSearchParams();
    Object.keys(filtros).forEach(key => {
      if (filtros[key]) {
        params.append(key, filtros[key]);
      }
    });

    return this.http.get<any>(`${this.apiUrl}/liquidaciones-sueldo/historico?${params.toString()}`).pipe(
      catchError(this.handleError<any>('obtenerHistoricoLiquidaciones'))
    );
  }

  /**
   * Genera informe de pagos previsionales
   * @param mes Mes (1-12)
   * @param anio Año
   * @returns Observable con el informe generado
   */
  generarInformePrevisional(mes: number, anio: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/liquidaciones-sueldo/informe-previsional/${mes}/${anio}`).pipe(
      catchError(this.handleError<any>('generarInformePrevisional'))
    );
  }

  /**
   * Obtiene las liquidaciones disponibles del empleado autenticado
   * @returns Observable con las liquidaciones del empleado
   */
  obtenerMisLiquidaciones(): Observable<any[]> {
    // Usando la ruta exacta que está definida en el backend
    return this.http.get<any[]>(`${this.apiUrl}/liquidaciones-sueldo/empleado/mis-liquidaciones`).pipe(
      catchError(this.handleError<any[]>('obtenerMisLiquidaciones', []))
    );
  }

  /**
   * Obtiene una liquidación específica por su ID
   * @param liquidacionId ID de la liquidación
   * @returns Observable con el detalle de la liquidación
   */
  obtenerLiquidacion(liquidacionId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/liquidaciones-sueldo/${liquidacionId}`).pipe(
      catchError(this.handleError<any>('obtenerLiquidacion'))
    );
  }

  /**
   * Obtiene los descuentos asociados a una liquidación
   * @param liquidacionId ID de la liquidación
   * @returns Observable con los descuentos de la liquidación
   */
  obtenerDescuentosPorLiquidacion(liquidacionId: string): Observable<any[]> {
  return this.http.get<any[]>(`${this.apiUrl}/descuentos/liquidacion/${liquidacionId}`).pipe(
    catchError(error => {
      console.error('Error al obtener descuentos:', error);
      return of([]); // Devolver array vacío en caso de error para no interrumpir el flujo
    })
  );
}

  /**
   * Obtiene el registro de asistencia asociado a una liquidación
   * @param liquidacionId ID de la liquidación
   * @returns Observable con los registros de asistencia
   */
  obtenerAsistenciaPorLiquidacion(liquidacionId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/liquidaciones-sueldo/${liquidacionId}/asistencia`).pipe(
      catchError(this.handleError<any>('obtenerAsistenciaPorLiquidacion'))
    );
  }

  /**
   * Descarga el PDF de una liquidación
   * @param {string} liquidacionId - ID de la liquidación
   * @returns {Observable<Blob>} Observable que contiene el blob del PDF
   */
  descargarLiquidacionPDF(liquidacionId: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/liquidaciones-sueldo/${liquidacionId}/pdf`, {
      responseType: 'blob'
    }).pipe(
      catchError(error => {
        console.error('Error al descargar PDF:', error);
        throw error;
      })
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

  /**
   * Obtiene todas las liquidaciones de sueldo de un empleado específico
   * @param empleadoId ID del empleado
   * @returns Observable con las liquidaciones del empleado
   */
  obtenerLiquidacionesPorEmpleado(empleadoId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/liquidaciones-sueldo/empleado/${empleadoId}`).pipe(
      catchError(this.handleError<any[]>('obtenerLiquidacionesPorEmpleado', []))
    );
  }
}