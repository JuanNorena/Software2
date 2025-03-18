package software2.backend.dto;

import java.time.LocalDate;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Positive;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO para recibir datos de actualización de un empleado existente.
 * A diferencia del DTO de registro, no incluye credenciales y todos los campos son opcionales.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class EmpleadoActualizacionRequest {
    private String nombre;
    private String rut;
    
    @Email(message = "El formato del email no es válido")
    private String email;
    
    @Past(message = "La fecha de nacimiento debe ser en el pasado")
    private LocalDate fechaNacimiento;
    
    private String profesion;
    private String cargo;
    
    @Positive(message = "El sueldo base debe ser un valor positivo")
    private Double sueldoBase; // Usamos wrapper para permitir valores nulos
} 