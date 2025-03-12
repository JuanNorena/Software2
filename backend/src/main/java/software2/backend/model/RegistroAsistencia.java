package software2.backend.model;

import java.time.LocalDate;
import java.time.LocalTime;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import com.fasterxml.jackson.annotation.JsonIgnore;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Representa un registro de asistencia de un empleado en el sistema PersonalPay.
 * Contiene la información de fecha, hora de entrada, hora de salida y total de horas trabajadas.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "registros_asistencia")
public class RegistroAsistencia {
    
    @Id
    private String id;
    
    private LocalDate fecha;
    private LocalTime horaEntrada;
    private LocalTime horaSalida;
    private double totalHorasTrabajadas;
    
    // Relación con empleado (un registro pertenece a un empleado)
    @JsonIgnore // Evita ciclos infinitos en la serialización JSON
    private Empleado empleado;
    
    /**
     * Calcula el total de horas trabajadas en base a la hora de entrada y salida
     * @return El total de horas trabajadas
     */
    public double calcularHorasTrabajadas() {
        if (horaEntrada != null && horaSalida != null) {
            // Convertir a segundos para mayor precisión
            int entradaSegundos = horaEntrada.toSecondOfDay();
            int salidaSegundos = horaSalida.toSecondOfDay();
            
            // Si la salida es antes que la entrada, asumimos que es del día siguiente
            if (salidaSegundos < entradaSegundos) {
                salidaSegundos += 24 * 60 * 60; // Añadimos 24 horas en segundos
            }
            
            // Calcular la diferencia en horas con precisión
            double horasTrabajadas = (salidaSegundos - entradaSegundos) / 3600.0;
            
            // Redondear a 2 decimales
            return Math.round(horasTrabajadas * 100.0) / 100.0;
        }
        return 0.0;
    }
    
    /**
     * Actualiza el total de horas trabajadas
     */
    public void actualizarTotalHoras() {
        this.totalHorasTrabajadas = calcularHorasTrabajadas();
    }
}