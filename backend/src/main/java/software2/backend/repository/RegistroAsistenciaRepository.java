package software2.backend.repository;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import software2.backend.model.Empleado;
import software2.backend.model.RegistroAsistencia;

/**
 * Repositorio para operaciones CRUD con entidades RegistroAsistencia.
 * Proporciona métodos para buscar, guardar, actualizar y eliminar registros de asistencia en la base de datos.
 */
@Repository
public interface RegistroAsistenciaRepository extends MongoRepository<RegistroAsistencia, String> {
    
    /**
     * Busca registros de asistencia por empleado
     * @param empleado El empleado cuyos registros se quieren obtener
     * @return Lista de registros de asistencia del empleado
     */
    List<RegistroAsistencia> findByEmpleado(Empleado empleado);
    
    /**
     * Busca registros de asistencia por fecha
     * @param fecha La fecha de los registros a buscar
     * @return Lista de registros de asistencia de la fecha especificada
     */
    List<RegistroAsistencia> findByFecha(LocalDate fecha);
    
    /**
     * Busca registros de asistencia por empleado y fecha
     * @param empleado El empleado cuyos registros se quieren obtener
     * @param fecha La fecha de los registros a buscar
     * @return Lista de registros de asistencia del empleado en la fecha especificada
     */
    List<RegistroAsistencia> findByEmpleadoAndFecha(Empleado empleado, LocalDate fecha);
    
    /**
     * Busca registros de asistencia por empleado y fecha donde la hora de salida es nula
     * @param empleado El empleado cuyos registros se quieren obtener
     * @param fecha La fecha de los registros a buscar
     * @return El registro de asistencia sin hora de salida o null si no existe
     */
    RegistroAsistencia findByEmpleadoAndFechaAndHoraSalidaIsNull(Empleado empleado, LocalDate fecha);
    
    /**
     * Busca registros de asistencia por empleado y rango de fechas
     * @param empleado El empleado cuyos registros se quieren obtener
     * @param fechaInicio La fecha de inicio del rango
     * @param fechaFin La fecha de fin del rango
     * @return Lista de registros de asistencia del empleado en el rango de fechas especificado
     */
    List<RegistroAsistencia> findByEmpleadoAndFechaBetween(Empleado empleado, LocalDate fechaInicio, LocalDate fechaFin);
    
    /**
     * Busca registros de asistencia por rango de fechas
     * @param fechaInicio La fecha de inicio del rango
     * @param fechaFin La fecha de fin del rango
     * @return Lista de registros de asistencia en el rango de fechas especificado
     */
    List<RegistroAsistencia> findByFechaBetween(LocalDate fechaInicio, LocalDate fechaFin);
}