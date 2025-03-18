package software2.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import software2.backend.model.Empleado;
import software2.backend.model.LiquidacionSueldo;
import software2.backend.service.LiquidacionService;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Controlador REST para gestionar operaciones relacionadas con las liquidaciones de sueldo
 * para empleados. Proporciona endpoints para consultar las liquidaciones propias.
 */
@RestController
@RequestMapping("/api/empleados/liquidaciones")
@RequiredArgsConstructor
@Slf4j
public class LiquidacionesEmpleadosController {

    private final LiquidacionService liquidacionService;
    
    /**
     * Obtiene las liquidaciones de sueldo del empleado autenticado
     * @param empleadoAutenticado Empleado autenticado en el sistema
     * @return Respuesta con las liquidaciones del empleado
     */
    @GetMapping
    public ResponseEntity<List<LiquidacionSueldo>> obtenerMisLiquidaciones(
            @AuthenticationPrincipal Empleado empleadoAutenticado) {
        
        log.info("Obteniendo liquidaciones para empleado: {}", empleadoAutenticado.getId());
        List<LiquidacionSueldo> liquidaciones = liquidacionService
                .obtenerLiquidacionesPorEmpleado(empleadoAutenticado.getId());
        
        return ResponseEntity.ok(liquidaciones);
    }
    
    /**
     * Obtiene una liquidación de sueldo específica del empleado autenticado
     * @param liquidacionId ID de la liquidación a consultar
     * @param empleadoAutenticado Empleado autenticado en el sistema
     * @return Respuesta con la liquidación solicitada
     */
    @GetMapping("/{liquidacionId}")
    public ResponseEntity<LiquidacionSueldo> obtenerLiquidacionPorId(
            @PathVariable String liquidacionId,
            @AuthenticationPrincipal Empleado empleadoAutenticado) {
        
        log.info("Obteniendo liquidación {} para empleado: {}", 
                liquidacionId, empleadoAutenticado.getId());
        
        // Obtener la liquidación
        LiquidacionSueldo liquidacion = liquidacionService.obtenerLiquidacionPorId(liquidacionId);
        
        // Verificar que la liquidación pertenece al empleado autenticado
        if (!liquidacion.getEmpleado().getId().equals(empleadoAutenticado.getId())) {
            log.warn("Intento de acceso no autorizado a liquidación {} por empleado: {}", 
                    liquidacionId, empleadoAutenticado.getId());
            return ResponseEntity.status(403).build();
        }
        
        return ResponseEntity.ok(liquidacion);
    }
    
    /**
     * Obtiene información sobre la tasa efectiva por hora del empleado autenticado
     * @param empleadoAutenticado Empleado autenticado en el sistema
     * @return Respuesta con la tasa efectiva por hora
     */
    @GetMapping("/tasa-hora")
    public ResponseEntity<Map<String, Object>> obtenerTasaEfectivaPorHora(
            @AuthenticationPrincipal Empleado empleadoAutenticado) {
        
        log.info("Calculando tasa efectiva por hora para empleado: {}", empleadoAutenticado.getId());
        
        double tasaHora = liquidacionService.calcularTasaEfectivaPorHora(empleadoAutenticado.getId());
        
        Map<String, Object> respuesta = new HashMap<>();
        respuesta.put("tasaHora", tasaHora);
        respuesta.put("empleadoId", empleadoAutenticado.getId());
        respuesta.put("nombre", empleadoAutenticado.getNombre());
        
        return ResponseEntity.ok(respuesta);
    }
} 