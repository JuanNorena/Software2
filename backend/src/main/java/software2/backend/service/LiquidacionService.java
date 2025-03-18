package software2.backend.service;

import java.time.LocalDate;
import java.time.Month;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import software2.backend.exception.BadRequestException;
import software2.backend.exception.ResourceNotFoundException;
import software2.backend.model.Descuento;
import software2.backend.model.Empleado;
import software2.backend.model.LiquidacionSueldo;
import software2.backend.model.PagoContabilidadProvisional;
import software2.backend.model.PagoSueldo;
import software2.backend.model.RegistroAsistencia;
import software2.backend.repository.EmpleadoRepository;
import software2.backend.repository.LiquidacionSueldoRepository;
import software2.backend.repository.RegistroAsistenciaRepository;

/**
 * Servicio para manejar la lógica de negocio relacionada con liquidaciones de sueldo.
 * Implementa cálculos de liquidaciones, descuentos legales y pagos.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class LiquidacionService {

    private final LiquidacionSueldoRepository liquidacionSueldoRepository;
    private final EmpleadoRepository empleadoRepository;
    private final RegistroAsistenciaRepository registroAsistenciaRepository;
    
    // Constantes para cálculos
    private static final double TASA_AFP = 0.10; // 10% de cotización AFP
    private static final double TASA_SALUD = 0.07; // 7% de cotización de salud
    private static final double TASA_HORA_EXTRA = 1.5; // 50% adicional por hora extra
    private static final int HORAS_JORNADA_COMPLETA = 8; // 8 horas por día
    private static final int DIAS_MES_COMPLETO = 30; // 30 días para cálculos de sueldo

    /**
     * Genera liquidaciones mensuales para todos los empleados activos
     * @param anio Año de las liquidaciones
     * @param mes Mes de las liquidaciones (1-12)
     * @return Resultado de la operación con estadísticas
     */
    @Transactional
    public Map<String, Object> generarLiquidacionesMensuales(int anio, int mes) {
        log.info("Generando liquidaciones mensuales para {}-{}", anio, mes);
        
        // Validar fecha
        if (mes < 1 || mes > 12) {
            throw new BadRequestException("El mes debe estar entre 1 y 12");
        }
        
        // Verificar si ya existen liquidaciones para este mes
        long liquidacionesExistentes = liquidacionSueldoRepository.countByFechaAnioAndFechaMes(anio, mes);
        if (liquidacionesExistentes > 0) {
            throw new BadRequestException("Ya existen liquidaciones generadas para " + Month.of(mes).toString() + " de " + anio);
        }
        
        // Obtener todos los empleados activos
        List<Empleado> empleados = empleadoRepository.findAll();
        int totalEmpleados = empleados.size();
        int liquidacionesGeneradas = 0;
        
        // Calcular el primer y último día del mes
        YearMonth yearMonth = YearMonth.of(anio, mes);
        LocalDate primerDia = yearMonth.atDay(1);
        LocalDate ultimoDia = yearMonth.atEndOfMonth();
        
        // Generar liquidación para cada empleado
        for (Empleado empleado : empleados) {
            try {
                // Calcular días trabajados y horas extras
                double diasTrabajados = calcularDiasTrabajados(empleado, primerDia, ultimoDia);
                double horasExtras = calcularHorasExtras(empleado, primerDia, ultimoDia);
                
                // Calcular sueldo base proporcional
                double sueldoBaseProporcional = (empleado.getSueldoBase() / DIAS_MES_COMPLETO) * diasTrabajados;
                
                // Calcular valor de horas extras
                double valorHoraNormal = empleado.getSueldoBase() / (DIAS_MES_COMPLETO * HORAS_JORNADA_COMPLETA);
                double valorHorasExtras = valorHoraNormal * TASA_HORA_EXTRA * horasExtras;
                
                // Calcular sueldo bruto
                double sueldoBruto = sueldoBaseProporcional + valorHorasExtras;
                
                // Crear liquidación
                LiquidacionSueldo liquidacion = new LiquidacionSueldo();
                liquidacion.setEmpleado(empleado);
                liquidacion.setFecha(ultimoDia);
                liquidacion.setEstado("emitido");
                liquidacion.setSueldoBruto(sueldoBruto);
                
                // Aplicar descuentos legales
                double descuentoAFP = sueldoBruto * TASA_AFP;
                double descuentoSalud = sueldoBruto * TASA_SALUD;
                
                Descuento descuentoAfp = new Descuento();
                descuentoAfp.setConcepto("AFP (" + (TASA_AFP * 100) + "%)");
                descuentoAfp.setValor(descuentoAFP);
                liquidacion.agregarDescuento(descuentoAfp);
                
                Descuento descuentoSaludObj = new Descuento();
                descuentoSaludObj.setConcepto("Salud (" + (TASA_SALUD * 100) + "%)");
                descuentoSaludObj.setValor(descuentoSalud);
                liquidacion.agregarDescuento(descuentoSaludObj);
                
                // Actualizar cálculos
                liquidacion.actualizarCalculos();
                
                // Generar pago provisional
                PagoContabilidadProvisional pagoProvisional = PagoContabilidadProvisional.generarPagoProvisional(
                        yearMonth.toString(), descuentoAFP, descuentoSalud);
                liquidacion.agregarPagoProvisional(pagoProvisional);
                
                // Guardar liquidación
                liquidacionSueldoRepository.save(liquidacion);
                
                // Agregar liquidación al empleado
                empleado.agregarLiquidacionSueldo(liquidacion);
                empleadoRepository.save(empleado);
                
                liquidacionesGeneradas++;
                log.info("Liquidación generada para empleado: {} - {}", empleado.getId(), empleado.getNombre());
            } catch (Exception e) {
                log.error("Error al generar liquidación para empleado: {} - {}. Error: {}", 
                        empleado.getId(), empleado.getNombre(), e.getMessage(), e);
            }
        }
        
        // Preparar respuesta
        Map<String, Object> resultado = new HashMap<>();
        resultado.put("totalEmpleados", totalEmpleados);
        resultado.put("liquidacionesGeneradas", liquidacionesGeneradas);
        resultado.put("mes", Month.of(mes).toString());
        resultado.put("anio", anio);
        resultado.put("mensaje", "Liquidaciones generadas correctamente");
        
        return resultado;
    }
    
    /**
     * Calcula la cantidad de días trabajados por un empleado en un período
     * @param empleado Empleado a evaluar
     * @param fechaInicio Fecha de inicio del período
     * @param fechaFin Fecha de fin del período
     * @return Número de días trabajados
     */
    private double calcularDiasTrabajados(Empleado empleado, LocalDate fechaInicio, LocalDate fechaFin) {
        List<RegistroAsistencia> registros = registroAsistenciaRepository
                .findByEmpleadoAndFechaBetween(empleado, fechaInicio, fechaFin);
        
        // Contar días únicos con asistencia
        return registros.stream()
                .map(RegistroAsistencia::getFecha)
                .distinct()
                .count();
    }
    
    /**
     * Calcula las horas extras trabajadas por un empleado en un período
     * @param empleado Empleado a evaluar
     * @param fechaInicio Fecha de inicio del período
     * @param fechaFin Fecha de fin del período
     * @return Número de horas extras
     */
    private double calcularHorasExtras(Empleado empleado, LocalDate fechaInicio, LocalDate fechaFin) {
        List<RegistroAsistencia> registros = registroAsistenciaRepository
                .findByEmpleadoAndFechaBetween(empleado, fechaInicio, fechaFin);
        
        return registros.stream()
                .mapToDouble(registro -> {
                    double horasTrabajadas = registro.getTotalHorasTrabajadas();
                    return horasTrabajadas > HORAS_JORNADA_COMPLETA ? 
                            horasTrabajadas - HORAS_JORNADA_COMPLETA : 0;
                })
                .sum();
    }
    
    /**
     * Obtiene las liquidaciones de sueldo de un empleado específico
     * @param empleadoId ID del empleado
     * @return Lista de liquidaciones de sueldo
     */
    public List<LiquidacionSueldo> obtenerLiquidacionesPorEmpleado(String empleadoId) {
        Empleado empleado = empleadoRepository.findById(empleadoId)
                .orElseThrow(() -> new ResourceNotFoundException("Empleado", "id", empleadoId));
        
        return liquidacionSueldoRepository.findByEmpleado(empleado);
    }
    
    /**
     * Obtiene una liquidación de sueldo específica por su ID
     * @param liquidacionId ID de la liquidación
     * @return Liquidación de sueldo
     */
    public LiquidacionSueldo obtenerLiquidacionPorId(String liquidacionId) {
        return liquidacionSueldoRepository.findById(liquidacionId)
                .orElseThrow(() -> new ResourceNotFoundException("Liquidación", "id", liquidacionId));
    }
    
    /**
     * Obtiene las liquidaciones de sueldo de un mes específico
     * @param anio Año de las liquidaciones
     * @param mes Mes de las liquidaciones (1-12)
     * @return Lista de liquidaciones de sueldo
     */
    public List<LiquidacionSueldo> obtenerLiquidacionesPorMes(int anio, int mes) {
        // Validar fecha
        if (mes < 1 || mes > 12) {
            throw new BadRequestException("El mes debe estar entre 1 y 12");
        }
        
        // Obtener liquidaciones
        return liquidacionSueldoRepository.findByFechaAnioAndFechaMes(anio, mes);
    }
    
    /**
     * Genera informe de contabilidad provisional para un mes específico
     * @param anio Año del informe
     * @param mes Mes del informe (1-12)
     * @return Lista de pagos de contabilidad provisional
     */
    public List<PagoContabilidadProvisional> generarInformeContabilidadProvisional(int anio, int mes) {
        // Validar fecha
        if (mes < 1 || mes > 12) {
            throw new BadRequestException("El mes debe estar entre 1 y 12");
        }
        
        // Obtener liquidaciones del mes
        List<LiquidacionSueldo> liquidaciones = obtenerLiquidacionesPorMes(anio, mes);
        
        // Obtener pagos provisionales
        List<PagoContabilidadProvisional> pagosProvisionales = new ArrayList<>();
        for (LiquidacionSueldo liquidacion : liquidaciones) {
            if (liquidacion.getPagosProvisionales() != null && !liquidacion.getPagosProvisionales().isEmpty()) {
                pagosProvisionales.addAll(liquidacion.getPagosProvisionales());
            }
        }
        return pagosProvisionales;
    }
    
    /**
     * Genera el pago de una liquidación de sueldo
     * @param liquidacionId ID de la liquidación
     * @param banco Banco desde donde se realiza el pago
     * @param metodoPago Método de pago utilizado
     * @return Liquidación de sueldo actualizada
     */
    @Transactional
    public LiquidacionSueldo generarPagoLiquidacion(String liquidacionId, String banco, String metodoPago) {
        // Obtener liquidación
        LiquidacionSueldo liquidacion = obtenerLiquidacionPorId(liquidacionId);
        
        // Verificar si ya está pagada
        if ("pagado".equals(liquidacion.getEstado())) {
            throw new BadRequestException("La liquidación ya ha sido pagada");
        }
        
        // Generar pago
        PagoSueldo pago = PagoSueldo.generarPago(banco, metodoPago, liquidacion.getSueldoNeto());
        liquidacion.agregarPago(pago);
        liquidacion.setEstado("pagado");
        
        // Guardar cambios
        return liquidacionSueldoRepository.save(liquidacion);
    }
    
    /**
     * Anula una liquidación de sueldo
     * @param liquidacionId ID de la liquidación
     * @return Liquidación de sueldo anulada
     */
    @Transactional
    public LiquidacionSueldo anularLiquidacion(String liquidacionId) {
        // Obtener liquidación
        LiquidacionSueldo liquidacion = obtenerLiquidacionPorId(liquidacionId);
        
        // Verificar si ya está pagada
        if ("pagado".equals(liquidacion.getEstado())) {
            throw new BadRequestException("No se puede anular una liquidación pagada");
        }
        
        // Anular liquidación
        liquidacion.setEstado("anulado");
        
        // Guardar cambios
        return liquidacionSueldoRepository.save(liquidacion);
    }
    
    /**
     * Genera una liquidación individual para un empleado
     * @param empleadoId ID del empleado
     * @param fechaLiquidacion Fecha de la liquidación
     * @return Liquidación de sueldo generada
     */
    @Transactional
    public LiquidacionSueldo generarLiquidacionIndividual(String empleadoId, LocalDate fechaLiquidacion) {
        // Obtener empleado
        Empleado empleado = empleadoRepository.findById(empleadoId)
                .orElseThrow(() -> new ResourceNotFoundException("Empleado", "id", empleadoId));
        
        // Calcular primer día del mes
        LocalDate primerDia = fechaLiquidacion.withDayOfMonth(1);
        
        // Verificar si ya existe liquidación para este empleado en este mes
        List<LiquidacionSueldo> liquidacionesExistentes = liquidacionSueldoRepository
                .findByEmpleadoAndFechaAnioAndFechaMes(
                        empleado, fechaLiquidacion.getYear(), fechaLiquidacion.getMonthValue());
        
        if (!liquidacionesExistentes.isEmpty()) {
            throw new BadRequestException("Ya existe una liquidación para este empleado en este mes");
        }
        
        // Calcular días trabajados y horas extras
        double diasTrabajados = calcularDiasTrabajados(empleado, primerDia, fechaLiquidacion);
        double horasExtras = calcularHorasExtras(empleado, primerDia, fechaLiquidacion);
        
        // Calcular sueldo base proporcional
        double sueldoBaseProporcional = (empleado.getSueldoBase() / DIAS_MES_COMPLETO) * diasTrabajados;
        
        // Calcular valor de horas extras
        double valorHoraNormal = empleado.getSueldoBase() / (DIAS_MES_COMPLETO * HORAS_JORNADA_COMPLETA);
        double valorHorasExtras = valorHoraNormal * TASA_HORA_EXTRA * horasExtras;
        
        // Calcular sueldo bruto
        double sueldoBruto = sueldoBaseProporcional + valorHorasExtras;
        
        // Crear liquidación
        LiquidacionSueldo liquidacion = new LiquidacionSueldo();
        liquidacion.setEmpleado(empleado);
        liquidacion.setFecha(fechaLiquidacion);
        liquidacion.setEstado("emitido");
        liquidacion.setSueldoBruto(sueldoBruto);
        
        // Aplicar descuentos legales
        double descuentoAFP = sueldoBruto * TASA_AFP;
        double descuentoSalud = sueldoBruto * TASA_SALUD;
        
        Descuento descuentoAfp = new Descuento();
        descuentoAfp.setConcepto("AFP (" + (TASA_AFP * 100) + "%)");
        descuentoAfp.setValor(descuentoAFP);
        liquidacion.agregarDescuento(descuentoAfp);
        
        Descuento descuentoSaludObj = new Descuento();
        descuentoSaludObj.setConcepto("Salud (" + (TASA_SALUD * 100) + "%)");
        descuentoSaludObj.setValor(descuentoSalud);
        liquidacion.agregarDescuento(descuentoSaludObj);
        
        // Actualizar cálculos
        liquidacion.actualizarCalculos();
        
        // Generar pago provisional
        YearMonth yearMonth = YearMonth.of(fechaLiquidacion.getYear(), fechaLiquidacion.getMonthValue());
        PagoContabilidadProvisional pagoProvisional = PagoContabilidadProvisional.generarPagoProvisional(
                yearMonth.toString(), descuentoAFP, descuentoSalud);
        liquidacion.agregarPagoProvisional(pagoProvisional);
        
        // Guardar liquidación
        liquidacionSueldoRepository.save(liquidacion);
        
        // Agregar liquidación al empleado
        empleado.agregarLiquidacionSueldo(liquidacion);
        empleadoRepository.save(empleado);
        
        log.info("Liquidación individual generada para empleado: {} - {}", empleado.getId(), empleado.getNombre());
        
        return liquidacion;
    }
    
    /**
     * Calcula la tasa efectiva por hora para un empleado
     * @param empleadoId ID del empleado
     * @return Tasa efectiva por hora
     */
    public double calcularTasaEfectivaPorHora(String empleadoId) {
        // Obtener empleado
        Empleado empleado = empleadoRepository.findById(empleadoId)
                .orElseThrow(() -> new ResourceNotFoundException("Empleado", "id", empleadoId));
        
        // Calcular tasa horaria
        return empleado.getSueldoBase() / (DIAS_MES_COMPLETO * HORAS_JORNADA_COMPLETA);
    }
    
    /**
     * Obtiene las liquidaciones de sueldo de un empleado en un mes específico
     * @param empleadoId ID del empleado
     * @param anio Año de las liquidaciones
     * @param mes Mes de las liquidaciones (1-12)
     * @return Lista de liquidaciones de sueldo del empleado en el mes especificado
     */
    public List<LiquidacionSueldo> obtenerLiquidacionesPorEmpleadoYMes(String empleadoId, int anio, int mes) {
        // Validar fecha
        if (mes < 1 || mes > 12) {
            throw new BadRequestException("El mes debe estar entre 1 y 12");
        }
        
        // Obtener empleado
        Empleado empleado = empleadoRepository.findById(empleadoId)
                .orElseThrow(() -> new ResourceNotFoundException("Empleado", "id", empleadoId));
        
        // Obtener liquidaciones
        return liquidacionSueldoRepository.findByEmpleadoAndFechaAnioAndFechaMes(empleado, anio, mes);
    }
} 