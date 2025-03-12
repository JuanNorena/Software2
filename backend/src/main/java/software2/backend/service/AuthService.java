package software2.backend.service;

import java.util.Date;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;

import software2.backend.model.Usuario;
import software2.backend.repository.UsuarioRepository;

/**
 * Servicio para manejar la autenticación y generación de tokens JWT.
 */
@Service
public class AuthService implements UserDetailsService {

    private final UsuarioRepository usuarioRepository;
    
    @Value("${jwt.secret:secretKey}")
    private String jwtSecret;
    
    @Value("${jwt.expiration:86400000}")
    private long jwtExpiration;
    
    public AuthService(UsuarioRepository usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
    }
    
    /**
     * Carga un usuario por su nombre de usuario
     * @param username El nombre de usuario a buscar
     * @return El usuario encontrado
     * @throws UsernameNotFoundException Si el usuario no existe
     */
    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        Usuario usuario = usuarioRepository.findByUsername(username);
        if (usuario == null) {
            throw new UsernameNotFoundException("Usuario no encontrado: " + username);
        }
        return usuario;
    }
    
    /**
     * Genera un token JWT para un usuario autenticado
     * @param authentication La autenticación del usuario
     * @return El token JWT generado
     */
    public String generateToken(Authentication authentication) {
        Usuario usuario = (Usuario) authentication.getPrincipal();
        
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtExpiration);
        
        // Crear una clave segura a partir del secreto
        SecretKey key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
        
        return Jwts.builder()
                .setSubject(usuario.getUsername())
                .setIssuedAt(now)
                .setExpiration(expiryDate)
                .claim("rol", usuario.getRol())
                .signWith(key)
                .compact();
    }
    
    /**
     * Valida un token JWT
     * @param token El token JWT a validar
     * @return true si el token es válido, false en caso contrario
     */
    public boolean validateToken(String token) {
        try {
            // Crear una clave segura a partir del secreto
            SecretKey key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
            
            Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }
    
    /**
     * Obtiene el nombre de usuario de un token JWT
     * @param token El token JWT
     * @return El nombre de usuario
     */
    public String getUsernameFromToken(String token) {
        // Crear una clave segura a partir del secreto
        SecretKey key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
        
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)
                .getBody();
        
        return claims.getSubject();
    }
}