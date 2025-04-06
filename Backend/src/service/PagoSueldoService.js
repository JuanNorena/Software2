/**
 * @fileoverview Servicio para gestionar los pagos de sueldos
 * @version 1.0.0
 */

const PagoSueldo = require('../Model/PagoSueldo');

class PagoSueldoService {
  /**
   * Crea un nuevo pago de sueldo
   * @param {Object} liquidacion - Liquidación de sueldo
   * @param {Object} datosPago - Datos para el pago
   * @param {string} datosPago.metodoPago - Método de pago (cheque o deposito)
   * @param {string} datosPago.banco - Banco para el pago
   * @returns {Promise<Object>} Pago creado
   */
  async crearPago(liquidacion, datosPago) {
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
   * Obtiene un pago por su ID
   * @param {string} pagoId - ID del pago
   * @returns {Promise<Object>} Pago encontrado
   */
  async obtenerPago(pagoId) {
    const pago = await PagoSueldo.findById(pagoId)
      .populate({
        path: 'liquidacionSueldo',
        populate: { path: 'empleado' }
      });
      
    if (!pago) {
      throw new Error('Pago no encontrado');
    }
    
    return pago;
  }

  /**
   * Obtiene los pagos de un empleado
   * @param {string} empleadoId - ID del empleado
   * @returns {Promise<Array>} Lista de pagos
   */
  async obtenerPagosPorEmpleado(empleadoId) {
    return await PagoSueldo.find()
      .populate({
        path: 'liquidacionSueldo',
        match: { empleado: empleadoId },
        populate: { path: 'empleado' }
      })
      .then(pagos => pagos.filter(pago => pago.liquidacionSueldo)); // Filtrar pagos sin liquidación
  }

  /**
   * Anula un pago de sueldo
   * @param {string} pagoId - ID del pago
   * @param {string} motivo - Motivo de la anulación
   * @returns {Promise<Object>} Resultado de la operación
   */
  async anularPago(pagoId, motivo) {
    const pago = await PagoSueldo.findById(pagoId);
    if (!pago) {
      throw new Error('Pago no encontrado');
    }
    
    // En un sistema real, se debería registrar la anulación y posiblemente
    // reversar la transacción bancaria, según el caso
    
    // Revertir estado de la liquidación
    const LiquidacionSueldo = require('../Model/LiquidacionSueldo');
    const liquidacion = await LiquidacionSueldo.findById(pago.liquidacionSueldo);
    
    if (liquidacion) {
      liquidacion.estado = 'aprobado'; // Vuelve al estado anterior al pago
      await liquidacion.save();
    }
    
    // Registrar la anulación (en un sistema real se crearía un modelo específico)
    console.log(`Pago ${pagoId} anulado. Motivo: ${motivo}`);
    
    // Eliminar el pago
    await PagoSueldo.findByIdAndDelete(pagoId);
    
    return {
      mensaje: 'Pago anulado correctamente',
      pagoId,
      liquidacionId: pago.liquidacionSueldo,
      fechaAnulacion: new Date()
    };
  }
}

module.exports = new PagoSueldoService();
