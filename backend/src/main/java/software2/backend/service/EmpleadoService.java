package software2.backend.service;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import software2.backend.dto.EmpleadoActualizacionRequest;
import software2.backend.dto.EmpleadoRegistroRequest;
import software2.backend.dto.EmpleadoResponse;
import software2.backend.exception.ResourceNotFoundException;
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

/**
 * Servicio para manejar la lógica de negocio relacionada con empleados.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EmpleadoService {

    private final EmpleadoRepository empleadoRepository;
    private final EmpresaRepository empresaRepository;
    private final UsuarioRepository usuarioRepository;
    private final RegistroAsistenciaRepository registroAsistenciaRepository;
    private final LiquidacionSueldoRepository liquidacionSueldoRepository;
    private final PasswordEncoder passwordEncoder;
    
    /**
     * Obtiene todos los empleados
     * @return Lista de empleados
     */
    public List<Empleado> obtenerTodosLosEmpleados() {
        return empleadoRepository.findAll();
    }
    
    /**
     * Obtiene todos los empleados como DTOs de respuesta
     * @return Lista de DTOs de empleados
     */
    public List<EmpleadoResponse> obtenerTodosLosEmpleadosDTO() {
        return empleadoRepository.findAll().stream()
                .map(EmpleadoResponse::fromEmpleado)
                .collect(Collectors.toList());
    }
    
    /**
     * Obtiene un empleado por su ID
     * @param id ID del empleado
     * @return Empleado encontrado
     * @throws ResourceNotFoundException si no existe el empleado
     */
    public Empleado obtenerEmpleadoPorId(String id) {
        return empleadoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Empleado", "id", id));
    }
    
    /**
     * Obtiene el empleado autenticado actualmente
     * @return El empleado autenticado
     * @throws RuntimeException si no hay usuario autenticado o no tiene empleado asociado
     */
    public Empleado obtenerEmpleadoAutenticado() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null) {
            throw new RuntimeException("No hay usuario autenticado");
        }
        
        Object principal = authentication.getPrincipal();
        if (!(principal instanceof Usuario)) {
            throw new RuntimeException("El usuario autenticado no es válido");
        }
        
        Usuario usuario = (Usuario) principal;
        if (usuario.getEmpleado() == null) {
            throw new RuntimeException("El usuario no tiene un empleado asociado");
        }
        
        return usuario.getEmpleado();
    }
    
    /**
     * Registra un nuevo empleado
     * @param registroRequest DTO con datos del empleado
     * @return Empleado creado
     */
    public Empleado registrarEmpleado(EmpleadoRegistroRequest registroRequest) {
        // Validar datos del empleado
        if (empleadoRepository.existsByRut(registroRequest.getRut())) {
            throw new RuntimeException("Ya existe un empleado con ese RUT");
        }
        
        // Verificar si ya existe un empleado con ese email
        Empleado empleadoExistente = empleadoRepository.findByEmail(registroRequest.getEmail());
        if (empleadoExistente != null) {
            throw new RuntimeException("Ya existe un empleado con ese correo electrónico");
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
        
        return empleadoGuardado;
    }
    
    /**
     * Actualiza un empleado existente
     * @param id ID del empleado a actualizar
     * @param actualizacionRequest DTO con datos actualizados
     * @return Empleado actualizado
     */
    public EmpleadoResponse actualizarEmpleado(String id, EmpleadoActualizacionRequest actualizacionRequest) {
        Empleado empleado = obtenerEmpleadoPorId(id);
        
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
                throw new RuntimeException("El correo electrónico ya está en uso por otro empleado");
            }
            empleado.setEmail(actualizacionRequest.getEmail());
        }
        
        Empleado empleadoActualizado = empleadoRepository.save(empleado);
        
        // Convertir a DTO para la respuesta
        return EmpleadoResponse.fromEmpleado(empleadoActualizado);
    }
    
    /**
     * Actualiza el perfil del empleado autenticado
     * @param actualizacionRequest DTO con datos actualizados
     * @return DTO del empleado actualizado
     */
    public EmpleadoResponse actualizarPerfilEmpleado(EmpleadoActualizacionRequest actualizacionRequest) {
        Empleado empleado = obtenerEmpleadoAutenticado();
        
        // Actualizar solo campos permitidos y si están presentes en la solicitud
        if (actualizacionRequest.getNombre() != null) {
            empleado.setNombre(actualizacionRequest.getNombre());
        }
        
        if (actualizacionRequest.getProfesion() != null) {
            empleado.setProfesion(actualizacionRequest.getProfesion());
        }
        
        // Actualizar email si se proporciona
        if (actualizacionRequest.getEmail() != null && !actualizacionRequest.getEmail().trim().isEmpty()) {
            // Verificar si el email ya está en uso
            Empleado empleadoConEmail = empleadoRepository.findByEmail(actualizacionRequest.getEmail());
            if (empleadoConEmail != null && !empleadoConEmail.getId().equals(empleado.getId())) {
                throw new RuntimeException("El correo electrónico ya está en uso por otro empleado");
            }
            empleado.setEmail(actualizacionRequest.getEmail());
        }
        
        Empleado empleadoActualizado = empleadoRepository.save(empleado);
        
        // Convertir a DTO para la respuesta
        return EmpleadoResponse.fromEmpleado(empleadoActualizado);
    }
    
    /**
     * Obtiene los registros de asistencia de un empleado en un período
     * @param empleado Empleado
     * @param fechaInicio Fecha de inicio del período
     * @param fechaFin Fecha de fin del período
     * @return Lista de registros de asistencia
     */
    public List<RegistroAsistencia> obtenerAsistenciaEnPeriodo(Empleado empleado, LocalDate fechaInicio, LocalDate fechaFin) {
        return registroAsistenciaRepository.findByEmpleadoAndFechaBetween(empleado, fechaInicio, fechaFin);
    }
    
    /**
     * Obtiene el resumen de horas trabajadas de un empleado en un período
     * @param empleado Empleado
     * @param anio Año
     * @param mes Mes (1-12)
     * @return Mapa con el resumen de horas trabajadas
     */
    public Map<String, Object> obtenerResumenHorasTrabajadas(Empleado empleado, int anio, int mes) {
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
        resumen.put("diasTrabajados", diasTrabajados);
        resumen.put("horasTrabajadas", horasTrabajadas);
        resumen.put("mes", yearMonth.getMonth().toString());
        resumen.put("anio", yearMonth.getYear());
        
        return resumen;
    }
    
    /**
     * Obtiene las liquidaciones de sueldo de un empleado
     * @param empleado Empleado
     * @return Lista de liquidaciones de sueldo
     */
    public List<LiquidacionSueldo> obtenerLiquidaciones(Empleado empleado) {
        return liquidacionSueldoRepository.findByEmpleado(empleado);
    }
    
    /**
     * Obtiene una liquidación de sueldo específica y verifica permisos
     * @param id ID de la liquidación
     * @param empleado Empleado que solicita la liquidación
     * @return Liquidación de sueldo
     * @throws ResourceNotFoundException si no existe la liquidación
     * @throws RuntimeException si el empleado no tiene permisos
     */
    public LiquidacionSueldo obtenerLiquidacion(String id, Empleado empleado) {
        LiquidacionSueldo liquidacion = liquidacionSueldoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Liquidación", "id", id));
        
        // Verificar que la liquidación pertenezca al empleado
        if (!liquidacion.getEmpleado().getId().equals(empleado.getId())) {
            throw new RuntimeException("No tiene permiso para acceder a esta liquidación");
        }
        
        return liquidacion;
    }
    
    /**
     * Elimina un empleado por su ID
     * @param id ID del empleado
     */
    public void eliminarEmpleado(String id) {
        Empleado empleado = obtenerEmpleadoPorId(id);
        
        // Primero eliminar el usuario asociado
        List<Usuario> usuariosAsociados = usuarioRepository.findAll().stream()
                .filter(u -> u.getEmpleado() != null && u.getEmpleado().getId().equals(id))
                .collect(Collectors.toList());
        
        usuariosAsociados.forEach(usuarioRepository::delete);
        
        // Luego eliminar el empleado
        empleadoRepository.delete(empleado);
        
        log.info("Empleado eliminado con ID: {}", id);
    }
} 