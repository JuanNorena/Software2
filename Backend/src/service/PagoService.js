/**
 * @fileoverview Servicio unificado para gestionar pagos de sueldos y pagos provisionales
 * @author Juan Sebastian Noreña
 * @version 1.0.0
 */

const PagoSueldo = require('../Model/PagoSueldo');
const PagoContabilidadProvisional = require('../Model/PagoContabilidadProvisional');
const LiquidacionSueldo = require('../Model/LiquidacionSueldo');
const Descuento = require('../Model/Descuento');
const FinancialUtils = require('../utils/FinancialUtils');
const NotificacionService = require('./NotificacionService');

/**
 * Servicio para gestionar pagos de sueldos y pagos provisionales
 * @class PagoService
 */
class PagoService {
  /**
   * Procesa el pago de una liquidación
   * @param {string} liquidacionId - ID de la liquidación
   * @param {Object} datosPago - Datos para el pago (método, banco, etc.)
   * @returns {Promise<Object>} Información del pago realizado
   * @throws {Error} Si la liquidación no existe o no está aprobada
   */
  async procesarPagoLiquidacion(liquidacionId, datosPago) {
    // 1. Verificar que la liquidación exista y esté aprobada
    const liquidacion = await LiquidacionSueldo.findById(liquidacionId)
        .populate('empleado');
        
    if (!liquidacion) {
      throw new Error('Liquidación no encontrada');
    }
    
    if (liquidacion.estado !== 'aprobado') {
      throw new Error('La liquidación debe estar aprobada para procesar el pago');
    }
    
    // 2. Realizar el pago del sueldo
    const pagoSueldo = await this.crearPagoSueldo(liquidacion, datosPago);
    
    // 3. Generar los pagos provisionales (AFP, Salud)
    const pagoProvisional = await this.generarPagoProvisional(liquidacion);
    
    // 4. Actualizar estado de la liquidación
    liquidacion.estado = 'pagado';
    await liquidacion.save();
    
    // 5. Notificar al empleado sobre el pago realizado
    await NotificacionService.notificarPagoRealizado(liquidacion.empleado._id, liquidacionId);
    
    return {
      liquidacion,
      pagoSueldo,
      pagoProvisional
    };
  }

  /**
   * Crea un nuevo pago de sueldo
   * @param {Object} liquidacion - Liquidación de sueldo
   * @param {Object} datosPago - Datos para el pago
   * @returns {Promise<Object>} Pago creado
   * @throws {Error} Si el método de pago es inválido o la liquidación ya está pagada
   */
  async crearPagoSueldo(liquidacion, datosPago) {
    if (!datosPago.metodoPago || !['cheque', 'deposito'].includes(datosPago.metodoPago)) {
      throw new Error('El método de pago debe ser "cheque" o "deposito"');
    }
    
    if (!datosPago.banco) {
      throw new Error('Se debe especificar el banco para el pago');
    }
    
    // Verificar que la liquidación no esté ya pagada
    if (liquidacion.estado === 'pagado') {
      throw new Error('Esta liquidación ya ha sido pagada');
    }
    
    const nuevoPago = new PagoSueldo({
      liquidacionSueldo: liquidacion._id,
      banco: datosPago.banco,
      fecha: new Date(),
      metodoPago: datosPago.metodoPago,
      monto: liquidacion.sueldoNeto
    });
    
    return await nuevoPago.save();
  }

  /**
   * Genera un pago provisional para una liquidación
   * @param {Object} liquidacion - Liquidación de sueldo
   * @returns {Promise<Object>} Pago provisional generado
   * @throws {Error} Si no hay montos previsionales para generar el pago
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
    const { inicio, fin } = FinancialUtils.obtenerPeriodoMensual(mes, anio);
    
    let query = {
      fechaPago: {
        $gte: inicio,
        $lt: fin
      }
    };
    
    // Si se especificó una empresa, filtramos por empleados de esa empresa
    if (empresaId) {
      // Necesitamos hacer un join más complejo con la empresa del empleado
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
    const resumen = FinancialUtils.generarResumenPagosPrevisionales(pagos);
    
    return {
      periodo: `${mes}/${anio}`,
      fechaGeneracion: new Date(),
      cantidadPagos: pagos.length,
      ...resumen
    };
  }

  /**
   * Obtiene todos los pagos de sueldo
   * @returns {Promise<Array>} Lista de pagos
   */
  async obtenerTodosPagosSueldo() {
    return await PagoSueldo.find()
      .populate('liquidacionSueldo', 'fecha sueldoBruto sueldoNeto')
      .populate({
        path: 'liquidacionSueldo',
        populate: { path: 'empleado', select: 'nombre rut cargo' }
      });
  }

  /**
   * Obtiene todos los pagos provisionales
   * @returns {Promise<Array>} Lista de pagos
   */
  async obtenerTodosPagosProvisionales() {
    return await PagoContabilidadProvisional.find()
      .populate('liquidacionSueldo', 'fecha sueldoBruto sueldoNeto')
      .populate({
        path: 'liquidacionSueldo',
        populate: { path: 'empleado', select: 'nombre rut cargo' }
      });
  }
}

module.exports = new PagoService();
