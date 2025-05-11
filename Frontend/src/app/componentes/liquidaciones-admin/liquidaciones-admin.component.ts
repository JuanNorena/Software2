import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LiquidacionService } from '../../services/liquidacion.service';
import { EmpleadoService } from '../../services/empleado.service';
import { AuthService } from '../../services/auth.service';
import { PagosService } from '../../services/pagos.service';

@Component({
  selector: 'app-liquidaciones-admin',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './liquidaciones-admin.component.html',
  styleUrls: ['./liquidaciones-admin.component.css'],
  providers: [DatePipe]
})
export class LiquidacionesAdminComponent implements OnInit {
  // Datos del administrador
  nombreAdmin: string = '';
  
  // Listado de empleados
  empleados: any[] = [];
  empleadosFiltrados: any[] = [];
  
  // Filtros y búsqueda
  terminoBusqueda: string = '';
  
  // Datos para generar liquidación
  fechaInicio: string = '';
  fechaFin: string = '';
  salarioMensual: number | null = null;
  auxilioTransporte: boolean = false;
  editarSalario: boolean = false;
  
  // Estados de carga y error
  cargando: boolean = false;
  procesando: boolean = false;
  procesandoPago: boolean = false;
  procesandoPagoNomina: boolean = false;
  procesandoPagoProvisional: boolean = false;
  procesandoCambioEstado: boolean = false;
  error: string | null = null;
  mensaje: string | null = null;
  
  // Notificaciones
  mostrarNotificacionExito: boolean = false;
  mostrarNotificacionError: boolean = false;
  mensajeExito: string = '';
  mensajeError: string = '';
  
  // Modales y selección de empleado
  mostrarModalLiquidacion: boolean = false;
  mostrarModalPago: boolean = false;
  mostrarModalPagoNomina: boolean = false;
  mostrarModalCambioEstado: boolean = false;
  empleadoSeleccionado: any = null;
  liquidacionSeleccionada: any = null;
  
  // Sistema de tabs para el modal de nómina
  tabActiva: string = 'liquidaciones';
  
  // Datos para pago de liquidación
  liquidacionesPendientesPago: any[] = [];
  liquidacionSeleccionadaId: string = '';
  metodoPago: string = 'deposito';
  banco: string = '';
  
  // Datos para pago de nómina
  metodoPagoNomina: string = 'deposito';
  bancoNomina: string = '';
  fechaPagoNomina: string = '';
  
  // Datos para contabilidad provisional
  periodoCorrespondiente: string = '';
  totalPagoPension: number | null = null;
  totalPagoSalud: number | null = null;
  
  // Datos para cambio de estado
  nuevoEstado: string = 'pendiente';
  motivoRechazo: string = '';
  
  // Propiedades para la liquidación generada
  liquidacionGenerada: any = null;
  procesandoAprobacion: boolean = false;
  
  // Propiedades para el modal de rechazo
  mostrarModalRechazo: boolean = false;
  liquidacionParaRechazar: any = null;
  procesandoRechazo: boolean = false;

  constructor(
    private liquidacionService: LiquidacionService,
    private empleadoService: EmpleadoService,
    private authService: AuthService,
    private pagosService: PagosService,
    private datePipe: DatePipe
  ) { }

  ngOnInit(): void {
    // Obtener información del usuario logueado (admin)
    const userData = this.authService.getUserData();
    if (userData) {
      this.nombreAdmin = userData.nombre || 'Administrador';
    }
    
    // Establecer fechas por defecto (mes actual)
    const hoy = new Date();
    const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const ultimoDiaMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
    
    this.fechaInicio = this.formatearFecha(primerDiaMes);
    this.fechaFin = this.formatearFecha(ultimoDiaMes);
    this.fechaPagoNomina = this.formatearFecha(hoy);
    
    // Establecer período correspondiente por defecto (mes actual)
    const mes = (hoy.getMonth() + 1).toString().padStart(2, '0');
    const anio = hoy.getFullYear();
    this.periodoCorrespondiente = `${anio}-${mes}`;
    
    // Cargar lista de empleados
    this.cargarEmpleados();
  }

  /**
   * Formatea una fecha para input date
   */
  formatearFecha(fecha: Date): string {
    const year = fecha.getFullYear();
    const month = (fecha.getMonth() + 1).toString().padStart(2, '0');
    const day = fecha.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Carga la lista de empleados
   */
  cargarEmpleados(): void {
    this.cargando = true;
    this.error = null;
    
    this.empleadoService.obtenerEmpleados().subscribe({
      next: (empleados) => {
        this.empleados = empleados;
        this.empleadosFiltrados = [...empleados];
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al cargar empleados:', err);
        this.mostrarError('No se pudieron cargar los empleados. Por favor, intente nuevamente.');
        this.cargando = false;
      }
    });
  }

  /**
   * Filtra empleados según término de búsqueda
   */
  buscarEmpleados(): void {
    if (!this.terminoBusqueda.trim()) {
      this.empleadosFiltrados = [...this.empleados];
      return;
    }
    
    const termino = this.terminoBusqueda.toLowerCase().trim();
    this.empleadosFiltrados = this.empleados.filter(emp => 
      emp.nombre?.toLowerCase().includes(termino) || 
      emp.rut?.toLowerCase().includes(termino) ||
      emp.cargo?.toLowerCase().includes(termino) ||
      emp.profesion?.toLowerCase().includes(termino)
    );
  }

  /**
   * Selecciona un empleado para liquidar y abre el modal
   */
  seleccionarEmpleadoParaLiquidar(empleado: any): void {
    this.empleadoSeleccionado = empleado;
    this.salarioMensual = empleado.sueldoBase || null;
    this.editarSalario = !empleado.sueldoBase;
    this.mostrarModalLiquidacion = true;
    this.error = null;
    this.mensaje = null;
  }

  /**
   * Selecciona un empleado para pagar nómina y abre el modal
   */
  seleccionarEmpleadoParaPagarNomina(empleado: any): void {
    this.empleadoSeleccionado = empleado;
    this.mostrarModalPagoNomina = true;
    this.tabActiva = 'liquidaciones';
    this.cargarLiquidacionesPendientesPago(empleado._id);
    this.error = null;
    this.mensaje = null;
    this.metodoPagoNomina = 'deposito';
    this.bancoNomina = '';
    
    // Establecer fecha de pago por defecto (hoy)
    const hoy = new Date();
    this.fechaPagoNomina = this.formatearFecha(hoy);
    
    // Calcular valores por defecto para contabilidad provisional
    this.calcularValoresPorDefectoProvisional();
  }
  
  /**
   * Cambia la tab activa en el modal de pago de nómina
   */
  cambiarTab(tab: string): void {
    this.tabActiva = tab;
    
    if (tab === 'contabilidad') {
      this.calcularValoresPorDefectoProvisional();
    }
  }
  
  /**
   * Calcula valores por defecto para contabilidad provisional
   */
  calcularValoresPorDefectoProvisional(): void {
    const montoBrutoTotal = this.getMontoTotalBrutoSeleccionadas();
    
    // Calcular valores por defecto (estos porcentajes deben ajustarse según normativa)
    const porcentajePension = 0.12; // 12% para pensión
    const porcentajeSalud = 0.09;   // 9% para salud
    
    this.totalPagoPension = Math.round(montoBrutoTotal * porcentajePension);
    this.totalPagoSalud = Math.round(montoBrutoTotal * porcentajeSalud);
  }
  
  /**
   * Obtiene el total de provisiones (pensión + salud)
   */
  getTotalProvisiones(): number {
    const pension = this.totalPagoPension || 0;
    const salud = this.totalPagoSalud || 0;
    return pension + salud;
  }

  /**
   * Abre el modal para cambiar estado de una liquidación
   */
  abrirModalCambioEstado(liquidacion: any): void {
    this.liquidacionSeleccionada = liquidacion;
    this.nuevoEstado = liquidacion.estado === 'pendiente' ? 'aprobado' : 'pendiente';
    this.motivoRechazo = '';
    this.mostrarModalCambioEstado = true;
  }
  
  /**
   * Confirma el cambio de estado de una liquidación
   */
  confirmarCambioEstado(): void {
    if (!this.liquidacionSeleccionada) return;
    
    this.procesandoCambioEstado = true;
    
    if (this.nuevoEstado === 'aprobado') {
      this.liquidacionService.aprobarLiquidacion(this.liquidacionSeleccionada._id).subscribe({
        next: (resultado) => {
          this.procesandoCambioEstado = false;
          this.mostrarExito('Liquidación aprobada correctamente');
          this.cerrarModalCambioEstado();
          this.cargarLiquidacionesPendientesPago(this.empleadoSeleccionado._id);
        },
        error: (err) => {
          console.error('Error al aprobar liquidación:', err);
          this.mostrarError(err.error?.mensaje || 'Error al aprobar la liquidación');
          this.procesandoCambioEstado = false;
        }
      });
    } else if (this.nuevoEstado === 'rechazado') {
      if (!this.motivoRechazo) {
        this.mostrarError('Debe proporcionar un motivo para el rechazo');
        this.procesandoCambioEstado = false;
        return;
      }
      
      this.liquidacionService.rechazarLiquidacion(
        this.liquidacionSeleccionada._id,
        this.motivoRechazo
      ).subscribe({
        next: (resultado) => {
          this.procesandoCambioEstado = false;
          this.mostrarExito('Liquidación rechazada correctamente');
          this.cerrarModalCambioEstado();
          this.cargarLiquidacionesPendientesPago(this.empleadoSeleccionado._id);
        },
        error: (err) => {
          console.error('Error al rechazar liquidación:', err);
          this.mostrarError(err.error?.mensaje || 'Error al rechazar la liquidación');
          this.procesandoCambioEstado = false;
        }
      });
    } else {
      // Cambiar a pendiente u otro estado (esto podría requerir un endpoint adicional)
      this.procesandoCambioEstado = false;
      this.mostrarError('Operación no implementada para este estado');
    }
  }

  /**
   * Cierra el modal de cambio de estado
   */
  cerrarModalCambioEstado(): void {
    this.mostrarModalCambioEstado = false;
    this.liquidacionSeleccionada = null;
    this.nuevoEstado = 'pendiente';
    this.motivoRechazo = '';
  }

  /**
   * Cierra el modal de liquidación
   */
  cerrarModalLiquidacion(): void {
    this.mostrarModalLiquidacion = false;
    this.empleadoSeleccionado = null;
    this.liquidacionGenerada = null;
  }

  /**
   * Cierra el modal de pago
   */
  cerrarModalPago(): void {
    this.mostrarModalPago = false;
    this.empleadoSeleccionado = null;
    this.liquidacionesPendientesPago = [];
    this.liquidacionSeleccionadaId = '';
    this.metodoPago = 'deposito';
    this.banco = '';
  }

  /**
   * Cierra el modal de pago de nómina
   */
  cerrarModalPagoNomina(): void {
    this.mostrarModalPagoNomina = false;
    this.empleadoSeleccionado = null;
    this.liquidacionesPendientesPago = [];
    this.tabActiva = 'liquidaciones';
    this.metodoPagoNomina = 'deposito';
    this.bancoNomina = '';
    this.totalPagoPension = null;
    this.totalPagoSalud = null;
    this.periodoCorrespondiente = '';
  }

  /**
   * Abre el modal para rechazar una liquidación
   * @param liquidacion Liquidación a rechazar
   */
  abrirModalRechazo(liquidacion: any): void {
    this.liquidacionParaRechazar = liquidacion;
    this.motivoRechazo = '';
    this.mostrarModalRechazo = true;
  }

  /**
   * Cierra el modal de rechazo
   */
  cerrarModalRechazo(): void {
    this.mostrarModalRechazo = false;
    this.liquidacionParaRechazar = null;
    this.motivoRechazo = '';
  }

  /**
   * Rechaza una liquidación
   */
  rechazarLiquidacion(): void {
    if (!this.liquidacionParaRechazar || !this.motivoRechazo) {
      this.mostrarError('Debe proporcionar un motivo para el rechazo');
      return;
    }
    
    this.procesandoRechazo = true;
    
    this.liquidacionService.rechazarLiquidacion(
      this.liquidacionParaRechazar._id,
      this.motivoRechazo
    ).subscribe({
      next: (resultado) => {
        console.log('Liquidación rechazada:', resultado);
        this.procesandoRechazo = false;
        this.mostrarExito('Liquidación rechazada correctamente');
        
        // Actualizar la lista de liquidaciones
        const index = this.liquidacionesPendientesPago.findIndex(
          liq => liq._id === this.liquidacionParaRechazar._id
        );
        
        if (index !== -1) {
          // Eliminar de la lista
          this.liquidacionesPendientesPago.splice(index, 1);
        }
        
        // Cerrar modal
        this.cerrarModalRechazo();
      },
      error: (err) => {
        console.error('Error al rechazar liquidación:', err);
        this.mostrarError(err.error?.mensaje || 'Error al rechazar la liquidación. Por favor, intente nuevamente.');
        this.procesandoRechazo = false;
      }
    });
  }

  /**
   * Genera una liquidación individual para el empleado seleccionado
   */
  generarLiquidacionIndividual(): void {
    if (!this.validarFormulario()) {
      return;
    }
    
    this.procesando = true;
    this.error = null;
    this.mensaje = null;
    
    // Obtener mes y año de la fecha de fin
    const fechaFin = new Date(this.fechaFin);
    const mes = fechaFin.getMonth() + 1;
    const anio = fechaFin.getFullYear();
    
    this.liquidacionService.generarLiquidacion(this.empleadoSeleccionado._id, mes, anio).subscribe({
      next: (resultado) => {
        console.log('Liquidación generada:', resultado);
        this.procesando = false;
        this.mostrarExito('Liquidación generada correctamente');
        
        // Guardar la liquidación generada para poder aprobarla
        this.liquidacionGenerada = resultado.liquidacion;
      },
      error: (err) => {
        console.error('Error al generar liquidación:', err);
        this.mostrarError(err.error?.mensaje || 'Error al generar la liquidación. Por favor, intente nuevamente.');
        this.procesando = false;
      }
    });
  }

  /**
   * Valida el formulario antes de generar liquidaciones
   */
  validarFormulario(): boolean {
    if (!this.fechaInicio || !this.fechaFin) {
      this.mostrarError('Debe seleccionar fechas de inicio y fin del período.');
      return false;
    }
    
    const inicio = new Date(this.fechaInicio);
    const fin = new Date(this.fechaFin);
    
    if (inicio > fin) {
      this.mostrarError('La fecha de inicio no puede ser posterior a la fecha de fin.');
      return false;
    }
    
    if (!this.salarioMensual) {
      this.mostrarError('Debe ingresar el salario mensual.');
      return false;
    }
    
    return true;
  }

  /**
   * Selecciona un empleado para pagar y abre el modal
   */
  seleccionarEmpleadoParaPagar(empleado: any): void {
    this.empleadoSeleccionado = empleado;
    this.mostrarModalPago = true;
    this.cargarLiquidacionesPendientesPago(empleado._id);
    this.error = null;
    this.mensaje = null;
  }

  /**
   * Carga las liquidaciones pendientes de pago para un empleado
   */
  cargarLiquidacionesPendientesPago(empleadoId: string): void {
    this.liquidacionesPendientesPago = [];
    this.liquidacionSeleccionadaId = '';
    this.cargando = true;
    
    this.liquidacionService.obtenerLiquidacionesPorEmpleado(empleadoId).subscribe({
      next: (liquidaciones) => {
        // Incluir tanto liquidaciones pendientes como aprobadas
        this.liquidacionesPendientesPago = liquidaciones
          .filter(liq => liq.estado === 'pendiente' || liq.estado === 'aprobado')
          .map(liq => ({
            ...liq,
            // Solo pre-seleccionar las que están aprobadas
            seleccionada: liq.estado === 'aprobado'
          }));
        
        this.cargando = false;
        
        if (this.liquidacionesPendientesPago.length > 0) {
          // Buscar la primera liquidación aprobada
          const primeraAprobada = this.liquidacionesPendientesPago.find(liq => liq.estado === 'aprobado');
          if (primeraAprobada) {
            this.liquidacionSeleccionadaId = primeraAprobada._id;
          } else {
            this.liquidacionSeleccionadaId = this.liquidacionesPendientesPago[0]._id;
          }
        }
      },
      error: (err) => {
        console.error('Error al cargar liquidaciones pendientes:', err);
        this.mostrarError('No se pudieron cargar las liquidaciones. Por favor, intente nuevamente.');
        this.cargando = false;
      }
    });
  }

  /**
   * Procesa el pago de una liquidación
   */
  procesarPagoLiquidacion(): void {
    if (!this.liquidacionSeleccionadaId || !this.metodoPago || !this.banco) {
      this.mostrarError('Debe seleccionar una liquidación y completar los datos de pago.');
      return;
    }
    
    this.procesandoPago = true;
    this.error = null;
    this.mensaje = null;
    
    const datosPago = {
      metodoPago: this.metodoPago,
      banco: this.banco
    };
    
    this.liquidacionService.procesarPagoLiquidacion(this.liquidacionSeleccionadaId, datosPago).subscribe({
      next: (resultado) => {
        console.log('Pago procesado:', resultado);
        this.procesandoPago = false;
        this.mostrarExito('Pago procesado correctamente.');
        
        // Cerrar modal después de 2 segundos
        setTimeout(() => {
          this.cerrarModalPago();
        }, 2000);
      },
      error: (err) => {
        console.error('Error al procesar pago:', err);
        this.mostrarError(err.error?.mensaje || 'Error al procesar el pago. Por favor, intente nuevamente.');
        this.procesandoPago = false;
      }
    });
  }

  /**
   * Verifica si hay liquidaciones seleccionadas para pago de nómina
   */
  hayLiquidacionesSeleccionadas(): boolean {
    return this.liquidacionesPendientesPago.some(liq => liq.seleccionada);
  }

  /**
   * Verifica si todas las liquidaciones están seleccionadas
   */
  todasLiquidacionesSeleccionadas(): boolean {
    // Solo contar las liquidaciones aprobadas
    const liquidacionesAprobadas = this.liquidacionesPendientesPago.filter(liq => liq.estado === 'aprobado');
    if (liquidacionesAprobadas.length === 0) return false;
    
    return liquidacionesAprobadas.every(liq => liq.seleccionada);
  }
  
  /**
   * Selecciona o deselecciona todas las liquidaciones
   */
  seleccionarTodasLiquidaciones(event: Event): void {
    // Hacer el casting apropiado del target del evento
    const checkbox = event.target as HTMLInputElement;
    const seleccionadas = checkbox.checked;
    
    // Solo seleccionar liquidaciones en estado aprobado
    this.liquidacionesPendientesPago.forEach(liq => {
      if (liq.estado === 'aprobado') {
        liq.seleccionada = seleccionadas;
      }
    });
  }

  /**
   * Obtiene total de liquidaciones seleccionadas para nómina
   */
  getTotalLiquidacionesSeleccionadas(): number {
    return this.liquidacionesPendientesPago.filter(liq => liq.seleccionada).length;
  }

  /**
   * Obtiene monto total neto de liquidaciones seleccionadas para nómina
   */
  getMontoTotalLiquidacionesSeleccionadas(): number {
    return this.liquidacionesPendientesPago
      .filter(liq => liq.seleccionada)
      .reduce((total, liq) => total + (liq.sueldoNeto || 0), 0);
  }
  
  /**
   * Obtiene monto total bruto de liquidaciones seleccionadas
   */
  getMontoTotalBrutoSeleccionadas(): number {
    return this.liquidacionesPendientesPago
      .filter(liq => liq.seleccionada)
      .reduce((total, liq) => total + (liq.sueldoBruto || 0), 0);
  }

  /**
   * Procesa el pago de nómina (múltiples liquidaciones)
   */
  procesarPagoNomina(): void {
    // Obtener IDs de liquidaciones seleccionadas
    const liquidacionesIds = this.liquidacionesPendientesPago
      .filter(liq => liq.seleccionada)
      .map(liq => liq._id);
    
    if (liquidacionesIds.length === 0 || !this.metodoPagoNomina || !this.bancoNomina || !this.fechaPagoNomina) {
      this.mostrarError('Debe seleccionar al menos una liquidación y completar los datos de pago.');
      return;
    }
    
    this.procesandoPagoNomina = true;
    this.error = null;
    this.mensaje = null;
    
    const datosPago = {
      liquidacionesIds,
      metodoPago: this.metodoPagoNomina,
      banco: this.bancoNomina,
      fechaPago: new Date(this.fechaPagoNomina).toISOString()
    };
    
    // Usar el método de liquidacionService que apunta al nuevo endpoint
    this.liquidacionService.procesarPagoNomina(datosPago).subscribe({
      next: (resultado) => {
        console.log('Pago de nómina procesado:', resultado);
        this.procesandoPagoNomina = false;
        
        // Mostrar un mensaje más detallado con la información del resultado
        const liquidacionesProcesadas = resultado.resumen?.liquidacionesProcesadas || liquidacionesIds.length;
        const montoTotal = resultado.resumen?.montoTotal || 'calculado';
        
        this.mostrarExito(`Pago de nómina procesado correctamente para ${liquidacionesProcesadas} liquidaciones por un total de ${this.formatoMoneda(montoTotal)}.`);
        
        // Cambiar a la tab de contabilidad provisional
        this.cambiarTab('contabilidad');
      },
      error: (err) => {
        console.error('Error al procesar pago de nómina:', err);
        this.mostrarError(err.error?.mensaje || 'Error al procesar el pago de nómina. Por favor, intente nuevamente.');
        this.procesandoPagoNomina = false;
      }
    });
  }
  
  /**
   * Procesa el pago de contabilidad provisional
   */
  procesarPagoProvisional(): void {
    // Obtener IDs de liquidaciones seleccionadas
    const liquidacionesIds = this.liquidacionesPendientesPago
      .filter(liq => liq.seleccionada)
      .map(liq => liq._id);
    
    if (liquidacionesIds.length === 0 || !this.periodoCorrespondiente || !this.totalPagoPension || !this.totalPagoSalud) {
      this.mostrarError('Debe completar todos los campos para el pago provisional.');
      return;
    }
    
    this.procesandoPagoProvisional = true;
    
    // Para simplificar, tomaremos el primer ID de liquidación como referencia
    // En un caso real, probablemente querrías crear un pago provisional por cada liquidación
    // o un solo pago provisional asociado a múltiples liquidaciones
    const liquidacionId = liquidacionesIds[0];
    
    const datosPago = {
      liquidacionSueldo: liquidacionId,
      periodoCorrespondiente: this.periodoCorrespondiente,
      fechaPago: new Date().toISOString(),
      totalPago: this.getTotalProvisiones(),
      totalPagoPension: this.totalPagoPension,
      totalPagoSalud: this.totalPagoSalud
    };
    
    this.pagosService.registrarPagoProvisional(datosPago).subscribe({
      next: (resultado) => {
        console.log('Pago provisional registrado:', resultado);
        this.procesandoPagoProvisional = false;
        this.mostrarExito('Pago de contabilidad provisional registrado correctamente.');
        
        // Cerrar modal después de 2 segundos
        setTimeout(() => {
          this.cerrarModalPagoNomina();
        }, 2000);
      },
      error: (err) => {
        console.error('Error al registrar pago provisional:', err);
        this.mostrarError(err.error?.mensaje || 'Error al registrar el pago provisional. Por favor, intente nuevamente.');
        this.procesandoPagoProvisional = false;
      }
    });
  }

  /**
   * Aprueba una liquidación directamente desde el modal
   * @param liquidacionId ID de la liquidación a aprobar
   */
  aprobarLiquidacion(liquidacionId: string): void {
    this.procesandoAprobacion = true;
    
    this.liquidacionService.aprobarLiquidacion(liquidacionId).subscribe({
      next: (resultado) => {
        console.log('Liquidación aprobada:', resultado);
        this.procesandoAprobacion = false;
        this.mostrarExito('Liquidación aprobada correctamente');
        
        // Actualizar el estado de la liquidación mostrada
        if (this.liquidacionGenerada && this.liquidacionGenerada._id === liquidacionId) {
          this.liquidacionGenerada.estado = 'aprobado';
        }
        
        // Actualizar el estado de la liquidación en la lista de pendientes
        if (this.liquidacionesPendientesPago.length > 0) {
          const liquidacion = this.liquidacionesPendientesPago.find(liq => liq._id === liquidacionId);
          if (liquidacion) {
            liquidacion.estado = 'aprobado';
            liquidacion.seleccionada = true; // Automáticamente seleccionarla para pago
          }
        }
      },
      error: (err) => {
        console.error('Error al aprobar liquidación:', err);
        this.mostrarError(err.error?.mensaje || 'Error al aprobar la liquidación. Por favor, intente nuevamente.');
        this.procesandoAprobacion = false;
      }
    });
  }

  /**
   * Muestra una notificación de éxito
   */
  mostrarExito(mensaje: string): void {
    this.mensajeExito = mensaje;
    this.mostrarNotificacionExito = true;
    
    // Ocultar la notificación después de 5 segundos
    setTimeout(() => {
      this.cerrarNotificacion();
    }, 5000);
  }
  
  /**
   * Muestra una notificación de error
   */
  mostrarError(mensaje: string): void {
    this.mensajeError = mensaje;
    this.mostrarNotificacionError = true;
    
    // Ocultar la notificación después de 5 segundos
    setTimeout(() => {
      this.cerrarNotificacion();
    }, 5000);
  }
  
  /**
   * Cierra todas las notificaciones
   */
  cerrarNotificacion(): void {
    this.mostrarNotificacionExito = false;
    this.mostrarNotificacionError = false;
    this.mensajeExito = '';
    this.mensajeError = '';
  }

  /**
   * Obtiene el tipo de contrato formateado
   */
  getTipoContrato(empleado: any): string {
    return empleado.tipoContrato ? empleado.tipoContrato : 'No especificado';
  }

  /**
   * Obtiene la jornada formateada
   */
  getJornada(empleado: any): string {
    return empleado.jornada ? empleado.jornada : 'Completa';
  }

  /**
   * Formatea un valor monetario para mostrar en pantalla
   */
  formatoMoneda(valor: number | undefined | null): string {
    if (valor === undefined || valor === null) {
      return '$0';
    }
    
    return valor.toLocaleString('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    });
  }
}