// components/sidebar/sidebar.component.ts
import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {
  @Input() rolUsuario: string | null = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (!this.rolUsuario) {
      const usuario = this.authService.getUserData();
      this.rolUsuario = usuario?.rol;
    }
  }

  cerrarSesion(): void {
    console.log('Iniciando cierre de sesión');
    this.authService.logout().subscribe({
      next: () => {
        console.log('Sesión cerrada exitosamente');
        // La redirección ya está manejada por el AuthService
      },
      error: (error) => {
        console.error('Error al cerrar sesión:', error);
        // La limpieza y redirección ya está manejada por el AuthService
      }
    });
  }
}