package software2.backend.model;

import java.util.ArrayList;
import java.util.List;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Representa una empresa en el sistema PersonalPay.
 * Contiene la información básica de la empresa y mantiene una relación
 * con sus empleados.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "empresas")
public class Empresa {
    
    @Id
    private String id;
    
    private String nombre;
    private String rut;
    private String direccion;
    private String telefono;
    private String email;
    
    // Relación con empleados (un empleado trabaja en una empresa)
    private List<Empleado> empleados = new ArrayList<>();
    
    /**
     * Agrega un empleado a la empresa
     * @param empleado El empleado a agregar
     */
    public void agregarEmpleado(Empleado empleado) {
        if (empleados == null) {
            empleados = new ArrayList<>();
        }
        empleados.add(empleado);
        empleado.setEmpresa(this);
    }
}