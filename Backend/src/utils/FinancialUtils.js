/**
 * @fileoverview Utilidades para cálculos financieros y operaciones comunes
 * @author Juan Sebastian Noreña
 * @version 1.0.1
 */

/**
 * Clase de utilidades para cálculos financieros
 * @class FinancialUtils
 */
class FinancialUtils {
  /**
   * Tasas estándar utilizadas en cálculos
   * @static
   * @property {number} TASA_AFP - Porcentaje de cotización para AFP (10%)
   * @property {number} TASA_SALUD - Porcentaje de cotización para salud (7%) 
   * @property {number} DIAS_LABORABLES - Días laborables estándar por mes
   * @property {number} HORAS_JORNADA - Horas estándar por jornada laboral
   */
  static TASA_AFP = 0.10; // 10% de cotización AFP
  static TASA_SALUD = 0.07; // 7% de cotización de salud
  static DIAS_LABORABLES = 20; // Días laborables por mes (promedio)
  static HORAS_JORNADA = 8; // Horas por jornada laboral

  /**
   * Calcula los descuentos legales aplicables al sueldo bruto
   * @param {number} sueldoBruto - Sueldo bruto
   * @returns {Object} Objeto con los descuentos calculados
   * @property {number} afp - Monto a pagar por AFP
   * @property {number} salud - Monto a pagar por salud
   * @property {number} totalDescuentos - Suma total de descuentos
   * @property {Array<Object>} detalles - Lista detallada de descuentos
   */
  static calcularDescuentosLegales(sueldoBruto) {
    const descuentoAFP = sueldoBruto * this.TASA_AFP;
    const descuentoSalud = sueldoBruto * this.TASA_SALUD;
    
    return {
      afp: descuentoAFP,
      salud: descuentoSalud,
      totalDescuentos: descuentoAFP + descuentoSalud,
      detalles: [
        {
          concepto: 'AFP',
          valor: descuentoAFP
        },
        {
          concepto: 'Salud',
          valor: descuentoSalud
        }
      ]
    };
  }

  /**
   * Calcula el sueldo bruto basado en el sueldo base y los registros de asistencia
   * @param {number} sueldoBase - Sueldo base del empleado
   * @param {Array<Object>} registrosAsistencia - Registros de asistencia del período
   * @param {number} registrosAsistencia[].totalHorasTrabajadas - Horas trabajadas en cada registro
   * @returns {number} Sueldo bruto calculado
   */
  static calcularSueldoBruto(sueldoBase, registrosAsistencia) {
    // Valor diario del sueldo base
    const valorDiario = sueldoBase / this.DIAS_LABORABLES;
    const valorHora = valorDiario / this.HORAS_JORNADA;
    const tasaHoraExtra = 1.5; // 50% adicional por hora extra
    
    // Si no hay registros, asumimos asistencia completa
    if (!registrosAsistencia || registrosAsistencia.length === 0) {
      return sueldoBase;
    }

    let horasRegulares = 0;
    let horasExtras = 0;
    
    // Sumar horas trabajadas, separando regulares y extras
    registrosAsistencia.forEach(registro => {
      if (registro.totalHorasTrabajadas <= this.HORAS_JORNADA) {
        horasRegulares += registro.totalHorasTrabajadas;
      } else {
        horasRegulares += this.HORAS_JORNADA;
        horasExtras += (registro.totalHorasTrabajadas - this.HORAS_JORNADA);
      }
    });
    
    // Calcular montos por horas regulares y extras
    const montoPorHorasRegulares = horasRegulares * valorHora;
    const montoPorHorasExtras = horasExtras * valorHora * tasaHoraExtra;
    
    // Total sueldo bruto
    const totalCalculado = montoPorHorasRegulares + montoPorHorasExtras;
    
    // Si no trabajó todas las horas esperadas, se reduce proporcionalmente
    if (horasRegulares < (this.DIAS_LABORABLES * this.HORAS_JORNADA)) {
      return totalCalculado;
    } else {
      // Si trabajó todas las horas regulares o más, recibe el sueldo base + horas extras
      return sueldoBase + montoPorHorasExtras;
    }
  }
  
  /**
   * Devuelve las fechas de inicio y fin para un periodo mensual
   * @param {number} mes - Mes (1-12) 
   * @param {number} anio - Año
   * @returns {Object} Objeto con fechas de inicio y fin
   * @property {Date} inicio - Primer día del mes a las 00:00:00
   * @property {Date} fin - Último día del mes a las 23:59:59
   */
  static obtenerPeriodoMensual(mes, anio) {
    const inicio = new Date(anio, mes - 1, 1);
    const fin = new Date(anio, mes, 0, 23, 59, 59, 999);
    return { inicio, fin };
  }

  /**
   * Genera un resumen de pagos previsionales por período
   * @param {Array<Object>} pagos - Lista de pagos provisionales
   * @param {number} pagos[].totalPagoPension - Monto de pensión
   * @param {number} pagos[].totalPagoSalud - Monto de salud
   * @param {string} [pagos[].afp] - Nombre de la AFP
   * @param {string} [pagos[].isapre] - Nombre de la ISAPRE
   * @returns {Object} Resumen de pagos por AFP e ISAPRE
   * @property {number} totalAFP - Suma total de pagos a AFP
   * @property {number} totalSalud - Suma total de pagos a salud
   * @property {number} montoTotal - Suma total de pagos previsionales
   * @property {Object} detalleAFP - Desglose por AFP
   * @property {Object} detalleSalud - Desglose por ISAPRE
   */
  static generarResumenPagosPrevisionales(pagos) {
    const resumenAFP = {};
    const resumenSalud = {};
    let totalAFP = 0;
    let totalSalud = 0;
    
    pagos.forEach(pago => {
      totalAFP += pago.totalPagoPension || 0;
      totalSalud += pago.totalPagoSalud || 0;
      
      // Si hay información específica, podemos agruparla
      if (pago.afp) {
        resumenAFP[pago.afp] = (resumenAFP[pago.afp] || 0) + pago.totalPagoPension;
      }
      
      if (pago.isapre) {
        resumenSalud[pago.isapre] = (resumenSalud[pago.isapre] || 0) + pago.totalPagoSalud;
      }
    });
    
    return {
      totalAFP,
      totalSalud,
      montoTotal: totalAFP + totalSalud,
      detalleAFP: resumenAFP,
      detalleSalud: resumenSalud
    };
  }
}

module.exports = FinancialUtils;
