import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { PasswordRecoveryService } from '../../services/password-recovery.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './password.component.html',
  styleUrls: ['./password.component.css']
})
export class PasswordComponent {
  recoveryForm: FormGroup;
  errorMessage = '';
  successMessage = '';
  loading = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private passwordService: PasswordRecoveryService
  ) {
    // Campo de email
    this.recoveryForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  onSubmit() {
    this.errorMessage = '';
    this.successMessage = '';

    if (this.recoveryForm.invalid) {
      this.errorMessage = 'Por favor, ingresa un correo válido.';
      return;
    }

    this.loading = true;
    const { email } = this.recoveryForm.value;

    this.passwordService.solicitarCodigo(email).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/verificar-codigo'], {
          state: { email }
        });
      },
      error: (err: HttpErrorResponse) => {
        this.loading = false;

        if (err.status === 404) {
          this.errorMessage = 'El correo ingresado no está registrado.';
        } else if (err.status === 0) {
          this.errorMessage = 'No se pudo conectar con el servidor. Intenta más tarde.';
        } else {
          this.errorMessage = err.error?.message || 'No se pudo enviar el código de recuperación.';
        }
      }
    });
  }

  goBack() {
    this.router.navigate(['/login']);
  }
}