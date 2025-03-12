package software2.backend.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import software2.backend.model.Empresa;

/**
 * Repositorio para operaciones CRUD con entidades Empresa.
 * Proporciona métodos para buscar, guardar, actualizar y eliminar empresas en la base de datos.
 */
@Repository
public interface EmpresaRepository extends MongoRepository<Empresa, String> {
    
    /**
     * Busca una empresa por su nombre
     * @param nombre El nombre de la empresa a buscar
     * @return La empresa encontrada o null si no existe
     */
    Empresa findByNombre(String nombre);
    
    /**
     * Busca una empresa por su RUT
     * @param rut El RUT de la empresa a buscar
     * @return La empresa encontrada o null si no existe
     */
    Empresa findByRut(String rut);
    
    /**
     * Verifica si existe una empresa con el RUT especificado
     * @param rut El RUT a verificar
     * @return true si existe, false en caso contrario
     */
    boolean existsByRut(String rut);
}