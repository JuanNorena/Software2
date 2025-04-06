import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { tap } from 'rxjs/operators';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = environment.apiUrl;
  
  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  /**
   * Registra un nuevo usuario en el sistema
   * @param userData Datos del formulario de registro
   * @returns Observable con la respuesta del servidor
   */
  register(userData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/auth/register`, userData)
      .pipe(
        tap(response => {
          // Si el backend devuelve un token tras el registro, lo guardamos
          if (response && response.token) {
            localStorage.setItem('token', response.token);
            if (response.usuario) {
              localStorage.setItem('usuario', JSON.stringify(response.usuario));
            }
          }
        })
      );
  }

  /**
   * Actualiza la información de un usuario existente
   * @param userId ID del usuario a actualizar
   * @param userData Datos actualizados del usuario
   * @returns Observable con la respuesta del servidor
   */
  updateUser(userId: string, userData: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/users/${userId}`, userData);
  }

  /**
   * Obtiene la información de un usuario específico
   * @param userId ID del usuario a consultar
   * @returns Observable con los datos del usuario
   */
  getUserById(userId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/users/${userId}`);
  }

  /**
   * Verifica si un nombre de usuario ya está en uso
   * @param username Nombre de usuario a verificar
   * @returns Observable con la respuesta de disponibilidad
   */
  checkUsernameAvailability(username: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/users/check-username/${username}`);
  }
}