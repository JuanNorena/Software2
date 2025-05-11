import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService } from '../../services/user.service';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-registro',
  templateUrl: './registro.component.html',
  styleUrls: ['./registro.component.css'],
  imports: [ReactiveFormsModule, CommonModule] 
})
export class RegistroComponent implements OnInit {
  registroForm!: FormGroup;
  loading = false;
  errorMessage = '';
  submitted = false;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.initForm();
  }

  /**
   * Inicializa el formulario de registro con validaciones
   */
  initForm(): void {
    this.registroForm = this.fb.group({
      // Datos de usuario
      username: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      
      // Datos personales
      nombre: ['', [Validators.required]],
      rut: ['', [Validators.required, this.validarRut]],
      fechaNacimiento: [''],
      
      // Datos laborales
      id: [''],
      cargo: [''],
      profesion: [''],
      sueldoBase: [0],
      numeroCuentaDigital: [''],
      empresaRut: ['', [Validators.required]],
      esEncargadoPersonal: [false]
    });
  }

  /**
   * Validador personalizado para el formato de RUT chileno
   */
  validarRut(control: any) {
    // Aquí podrías implementar una validación específica de RUT si lo necesitas
    return null;
  }

  /**
   * Comprueba si un campo tiene errores y ha sido tocado
   * @param fieldName Nombre del campo a verificar
   * @returns Boolean indicando si el campo tiene errores
   */
  hasError(fieldName: string): boolean {
    const field = this.registroForm.get(fieldName);
    return !!field?.invalid && (field?.dirty || field?.touched || this.submitted);
  }

  /**
   * Procesa el formulario de registro y envía los datos al servidor
   */
  registrar(): void {
    this.submitted = true;
    
    if (this.registroForm.invalid) {
      // Marcar todos los campos como tocados para mostrar errores
      Object.keys(this.registroForm.controls).forEach(key => {
        const control = this.registroForm.get(key);
        if (control) {
          control.markAsTouched();
        }
      });
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    // Obtener los valores del formulario
    const formData = this.registroForm.value;

    // Utilizar el servicio para realizar el registro
    this.userService.register(formData)
      .subscribe({
        next: (response: any) => {
          console.log('Registro exitoso:', response);
          
          // Mostrar mensaje de éxito y redirigir al usuario
          alert('Registro exitoso. ¡Bienvenido!');
          this.router.navigate(['/dashboard']);
        },
        error: (error) => {
          console.error('Error en el registro:', error);
          
          // Mostrar mensaje de error
          if (error.error && error.error.message) {
            this.errorMessage = error.error.message;
          } else {
            this.errorMessage = 'Error en el registro. Por favor, intenta nuevamente.';
          }
          
          this.loading = false;
        },
        complete: () => {
          this.loading = false;
        }
      });
  }

  /**
   * Maneja la acción de cancelar el registro
   */
  cancelar(): void {
    this.registroForm.reset();
    // Redirigir al usuario a la página de inicio o login
    this.router.navigate(['/login']);
  }
}