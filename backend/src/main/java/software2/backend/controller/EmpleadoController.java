package software2.backend.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import software2.backend.model.Empleado;
import software2.backend.model.LiquidacionSueldo;
import software2.backend.model.RegistroAsistencia;
import software2.backend.model.Usuario;
import software2.backend.repository.EmpleadoRepository;
import software2.backend.repository.LiquidacionSueldoRepository;
import software2.backend.repository.RegistroAsistenciaRepository;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Controlador para manejar operaciones relacionadas con empleados.
 * Proporciona endpoints para consultar asistencia, horas trabajadas, liquidaciones y actualizar información personal.
 */
@RestController
@RequestMapping("/api/empleado")
public class EmpleadoController {

    @Autowired
    private EmpleadoRepository empleadoRepository;
    
    @Autowired
    private RegistroAsistenciaRepository registroAsistenciaRepository;
    
    @Autowired
    private LiquidacionSueldoRepository liquidacionSueldoRepository;
    
    /**
     * Obtiene el empleado autenticado actualmente
     * @return El empleado autenticado
     * @throws RuntimeException si el usuario no tiene un empleado asociado
     */
    private Empleado getEmpleadoAutenticado() {
        try {
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
        } catch (Exception e) {
            throw new RuntimeException("Error al obtener el empleado autenticado: " + e.getMessage());
        }
    }
    
    /**
     * Endpoint para obtener la información del empleado autenticado
     * @return Información del empleado
     */
    @GetMapping("/perfil")
    public ResponseEntity<?> obtenerPerfil() {
        try {
            Empleado empleado = getEmpleadoAutenticado();
            return ResponseEntity.ok(empleado);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error al obtener perfil: " + e.getMessage());
        }
    }
    
    /**
     * Endpoint para actualizar la información personal del empleado
     * @param empleadoActualizado Datos actualizados del empleado
     * @return Empleado actualizado
     */
    @PutMapping("/perfil")
    public ResponseEntity<?> actualizarPerfil(@RequestBody Empleado empleadoActualizado) {
        Empleado empleado = getEmpleadoAutenticado();
        
        // Actualizar solo campos permitidos (no permitir cambiar empresa, registros, etc.)
        empleado.setNombre(empleadoActualizado.getNombre());
        empleado.setProfesion(empleadoActualizado.getProfesion());
        
        empleadoRepository.save(empleado);
        
        return ResponseEntity.ok(empleado);
    }
    
    /**
     * Endpoint para obtener los registros de asistencia del mes actual
     * @return Lista de registros de asistencia
     */
    @GetMapping("/asistencia/mes-actual")
    public ResponseEntity<?> obtenerAsistenciaMesActual() {
        Empleado empleado = getEmpleadoAutenticado();
        
        // Obtener primer y último día del mes actual
        YearMonth mesActual = YearMonth.now();
        LocalDate primerDia = mesActual.atDay(1);
        LocalDate ultimoDia = mesActual.atEndOfMonth();
        
        List<RegistroAsistencia> registros = registroAsistenciaRepository
                .findByEmpleadoAndFechaBetween(empleado, primerDia, ultimoDia);
        
        return ResponseEntity.ok(registros);
    }
    
    /**
     * Endpoint para obtener los registros de asistencia de un mes específico
     * @param anio Año del mes a consultar
     * @param mes Mes a consultar (1-12)
     * @return Lista de registros de asistencia
     */
    @GetMapping("/asistencia/{anio}/{mes}")
    public ResponseEntity<?> obtenerAsistenciaPorMes(
            @PathVariable int anio, 
            @PathVariable int mes) {
        
        Empleado empleado = getEmpleadoAutenticado();
        
        // Obtener primer y último día del mes especificado
        YearMonth yearMonth = YearMonth.of(anio, mes);
        LocalDate primerDia = yearMonth.atDay(1);
        LocalDate ultimoDia = yearMonth.atEndOfMonth();
        
        List<RegistroAsistencia> registros = registroAsistenciaRepository
                .findByEmpleadoAndFechaBetween(empleado, primerDia, ultimoDia);
        
        return ResponseEntity.ok(registros);
    }
    
    /**
     * Endpoint para obtener el resumen de horas trabajadas en el mes actual
     * @return Resumen de horas trabajadas
     */
    @GetMapping("/horas-trabajadas/mes-actual")
    public ResponseEntity<?> obtenerHorasTrabajadasMesActual() {
        Empleado empleado = getEmpleadoAutenticado();
        
        // Obtener primer y último día del mes actual
        YearMonth mesActual = YearMonth.now();
        LocalDate primerDia = mesActual.atDay(1);
        LocalDate ultimoDia = mesActual.atEndOfMonth();
        
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
        resumen.put("mes", mesActual.getMonth().toString());
        resumen.put("anio", mesActual.getYear());
        
        return ResponseEntity.ok(resumen);
    }
    
    /**
     * Endpoint para obtener el resumen de horas trabajadas en un mes específico
     * @param anio Año del mes a consultar
     * @param mes Mes a consultar (1-12)
     * @return Resumen de horas trabajadas
     */
    @GetMapping("/horas-trabajadas/{anio}/{mes}")
    public ResponseEntity<?> obtenerHorasTrabajadasPorMes(
            @PathVariable int anio, 
            @PathVariable int mes) {
        
        Empleado empleado = getEmpleadoAutenticado();
        
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
        
        return ResponseEntity.ok(resumen);
    }
    
    /**
     * Endpoint para obtener las liquidaciones de sueldo del empleado
     * @return Lista de liquidaciones de sueldo
     */
    @GetMapping("/liquidaciones")
    public ResponseEntity<?> obtenerLiquidaciones() {
        Empleado empleado = getEmpleadoAutenticado();
        List<LiquidacionSueldo> liquidaciones = liquidacionSueldoRepository.findByEmpleado(empleado);
        return ResponseEntity.ok(liquidaciones);
    }
    
    /**
     * Endpoint para obtener una liquidación de sueldo específica
     * @param id ID de la liquidación
     * @return Liquidación de sueldo
     */
    @GetMapping("/liquidaciones/{id}")
    public ResponseEntity<?> obtenerLiquidacion(@PathVariable String id) {
        Empleado empleado = getEmpleadoAutenticado();
        
        LiquidacionSueldo liquidacion = liquidacionSueldoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Liquidación no encontrada"));
        
        // Verificar que la liquidación pertenezca al empleado autenticado
        if (!liquidacion.getEmpleado().getId().equals(empleado.getId())) {
            return ResponseEntity.status(403).body("No tiene permiso para acceder a esta liquidación");
        }
        
        return ResponseEntity.ok(liquidacion);
    }
    
    /**
     * Endpoint para imprimir una liquidación
     * @param id ID de la liquidación
     * @return URL del PDF generado
     */
    @GetMapping("/liquidaciones/{id}/imprimir")
    public ResponseEntity<?> imprimirLiquidacion(@PathVariable String id) {
        try {
            Empleado empleado = getEmpleadoAutenticado();
            
            LiquidacionSueldo liquidacion = liquidacionSueldoRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Liquidación no encontrada"));
            
            // Verificar que la liquidación pertenezca al empleado autenticado
            if (!liquidacion.getEmpleado().getId().equals(empleado.getId())) {
                return ResponseEntity.status(403).body("No tiene permiso para acceder a esta liquidación");
            }
            
            // Simulación de generación de PDF
            String nombreArchivo = "Liquidacion_" + empleado.getRut() + "_" + 
                                  liquidacion.getFecha().getMonthValue() + "_" + 
                                  liquidacion.getFecha().getYear() + ".pdf";
            
            Map<String, Object> resultado = new HashMap<>();
            resultado.put("mensaje", "Liquidación generada con éxito");
            resultado.put("nombreArchivo", nombreArchivo);
            resultado.put("url", "/api/empleado/liquidaciones/descargar/" + nombreArchivo);
            
            return ResponseEntity.ok(resultado);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error al generar la liquidación: " + e.getMessage());
        }
    }
}