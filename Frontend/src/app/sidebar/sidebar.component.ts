// components/sidebar/sidebar.component.ts
import { Component, Input, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {
  @Input() rolUsuario: string | null = '';

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    if (!this.rolUsuario) {
      const usuario = this.authService.getUserData();
      this.rolUsuario = usuario?.rol;
    }
  }

  cerrarSesion(): void {
    this.authService.logout();
  }
}