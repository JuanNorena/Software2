import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PasswordRecoveryService {
  private apiUrl = 'http://localhost:3000/api/auth'; // ajustá si es necesario

  constructor(private http: HttpClient) {}

  /**
   * Envía una solicitud de código de recuperación al correo
   */
  solicitarCodigo(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/solicitar-restablecimiento`, { email });
  }

  /**
   * Verifica si el código enviado al correo es válido
   */
  verificarCodigo(email: string, codigo: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/verificar-codigo`, { email, codigo });
  }

  /**
   * Cambia la contraseña si el código fue verificado exitosamente
   */
  cambiarContrasenia(email: string, nuevaContrasenia: string, codigo: string) {
    return this.http.post(`${this.apiUrl}/cambiar-contraseña`, {
      email,
      nuevaContrasenia,
      codigo
    });
  }
}
