package software2.backend.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import software2.backend.model.Empleado;
import software2.backend.model.Empresa;
import software2.backend.model.LiquidacionSueldo;
import software2.backend.model.RegistroAsistencia;
import software2.backend.model.Usuario;
import software2.backend.repository.EmpleadoRepository;
import software2.backend.repository.EmpresaRepository;
import software2.backend.repository.LiquidacionSueldoRepository;
import software2.backend.repository.RegistroAsistenciaRepository;
import software2.backend.repository.UsuarioRepository;
import software2.backend.dto.EmpleadoRegistroRequest;
import software2.backend.dto.EmpleadoResponse;
import software2.backend.dto.EmpleadoActualizacionRequest;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Controlador para manejar operaciones administrativas.
 * Proporciona endpoints para gestionar empleados, consultar reportes y generar liquidaciones.
 * 
 * Nota: Las operaciones relacionadas con liquidaciones de sueldo han sido migradas a:
 * @see LiquidacionesAdminController para APIs específicas de liquidaciones
 */
@RestController
@RequestMapping("/api/admin")
public class AdminController {

    @Autowired
    private EmpleadoRepository empleadoRepository;
    
    @Autowired
    private EmpresaRepository empresaRepository;
    
    @Autowired
    private UsuarioRepository usuarioRepository;
    
    @Autowired
    private RegistroAsistenciaRepository registroAsistenciaRepository;
    
    @Autowired
    private LiquidacionSueldoRepository liquidacionSueldoRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    /**
     * Endpoint para obtener todos los empleados
     * @return Lista de empleados
     */
    @GetMapping("/empleados")
    public ResponseEntity<?> obtenerEmpleados() {
        List<Empleado> empleados = empleadoRepository.findAll();
        return ResponseEntity.ok(empleados);
    }
    
    /**
     * Endpoint para obtener todos los empleados (retorna DTO)
     * @return Lista de empleados con datos seguros para mostrar
     */
    @GetMapping("/empleados/dto")
    public ResponseEntity<?> obtenerEmpleadosDTO() {
        List<Empleado> empleados = empleadoRepository.findAll();
        List<EmpleadoResponse> respuesta = empleados.stream()
            .map(EmpleadoResponse::fromEmpleado)
            .collect(Collectors.toList());
        return ResponseEntity.ok(respuesta);
    }
    
    /**
     * Endpoint para obtener un empleado por su ID
     * @param id ID del empleado
     * @return Empleado encontrado
     */
    @GetMapping("/empleados/{id}")
    public ResponseEntity<?> obtenerEmpleado(@PathVariable String id) {
        Optional<Empleado> empleado = empleadoRepository.findById(id);
        if (empleado.isPresent()) {
            return ResponseEntity.ok(empleado.get());
        } else {
            return ResponseEntity.notFound().build();
        }
    }
    
    /**
     * Endpoint para crear un nuevo empleado usando DTO
     * @param registroRequest DTO con datos del empleado y credenciales
     * @return Empleado creado
     */
    @PostMapping("/empleados/registro")
    public ResponseEntity<?> registrarEmpleado(@RequestBody EmpleadoRegistroRequest registroRequest) {
        try {
            // Validar datos del empleado
            if (registroRequest.getRut() == null || registroRequest.getRut().trim().isEmpty()) {
                return ResponseEntity.badRequest().body("El RUT es obligatorio");
            }
            
            // Validar email
            if (registroRequest.getEmail() == null || registroRequest.getEmail().trim().isEmpty()) {
                return ResponseEntity.badRequest().body("El correo electrónico es obligatorio");
            }
            
            // Verificar si ya existe un empleado con ese RUT
            if (empleadoRepository.existsByRut(registroRequest.getRut())) {
                return ResponseEntity.badRequest().body("Ya existe un empleado con ese RUT");
            }
            
            // Verificar si ya existe un empleado con ese email
            Empleado empleadoExistente = empleadoRepository.findByEmail(registroRequest.getEmail());
            if (empleadoExistente != null) {
                return ResponseEntity.badRequest().body("Ya existe un empleado con ese correo electrónico");
            }
            
            // Crear empleado desde el DTO
            Empleado empleado = new Empleado();
            empleado.setNombre(registroRequest.getNombre());
            empleado.setRut(registroRequest.getRut());
            empleado.setEmail(registroRequest.getEmail());
            empleado.setFechaNacimiento(registroRequest.getFechaNacimiento());
            empleado.setProfesion(registroRequest.getProfesion());
            empleado.setCargo(registroRequest.getCargo());
            empleado.setSueldoBase(registroRequest.getSueldoBase());
            
            // Obtener la empresa (asumiendo que hay una sola empresa en el sistema)
            Empresa empresa = empresaRepository.findAll().stream().findFirst()
                    .orElseThrow(() -> new RuntimeException("No hay empresas registradas"));
            
            // Asignar empresa al empleado
            empresa.agregarEmpleado(empleado);
            
            // Guardar empleado
            Empleado empleadoGuardado = empleadoRepository.save(empleado);
            empresaRepository.save(empresa);
            
            // Crear usuario para el empleado
            Usuario usuario = new Usuario();
            
            // Usar username proporcionado o RUT por defecto
            String username = registroRequest.getUsername();
            if (username == null || username.trim().isEmpty()) {
                username = registroRequest.getRut();
            }
            
            // Usar password proporcionado o "password" por defecto
            String password = registroRequest.getPassword();
            if (password == null || password.trim().isEmpty()) {
                password = "password";
            }
            
            usuario.setUsername(username);
            usuario.setPassword(passwordEncoder.encode(password));
            usuario.setRol("EMPLEADO");
            usuario.setEmpleado(empleadoGuardado);
            usuario.setEnabled(true);
            
            usuarioRepository.save(usuario);
            
            return ResponseEntity.ok(empleadoGuardado);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error al registrar empleado: " + e.getMessage());
        }
    }
    
    /**
     * Endpoint para actualizar un empleado existente (usando DTO)
     * @param id ID del empleado a actualizar
     * @param actualizacionRequest DTO con datos actualizados
     * @return Empleado actualizado
     */
    @PutMapping("/empleados/{id}/dto")
    public ResponseEntity<?> actualizarEmpleadoConDTO(
            @PathVariable String id, 
            @RequestBody EmpleadoActualizacionRequest actualizacionRequest) {
        
        Optional<Empleado> empleadoOpt = empleadoRepository.findById(id);
        if (empleadoOpt.isPresent()) {
            Empleado empleado = empleadoOpt.get();
            
            // Actualizar campos solo si están presentes en la solicitud
            if (actualizacionRequest.getNombre() != null) {
                empleado.setNombre(actualizacionRequest.getNombre());
            }
            
            if (actualizacionRequest.getRut() != null) {
                empleado.setRut(actualizacionRequest.getRut());
            }
            
            if (actualizacionRequest.getFechaNacimiento() != null) {
                empleado.setFechaNacimiento(actualizacionRequest.getFechaNacimiento());
            }
            
            if (actualizacionRequest.getProfesion() != null) {
                empleado.setProfesion(actualizacionRequest.getProfesion());
            }
            
            if (actualizacionRequest.getCargo() != null) {
                empleado.setCargo(actualizacionRequest.getCargo());
            }
            
            if (actualizacionRequest.getSueldoBase() != null) {
                empleado.setSueldoBase(actualizacionRequest.getSueldoBase());
            }
            
            // Actualizar email si se proporciona
            if (actualizacionRequest.getEmail() != null && !actualizacionRequest.getEmail().trim().isEmpty()) {
                // Verificar si el nuevo email ya está en uso por otro empleado
                Empleado empleadoConEmail = empleadoRepository.findByEmail(actualizacionRequest.getEmail());
                if (empleadoConEmail != null && !empleadoConEmail.getId().equals(id)) {
                    return ResponseEntity.badRequest().body("El correo electrónico ya está en uso por otro empleado");
                }
                empleado.setEmail(actualizacionRequest.getEmail());
            }
            
            Empleado empleadoActualizado = empleadoRepository.save(empleado);
            
            // Convertir a DTO para la respuesta
            EmpleadoResponse respuesta = EmpleadoResponse.fromEmpleado(empleadoActualizado);
            
            return ResponseEntity.ok(respuesta);
        } else {
            return ResponseEntity.notFound().build();
        }
    }
    
    /**
     * Endpoint para eliminar un empleado
     * @param id ID del empleado a eliminar
     * @return Respuesta sin contenido
     */
    @DeleteMapping("/empleados/{id}")
    public ResponseEntity<?> eliminarEmpleado(@PathVariable String id) {
        Optional<Empleado> empleadoOpt = empleadoRepository.findById(id);
        if (empleadoOpt.isPresent()) {
            Empleado empleado = empleadoOpt.get();
            
            // Eliminar usuario asociado
            Usuario usuario = usuarioRepository.findAll().stream()
                    .filter(u -> u.getEmpleado() != null && u.getEmpleado().getId().equals(id))
                    .findFirst().orElse(null);
            
            if (usuario != null) {
                usuarioRepository.delete(usuario);
            }
            
            // Eliminar empleado
            empleadoRepository.delete(empleado);
            
            return ResponseEntity.noContent().build();
        } else {
            return ResponseEntity.notFound().build();
        }
    }
    
    /**
     * Endpoint para obtener los registros de asistencia de un empleado en un mes específico
     * @param id ID del empleado
     * @param anio Año del mes a consultar
     * @param mes Mes a consultar (1-12)
     * @return Lista de registros de asistencia
     */
    @GetMapping("/empleados/{id}/asistencia/{anio}/{mes}")
    public ResponseEntity<?> obtenerAsistenciaEmpleado(
            @PathVariable String id,
            @PathVariable int anio, 
            @PathVariable int mes) {
        
        Optional<Empleado> empleadoOpt = empleadoRepository.findById(id);
        if (empleadoOpt.isPresent()) {
            Empleado empleado = empleadoOpt.get();
            
            // Obtener primer y último día del mes especificado
            YearMonth yearMonth = YearMonth.of(anio, mes);
            LocalDate primerDia = yearMonth.atDay(1);
            LocalDate ultimoDia = yearMonth.atEndOfMonth();
            
            List<RegistroAsistencia> registros = registroAsistenciaRepository
                    .findByEmpleadoAndFechaBetween(empleado, primerDia, ultimoDia);
            
            return ResponseEntity.ok(registros);
        } else {
            return ResponseEntity.notFound().build();
        }
    }
    
    /**
     * Endpoint para obtener el resumen de horas trabajadas de un empleado en un mes específico
     * @param id ID del empleado
     * @param anio Año del mes a consultar
     * @param mes Mes a consultar (1-12)
     * @return Resumen de horas trabajadas
     */
    @GetMapping("/empleados/{id}/horas-trabajadas/{anio}/{mes}")
    public ResponseEntity<?> obtenerHorasTrabajadasEmpleado(
            @PathVariable String id,
            @PathVariable int anio, 
            @PathVariable int mes) {
        
        Optional<Empleado> empleadoOpt = empleadoRepository.findById(id);
        if (empleadoOpt.isPresent()) {
            Empleado empleado = empleadoOpt.get();
            
            // Obtener primer y último día del mes especificado
            YearMonth yearMonth = YearMonth.of(anio, mes);
            LocalDate primerDia = yearMonth.atDay(1);
            LocalDate ultimoDia = yearMonth.atEndOfMonth();
            
            List<RegistroAsistencia> registros = registroAsistenciaRepository
                    .findByEmpleadoAndFechaBetween(empleado, primerDia, ultimoDia);
            
            // Calcular total de días y horas trabajadas
            int diasTrabajados = registros.size();
            double horasTrabajadas = registros.stream()
                    .mapToDouble(RegistroAsistencia::getTotalHorasTrabajadas)
                    .sum();
            
            Map<String, Object> resumen = new HashMap<>();
            resumen.put("empleadoId", empleado.getId());
            resumen.put("empleadoNombre", empleado.getNombre());
            resumen.put("diasTrabajados", diasTrabajados);
            resumen.put("horasTrabajadas", horasTrabajadas);
            resumen.put("mes", yearMonth.getMonth().toString());
            resumen.put("anio", yearMonth.getYear());
            
            return ResponseEntity.ok(resumen);
        } else {
            return ResponseEntity.notFound().build();
        }
    }
    
    /**
     * Endpoint para obtener las liquidaciones de sueldo de un empleado
     * @param id ID del empleado
     * @return Lista de liquidaciones de sueldo
     * @deprecated Usar /api/admin/liquidaciones/empleado/{empleadoId} en su lugar
     */
    @GetMapping("/empleados/{id}/liquidaciones")
    public ResponseEntity<?> obtenerLiquidacionesEmpleado(@PathVariable String id) {
        Optional<Empleado> empleadoOpt = empleadoRepository.findById(id);
        if (empleadoOpt.isPresent()) {
            Empleado empleado = empleadoOpt.get();
            List<LiquidacionSueldo> liquidaciones = liquidacionSueldoRepository.findByEmpleado(empleado);
            return ResponseEntity.ok(liquidaciones);
        } else {
            return ResponseEntity.notFound().build();
        }
    }
    
    /**
     * Endpoint para obtener un reporte de todos los empleados con sus horas trabajadas en un mes
     * @param anio Año del mes a consultar
     * @param mes Mes a consultar (1-12)
     * @return Reporte de horas trabajadas
     */
    @GetMapping("/reportes/horas-trabajadas/{anio}/{mes}")
    public ResponseEntity<?> obtenerReporteHorasTrabajadas(
            @PathVariable int anio, 
            @PathVariable int mes) {
        
        List<Empleado> empleados = empleadoRepository.findAll();
        YearMonth yearMonth = YearMonth.of(anio, mes);
        LocalDate primerDia = yearMonth.atDay(1);
        LocalDate ultimoDia = yearMonth.atEndOfMonth();
        
        List<Map<String, Object>> reporte = new java.util.ArrayList<>();
        
        for (Empleado empleado : empleados) {
            List<RegistroAsistencia> registros = registroAsistenciaRepository
                    .findByEmpleadoAndFechaBetween(empleado, primerDia, ultimoDia);
            
            int diasTrabajados = registros.size();
            double horasTrabajadas = registros.stream()
                    .mapToDouble(RegistroAsistencia::getTotalHorasTrabajadas)
                    .sum();
            
            Map<String, Object> empleadoReporte = new HashMap<>();
            empleadoReporte.put("empleadoId", empleado.getId());
            empleadoReporte.put("empleadoNombre", empleado.getNombre());
            empleadoReporte.put("empleadoRut", empleado.getRut());
            empleadoReporte.put("empleadoEmail", empleado.getEmail());
            empleadoReporte.put("diasTrabajados", diasTrabajados);
            empleadoReporte.put("horasTrabajadas", horasTrabajadas);
            
            reporte.add(empleadoReporte);
        }
        
        Map<String, Object> resultado = new HashMap<>();
        resultado.put("mes", yearMonth.getMonth().toString());
        resultado.put("anio", yearMonth.getYear());
        resultado.put("empleados", reporte);
        
        return ResponseEntity.ok(resultado);
    }
}