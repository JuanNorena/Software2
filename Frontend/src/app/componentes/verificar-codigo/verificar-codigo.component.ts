import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { PasswordRecoveryService } from '../../services/password-recovery.service';


@Component({
  selector: 'app-verificar-codigo',
  standalone: true,
  templateUrl: './verificar-codigo.component.html',
  styleUrls: ['./verificar-codigo.component.css'],
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
})
export class VerificarCodigoComponent {
  formulario: FormGroup;
  email: string = '';
  mensajeError = '';
  cargando = false;

  constructor(
    private fb: FormBuilder,
    private recoveryService: PasswordRecoveryService,
    public router: Router

  ) {
    this.formulario = this.fb.group({
      codigo: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]]
    });

    const state = history.state;
    this.email = state['email'] || '';
    if (!this.email) {
      this.router.navigate(['/recuperar-password']);
    }
  }

  onSubmit() {
    if (this.formulario.invalid || !this.email) return;

    this.cargando = true;
    const { codigo } = this.formulario.value;

    this.recoveryService.verificarCodigo(this.email, codigo).subscribe({
      next: () => {
        // Si es válido, llevamos al componente para cambiar contraseña
        this.router.navigate(['/cambiar-password'], {
          state: { email: this.email, codigo }
        });
      },
      error: (error) => {
        this.mensajeError = error?.error?.message || 'Código inválido o expirado';
        this.cargando = false;
      }
    });
  }
}