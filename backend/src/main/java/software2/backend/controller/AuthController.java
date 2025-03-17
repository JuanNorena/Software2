package software2.backend.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import software2.backend.model.Empleado;
import software2.backend.model.RegistroAsistencia;
import software2.backend.model.Usuario;
import software2.backend.repository.RegistroAsistenciaRepository;
import software2.backend.service.AuthService;
import software2.backend.dto.LoginRequest;
import software2.backend.dto.LoginResponse;
import software2.backend.service.PasswordResetService;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Map;

/**
 * Controlador para manejar la autenticación de usuarios.
 * Proporciona endpoints para iniciar y cerrar sesión.
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthenticationManager authenticationManager;
    
    @Autowired
    private AuthService authService;
    
    @Autowired
    private RegistroAsistenciaRepository registroAsistenciaRepository;
    
    @Autowired
    private PasswordResetService passwordResetService;
    
    /**
     * Endpoint para iniciar sesión
     * @param loginRequest Datos de inicio de sesión (username y password)
     * @return Respuesta con token y rol del usuario
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest) {
        try {
            // Validar datos de entrada
            if (loginRequest.getUsername() == null || loginRequest.getUsername().trim().isEmpty() ||
                loginRequest.getPassword() == null || loginRequest.getPassword().trim().isEmpty()) {
                return ResponseEntity.badRequest().body("El nombre de usuario y la contraseña son obligatorios");
            }
            
            // Autenticar usuario
            Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getUsername(), loginRequest.getPassword())
            );
            
            SecurityContextHolder.getContext().setAuthentication(authentication);
            
            // Obtener usuario autenticado
            Usuario usuario = (Usuario) authentication.getPrincipal();
            
            // Si es empleado, registrar entrada
            if ("EMPLEADO".equals(usuario.getRol()) && usuario.getEmpleado() != null) {
                registrarEntrada(usuario.getEmpleado());
            }
            
            // Generar token JWT
            String token = authService.generateToken(authentication);
            
            // Crear respuesta
            LoginResponse response = new LoginResponse(
                token,
                usuario.getId(),
                usuario.getUsername(),
                usuario.getRol(),
                usuario.getEmpleado() != null ? usuario.getEmpleado().getId() : null
            );
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error de autenticación: " + e.getMessage());
        }
    }
    
    /**
     * Endpoint para cerrar sesión
     * @return Mensaje de éxito
     */
    @PostMapping("/logout")
    public ResponseEntity<?> logout() {
        // Obtener usuario autenticado
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        Usuario usuario = (Usuario) authentication.getPrincipal();
        
        // Si es empleado, registrar salida
        if ("EMPLEADO".equals(usuario.getRol()) && usuario.getEmpleado() != null) {
            registrarSalida(usuario.getEmpleado());
        }
        
        // Limpiar contexto de seguridad
        SecurityContextHolder.clearContext();
        
        return ResponseEntity.ok().body("Sesión cerrada con éxito");
    }
    
    /**
     * Registra la entrada de un empleado
     * @param empleado Empleado que inicia sesión
     */
    private void registrarEntrada(Empleado empleado) {
        RegistroAsistencia registro = new RegistroAsistencia();
        registro.setFecha(LocalDate.now());
        registro.setHoraEntrada(LocalTime.now());
        registro.setEmpleado(empleado);
        
        registroAsistenciaRepository.save(registro);
        empleado.agregarRegistroAsistencia(registro);
    }
    
    /**
     * Registra la salida de un empleado
     * @param empleado Empleado que cierra sesión
     */
    private void registrarSalida(Empleado empleado) {
        // Buscar el registro de asistencia del día actual sin hora de salida
        RegistroAsistencia registro = registroAsistenciaRepository.findByEmpleadoAndFechaAndHoraSalidaIsNull(
            empleado, LocalDate.now()
        );
        
        if (registro != null) {
            registro.setHoraSalida(LocalTime.now());
            registro.actualizarTotalHoras();
            registroAsistenciaRepository.save(registro);
        }
    }

    /**
     * Endpoint para iniciar el proceso de recuperación de contraseña
     * @param requestMap Mapa con el correo electrónico
     * @return Mensaje indicando si se envió el correo
     */
    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> requestMap) {
        String email = requestMap.get("email");
        
        if (email == null || email.trim().isEmpty()) {
            return ResponseEntity.badRequest().body("El correo electrónico es obligatorio");
        }
        
        boolean result = passwordResetService.initiatePasswordReset(email);
        
        if (result) {
            return ResponseEntity.ok("Se ha enviado un correo con las instrucciones para restablecer la contraseña");
        } else {
            // Por razones de seguridad, no indicamos si el correo existe o no
            return ResponseEntity.ok("Si el correo está registrado, recibirás las instrucciones para restablecer la contraseña");
        }
    }
    
    /**
     * Endpoint para validar un token de recuperación de contraseña
     * @param requestMap Mapa con el token de recuperación
     * @return Estado de validación del token
     */
    @PostMapping("/validate-reset-token")
    public ResponseEntity<?> validateResetToken(@RequestBody Map<String, String> requestMap) {
        String token = requestMap.get("token");
        
        if (token == null || token.trim().isEmpty()) {
            return ResponseEntity.badRequest().body("El token es obligatorio");
        }
        
        boolean isValid = passwordResetService.validateResetToken(token);
        
        if (isValid) {
            return ResponseEntity.ok(Map.of("valid", true));
        } else {
            return ResponseEntity.ok(Map.of("valid", false, "message", "El token es inválido o ha expirado"));
        }
    }
    
    /**
     * Endpoint para restablecer la contraseña
     * @param requestMap Mapa con el token y la nueva contraseña
     * @return Mensaje indicando si se cambió la contraseña
     */
    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> requestMap) {
        String token = requestMap.get("token");
        String newPassword = requestMap.get("newPassword");
        
        if (token == null || token.trim().isEmpty()) {
            return ResponseEntity.badRequest().body("El token es obligatorio");
        }
        
        if (newPassword == null || newPassword.trim().isEmpty()) {
            return ResponseEntity.badRequest().body("La nueva contraseña es obligatoria");
        }
        
        boolean result = passwordResetService.completePasswordReset(token, newPassword);
        
        if (result) {
            return ResponseEntity.ok("Contraseña restablecida con éxito");
        } else {
            return ResponseEntity.badRequest().body("No se pudo restablecer la contraseña. El token es inválido o ha expirado");
        }
    }
}