package software2.backend.exception;

/**
 * Excepción lanzada cuando un recurso solicitado no existe.
 * Se utiliza para identificar casos en los que se busca una entidad por ID y no se encuentra.
 */
public class ResourceNotFoundException extends RuntimeException {

    private static final long serialVersionUID = 1L;

    /**
     * Constructor con mensaje personalizado
     *
     * @param message Mensaje de error
     */
    public ResourceNotFoundException(String message) {
        super(message);
    }

    /**
     * Constructor con mensaje generado automáticamente para recursos por ID
     *
     * @param resourceName Nombre del recurso (ej: "Empleado")
     * @param fieldName Nombre del campo (ej: "id")
     * @param fieldValue Valor del campo
     */
    public ResourceNotFoundException(String resourceName, String fieldName, Object fieldValue) {
        super(String.format("%s no encontrado con %s: '%s'", resourceName, fieldName, fieldValue));
    }
} 