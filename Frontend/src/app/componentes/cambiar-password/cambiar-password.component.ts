import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { PasswordRecoveryService } from '../../services/password-recovery.service';

@Component({
  selector: 'app-cambiar-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './cambiar-password.component.html',
  styleUrls: ['./cambiar-password.component.css']
})
export class CambiarPasswordComponent {
  form!: FormGroup;
  email: string = '';
  codigo: string = '';
  mensajeError = '';
  cargando = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private recoveryService: PasswordRecoveryService
  ) {
    this.form = this.fb.group({
      nuevaContrasenia: ['', [Validators.required, Validators.minLength(8)]]
    });

    const state = history.state;
    this.email = state['email'] || '';
    this.codigo = state['codigo'] || '';

    if (!this.email || !this.codigo) {
      this.router.navigate(['/recuperar-password']);
    }
  }

  cambiarContrasenia() {
    if (this.form.invalid) return;

    this.cargando = true;
    const { nuevaContrasenia } = this.form.value;

    this.recoveryService.cambiarContrasenia(this.email, this.codigo, nuevaContrasenia).subscribe({
      next: () => {
        this.router.navigate(['/login'], {
          queryParams: { mensaje: 'Contraseña actualizada con éxito' }
        });
      },
      error: (err) => {
        this.mensajeError = err.error?.message || 'No se pudo actualizar la contraseña';
        this.cargando = false;
      }
    });
  }

  volver() {
    this.router.navigate(['/login']);
  }
}
