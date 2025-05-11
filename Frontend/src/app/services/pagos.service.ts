import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PagosService {
  private apiUrl = `${environment.apiUrl}`;

  constructor(private http: HttpClient) { }

  /**
   * Obtiene todos los pagos de sueldo (solo para admin)
   * @returns Observable con todos los pagos
   */
  obtenerTodosPagos(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/pagos-sueldo`).pipe(
      catchError(this.handleError<any[]>('obtenerTodosPagos', []))
    );
  }

  /**
   * Obtiene el historial de pagos de un empleado
   * @param empleadoId ID del empleado
   * @param mes Mes (1-12)
   * @param anio Año
   * @returns Observable con los pagos del empleado
   */
  obtenerHistorialPagos(empleadoId: string, mes: number, anio: number): Observable<any[]> {
    // Para empleados, usando la ruta exacta definida en el backend
    return this.http.get<any[]>(`${this.apiUrl}/liquidaciones-sueldo/empleado/mis-liquidaciones`).pipe(
      map(liquidaciones => {
        // Filtrar por el mes/año especificado si es necesario
        if (mes && anio) {
          return liquidaciones.filter(liquidacion => {
            const fechaLiquidacion = new Date(liquidacion.fecha);
            return fechaLiquidacion.getMonth() + 1 === mes && 
                  fechaLiquidacion.getFullYear() === anio;
          });
        }
        return liquidaciones;
      }),
      catchError(this.handleError<any[]>('obtenerHistorialPagos', []))
    );
  }

  /**
   * Obtiene un pago específico por su ID
   * @param pagoId ID del pago
   * @returns Observable con el detalle del pago
   */
  obtenerPago(pagoId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/pagos-sueldo/${pagoId}`).pipe(
      catchError(this.handleError<any>('obtenerPago'))
    );
  }

  /**
   * Obtiene los pagos asociados a una liquidación
   * @param liquidacionId ID de la liquidación
   * @returns Observable con los pagos de la liquidación
   */
  obtenerPagosPorLiquidacion(liquidacionId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/pagos-sueldo/liquidacion/${liquidacionId}`).pipe(
      catchError(this.handleError<any[]>('obtenerPagosPorLiquidacion', []))
    );
  }

  /**
   * Procesa el pago de una liquidación individual
   * @param liquidacionId ID de la liquidación a pagar
   * @param datosPago Datos del pago (método, banco, etc.)
   * @returns Observable con el resultado del proceso
   */
  procesarPagoLiquidacion(liquidacionId: string, datosPago: any): Observable<any> {
    // Formatear los datos según lo que espera el backend
    const payload = {
      liquidacionSueldo: liquidacionId,
      banco: datosPago.banco,
      metodoPago: datosPago.metodoPago,
      fecha: datosPago.fechaPago || new Date().toISOString(),
      monto: datosPago.monto || 0 // El monto debería venir de la liquidación
    };

    return this.http.post<any>(`${this.apiUrl}/pagos-sueldo`, payload).pipe(
      catchError(this.handleError<any>('procesarPagoLiquidacion'))
    );
  }

  /**
   * Procesa el pago masivo de liquidaciones (pago de nómina)
   * @param datosPago Datos para el pago (liquidacionesIds, método, banco, etc.)
   * @returns Observable con el resultado del pago
   */
  procesarPagoNomina(datosPago: any): Observable<any> {
    // Crear array de promesas para procesar cada liquidación
    const pagosPromises = datosPago.liquidacionesIds.map((liquidacionId: string) => {
      const pagoIndividual = {
        liquidacionSueldo: liquidacionId,
        banco: datosPago.banco,
        metodoPago: datosPago.metodoPago,
        fecha: datosPago.fechaPago || new Date().toISOString(),
        monto: 0 // El monto se determinará en el backend basado en la liquidación
      };
      
      return this.http.post<any>(`${this.apiUrl}/pagos-sueldo`, pagoIndividual).toPromise();
    });
    
    // Usar forkJoin para procesar todos los pagos en paralelo
    return new Observable(observer => {
      Promise.all(pagosPromises)
        .then(resultados => {
          observer.next({
            mensaje: `Se han procesado ${resultados.length} liquidaciones correctamente`,
            resultados
          });
          observer.complete();
        })
        .catch(error => {
          observer.error(error);
        });
    });
  }

  /**
   * Registra un pago de contabilidad provisional
   * @param datosPago Datos para el pago provisional
   * @returns Observable con el resultado del registro
   */
  registrarPagoProvisional(datosPago: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/pagos-contabilidad-provisional`, datosPago).pipe(
      catchError(error => {
        console.error('Error al registrar pago provisional:', error);
        throw error;
      })
    );
  }

  /**
   * Actualiza un pago existente
   * @param pagoId ID del pago
   * @param datosPago Datos actualizados del pago
   * @returns Observable con el pago actualizado
   */
  actualizarPago(pagoId: string, datosPago: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/pagos-sueldo/${pagoId}`, datosPago).pipe(
      catchError(this.handleError<any>('actualizarPago'))
    );
  }

  /**
   * Anula/elimina un pago existente
   * @param pagoId ID del pago
   * @returns Observable con el resultado de la operación
   */
  anularPago(pagoId: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/pagos-sueldo/${pagoId}`).pipe(
      catchError(this.handleError<any>('anularPago'))
    );
  }

  /**
   * Obtiene el informe previsional para un período
   * @param mes Mes (1-12)
   * @param anio Año
   * @returns Observable con el informe previsional
   */
  obtenerInformePrevisional(mes: number, anio: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/liquidaciones-sueldo/informe-previsional/${mes}/${anio}`).pipe(
      catchError(this.handleError<any>('obtenerInformePrevisional'))
    );
  }

  /**
   * Obtiene todos los pagos de contabilidad provisional
   * @returns Observable con todos los pagos provisionales
   */
  obtenerTodosPagosProvisionales(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/pagos-contabilidad-provisional`).pipe(
      catchError(this.handleError<any[]>('obtenerTodosPagosProvisionales', []))
    );
  }

  /**
   * Obtiene los pagos provisionales por liquidación
   * @param liquidacionId ID de la liquidación
   * @returns Observable con los pagos provisionales asociados
   */
  obtenerPagosProvisionalesPorLiquidacion(liquidacionId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/pagos-contabilidad-provisional/liquidacion/${liquidacionId}`).pipe(
      catchError(this.handleError<any[]>('obtenerPagosProvisionalesPorLiquidacion', []))
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