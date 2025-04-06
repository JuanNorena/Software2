import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  loginForm!: FormGroup;
  errorMessage: string = '';
  loading: boolean = false;
  
  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.crearFormulario();
  }
  
  private crearFormulario() {
    this.loginForm = this.formBuilder.group({
      usuario: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.maxLength(10), Validators.minLength(7)]],
      rememberUser: [false]
    });
  }
  
  public login() {
    if (this.loginForm.invalid) {
      return;
    }
    
    this.loading = true;
    this.errorMessage = '';
    
    const { usuario, password, rememberUser } = this.loginForm.value;
    
    this.authService.login(usuario, password).subscribe({
      next: (response) => {
        this.loading = false;
        
        if (rememberUser) {
          localStorage.setItem('rememberedUser', usuario);
        } else {
          localStorage.removeItem('rememberedUser');
        }
        
        // Navega a la página principal o dashboard después del login exitoso
        this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        this.loading = false;
        // Maneja los diferentes tipos de errores
        if (error.status === 401) {
          this.errorMessage = 'Usuario o contraseña incorrectos';
        } else {
          this.errorMessage = 'Error al iniciar sesión. Intente nuevamente.';
        }
        console.error('Error de inicio de sesión:', error);
      }
    });
  }
  
  onForgotPassword() {
    this.router.navigate(['/recuperar-password']);
  }
}