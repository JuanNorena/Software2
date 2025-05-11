import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PagosService } from '../../services/pagos.service';
import { AuthService } from '../../services/auth.service';
import { LiquidacionService } from '../../services/liquidacion.service';

@Component({
  selector: 'app-pagos',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './pagos.component.html',
  styleUrls: ['./pagos.component.css'],
  providers: [DatePipe]
})
export class PagosComponent implements OnInit {
  empleadoId: string = '';
  nombreEmpleado: string = '';
  fechaActual: Date = new Date();
  
  // Datos del resumen actual
  resumenActual: any = null;
  
  // Datos del historial de pagos
  historialPagos: any[] = [];
  
  // Filtro para el historial
  mesFiltro: string = '';

  // Estado de carga
  cargando: boolean = false;
  error: string | null = null;

  constructor(
    private pagosService: PagosService,
    private liquidacionService: LiquidacionService,
    private authService: AuthService,
    private datePipe: DatePipe
  ) { }

  ngOnInit(): void {
    // Obtener información del usuario logueado
    const userData = this.authService.getUserData();
    if (userData) {
      this.empleadoId = userData.empleadoId || userData._id || userData.id;
      this.nombreEmpleado = userData.nombre || '';
    }
    
    // Establecer mes actual para filtro
    const fechaActual = new Date();
    this.mesFiltro = this.datePipe.transform(fechaActual, 'yyyy-MM') || '';
    
    // Cargar datos iniciales
    this.cargarResumenActual();
    this.cargarHistorialPagos();
  }

  /**
   * Helper para acceder a Object.keys desde la plantilla
   */
  objectKeys(obj: any): string[] {
    return Object.keys(obj || {});
  }

  /**
   * Carga el resumen de la liquidación actual del empleado
   */
  cargarResumenActual(): void {
    this.cargando = true;
    this.error = null;
    
    this.liquidacionService.obtenerMisLiquidaciones().subscribe({
      next: (liquidaciones) => {
        // Ordenar liquidaciones por fecha (más reciente primero)
        const liquidacionesOrdenadas = liquidaciones.sort((a, b) => 
          new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
        );
        
        // Tomar la más reciente (si existe)
        if (liquidacionesOrdenadas.length > 0) {
          const ultimaLiquidacion = liquidacionesOrdenadas[0];
          
          // Obtener descuentos de esta liquidación
          this.liquidacionService.obtenerDescuentosPorLiquidacion(ultimaLiquidacion._id).subscribe({
            next: (descuentos) => {
              // Preparar el resumen con los datos obtenidos
              this.resumenActual = {
                fecha: new Date(ultimaLiquidacion.fecha),
                sueldoBruto: ultimaLiquidacion.sueldoBruto || 0,
                sueldoNeto: ultimaLiquidacion.sueldoNeto || 0,
                estado: ultimaLiquidacion.estado || 'pendiente',
                fechaPago: ultimaLiquidacion.fechaAprobacion || null,
                descuentos: this.agruparDescuentos(descuentos)
              };
              
              this.cargando = false;
            },
            error: (err) => {
              console.error('Error al obtener descuentos:', err);
              this.cargando = false;
              this.error = 'No se pudieron cargar los descuentos';
            }
          });
        } else {
          this.cargando = false;
          this.resumenActual = null;
        }
      },
      error: (err) => {
        console.error('Error al obtener liquidaciones:', err);
        this.cargando = false;
        this.error = 'No se pudo cargar el resumen actual';
      }
    });
  }

  /**
   * Agrupar los descuentos por tipo para mostrarlos en el resumen
   */
  agruparDescuentos(descuentos: any[]): any {
    const agrupados: any = {
      totalDescuentos: 0,
      detalles: {}
    };
    
    // Validar que descuentos sea un array
    if (!Array.isArray(descuentos)) {
      return agrupados;
    }
    
    // Agrupar descuentos por concepto
    descuentos.forEach(descuento => {
      if (descuento && typeof descuento.valor === 'number') {
        agrupados.totalDescuentos += descuento.valor;
        
        // Mapear conceptos específicos a nombres más amigables
        let concepto = descuento.concepto || 'Otro';
        if (concepto === 'AFP') concepto = 'Pensión (AFP)';
        if (concepto === 'Salud') concepto = 'Salud (7%)';
        
        agrupados.detalles[concepto] = (agrupados.detalles[concepto] || 0) + descuento.valor;
      }
    });
    
    return agrupados;
  }

  /**
   * Carga el historial de pagos del empleado
   */
  cargarHistorialPagos(): void {
    this.cargando = true;
    this.error = null;
    
    // Extraer mes y año del filtro
    let mes: number, anio: number;
    if (this.mesFiltro) {
      const partes = this.mesFiltro.split('-');
      anio = parseInt(partes[0], 10);
      mes = parseInt(partes[1], 10);
    } else {
      const fecha = new Date();
      mes = fecha.getMonth() + 1;
      anio = fecha.getFullYear();
    }
    
    this.pagosService.obtenerHistorialPagos(this.empleadoId, mes, anio).subscribe({
      next: (pagos) => {
        this.historialPagos = pagos.map(pago => ({
          fecha: new Date(pago.fecha),
          sueldoBruto: pago.liquidacionSueldo?.sueldoBruto || 0,
          salud: this.encontrarDescuento(pago.descuentos, 'Salud'),
          pension: this.encontrarDescuento(pago.descuentos, 'AFP'),
          netoAPagar: pago.liquidacionSueldo?.sueldoNeto || 0,
          estado: pago.estado || 'pendiente',
          id: pago._id || ''
        }));
        
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al obtener historial de pagos:', err);
        this.cargando = false;
        this.error = 'No se pudo cargar el historial de pagos';
      }
    });
  }

  /**
   * Encuentra un descuento específico por concepto
   */
  encontrarDescuento(descuentos: any[], concepto: string): number {
    if (!descuentos || !Array.isArray(descuentos)) return 0;
    const descuento = descuentos.find(d => d.concepto === concepto);
    return descuento ? descuento.valor : 0;
  }

  /**
   * Filtra el historial de pagos por mes
   */
  filtrarPorMes(): void {
    this.cargarHistorialPagos();
  }

  /**
   * Descarga el PDF de la liquidación
   */
  descargarPDF(liquidacionId: string): void {
    if (!liquidacionId) {
      this.error = 'ID de liquidación no válido';
      return;
    }
    
    this.liquidacionService.descargarLiquidacionPDF(liquidacionId).subscribe({
      next: (blob) => {
        // Crear un objeto URL para el blob
        const url = window.URL.createObjectURL(blob);
        
        // Crear un elemento <a> para descargar el archivo
        const a = document.createElement('a');
        a.href = url;
        a.download = `liquidacion_${liquidacionId}.pdf`;
        document.body.appendChild(a);
        a.click();
        
        // Limpiar
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      },
      error: (err) => {
        console.error('Error al descargar PDF:', err);
        this.error = 'No se pudo descargar el PDF de la liquidación';
      }
    });
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