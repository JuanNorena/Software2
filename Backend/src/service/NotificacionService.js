/**
 * @fileoverview Servicio para gestionar las notificaciones a los empleados
 * @author Juan Sebastian Noreña
 * @version 1.0.1
 */

const Empleado = require('../Model/Empleado');

/**
 * Servicio para gestionar las notificaciones a los empleados
 * @class NotificacionService
 */
class NotificacionService {
  /**
   * Envía una notificación genérica al empleado
   * @param {string} empleadoId - ID del empleado
   * @param {string} tipo - Tipo de notificación
   * @param {string} mensaje - Mensaje a enviar
   * @param {Object} datos - Datos adicionales
   * @returns {Promise<Object>} Resultado de la notificación
   * @throws {Error} Si el empleado no existe
   */
  async enviarNotificacion(empleadoId, tipo, mensaje, datos = {}) {
    try {
      const empleado = await Empleado.findById(empleadoId);
      if (!empleado) {
        throw new Error('Empleado no encontrado');
      }
      
      // En un entorno real, aquí se enviaría un email, SMS, o notificación push
      console.log(`Notificación ${tipo}: ${mensaje} para ${empleado.nombre}`);
      
      // Simulación de registro de notificación
      return {
        empleadoId,
        tipo,
        mensaje,
        datos,
        fechaEnvio: new Date(),
        entregada: true
      };
    } catch (error) {
      console.error(`Error al enviar notificación ${tipo}:`, error);
      return {
        empleadoId,
        tipo,
        error: error.message,
        entregada: false
      };
    }
  }

  /**
   * Notifica al empleado que su liquidación está disponible
   * @param {string} empleadoId - ID del empleado
   * @param {string} liquidacionId - ID de la liquidación
   * @returns {Promise<Object>} Resultado de la notificación
   */
  async notificarLiquidacionDisponible(empleadoId, liquidacionId) {
    return this.enviarNotificacion(
      empleadoId, 
      'liquidacion_disponible', 
      `Su liquidación de sueldo está disponible para revisión`,
      { liquidacionId }
    );
  }

  /**
   * Notifica al empleado que su pago ha sido realizado
   * @param {string} empleadoId - ID del empleado
   * @param {string} liquidacionId - ID de la liquidación
   * @returns {Promise<Object>} Resultado de la notificación
   */
  async notificarPagoRealizado(empleadoId, liquidacionId) {
    return this.enviarNotificacion(
      empleadoId, 
      'pago_realizado', 
      `El pago de su liquidación de sueldo ha sido procesado`,
      { liquidacionId }
    );
  }
}

module.exports = new NotificacionService();
