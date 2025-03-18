package software2.backend.exception;

/**
 * Excepción lanzada cuando una solicitud contiene datos inválidos o inconsistentes.
 * Se utiliza para indicar problemas con los parámetros proporcionados por el cliente.
 */
public class BadRequestException extends RuntimeException {

    private static final long serialVersionUID = 1L;

    /**
     * Constructor con mensaje personalizado
     *
     * @param message Mensaje de error
     */
    public BadRequestException(String message) {
        super(message);
    }

    /**
     * Constructor con mensaje y causa
     *
     * @param message Mensaje de error
     * @param cause Causa de la excepción
     */
    public BadRequestException(String message, Throwable cause) {
        super(message, cause);
    }
} 