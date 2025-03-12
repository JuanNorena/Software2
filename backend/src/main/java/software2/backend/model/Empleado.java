package software2.backend.model;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import com.fasterxml.jackson.annotation.JsonIgnore;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Representa un empleado en el sistema PersonalPay.
 * Contiene la información personal y laboral del empleado.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "empleados")
public class Empleado {
    
    @Id
    private String id;
    
    private String nombre;
    private String rut;
    private LocalDate fechaNacimiento;
    private String profesion;
    private String cargo;
    private double sueldoBase;
    
    // Relación con empresa (un empleado trabaja en una empresa)
    @JsonIgnore // Evita ciclos infinitos en la serialización JSON
    private Empresa empresa;
    
    // Relación con registros de asistencia
    private List<RegistroAsistencia> registrosAsistencia = new ArrayList<>();
    
    // Relación con liquidaciones de sueldo
    private List<LiquidacionSueldo> liquidacionesSueldo = new ArrayList<>();
    
    /**
     * Agrega un registro de asistencia al empleado
     * @param registro El registro de asistencia a agregar
     */
    public void agregarRegistroAsistencia(RegistroAsistencia registro) {
        if (registrosAsistencia == null) {
            registrosAsistencia = new ArrayList<>();
        }
        registrosAsistencia.add(registro);
        registro.setEmpleado(this);
    }
    
    /**
     * Agrega una liquidación de sueldo al empleado
     * @param liquidacion La liquidación de sueldo a agregar
     */
    public void agregarLiquidacionSueldo(LiquidacionSueldo liquidacion) {
        if (liquidacionesSueldo == null) {
            liquidacionesSueldo = new ArrayList<>();
        }
        liquidacionesSueldo.add(liquidacion);
        liquidacion.setEmpleado(this);
    }
}