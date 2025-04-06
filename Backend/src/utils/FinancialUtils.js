/**
 * @fileoverview Utilidades para cálculos financieros y operaciones comunes
 * @version 1.0.0
 */

class FinancialUtils {
  /**
   * Tasas estándar utilizadas en cálculos
   */
  static TASA_AFP = 0.10; // 10% de cotización AFP
  static TASA_SALUD = 0.07; // 7% de cotización de salud
  static DIAS_LABORABLES = 20; // Días laborables por mes (promedio)
  static HORAS_JORNADA = 8; // Horas por jornada laboral

  /**
   * Calcula los descuentos legales aplicables al sueldo bruto
   * @param {number} sueldoBruto - Sueldo bruto
   * @returns {Object} Objeto con los descuentos calculados
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
   * @param {Array} registrosAsistencia - Registros de asistencia del período
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
    
    // Total sueldo bruto (no puede ser mayor que el sueldo base + horas extras)
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
   */
  static obtenerPeriodoMensual(mes, anio) {
    const inicio = new Date(anio, mes - 1, 1);
    const fin = new Date(anio, mes, 0);
    return { inicio, fin };
  }
}

module.exports = FinancialUtils;
