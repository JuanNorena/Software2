package software2.backend.service;

import java.util.Date;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import lombok.extern.slf4j.Slf4j;
import software2.backend.model.Empleado;
import software2.backend.model.Usuario;
import software2.backend.repository.EmpleadoRepository;
import software2.backend.repository.UsuarioRepository;

/**
 * Servicio para gestionar la recuperación de contraseñas.
 */
@Service
@Slf4j
public class PasswordResetService {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private EmpleadoRepository empleadoRepository;

    @Autowired
    private EmailService emailService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    // Tiempo de expiración del token en milisegundos (1 hora)
    private static final long TOKEN_EXPIRATION = 3600000;

    /**
     * Inicia el proceso de recuperación de contraseña
     * 
     * @param email Correo electrónico del usuario
     * @return true si se envió el correo, false en caso contrario
     */
    public boolean initiatePasswordReset(String email) {
        // Buscar si existe un empleado con ese correo
        Empleado empleado = empleadoRepository.findByEmail(email);
        if (empleado == null) {
            log.warn("Intento de recuperación de contraseña para email no registrado: {}", email);
            return false;
        }

        // Buscar el usuario asociado al empleado
        Usuario usuario = usuarioRepository.findAll().stream()
                .filter(u -> u.getEmpleado() != null && u.getEmpleado().getId().equals(empleado.getId()))
                .findFirst()
                .orElse(null);

        if (usuario == null) {
            log.warn("Empleado sin usuario asociado para el email: {}", email);
            return false;
        }

        // Generar token aleatorio
        String token = UUID.randomUUID().toString();
        Date expiryDate = new Date(System.currentTimeMillis() + TOKEN_EXPIRATION);

        // Guardar token en el usuario
        usuario.setResetPasswordToken(token);
        usuario.setResetPasswordTokenExpiry(expiryDate);
        usuarioRepository.save(usuario);

        // Enviar email con el enlace de recuperación
        String resetUrl = "http://localhost:8080/reset-password?token=" + token;
        String message = String.format(
                "Estimado/a %s,\n\n" +
                "Has solicitado restablecer tu contraseña. " +
                "Haz clic en el siguiente enlace para crear una nueva contraseña:\n\n" +
                "%s\n\n" +
                "Este enlace expirará en 1 hora.\n\n" +
                "Si no solicitaste este cambio, puedes ignorar este mensaje.\n\n" +
                "Saludos,\n" +
                "El equipo de PersonalPay",
                empleado.getNombre(), resetUrl);

        emailService.sendSimpleMessage(email, "Recuperación de contraseña - PersonalPay", message);
        log.info("Correo de recuperación enviado a: {}", email);
        return true;
    }

    /**
     * Valida un token de recuperación de contraseña
     * 
     * @param token Token de recuperación
     * @return true si el token es válido, false en caso contrario
     */
    public boolean validateResetToken(String token) {
        Usuario usuario = usuarioRepository.findByResetPasswordToken(token);
        if (usuario == null) {
            return false;
        }

        // Verificar si el token ha expirado
        if (usuario.getResetPasswordTokenExpiry().before(new Date())) {
            // El token ha expirado, limpiarlo
            usuario.setResetPasswordToken(null);
            usuario.setResetPasswordTokenExpiry(null);
            usuarioRepository.save(usuario);
            return false;
        }

        return true;
    }

    /**
     * Completa el proceso de recuperación de contraseña
     * 
     * @param token       Token de recuperación
     * @param newPassword Nueva contraseña
     * @return true si se cambió la contraseña, false en caso contrario
     */
    public boolean completePasswordReset(String token, String newPassword) {
        Usuario usuario = usuarioRepository.findByResetPasswordToken(token);
        if (usuario == null) {
            return false;
        }

        // Verificar si el token ha expirado
        if (usuario.getResetPasswordTokenExpiry().before(new Date())) {
            // El token ha expirado, limpiarlo
            usuario.setResetPasswordToken(null);
            usuario.setResetPasswordTokenExpiry(null);
            usuarioRepository.save(usuario);
            return false;
        }

        // Cambiar la contraseña
        usuario.setPassword(passwordEncoder.encode(newPassword));
        
        // Limpiar el token
        usuario.setResetPasswordToken(null);
        usuario.setResetPasswordTokenExpiry(null);
        
        usuarioRepository.save(usuario);
        log.info("Contraseña restablecida para el usuario: {}", usuario.getUsername());
        return true;
    }
} 