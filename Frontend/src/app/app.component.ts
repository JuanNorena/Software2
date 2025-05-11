import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd, Event as RouterEvent } from '@angular/router';
import { SidebarComponent } from './componentes/sidebar/sidebar.component';
import { AuthService } from './services/auth.service';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent],
  template: `
    <div class="app-container">
      <!-- Solo mostramos el sidebar si NO estamos en la página de login -->
      <app-sidebar [rolUsuario]="rolUsuario" *ngIf="!isLoginPage"></app-sidebar>
      <div class="content-area" [ngClass]="{'full-width': isLoginPage}">
        <router-outlet></router-outlet>
      </div>
    </div>
  `,
  styles: [`
    .app-container {
      display: flex;
    }
    .content-area {
      margin-left: 250px;
      width: calc(100% - 250px);
      min-height: 100vh;
      background-color: #f5f5f5;
      transition: all 0.3s ease;
    }
    .full-width {
      margin-left: 0;
      width: 100%;
    }
    @media (max-width: 768px) {
      .content-area {
        margin-left: 0;
        width: 100%;
      }
    }
  `]
})
export class AppComponent implements OnInit {
  rolUsuario: string | null = null;
  isLoginPage: boolean = false;

  constructor(
    private authService: AuthService, 
    private router: Router
  ) {
    // Suscribirse a los eventos de navegación para detectar la ruta actual
    this.router.events.pipe(
      filter((event: RouterEvent): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      // Verificar si estamos en la página de login
      this.isLoginPage = event.urlAfterRedirects === '/login' || 
                         event.urlAfterRedirects === '/login/' || 
                         event.urlAfterRedirects === '/';
    });
  }

  ngOnInit() {
    const userData = this.authService.getUserData();
    this.rolUsuario = userData?.rol || null;
    
    // Verificar la URL inicial
    const currentUrl = this.router.url;
    this.isLoginPage = currentUrl === '/login' || 
                       currentUrl === '/login/' || 
                       currentUrl === '/';
  }
}