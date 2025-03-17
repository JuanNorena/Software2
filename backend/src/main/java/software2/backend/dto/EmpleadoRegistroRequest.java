package software2.backend.dto;

import java.time.LocalDate;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO para recibir los datos de registro de un nuevo empleado.
 * Incluye información personal y credenciales para la cuenta de usuario.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class EmpleadoRegistroRequest {
    // Datos personales
    private String nombre;
    private String rut;
    private String email;  // Obligatorio para recuperación de contraseña
    private LocalDate fechaNacimiento;
    private String profesion;
    private String cargo;
    private double sueldoBase;
    
    // Credenciales (opcional, se puede generar automáticamente)
    private String username;
    private String password;
} 