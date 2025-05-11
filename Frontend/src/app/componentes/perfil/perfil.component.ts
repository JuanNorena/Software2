import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './perfil.component.html',
  styleUrls: ['./perfil.component.css']
})
export class PerfilComponent implements OnInit {
  empleado: any = {};
  empresa: any = {};
  cargando: boolean = true;
  error: string | null = null;

  constructor(
    private authService: AuthService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.cargarDatosEmpleado();
  }

  cargarDatosEmpleado(): void {
    this.cargando = true;
    this.error = null;
    
    // Obtenemos los datos del localStorage
    const userData = this.authService.getUserData();
    console.log('Datos de usuario en localStorage:', userData);
    
    if (!userData || !userData.empleadoId) {
      this.error = "No se pudo identificar al empleado actual";
      this.cargando = false;
      return;
    }
    
    // Inicializamos con datos básicos del localStorage
    this.empleado = {
      nombre: userData.nombre || 'N/A',
      cargo: userData.cargo || 'N/A',
      // Si tienes el correo en userData, lo usamos
      email: userData.email || 'N/A',
      username: userData.username || 'N/A'
    };
    
    if (userData.empresa) {
      this.empresa = userData.empresa;
    }
    
    // Obtener datos completos del backend
    this.http.get<any>(`${environment.apiUrl}/empleados/${userData.empleadoId}`)
      .subscribe({
        next: (data) => {
          console.log('Datos completos del empleado:', data);
          
          // Actualizar el objeto empleado
          this.empleado = {
            ...this.empleado, // Mantener los datos que ya teníamos
            ...data, // Agregar los datos del backend
          };
          
          // Si viene la empresa en la respuesta, la actualizamos
          if (data.empresa && typeof data.empresa === 'object') {
            this.empresa = data.empresa;
          }
          
          this.cargando = false;
        },
        error: (err: HttpErrorResponse) => {
          console.error('Error al cargar perfil completo:', err);
          
          // Si el error es grave y no tenemos datos básicos suficientes
          if (!this.empleado.nombre || !this.empleado.cargo) {
            this.error = "No se pudieron cargar los datos del perfil. " + 
                        (err.error?.message || 'Error de servidor');
          }
          
          this.cargando = false;
        }
      });
  }
  
  formatFecha(fecha: string | Date): string {
    if (!fecha) return 'N/A';
    try {
      return new Date(fecha).toLocaleDateString('es-CL');
    } catch (e) {
      return 'N/A';
    }
  }
  
  formatMoneda(valor: number): string {
    if (valor === undefined || valor === null) return 'N/A';
    try {
      return valor.toLocaleString('es-CL', {
        style: 'currency',
        currency: 'CLP',
        minimumFractionDigits: 0
      });
    } catch (e) {
      return 'N/A';
    }
  }
}