import { Component, OnInit } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink,SidebarComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  rolUsuario: string | null = '';
  nombreUsuario: string = '';

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    const usuario = this.authService.getUserData();
    this.rolUsuario = usuario?.rol;
    this.nombreUsuario = usuario?.nombre;
  }
}