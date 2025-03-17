package software2.backend.dto;

import java.time.LocalDate;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import software2.backend.model.Empleado;

/**
 * DTO para enviar información de empleados como respuesta.
 * Incluye información personal pero omite detalles sensibles o relaciones complejas.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class EmpleadoResponse {
    private String id;
    private String nombre;
    private String rut;
    private String email;
    private LocalDate fechaNacimiento;
    private String profesion;
    private String cargo;
    private double sueldoBase;
    
    /**
     * Convierte un objeto Empleado en EmpleadoResponse
     * @param empleado Empleado a convertir
     * @return DTO con los datos del empleado
     */
    public static EmpleadoResponse fromEmpleado(Empleado empleado) {
        if (empleado == null) {
            return null;
        }
        
        EmpleadoResponse response = new EmpleadoResponse();
        response.setId(empleado.getId());
        response.setNombre(empleado.getNombre());
        response.setRut(empleado.getRut());
        response.setEmail(empleado.getEmail());
        response.setFechaNacimiento(empleado.getFechaNacimiento());
        response.setProfesion(empleado.getProfesion());
        response.setCargo(empleado.getCargo());
        response.setSueldoBase(empleado.getSueldoBase());
        
        return response;
    }
} 