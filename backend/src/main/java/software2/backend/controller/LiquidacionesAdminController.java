package software2.backend.controller;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import software2.backend.model.LiquidacionSueldo;
import software2.backend.model.PagoContabilidadProvisional;
import software2.backend.service.LiquidacionService;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Controlador REST para gestionar operaciones administrativas relacionadas con liquidaciones de sueldo.
 * Proporciona endpoints para generar, consultar y gestionar liquidaciones.
 */
@RestController
@RequestMapping("/api/admin/liquidaciones")
@PreAuthorize("hasRole('ROLE_ADMIN')")
@RequiredArgsConstructor
@Slf4j
public class LiquidacionesAdminController {

    private final LiquidacionService liquidacionService;
    
    /**
     * Genera liquidaciones mensuales para todos los empleados
     * @param anio Año de las liquidaciones
     * @param mes Mes de las liquidaciones (1-12)
     * @return Resultado de la operación
     */
    @PostMapping("/generar-mes/{anio}/{mes}")
    public ResponseEntity<Map<String, Object>> generarLiquidacionesMensuales(
            @PathVariable int anio, 
            @PathVariable int mes) {
        
        log.info("Generando liquidaciones mensuales para {}-{}", anio, mes);
        Map<String, Object> resultado = liquidacionService.generarLiquidacionesMensuales(anio, mes);
        
        return ResponseEntity.ok(resultado);
    }
    
    /**
     * Obtiene todas las liquidaciones de un mes específico
     * @param anio Año de las liquidaciones
     * @param mes Mes de las liquidaciones (1-12)
     * @return Lista de liquidaciones
     */
    @GetMapping("/mes/{anio}/{mes}")
    public ResponseEntity<List<LiquidacionSueldo>> obtenerLiquidacionesPorMes(
            @PathVariable int anio, 
            @PathVariable int mes) {
        
        log.info("Obteniendo liquidaciones para {}-{}", anio, mes);
        List<LiquidacionSueldo> liquidaciones = liquidacionService.obtenerLiquidacionesPorMes(anio, mes);
        
        return ResponseEntity.ok(liquidaciones);
    }
    
    /**
     * Obtiene las liquidaciones de un empleado específico
     * @param empleadoId ID del empleado
     * @return Lista de liquidaciones
     */
    @GetMapping("/empleado/{empleadoId}")
    public ResponseEntity<List<LiquidacionSueldo>> obtenerLiquidacionesPorEmpleado(
            @PathVariable String empleadoId) {
        
        log.info("Obteniendo liquidaciones para empleado: {}", empleadoId);
        List<LiquidacionSueldo> liquidaciones = liquidacionService.obtenerLiquidacionesPorEmpleado(empleadoId);
        
        return ResponseEntity.ok(liquidaciones);
    }
    
    /**
     * Obtiene las liquidaciones de un empleado en un mes específico
     * @param empleadoId ID del empleado
     * @param anio Año de las liquidaciones
     * @param mes Mes de las liquidaciones (1-12)
     * @return Lista de liquidaciones
     */
    @GetMapping("/empleado/{empleadoId}/mes/{anio}/{mes}")
    public ResponseEntity<List<LiquidacionSueldo>> obtenerLiquidacionesPorEmpleadoYMes(
            @PathVariable String empleadoId,
            @PathVariable int anio, 
            @PathVariable int mes) {
        
        log.info("Obteniendo liquidaciones para empleado: {} en el período: {}-{}", empleadoId, anio, mes);
        List<LiquidacionSueldo> liquidaciones = liquidacionService.obtenerLiquidacionesPorEmpleadoYMes(empleadoId, anio, mes);
        
        return ResponseEntity.ok(liquidaciones);
    }
    
    /**
     * Obtiene una liquidación específica por su ID
     * @param liquidacionId ID de la liquidación
     * @return Liquidación de sueldo
     */
    @GetMapping("/{liquidacionId}")
    public ResponseEntity<LiquidacionSueldo> obtenerLiquidacionPorId(
            @PathVariable String liquidacionId) {
        
        log.info("Obteniendo liquidación: {}", liquidacionId);
        LiquidacionSueldo liquidacion = liquidacionService.obtenerLiquidacionPorId(liquidacionId);
        
        return ResponseEntity.ok(liquidacion);
    }
    
    /**
     * Genera informe de contabilidad provisional para un mes específico
     * @param anio Año del informe
     * @param mes Mes del informe (1-12)
     * @return Lista de pagos de contabilidad provisional
     */
    @GetMapping("/informe-provisional/{anio}/{mes}")
    public ResponseEntity<List<PagoContabilidadProvisional>> generarInformeContabilidadProvisional(
            @PathVariable int anio, 
            @PathVariable int mes) {
        
        log.info("Generando informe de contabilidad provisional para {}-{}", anio, mes);
        List<PagoContabilidadProvisional> informe = 
                liquidacionService.generarInformeContabilidadProvisional(anio, mes);
        
        return ResponseEntity.ok(informe);
    }
    
    /**
     * Genera el pago de una liquidación de sueldo
     * @param liquidacionId ID de la liquidación
     * @param banco Banco desde donde se realiza el pago
     * @param metodoPago Método de pago utilizado
     * @return Liquidación de sueldo actualizada
     */
    @PostMapping("/{liquidacionId}/pagar")
    public ResponseEntity<LiquidacionSueldo> generarPagoLiquidacion(
            @PathVariable String liquidacionId,
            @RequestParam String banco,
            @RequestParam String metodoPago) {
        
        log.info("Generando pago para liquidación: {} con banco: {} y método: {}", 
                liquidacionId, banco, metodoPago);
        LiquidacionSueldo liquidacion = 
                liquidacionService.generarPagoLiquidacion(liquidacionId, banco, metodoPago);
        
        return ResponseEntity.ok(liquidacion);
    }
    
    /**
     * Anula una liquidación de sueldo
     * @param liquidacionId ID de la liquidación
     * @return Liquidación de sueldo anulada
     */
    @PostMapping("/{liquidacionId}/anular")
    public ResponseEntity<LiquidacionSueldo> anularLiquidacion(
            @PathVariable String liquidacionId) {
        
        log.info("Anulando liquidación: {}", liquidacionId);
        LiquidacionSueldo liquidacion = liquidacionService.anularLiquidacion(liquidacionId);
        
        return ResponseEntity.ok(liquidacion);
    }
    
    /**
     * Genera una liquidación individual para un empleado
     * @param empleadoId ID del empleado
     * @param fechaLiquidacion Fecha de la liquidación
     * @return Liquidación de sueldo generada
     */
    @PostMapping("/generar-individual/{empleadoId}")
    public ResponseEntity<LiquidacionSueldo> generarLiquidacionIndividual(
            @PathVariable String empleadoId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaLiquidacion) {
        
        log.info("Generando liquidación individual para empleado: {} con fecha: {}", 
                empleadoId, fechaLiquidacion);
        LiquidacionSueldo liquidacion = 
                liquidacionService.generarLiquidacionIndividual(empleadoId, fechaLiquidacion);
        
        return ResponseEntity.ok(liquidacion);
    }
    
    /**
     * Imprime un reporte de todas las liquidaciones generadas en un mes (simulado)
     * @param anio Año del mes a consultar
     * @param mes Mes a consultar (1-12)
     * @return URL del reporte PDF generado
     */
    @GetMapping("/reportes/{anio}/{mes}/imprimir")
    public ResponseEntity<Map<String, Object>> imprimirReporteLiquidaciones(
            @PathVariable int anio, 
            @PathVariable int mes) {
        
        log.info("Generando reporte PDF de liquidaciones para {}-{}", anio, mes);
        
        // Simulación de generación de reporte PDF
        YearMonth yearMonth = YearMonth.of(anio, mes);
        String nombreReporte = "Liquidaciones_" + mes + "_" + anio + ".pdf";
        
        Map<String, Object> resultado = new HashMap<>();
        resultado.put("mensaje", "Reporte generado con éxito");
        resultado.put("mes", yearMonth.getMonth().toString());
        resultado.put("anio", anio);
        resultado.put("nombreArchivo", nombreReporte);
        resultado.put("url", "/api/admin/liquidaciones/descargar/" + nombreReporte);
        
        return ResponseEntity.ok(resultado);
    }
    
    /**
     * Imprime una liquidación individual en formato PDF (simulado)
     * @param liquidacionId ID de la liquidación a imprimir
     * @return URL del archivo PDF generado
     */
    @GetMapping("/{liquidacionId}/imprimir")
    public ResponseEntity<Map<String, Object>> imprimirLiquidacion(@PathVariable String liquidacionId) {
        log.info("Generando PDF para liquidación: {}", liquidacionId);
        
        // Obtener la liquidación
        LiquidacionSueldo liquidacion = liquidacionService.obtenerLiquidacionPorId(liquidacionId);
        
        // Simulación de generación de PDF individual
        String nombreArchivo = "Liquidacion_" + liquidacion.getEmpleado().getRut() + "_" + 
                              liquidacion.getFecha().getMonthValue() + "_" + 
                              liquidacion.getFecha().getYear() + ".pdf";
        
        Map<String, Object> resultado = new HashMap<>();
        resultado.put("mensaje", "Liquidación generada con éxito");
        resultado.put("liquidacionId", liquidacion.getId());
        resultado.put("empleado", liquidacion.getEmpleado().getNombre());
        resultado.put("fecha", liquidacion.getFecha().toString());
        resultado.put("nombreArchivo", nombreArchivo);
        resultado.put("url", "/api/admin/liquidaciones/descargar/" + nombreArchivo);
        
        return ResponseEntity.ok(resultado);
    }
    
    /**
     * Endpoint placeholder para descargar archivos PDF generados
     * @param nombreArchivo Nombre del archivo a descargar
     * @return Mensaje indicando que la descarga no está implementada
     */
    @GetMapping("/descargar/{nombreArchivo}")
    public ResponseEntity<Map<String, Object>> descargarArchivo(@PathVariable String nombreArchivo) {
        log.info("Solicitud de descarga de archivo: {}", nombreArchivo);
        
        // En una implementación real, aquí se devolvería el archivo PDF
        Map<String, Object> respuesta = new HashMap<>();
        respuesta.put("mensaje", "La funcionalidad de descarga no está implementada");
        respuesta.put("nombreArchivo", nombreArchivo);
        
        return ResponseEntity.ok(respuesta);
    }
} 