package software2.backend.dto;

import java.time.LocalDate;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Positive;

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
    @NotBlank(message = "El nombre es obligatorio")
    private String nombre;
    
    @NotBlank(message = "El RUT es obligatorio")
    private String rut;
    
    @NotBlank(message = "El email es obligatorio")
    @Email(message = "El formato del email no es válido")
    private String email;  // Obligatorio para recuperación de contraseña
    
    @Past(message = "La fecha de nacimiento debe ser en el pasado")
    private LocalDate fechaNacimiento;
    
    private String profesion;
    
    @NotBlank(message = "El cargo es obligatorio")
    private String cargo;
    
    @NotNull(message = "El sueldo base es obligatorio")
    @Positive(message = "El sueldo base debe ser un valor positivo")
    private double sueldoBase;
    
    // Credenciales (opcional, se puede generar automáticamente)
    private String username;
    private String password;
} 