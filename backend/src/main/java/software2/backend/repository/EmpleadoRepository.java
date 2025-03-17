package software2.backend.repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import software2.backend.model.Empleado;
import software2.backend.model.Empresa;

/**
 * Repositorio para operaciones CRUD con entidades Empleado.
 * Proporciona métodos para buscar, guardar, actualizar y eliminar empleados en la base de datos.
 */
@Repository
public interface EmpleadoRepository extends MongoRepository<Empleado, String> {
    
    /**
     * Busca un empleado por su RUT
     * @param rut El RUT del empleado a buscar
     * @return El empleado encontrado o null si no existe
     */
    Empleado findByRut(String rut);
    
    /**
     * Busca todos los empleados de una empresa
     * @param empresa La empresa cuyos empleados se quieren obtener
     * @return Lista de empleados de la empresa
     */
    List<Empleado> findByEmpresa(Empresa empresa);
    
    /**
     * Busca empleados por su cargo
     * @param cargo El cargo de los empleados a buscar
     * @return Lista de empleados con el cargo especificado
     */
    List<Empleado> findByCargo(String cargo);
    
    /**
     * Verifica si existe un empleado con el RUT especificado
     * @param rut El RUT a verificar
     * @return true si existe, false en caso contrario
     */
    boolean existsByRut(String rut);
    
    /**
     * Busca empleados por nombre (búsqueda parcial, no sensible a mayúsculas/minúsculas)
     * @param nombre El nombre o parte del nombre a buscar
     * @return Lista de empleados que coinciden con el criterio de búsqueda
     */
    List<Empleado> findByNombreContainingIgnoreCase(String nombre);
    
    /**
     * Busca un empleado por su correo electrónico
     * @param email El correo electrónico del empleado a buscar
     * @return El empleado encontrado o null si no existe
     */
    Empleado findByEmail(String email);
}