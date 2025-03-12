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

import java.time.LocalDate;
import java.time.LocalTime;

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
    
    /**
     * Endpoint para iniciar sesión
     * @param loginRequest Datos de inicio de sesión (username y password)
     * @return Respuesta con token y rol del usuario
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest) {
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
}