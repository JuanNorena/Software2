package software2.backend.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import software2.backend.model.Usuario;

/**
 * Repositorio para operaciones CRUD con entidades Usuario.
 * Proporciona métodos para buscar, guardar, actualizar y eliminar usuarios en la base de datos.
 */
@Repository
public interface UsuarioRepository extends MongoRepository<Usuario, String> {
    
    /**
     * Busca un usuario por su nombre de usuario
     * @param username El nombre de usuario a buscar
     * @return El usuario encontrado o null si no existe
     */
    Usuario findByUsername(String username);
    
    /**
     * Verifica si existe un usuario con el nombre de usuario especificado
     * @param username El nombre de usuario a verificar
     * @return true si existe, false en caso contrario
     */
    boolean existsByUsername(String username);
}