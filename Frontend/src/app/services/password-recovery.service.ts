// password-recovery.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PasswordRecoveryService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  // Método para solicitar código de recuperación
  solicitarCodigo(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/solicitar-reset`, { email });
  }

  // Método para verificar el código enviado
  verificarCodigo(email: string, codigo: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/verificar-codigo`, { email, codigo });
  }

  // Método para cambiar la contraseña
  cambiarContrasenia(email: string, codigo: string, nuevaContrasenia: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/cambiar-password`, { 
      email, 
      codigo, 
      nuevaContrasenia 
    });
  }
}