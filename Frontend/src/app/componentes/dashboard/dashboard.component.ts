// dashboard.component.ts
import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { HttpClient } from '@angular/common/http';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { environment } from '../../../environments/environment';

interface Liquidacion {
  _id: string;
  fecha: Date;
  sueldoBruto: number;
  sueldoNeto: number;
  estado: string;
  empleado?: any;
}

interface Activity {
  date: Date;
  description: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, SidebarComponent, DatePipe],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  // Propiedades compartidas
  rolUsuario: string | null = '';
  nombreUsuario: string = '';
  currentDate: Date = new Date();
  
  // Propiedades para empleado
  attendancePercentage: number = 0;
  ultimaLiquidacion: Liquidacion | null = null;
  cargandoLiquidacion: boolean = false;
  descargandoPDF: boolean = false;
  recentActivities: Activity[] = [];
  cargandoActividades: boolean = false;
  asistenciaRegistrada: boolean = false;
  entradaRegistrada: boolean = false;
  salidaRegistrada: boolean = false;
  
  // Propiedades para administrador
  totalEmpleados: number = 0;
  asistenciaHoyPorcentaje: number = 0;
  liquidacionesPendientes: number = 0;
  ultimasLiquidacionesPendientes: Liquidacion[] = [];
  cargandoEmpleados: boolean = false;
  cargandoAsistenciaHoy: boolean = false;
  cargandoLiquidacionesPendientes: boolean = false;

  constructor(
    private authService: AuthService,
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    const userData = this.authService.getUserData();
    this.rolUsuario = userData?.rol;
    this.nombreUsuario = userData?.nombre?.split(' ')[0] || '';
    
    if (this.rolUsuario === 'EMPLEADO') {
      this.cargarDatosEmpleado();
    } else if (this.rolUsuario === 'ADMIN') {
      this.cargarDatosAdmin();
    }
  }


   // Métodos para administrador
  cargarDatosAdmin(): void {
    this.cargarTotalEmpleados();
    this.cargarAsistenciaHoy();
    this.cargarLiquidacionesPendientes();
  }


  cargarTotalEmpleados(): void {
    this.cargandoEmpleados = true;
    
    this.http.get<any[]>(`${environment.apiUrl}/empleados`)
      .subscribe({
        next: (empleados) => {
          if (empleados && Array.isArray(empleados)) {
            this.totalEmpleados = empleados.length;
          } else {
            this.totalEmpleados = 0;
          }
          this.cargandoEmpleados = false;
        },
        error: (err) => {
          console.error('Error al cargar total de empleados:', err);
          this.totalEmpleados = 0;
          this.cargandoEmpleados = false;
        }
      });
  }


  cargarAsistenciaHoy(): void {
    this.cargandoAsistenciaHoy = true;
    
    // Obtener la fecha actual en formato YYYY-MM-DD
    const hoy = new Date().toISOString().split('T')[0];
    
    // Obtener todos los registros de asistencia de hoy
    this.http.get<any[]>(`${environment.apiUrl}/asistencia`, {
      params: {
        fechaInicio: hoy,
        fechaFin: hoy
      }
    }).subscribe({
      next: (registros) => {
        console.log('Registros de asistencia de hoy:', registros);
        
        if (registros && Array.isArray(registros)) {
          // Primero necesitamos obtener el total de empleados
          this.http.get<any[]>(`${environment.apiUrl}/empleados`)
            .subscribe({
              next: (empleados) => {
                const totalEmpleados = empleados.length;
                
                if (totalEmpleados > 0) {
                  // Calcular porcentaje de asistencia
                  const empleadosConAsistencia = new Set(
                    registros.map(r => r.empleado?._id || r.empleado)
                  ).size;
                  
                  this.asistenciaHoyPorcentaje = Math.round((empleadosConAsistencia / totalEmpleados) * 100);
                } else {
                  this.asistenciaHoyPorcentaje = 0;
                }
                
                this.cargandoAsistenciaHoy = false;
              },
              error: (err) => {
                console.error('Error al cargar empleados para cálculo de asistencia:', err);
                this.asistenciaHoyPorcentaje = 0;
                this.cargandoAsistenciaHoy = false;
              }
            });
        } else {
          this.asistenciaHoyPorcentaje = 0;
          this.cargandoAsistenciaHoy = false;
        }
      },
      error: (err) => {
        console.error('Error al cargar asistencia de hoy:', err);
        this.asistenciaHoyPorcentaje = 0;
        this.cargandoAsistenciaHoy = false;
      }
    });
  }


  cargarLiquidacionesPendientes(): void {
    this.cargandoLiquidacionesPendientes = true;
    
    this.http.get<Liquidacion[]>(`${environment.apiUrl}/liquidaciones-sueldo/pendientes`)
      .subscribe({
        next: (liquidaciones) => {
          if (liquidaciones && Array.isArray(liquidaciones)) {
            this.liquidacionesPendientes = liquidaciones.length;
            
            // Tomar las 5 más recientes para mostrar en la tabla
            this.ultimasLiquidacionesPendientes = liquidaciones
              .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
              .slice(0, 5);
          } else {
            this.liquidacionesPendientes = 0;
            this.ultimasLiquidacionesPendientes = [];
          }
          
          this.cargandoLiquidacionesPendientes = false;
        },
        error: (err) => {
          console.error('Error al cargar liquidaciones pendientes:', err);
          this.liquidacionesPendientes = 0;
          this.ultimasLiquidacionesPendientes = [];
          this.cargandoLiquidacionesPendientes = false;
        }
      });
  }
  


  cargarDatosEmpleado(): void {
    this.cargarLiquidaciones();
    this.cargarAsistencia();
    this.generarActividades();
  }

 
  cargarLiquidaciones(): void {
    this.cargandoLiquidacion = true;
    this.http.get<Liquidacion[]>(`${environment.apiUrl}/liquidaciones-sueldo/empleado/mis-liquidaciones`)
      .subscribe({
        next: (data) => {
          if (data && data.length > 0) {
            // Ordenamos por fecha, más reciente primero
            data.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
            this.ultimaLiquidacion = data[0];
          }
          this.cargandoLiquidacion = false;
        },
        error: (err) => {
          console.error('Error al cargar liquidaciones:', err);
          this.cargandoLiquidacion = false;
        }
      });
  }
  
  cargarAsistencia(): void {
    // Obtener fecha de inicio (primer día del mes actual)
    const fechaActual = new Date();
    const anio = fechaActual.getFullYear();
    const mes = fechaActual.getMonth() + 1;
    
    const fechaInicio = `${anio}-${mes.toString().padStart(2, '0')}-01`;
    const fechaFin = fechaActual.toISOString().split('T')[0]; // Formato YYYY-MM-DD
    
    console.log(`Cargando asistencia desde ${fechaInicio} hasta ${fechaFin}`);
    
    this.http.get<any[]>(`${environment.apiUrl}/asistencia/mi-historial`, {
      params: {
        fechaInicio: fechaInicio,
        fechaFin: fechaFin
      }
    }).subscribe({
      next: (registros) => {
        console.log('Registros de asistencia recibidos:', registros);
        
        if (registros && Array.isArray(registros)) {
          // Contar días con asistencia completa (entrada y salida)
          const asistenciasCompletas = registros.filter(r => r.horaEntrada && r.horaSalida).length;
          
          // Contar días en jornada (con entrada pero sin salida)
          const diasEnJornada = registros.filter(r => r.horaEntrada && !r.horaSalida).length;
          
          // Calcular días laborables en el mes hasta hoy
          let diasLaborables = 0;
          const diasEnMes = new Date(anio, mes, 0).getDate();
          
          for (let i = 1; i <= Math.min(fechaActual.getDate(), diasEnMes); i++) {
            const fecha = new Date(anio, mes - 1, i);
            const diaSemana = fecha.getDay();
            if (diaSemana !== 0 && diaSemana !== 6) { // No es domingo ni sábado
              diasLaborables++;
            }
          }
          
          // Calcular porcentaje de asistencia
          // (días con asistencia completa + días en jornada) / días laborables
          if (diasLaborables > 0) {
            this.attendancePercentage = Math.round(((asistenciasCompletas + diasEnJornada) / diasLaborables) * 100);
          } else {
            this.attendancePercentage = 0;
          }
          
          // Limitar el valor máximo a 100%
          this.attendancePercentage = Math.min(this.attendancePercentage, 100);
          
          // Verificar si hay registro para hoy
          const hoy = fechaActual.toISOString().split('T')[0];
          const registroHoy = registros.find(r => 
            new Date(r.fecha).toISOString().split('T')[0] === hoy
          );
          
          if (registroHoy) {
            this.asistenciaRegistrada = true;
            this.entradaRegistrada = !!registroHoy.horaEntrada;
            this.salidaRegistrada = !!registroHoy.horaSalida;
          } else {
            this.asistenciaRegistrada = false;
            this.entradaRegistrada = false;
            this.salidaRegistrada = false;
          }
        }
      },
      error: (err) => {
        console.error('Error al cargar asistencia:', err);
        // Si hay error, asignar un valor por defecto
        this.attendancePercentage = 45;
      }
    });
  }
  
  generarActividades(): void {
    this.cargandoActividades = true;
    
    // Podríamos hacer una llamada a una API para obtener actividades reales
    // Por ahora, generamos datos de ejemplo basados en la fecha actual
    
    const hoy = new Date();
    const ayer = new Date(hoy);
    ayer.setDate(hoy.getDate() - 1);
    
    const semanaAnterior = new Date(hoy);
    semanaAnterior.setDate(hoy.getDate() - 7);
    
    this.recentActivities = [
      { date: hoy, description: 'Liquidación de sueldo procesada' },
      { date: ayer, description: 'Registro de asistencia completado' },
      { date: semanaAnterior, description: 'Actualización de información personal' }
    ];
    
    this.cargandoActividades = false;
  }
  
  descargarLiquidacion(): void {
    if (!this.ultimaLiquidacion || !this.ultimaLiquidacion._id) {
      alert('No hay liquidación disponible para descargar');
      return;
    }
    
    // Indicador de carga
    this.descargandoPDF = true;
    
    // Construir la URL
    const url = `${environment.apiUrl}/liquidaciones-sueldo/${this.ultimaLiquidacion._id}/pdf`;
    
    // Hacer la solicitud HTTP con responseType: 'blob'
    this.http.get(url, { responseType: 'blob' }).subscribe({
      next: (blob) => {
        // Crear una URL de objeto para el blob
        const url = window.URL.createObjectURL(blob);
        
        // Crear un elemento <a> para descargar el archivo
        const a = document.createElement('a');
        a.href = url;
        a.download = `liquidacion_${this.ultimaLiquidacion?._id ?? 'desconocida'}.pdf`;
        document.body.appendChild(a);
        a.click();
        
        // Limpiar
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        this.descargandoPDF = false;
      },
      error: (err) => {
        console.error('Error al descargar liquidación:', err);
        alert('No se pudo descargar la liquidación. Por favor, intente de nuevo.');
        this.descargandoPDF = false;
      }
    });
  }
  
  registrarAsistencia(event: Event): void {
    event.preventDefault();
    
    // Si ya hay salida registrada, no permitir más registros
    if (this.salidaRegistrada) {
      alert('Ya ha registrado entrada y salida para el día de hoy');
      return;
    }
    
    // Si ya está registrada la entrada pero no la salida, registramos salida
    if (this.entradaRegistrada && !this.salidaRegistrada) {
      this.http.post(`${environment.apiUrl}/asistencia/mi-salida`, {})
        .subscribe({
          next: (response) => {
            console.log('Salida registrada con éxito', response);
            this.salidaRegistrada = true;
            alert('Salida registrada correctamente');
            
            // Actualizar datos de asistencia
            this.cargarAsistencia();
          },
          error: (err) => {
            console.error('Error al registrar salida:', err);
            alert('Error al registrar salida. Por favor, inténtelo de nuevo.');
          }
        });
    } else {
      // Si no hay entrada registrada, registramos entrada
      this.http.post(`${environment.apiUrl}/asistencia/mi-entrada`, {})
        .subscribe({
          next: (response) => {
            console.log('Entrada registrada con éxito', response);
            this.entradaRegistrada = true;
            this.asistenciaRegistrada = true;
            alert('Entrada registrada correctamente');
            
            // Actualizar datos de asistencia
            this.cargarAsistencia();
          },
          error: (err) => {
            console.error('Error al registrar entrada:', err);
            alert('Error al registrar entrada. Por favor, inténtelo de nuevo.');
          }
        });
    }
  }
  
  formatMonto(monto: number): string {
    return monto?.toLocaleString('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }) || 'N/A';
  }
  
  getProgressColor(percentage: number): string {
    if (percentage >= 75) return '#4caf50'; // Verde
    if (percentage >= 50) return '#ff9800'; // Naranja
    return '#f44336'; // Rojo
  }
}