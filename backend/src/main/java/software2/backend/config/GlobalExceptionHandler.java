package software2.backend.config;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.context.request.WebRequest;

import java.util.HashMap;
import java.util.Map;

/**
 * Manejador global de excepciones para la aplicación.
 * Proporciona respuestas estandarizadas para diferentes tipos de excepciones.
 */
@ControllerAdvice
public class GlobalExceptionHandler {

    /**
     * Maneja excepciones generales
     * @param ex La excepción
     * @param request La solicitud web
     * @return Respuesta con mensaje de error
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<?> handleGlobalException(Exception ex, WebRequest request) {
        Map<String, Object> body = new HashMap<>();
        body.put("error", "Error en el servidor");
        body.put("mensaje", ex.getMessage());
        
        return new ResponseEntity<>(body, HttpStatus.INTERNAL_SERVER_ERROR);
    }
    
    /**
     * Maneja excepciones de autenticación
     * @param ex La excepción
     * @param request La solicitud web
     * @return Respuesta con mensaje de error
     */
    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<?> handleAuthenticationException(AuthenticationException ex, WebRequest request) {
        Map<String, Object> body = new HashMap<>();
        body.put("error", "Error de autenticación");
        body.put("mensaje", ex.getMessage());
        
        return new ResponseEntity<>(body, HttpStatus.UNAUTHORIZED);
    }
    
    /**
     * Maneja excepciones de credenciales incorrectas
     * @param ex La excepción
     * @param request La solicitud web
     * @return Respuesta con mensaje de error
     */
    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<?> handleBadCredentialsException(BadCredentialsException ex, WebRequest request) {
        Map<String, Object> body = new HashMap<>();
        body.put("error", "Credenciales incorrectas");
        body.put("mensaje", "El nombre de usuario o la contraseña son incorrectos");
        
        return new ResponseEntity<>(body, HttpStatus.UNAUTHORIZED);
    }
    
    /**
     * Maneja excepciones de acceso denegado
     * @param ex La excepción
     * @param request La solicitud web
     * @return Respuesta con mensaje de error
     */
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<?> handleAccessDeniedException(AccessDeniedException ex, WebRequest request) {
        Map<String, Object> body = new HashMap<>();
        body.put("error", "Acceso denegado");
        body.put("mensaje", "No tiene permisos para acceder a este recurso");
        
        return new ResponseEntity<>(body, HttpStatus.FORBIDDEN);
    }
} 