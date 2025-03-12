package software2.backend.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import lombok.extern.slf4j.Slf4j;
import software2.backend.model.Usuario;
import software2.backend.repository.UsuarioRepository;

/**
 * Servicio para inicializar datos en la aplicación.
 * Se ejecuta al iniciar la aplicación y crea el usuario administrador por defecto
 * si no existe.
 */
@Service
@Slf4j
public class InitService implements CommandLineRunner {

    @Autowired
    private UsuarioRepository usuarioRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    @Override
    public void run(String... args) throws Exception {
        // Crear usuario administrador por defecto si no existe
        if (!usuarioRepository.existsByUsername("admin")) {
            Usuario admin = new Usuario();
            admin.setUsername("admin");
            admin.setPassword(passwordEncoder.encode("admin123"));
            admin.setRol("ADMIN");
            admin.setEnabled(true);
            
            usuarioRepository.save(admin);
            
            log.info("Usuario administrador creado con éxito");
        } else {
            log.info("Usuario administrador ya existe");
        }
    }
}