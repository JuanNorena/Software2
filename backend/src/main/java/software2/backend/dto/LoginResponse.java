package software2.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO para enviar la respuesta de inicio de sesión exitoso.
 * Contiene el token JWT, información del usuario y su rol.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class LoginResponse {
    private String token;
    private String userId;
    private String username;
    private String rol;
    private String empleadoId; // Solo para usuarios con rol EMPLEADO
}