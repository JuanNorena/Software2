package software2.backend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import lombok.Data;

/**
 * Configuración para propiedades relacionadas con JWT.
 * Mapea las propiedades definidas en application.properties con prefijo 'jwt'.
 */
@Configuration
@ConfigurationProperties(prefix = "jwt")
@Data
public class JwtConfig {
    
    /**
     * Clave secreta utilizada para firmar los tokens JWT
     */
    private String secret;
    
    /**
     * Tiempo de expiración del token JWT en milisegundos
     */
    private long expiration;
} 