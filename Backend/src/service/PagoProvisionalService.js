/**
 * @fileoverview Servicio para gestionar los pagos de cotizaciones previsionales (AFP e ISAPRES)
 * @version 1.0.0
 */

const PagoContabilidadProvisional = require('../Model/PagoContabilidadProvisional');
const Descuento = require('../Model/Descuento');

class PagoProvisionalService {
  /**
   * Genera un pago provisional para una liquidación
   * @param {Object} liquidacion - Liquidación de sueldo
   * @returns {Promise<Object>} Pago provisional generado
   */
  async generarPagoProvisional(liquidacion) {
    // 1. Obtener los descuentos de la liquidación
    const descuentos = await Descuento.find({ liquidacionSueldo: liquidacion._id });
    
    // 2. Filtrar y calcular montos de AFP y Salud
    const descuentoAFP = descuentos.find(d => d.concepto === 'AFP');
    const descuentoSalud = descuentos.find(d => d.concepto === 'Salud');
    
    const montoAFP = descuentoAFP ? descuentoAFP.valor : 0;
    const montoSalud = descuentoSalud ? descuentoSalud.valor : 0;
    const totalProvisional = montoAFP + montoSalud;
    
    if (totalProvisional <= 0) {
      throw new Error('No hay montos previsionales para generar el pago');
    }
    
    // 3. Crear registro de pago provisional
    const fecha = new Date();
    const mesAnio = `${fecha.getMonth() + 1}/${fecha.getFullYear()}`;
    
    const nuevoPago = new PagoContabilidadProvisional({
      liquidacionSueldo: liquidacion._id,
      fechaPago: fecha,
      periodoCorrespondiente: mesAnio,
      totalPago: totalProvisional,
      totalPagoPension: montoAFP,
      totalPagoSalud: montoSalud
    });
    
    return await nuevoPago.save();
  }

  /**
   * Obtiene pagos provisionales filtrados por período
   * @param {number} mes - Mes (1-12)
   * @param {number} anio - Año
   * @param {string} [empresaId] - ID de la empresa (opcional)
   * @returns {Promise<Array>} Lista de pagos provisionales
   */
  async obtenerPagosPorPeriodo(mes, anio, empresaId = null) {
    const primerDiaMes = new Date(anio, mes - 1, 1);
    const primerDiaSiguienteMes = new Date(anio, mes, 1);
    
    let query = {
      fechaPago: {
        $gte: primerDiaMes,
        $lt: primerDiaSiguienteMes
      }
    };
    
    // Si se especificó una empresa, filtramos por empleados de esa empresa
    if (empresaId) {
      // Necesitamos hacer un join más complejo con la empresa del empleado
      // En un entorno real, esto podría optimizarse con una agregación
      const pagos = await PagoContabilidadProvisional.find(query)
        .populate({
          path: 'liquidacionSueldo',
          populate: { path: 'empleado', select: 'empresa nombre rut' }
        });
      
      return pagos.filter(pago => 
        pago.liquidacionSueldo && 
        pago.liquidacionSueldo.empleado && 
        pago.liquidacionSueldo.empleado.empresa.toString() === empresaId
      );
    }
    
    return await PagoContabilidadProvisional.find(query)
      .populate({
        path: 'liquidacionSueldo',
        populate: { path: 'empleado', select: 'nombre rut' }
      });
  }

  /**
   * Genera informe de pagos previsionales
   * @param {number} mes - Mes (1-12)
   * @param {number} anio - Año
   * @returns {Promise<Object>} Informe generado
   */
  async generarInformePrevisional(mes, anio) {
    const pagos = await this.obtenerPagosPorPeriodo(mes, anio);
    
    // Agrupar por AFP e ISAPRE para el informe
    const resumenAFP = {};
    const resumenSalud = {};
    let totalAFP = 0;
    let totalSalud = 0;
    
    pagos.forEach(pago => {
      // En un sistema real, aquí se obtendría la AFP y la ISAPRE específica de cada empleado
      // Para este ejemplo, agrupamos todos los pagos
      totalAFP += pago.totalPagoPension;
      totalSalud += pago.totalPagoSalud;
      
      // Si tuviéramos la información específica de AFP e ISAPRE:
      // const afp = pago.liquidacionSueldo.empleado.afp || 'Desconocida';
      // resumenAFP[afp] = (resumenAFP[afp] || 0) + pago.totalPagoPension;
    });
    
    return {
      periodo: `${mes}/${anio}`,
      fechaGeneracion: new Date(),
      cantidadPagos: pagos.length,
      montoTotalAFP: totalAFP,
      montoTotalSalud: totalSalud,
      montoTotal: totalAFP + totalSalud,
      detalleAFP: resumenAFP,
      detalleSalud: resumenSalud
    };
  }
}

module.exports = new PagoProvisionalService();
