import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AsistenciaService } from '../../services/asistencia.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-asistencia',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './asistencia.component.html',
  styleUrls: ['./asistencia.component.css'],
  providers: [DatePipe]
})
export class AsistenciaComponent implements OnInit {
  registros: any[] = [];
  empleadoId: string = '';
  nombreEmpleado: string = '';
  estadoActual: string = 'Ausente';
  horaEntrada: string = '';
  horaSalida: string = '';
  mesFiltro: string = '';
  
  tieneEntradaHoy: boolean = false;
  tieneSalidaHoy: boolean = false;
  procesandoRegistro: boolean = false;
  
  // Datos para gráfico de asistencia
  datosAsistencia = {
    asistencia: 70,
    ausencias: 20,
    enJornada: 10
  };

  constructor(
    private asistenciaService: AsistenciaService,
    private authService: AuthService,
    private datePipe: DatePipe
  ) { }

  ngOnInit(): void {
    // Obtener información del usuario logueado
    const userData = this.authService.getUserData();
    if (userData) {
      this.empleadoId = userData.empleadoId || userData._id || userData.id;
      this.nombreEmpleado = userData.nombre || '';
      console.log('Datos del usuario:', userData);
      console.log('ID empleado:', this.empleadoId);
    }
    
    // Establecer mes actual para filtro
    const fechaActual = new Date();
    this.mesFiltro = this.datePipe.transform(fechaActual, 'yyyy-MM') || '';
    
    // Cargar datos iniciales
    this.cargarHistorialAsistencia();
    
    // Verificar si ya hay entrada o salida registrada hoy
    this.verificarEstadoActual();
    
    // Configurar variables CSS para el gráfico
    this.actualizarGrafico();
  }

  // Carga el historial de asistencia del empleado
  cargarHistorialAsistencia(): void {
    console.log('Cargando historial de asistencia...');
    this.asistenciaService.obtenerMiHistorial().subscribe(
      (datos) => {
        console.log('Datos de historial recibidos:', datos);
        this.registros = datos;
        this.calcularEstadisticas();
        this.actualizarEstadoHoy();
      },
      (error) => {
        console.error('Error al cargar historial de asistencia:', error);
      }
    );
  }

  // Actualiza el estado de hoy basado en los registros
  actualizarEstadoHoy(): void {
    const fechaHoy = this.datePipe.transform(new Date(), 'yyyy-MM-dd');
    const registroHoy = this.registros.find(registro => 
      this.datePipe.transform(new Date(registro.fecha), 'yyyy-MM-dd') === fechaHoy
    );
    
    if (registroHoy) {
      console.log('Registro de hoy encontrado:', registroHoy);
      this.horaEntrada = registroHoy.horaEntrada || '';
      this.horaSalida = registroHoy.horaSalida || '';
      this.tieneEntradaHoy = !!registroHoy.horaEntrada;
      this.tieneSalidaHoy = !!registroHoy.horaSalida;
      
      // Actualizar estado actual
      if (this.tieneEntradaHoy && this.tieneSalidaHoy) {
        this.estadoActual = 'Asistió';
      } else if (this.tieneEntradaHoy && !this.tieneSalidaHoy) {
        this.estadoActual = 'En Jornada';
      } else {
        this.estadoActual = 'Ausente';
      }
    } else {
      console.log('No se encontró registro para hoy');
      this.horaEntrada = '';
      this.horaSalida = '';
      this.tieneEntradaHoy = false;
      this.tieneSalidaHoy = false;
      this.estadoActual = 'Ausente';
    }
  }

  // Filtra registros por mes seleccionado
  filtrarPorMes(): void {
    if (this.mesFiltro) {
      const [anio, mes] = this.mesFiltro.split('-');
      const fechaInicio = `${anio}-${mes}-01`;
      
      // Calcular último día del mes
      const ultimoDia = new Date(parseInt(anio), parseInt(mes), 0).getDate();
      const fechaFin = `${anio}-${mes}-${ultimoDia}`;
      
      console.log(`Filtrando registros desde ${fechaInicio} hasta ${fechaFin}`);
      this.asistenciaService.obtenerMiHistorial(fechaInicio, fechaFin).subscribe(
        (datos) => {
          console.log('Datos filtrados recibidos:', datos);
          this.registros = datos;
          this.calcularEstadisticas();
          this.actualizarEstadoHoy();
        },
        (error) => {
          console.error('Error al filtrar registros por mes:', error);
        }
      );
    }
  }

  // Verifica el estado actual del empleado (usando el servicio)
  verificarEstadoActual(): void {
    console.log('Verificando estado actual...');
    this.asistenciaService.verificarRegistroHoy().subscribe(
      (estado) => {
        console.log('Estado actual recibido del servicio:', estado);
        this.tieneEntradaHoy = estado.tieneEntrada;
        this.tieneSalidaHoy = estado.tieneSalida;
        
        // Actualizar estado actual basado en entrada/salida
        if (this.tieneEntradaHoy && this.tieneSalidaHoy) {
          this.estadoActual = 'Asistió';
        } else if (this.tieneEntradaHoy && !this.tieneSalidaHoy) {
          this.estadoActual = 'En Jornada';
        } else {
          this.estadoActual = 'Ausente';
        }
        
        console.log('Estado actual actualizado:', {
          tieneEntrada: this.tieneEntradaHoy,
          tieneSalida: this.tieneSalidaHoy,
          estado: this.estadoActual
        });
      },
      (error) => {
        console.error('Error al verificar estado actual:', error);
        this.estadoActual = 'Ausente';
      }
    );
  }

  // Registra entrada o salida del empleado con un solo click
  registrarEntradaSalida(): void {
    this.procesandoRegistro = true;
    console.log('Iniciando registro de entrada/salida...');
    
    // Verificar si debe registrar entrada o salida
    if (!this.tieneEntradaHoy) {
      // Registrar entrada
      console.log('Registrando entrada...');
      this.asistenciaService.registrarMiEntrada().subscribe(
        (respuesta) => {
          console.log('Entrada registrada con éxito:', respuesta);
          this.procesandoRegistro = false;
          
          // Actualizar estado local primero para efecto inmediato
          this.tieneEntradaHoy = true;
          this.estadoActual = 'En Jornada';
          
          // Recargar datos para asegurar actualización completa
          this.cargarHistorialAsistencia();
          
          alert('Entrada registrada exitosamente');
        },
        (error) => {
          console.error('Error al registrar entrada:', error);
          this.procesandoRegistro = false;
          alert('Error al registrar entrada. Por favor, intente nuevamente.');
        }
      );
    } else if (!this.tieneSalidaHoy) {
      // Registrar salida
      console.log('Registrando salida...');
      this.asistenciaService.registrarMiSalida().subscribe(
        (respuesta) => {
          console.log('Salida registrada con éxito:', respuesta);
          this.procesandoRegistro = false;
          
          // Actualizar estado local primero para efecto inmediato
          this.tieneSalidaHoy = true;
          this.estadoActual = 'Asistió';
          
          // Recargar datos para asegurar actualización completa
          this.cargarHistorialAsistencia();
          
          alert('Salida registrada exitosamente');
        },
        (error) => {
          console.error('Error al registrar salida:', error);
          this.procesandoRegistro = false;
          alert('Error al registrar salida. Por favor, intente nuevamente.');
        }
      );
    } else {
      console.log('Ya tiene entrada y salida registradas hoy');
      alert('Ya ha registrado entrada y salida para el día de hoy');
      this.procesandoRegistro = false;
    }
  }

  // Calcula estadísticas para el gráfico
  calcularEstadisticas(): void {
    // Contar registros por tipo
    const asistencias = this.registros.filter(r => r.horaEntrada && r.horaSalida).length;
    const enJornada = this.registros.filter(r => r.horaEntrada && !r.horaSalida).length;
    
    // Actualizar datos para el gráfico
    this.datosAsistencia = {
      asistencia: asistencias,
      enJornada: enJornada,
      ausencias: 0 // Se calculará a continuación
    };
    
    // Calcular ausencias aproximadas (usando datos del mes actual)
    if (this.mesFiltro) {
      const [anio, mes] = this.mesFiltro.split('-');
      const diasEnMes = new Date(parseInt(anio), parseInt(mes), 0).getDate();
      const fechaActual = new Date();
      
      // Si es el mes actual, solo consideramos hasta el día de hoy
      const diasHastaHoy = (parseInt(anio) === fechaActual.getFullYear() && 
                           parseInt(mes) === fechaActual.getMonth() + 1) 
                           ? fechaActual.getDate() 
                           : diasEnMes;
      
      // Suponemos días laborables (lunes a viernes)
      let diasLaborables = 0;
      for (let i = 1; i <= diasHastaHoy; i++) {
        const fecha = new Date(parseInt(anio), parseInt(mes) - 1, i);
        const diaSemana = fecha.getDay();
        if (diaSemana !== 0 && diaSemana !== 6) { // No es domingo ni sábado
          diasLaborables++;
        }
      }
      
      // Calcular ausencias (solo días laborables menos días con registro)
      this.datosAsistencia.ausencias = Math.max(0, diasLaborables - asistencias - enJornada);
    }
    
    this.actualizarGrafico();
  }
  
  // Actualiza las variables CSS para el gráfico circular
  actualizarGrafico(): void {
    // Actualizar variables CSS para el gráfico circular
    document.documentElement.style.setProperty('--asistencia', `${this.datosAsistencia.asistencia}`);
    document.documentElement.style.setProperty('--en-jornada', `${this.datosAsistencia.enJornada}`);
    document.documentElement.style.setProperty('--ausencias', `${this.datosAsistencia.ausencias}`);
  }
}