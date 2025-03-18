package software2.backend.repository;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import software2.backend.model.Empleado;
import software2.backend.model.LiquidacionSueldo;

/**
 * Repositorio para operaciones CRUD con entidades LiquidacionSueldo.
 * Proporciona métodos para buscar, guardar, actualizar y eliminar liquidaciones de sueldo en la base de datos.
 */
@Repository
public interface LiquidacionSueldoRepository extends MongoRepository<LiquidacionSueldo, String> {
    
    /**
     * Busca liquidaciones de sueldo por empleado
     * @param empleado El empleado cuyas liquidaciones se quieren obtener
     * @return Lista de liquidaciones de sueldo del empleado
     */
    List<LiquidacionSueldo> findByEmpleado(Empleado empleado);
    
    /**
     * Busca liquidaciones de sueldo por fecha
     * @param fecha La fecha de las liquidaciones a buscar
     * @return Lista de liquidaciones de sueldo de la fecha especificada
     */
    List<LiquidacionSueldo> findByFecha(LocalDate fecha);
    
    /**
     * Busca liquidaciones de sueldo por empleado y fecha
     * @param empleado El empleado cuyas liquidaciones se quieren obtener
     * @param fecha La fecha de las liquidaciones a buscar
     * @return Lista de liquidaciones de sueldo del empleado en la fecha especificada
     */
    List<LiquidacionSueldo> findByEmpleadoAndFecha(Empleado empleado, LocalDate fecha);
    
    /**
     * Busca liquidaciones de sueldo por rango de fechas
     * @param fechaInicio La fecha de inicio del rango
     * @param fechaFin La fecha de fin del rango
     * @return Lista de liquidaciones de sueldo en el rango de fechas especificado
     */
    List<LiquidacionSueldo> findByFechaBetween(LocalDate fechaInicio, LocalDate fechaFin);
    
    /**
     * Busca liquidaciones de sueldo por empleado y rango de fechas
     * @param empleado El empleado cuyas liquidaciones se quieren obtener
     * @param fechaInicio La fecha de inicio del rango
     * @param fechaFin La fecha de fin del rango
     * @return Lista de liquidaciones de sueldo del empleado en el rango de fechas especificado
     */
    List<LiquidacionSueldo> findByEmpleadoAndFechaBetween(Empleado empleado, LocalDate fechaInicio, LocalDate fechaFin);
    
    /**
     * Busca liquidaciones de sueldo por estado
     * @param estado El estado de las liquidaciones a buscar ("emitido" o "pagado")
     * @return Lista de liquidaciones de sueldo con el estado especificado
     */
    List<LiquidacionSueldo> findByEstado(String estado);
    
    /**
     * Busca liquidaciones de sueldo por empleado y estado
     * @param empleado El empleado cuyas liquidaciones se quieren obtener
     * @param estado El estado de las liquidaciones a buscar
     * @return Lista de liquidaciones de sueldo del empleado con el estado especificado
     */
    List<LiquidacionSueldo> findByEmpleadoAndEstado(Empleado empleado, String estado);
    
    /**
     * Busca liquidaciones de sueldo por año y mes
     * @param anio El año de las liquidaciones a buscar
     * @param mes El mes de las liquidaciones a buscar (1-12)
     * @return Lista de liquidaciones de sueldo del año y mes especificados
     */
    @Query("{'fecha': {'$gte': {'$date': '?0-?1-01'}, '$lte': {'$date': '?0-?1-?2'}}}")
    List<LiquidacionSueldo> findByFechaAnioAndFechaMes(int anio, int mes);
    
    /**
     * Busca liquidaciones de sueldo por empleado, año y mes
     * @param empleado El empleado cuyas liquidaciones se quieren obtener
     * @param anio El año de las liquidaciones a buscar
     * @param mes El mes de las liquidaciones a buscar (1-12)
     * @return Lista de liquidaciones de sueldo del empleado, año y mes especificados
     */
    @Query("{'empleado': ?0, 'fecha': {'$gte': {'$date': '?1-?2-01'}, '$lte': {'$date': '?1-?2-?3'}}}")
    List<LiquidacionSueldo> findByEmpleadoAndFechaAnioAndFechaMes(Empleado empleado, int anio, int mes);
    
    /**
     * Cuenta liquidaciones de sueldo por año y mes
     * @param anio El año de las liquidaciones a contar
     * @param mes El mes de las liquidaciones a contar (1-12)
     * @return Número de liquidaciones de sueldo del año y mes especificados
     */
    @Query(value = "{'fecha': {'$gte': {'$date': '?0-?1-01'}, '$lte': {'$date': '?0-?1-?2'}}}", count = true)
    long countByFechaAnioAndFechaMes(int anio, int mes);
}