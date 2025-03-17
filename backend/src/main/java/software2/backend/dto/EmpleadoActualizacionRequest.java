package software2.backend.dto;

import java.time.LocalDate;

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
    private String email;
    private LocalDate fechaNacimiento;
    private String profesion;
    private String cargo;
    private Double sueldoBase; // Usamos wrapper para permitir valores nulos
} 