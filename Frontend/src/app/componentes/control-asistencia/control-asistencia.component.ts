import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';
import { SidebarComponent } from '../sidebar/sidebar.component';

interface RegistroAsistencia {
  _id: string;
  empleado: any;
  fecha: Date;
  horaEntrada: string;
  horaSalida: string;
  totalHorasTrabajadas: number;
}

interface EmpleadoData {
  _id: string;
  nombre: string;
  rut: string;
  cargo: string;
}

@Component({
  selector: 'app-control-asistencia',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, SidebarComponent],
  templateUrl: './control-asistencia.component.html',
  styleUrls: ['./control-asistencia.component.css'],
  providers: [DatePipe]
})
export class ControlAsistenciaComponent implements OnInit {
  // Datos del usuario
  rolUsuario: string | null = '';
  nombreUsuario: string = '';
  
  // Datos de asistencia
  registrosAsistencia: RegistroAsistencia[] = [];
  empleados: EmpleadoData[] = [];
  
  // Estadísticas
  asistenciaHoyPorcentaje: number = 0;
  totalEmpleados: number = 0;
  
  // Filtros y búsqueda
  fechaInicio: string = '';
  fechaFin: string = '';
  busquedaEmpleado: string = '';
  empleadoSeleccionado: string = '';
  mostrarFiltros: boolean = false;
  
  // Estados de carga
  cargando: boolean = false;
  cargandoEstadisticas: boolean = false;
  
  // Datos para gráficos
  estadisticasAsistencia = {
    asistio: 0,
    enJornada: 0,
    ausente: 0
  };
  
  // Estado actual (para hoy)
  fechaActual: Date = new Date();
  
  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private datePipe: DatePipe
  ) {}

  ngOnInit(): void {
    // Verificar rol de usuario
    const userData = this.authService.getUserData();
    this.rolUsuario = userData?.rol;
    this.nombreUsuario = userData?.nombre || 'Administrador';
    
    // Inicializar fechas
    this.inicializarFechas();
    
    // Cargar datos iniciales
    this.cargarEmpleados();
    this.cargarRegistrosAsistencia();
    this.cargarEstadisticas();
  }
  
  inicializarFechas(): void {
    const hoy = new Date();
    const inicioSemana = new Date(hoy);
    inicioSemana.setDate(hoy.getDate() - 7); // Una semana atrás
    
    this.fechaInicio = this.formatFechaInput(inicioSemana);
    this.fechaFin = this.formatFechaInput(hoy);
  }
  
  cargarEmpleados(): void {
    this.http.get<EmpleadoData[]>(`${environment.apiUrl}/empleados`)
      .subscribe({
        next: (data) => {
          this.empleados = data;
          this.totalEmpleados = data.length;
        },
        error: (err) => {
          console.error('Error al cargar empleados:', err);
        }
      });
  }
  
  cargarRegistrosAsistencia(): void {
    this.cargando = true;
    
    // Construir parámetros de búsqueda
    let params: any = {};
    
    if (this.fechaInicio) {
      params.fechaInicio = this.fechaInicio;
    }
    
    if (this.fechaFin) {
      params.fechaFin = this.fechaFin;
    }
    
    if (this.empleadoSeleccionado) {
      params.empleadoId = this.empleadoSeleccionado;
    }
    
    // Realizar la petición
    this.http.get<RegistroAsistencia[]>(`${environment.apiUrl}/asistencia`, { params })
      .subscribe({
        next: (data) => {
          console.log('Registros de asistencia recibidos:', data);
          this.registrosAsistencia = data;
          
          // Actualizar estadísticas
          this.calcularEstadisticas();
          
          this.cargando = false;
        },
        error: (err) => {
          console.error('Error al cargar registros de asistencia:', err);
          this.cargando = false;
        }
      });
  }
  
  cargarEstadisticas(): void {
    this.cargandoEstadisticas = true;
    
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
        if (registros && Array.isArray(registros)) {
          if (this.totalEmpleados > 0) {
            // Calcular porcentaje de asistencia
            const empleadosConAsistencia = new Set(
              registros.map(r => r.empleado?._id || r.empleado)
            ).size;
            
            this.asistenciaHoyPorcentaje = Math.round((empleadosConAsistencia / this.totalEmpleados) * 100);
          }
        }
        
        this.cargandoEstadisticas = false;
      },
      error: (err) => {
        console.error('Error al cargar estadísticas de hoy:', err);
        this.cargandoEstadisticas = false;
      }
    });
  }
  
  calcularEstadisticas(): void {
    // Reiniciar contadores
    this.estadisticasAsistencia = {
      asistio: 0,
      enJornada: 0,
      ausente: 0
    };
    
    // Para los registros cargados
    for (const registro of this.registrosAsistencia) {
      if (registro.horaEntrada && registro.horaSalida) {
        this.estadisticasAsistencia.asistio++;
      } else if (registro.horaEntrada) {
        this.estadisticasAsistencia.enJornada++;
      }
    }
    
    // Calcular ausencias (estimado)
    const totalDias = this.calcularDiasEnRango();
    const registrosPorEmpleado = new Set(this.registrosAsistencia.map(r => r.empleado?._id || r.empleado)).size;
    const asistenciasEsperadas = totalDias * this.totalEmpleados;
    
    this.estadisticasAsistencia.ausente = Math.max(0, asistenciasEsperadas - this.registrosAsistencia.length);
  }
  
  calcularDiasEnRango(): number {
    if (!this.fechaInicio || !this.fechaFin) return 1;
    
    const inicio = new Date(this.fechaInicio);
    const fin = new Date(this.fechaFin);
    
    // Calcular días entre las dos fechas
    const diferenciaTiempo = fin.getTime() - inicio.getTime();
    return Math.max(1, Math.ceil(diferenciaTiempo / (1000 * 3600 * 24)));
  }
  
  toggleFiltros(): void {
    this.mostrarFiltros = !this.mostrarFiltros;
  }
  
  aplicarFiltros(): void {
    this.cargarRegistrosAsistencia();
  }
  
  resetearFiltros(): void {
    this.inicializarFechas();
    this.empleadoSeleccionado = '';
    this.busquedaEmpleado = '';
    this.cargarRegistrosAsistencia();
  }
  
  registrarEntrada(empleadoId: string): void {
    this.http.post(`${environment.apiUrl}/asistencia/entrada/${empleadoId}`, {})
      .subscribe({
        next: (response) => {
          console.log('Entrada registrada:', response);
          // Recargar datos
          this.cargarRegistrosAsistencia();
          this.cargarEstadisticas();
        },
        error: (err) => {
          console.error('Error al registrar entrada:', err);
          alert('Error al registrar entrada');
        }
      });
  }
  
  registrarSalida(empleadoId: string): void {
    this.http.post(`${environment.apiUrl}/asistencia/salida/${empleadoId}`, {})
      .subscribe({
        next: (response) => {
          console.log('Salida registrada:', response);
          // Recargar datos
          this.cargarRegistrosAsistencia();
          this.cargarEstadisticas();
        },
        error: (err) => {
          console.error('Error al registrar salida:', err);
          alert('Error al registrar salida');
        }
      });
  }
  
  formatFechaInput(fecha: Date): string {
    return this.datePipe.transform(fecha, 'yyyy-MM-dd') || '';
  }
  
  formatFecha(fecha: string | Date): string {
    return this.datePipe.transform(fecha, 'dd/MM/yyyy') || '';
  }
  
  formatHora(hora: string): string {
    if (!hora) return '—';
    return hora;
  }
  
  getEstadoClase(registro: RegistroAsistencia): string {
    if (registro.horaEntrada && registro.horaSalida) {
      return 'estado-asistio';
    } else if (registro.horaEntrada) {
      return 'estado-en-jornada';
    } else {
      return 'estado-ausente';
    }
  }
  
  getEstadoTexto(registro: RegistroAsistencia): string {
    if (registro.horaEntrada && registro.horaSalida) {
      return 'Asistió';
    } else if (registro.horaEntrada) {
      return 'En Jornada';
    } else {
      return 'Ausente';
    }
  }
  
  filtrarEmpleados(): EmpleadoData[] {
    if (!this.busquedaEmpleado) return this.empleados;
    
    const busqueda = this.busquedaEmpleado.toLowerCase();
    return this.empleados.filter(emp => 
      emp.nombre.toLowerCase().includes(busqueda) || 
      emp.rut.toLowerCase().includes(busqueda) ||
      emp.cargo.toLowerCase().includes(busqueda)
    );
  }
}