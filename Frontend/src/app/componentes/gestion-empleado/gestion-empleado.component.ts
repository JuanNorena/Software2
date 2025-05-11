import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EmpleadoService } from '../../services/empleado.service';
import { UserService } from '../../services/user.service';
import { Router } from '@angular/router';
import { Modal } from 'bootstrap';
import { SidebarComponent } from '../sidebar/sidebar.component';

@Component({
  standalone: true,
  selector: 'app-gestion-empleados',
  templateUrl: './gestion-empleado.component.html',
  styleUrls: ['./gestion-empleado.component.css'],
  imports: [ReactiveFormsModule, CommonModule, FormsModule, DatePipe, SidebarComponent]
})
export class GestionEmpleadosComponent implements OnInit {
  empleadoForm!: FormGroup;
  loading = false;
  modoEdicion = false;
  errorMessage = '';
  successMessage = '';
  submitted = false;
  empleados: any[] = [];
  empleadoSeleccionado: any = null;
  empleadoAEliminar: any = null;
  filtroBusqueda = '';
  currentDate: Date = new Date();
  
  // Referencia a los modales
  private eliminarModal: any;

  constructor(
    private fb: FormBuilder,
    private empleadoService: EmpleadoService,
    private userService: UserService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.initForm();
    this.cargarEmpleados();
    
    // Inicializar modales cuando el DOM esté completamente cargado
    document.addEventListener('DOMContentLoaded', () => {
      this.inicializarModales();
    });
  }

  /**
   * Inicializa los modales de Bootstrap
   */
  inicializarModales(): void {
    const eliminarModalElement = document.getElementById('eliminarModal');
    if (eliminarModalElement) {
      this.eliminarModal = new Modal(eliminarModalElement);
    }
  }

  /**
   * Inicializa el formulario de empleado con validaciones
   */
  initForm(): void {
    this.empleadoForm = this.fb.group({
      // Datos personales
      nombre: ['', [Validators.required]],
      rut: ['', [Validators.required, this.validarRut]],
      fechaNacimiento: [''],
      profesion: [''],
      
      // Datos laborales
      id: [''],
      cargo: [''],
      sueldoBase: [0],
      numeroCuentaDigital: [''],
      empresaRut: ['', [Validators.required]],
      esEncargadoPersonal: [false],
      
      // Datos de usuario (solo para creación)
      username: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]]
    });
  }

  /**
   * Ajusta las validaciones del formulario según modo edición o creación
   */
  ajustarValidaciones(): void {
    const usernameControl = this.empleadoForm.get('username');
    const emailControl = this.empleadoForm.get('email');
    const passwordControl = this.empleadoForm.get('password');
    
    if (this.modoEdicion) {
      // En modo edición, los campos de usuario no son requeridos
      usernameControl?.clearValidators();
      emailControl?.clearValidators();
      passwordControl?.clearValidators();
    } else {
      // En modo creación, establecer validadores
      usernameControl?.setValidators([Validators.required]);
      emailControl?.setValidators([Validators.required, Validators.email]);
      passwordControl?.setValidators([Validators.required, Validators.minLength(8)]);
    }
    
    // Actualizar validaciones
    usernameControl?.updateValueAndValidity();
    emailControl?.updateValueAndValidity();
    passwordControl?.updateValueAndValidity();
  }

  /**
   * Validador personalizado para el formato de RUT chileno
   */
  validarRut(control: any) {
    // Implementación básica de validación de RUT (puede mejorarse)
    if (!control.value) return null;
    
    // Eliminar puntos y guión
    let rut = control.value.replace(/\./g, '').replace(/-/g, '');
    
    // Verificar que el RUT tenga entre 8 y 9 caracteres
    if (rut.length < 8 || rut.length > 9) {
      return { 'rutInvalido': true };
    }
    
    return null;
  }

  /**
   * Comprueba si un campo tiene errores y ha sido tocado
   * @param fieldName Nombre del campo a verificar
   * @returns Boolean indicando si el campo tiene errores
   */
  hasError(fieldName: string): boolean {
    const field = this.empleadoForm.get(fieldName);
    return !!field?.invalid && (field?.dirty || field?.touched || this.submitted);
  }

  /**
   * Carga la lista de empleados desde el servicio
   */
  cargarEmpleados(): void {
    this.loading = true;
    
    this.empleadoService.obtenerEmpleados().subscribe({
      next: (data) => {
        this.empleados = data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar empleados:', error);
        this.errorMessage = 'Error al cargar la lista de empleados';
        this.loading = false;
      }
    });
  }

  /**
   * Filtra la lista de empleados según el término de búsqueda
   * @returns Array de empleados filtrados
   */
  empleadosFiltrados(): any[] {
    if (!this.filtroBusqueda) return this.empleados;
    
    const termino = this.filtroBusqueda.toLowerCase();
    return this.empleados.filter(empleado => 
      empleado.nombre?.toLowerCase().includes(termino) ||
      empleado.rut?.toLowerCase().includes(termino) ||
      empleado.cargo?.toLowerCase().includes(termino) ||
      empleado.profesion?.toLowerCase().includes(termino)
    );
  }

  /**
   * Limpia el formulario y reinicia el estado
   */
  limpiarFormulario(): void {
    this.empleadoForm.reset();
    this.empleadoForm.patchValue({
      sueldoBase: 0,
      esEncargadoPersonal: false
    });
    this.modoEdicion = false;
    this.empleadoSeleccionado = null;
    this.errorMessage = '';
    this.successMessage = '';
    this.submitted = false;
    this.ajustarValidaciones();
  }

  /**
   * Selecciona un empleado para edición
   * @param empleado Empleado a editar
   */
  seleccionarEmpleado(empleado: any): void {
    this.empleadoSeleccionado = empleado;
    this.modoEdicion = true;
    
    // Cargar datos del empleado en el formulario
    this.empleadoForm.patchValue({
      nombre: empleado.nombre,
      rut: empleado.rut,
      fechaNacimiento: empleado.fechaNacimiento ? new Date(empleado.fechaNacimiento).toISOString().split('T')[0] : '',
      profesion: empleado.profesion,
      id: empleado.id,
      cargo: empleado.cargo,
      sueldoBase: empleado.sueldoBase,
      numeroCuentaDigital: empleado.numeroCuentaDigital,
      empresaRut: empleado.empresa?.rut || '',
      esEncargadoPersonal: empleado.esEncargadoPersonal || false
    });
    
    // Ajustar validaciones para modo edición
    this.ajustarValidaciones();
    
    // Limpiar mensajes
    this.errorMessage = '';
    this.successMessage = '';
    
    // Desplazar hacia arriba para ver el formulario
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  /**
   * Inicia el modo de edición para el empleado seleccionado
   */
  editarEmpleado(): void {
    if (this.empleadoSeleccionado) {
      this.seleccionarEmpleado(this.empleadoSeleccionado);
      this.modoEdicion = true;
    }
  }

  /**
   * Prepara un empleado para eliminación y muestra el modal de confirmación
   * @param empleado Empleado a eliminar
   */
  confirmarEliminar(empleado: any): void {
    this.empleadoAEliminar = empleado;
    
    // Mostrar modal de confirmación
    if (this.eliminarModal) {
      this.eliminarModal.show();
    } else {
      // Si el modal no está inicializado, inicializar e intentar mostrar
      this.inicializarModales();
      setTimeout(() => {
        if (this.eliminarModal) {
          this.eliminarModal.show();
        } else {
          // Fallback si el modal no se puede mostrar
          if (confirm(`¿Está seguro que desea eliminar al empleado ${empleado.nombre}?`)) {
            this.eliminarEmpleado();
          }
        }
      }, 100);
    }
  }

  /**
   * Elimina un empleado después de la confirmación
   */
  eliminarEmpleado(): void {
    if (!this.empleadoAEliminar) return;
    
    this.loading = true;
    
    this.empleadoService.eliminarEmpleado(this.empleadoAEliminar._id).subscribe({
      next: (response) => {
        // Ocultar modal
        if (this.eliminarModal) {
          this.eliminarModal.hide();
        }
        
        // Actualizar lista de empleados
        this.cargarEmpleados();
        
        this.successMessage = 'Empleado eliminado correctamente';
        this.errorMessage = '';
        this.empleadoAEliminar = null;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al eliminar empleado:', error);
        this.errorMessage = 'Error al eliminar empleado';
        this.successMessage = '';
        this.loading = false;
        
        // Ocultar modal
        if (this.eliminarModal) {
          this.eliminarModal.hide();
        }
      }
    });
  }

  /**
   * Guarda o actualiza un empleado según el modo actual
   */
  guardarEmpleado(): void {
    this.submitted = true;
    
    if (this.empleadoForm.invalid) {
      // Marcar todos los campos como tocados para mostrar errores
      Object.keys(this.empleadoForm.controls).forEach(key => {
        const control = this.empleadoForm.get(key);
        if (control) {
          control.markAsTouched();
        }
      });
      return;
    }
    
    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';
    
    // Obtener datos del formulario
    const formData = this.empleadoForm.value;
    
    if (this.modoEdicion) {
      // Actualizar empleado existente
      this.empleadoService.actualizarEmpleado(this.empleadoSeleccionado._id, formData).subscribe({
        next: (response) => {
          this.successMessage = 'Empleado actualizado correctamente';
          this.errorMessage = '';
          this.loading = false;
          
          // Actualizar lista de empleados
          this.cargarEmpleados();
          
          // Limpiar formulario y volver a modo creación
          this.limpiarFormulario();
        },
        error: (error) => {
          console.error('Error al actualizar empleado:', error);
          this.errorMessage = error.error?.message || 'Error al actualizar empleado';
          this.successMessage = '';
          this.loading = false;
        }
      });
    } else {
      // Crear nuevo empleado con usuario asociado
      this.userService.register(formData).subscribe({
        next: (response) => {
          this.successMessage = 'Empleado registrado correctamente';
          this.errorMessage = '';
          this.loading = false;
          
          // Actualizar lista de empleados
          this.cargarEmpleados();
          
          // Limpiar formulario
          this.limpiarFormulario();
        },
        error: (error) => {
          console.error('Error al registrar empleado:', error);
          this.errorMessage = error.error?.message || 'Error al registrar empleado';
          this.successMessage = '';
          this.loading = false;
        }
      });
    }
  }
}