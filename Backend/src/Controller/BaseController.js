/**
 * @fileoverview Controlador base con funciones comunes para evitar duplicación
 * @version 1.0.0
 */

class BaseController {
  /**
   * Crea una respuesta estándar para errores
   * @param {Response} res - Objeto de respuesta Express
   * @param {Error} error - Error producido
   * @param {number} statusCode - Código HTTP (default: 500)
   */
  static handleError(res, error, statusCode = 500) {
    console.error(`Error en controlador: ${error.message}`, error);
    res.status(statusCode).json({ 
      mensaje: 'Error al procesar la solicitud', 
      error: error.message 
    });
  }
  
  /**
   * Crea una respuesta estándar para recursos no encontrados
   * @param {Response} res - Objeto de respuesta Express
   * @param {string} resourceName - Nombre del recurso no encontrado
   */
  static handleNotFound(res, resourceName) {
    res.status(404).json({ mensaje: `${resourceName} no encontrado` });
  }
  
  /**
   * Crea una respuesta estándar para solicitudes exitosas
   * @param {Response} res - Objeto de respuesta Express
   * @param {Object} data - Datos a enviar
   * @param {string} mensaje - Mensaje opcional
   * @param {number} statusCode - Código HTTP (default: 200)
   */
  static sendResponse(res, data, mensaje = null, statusCode = 200) {
    const response = mensaje ? { mensaje, data } : data;
    res.status(statusCode).json(response);
  }
  
  /**
   * Valida que los campos requeridos estén presentes
   * @param {Request} req - Objeto de solicitud Express
   * @param {Array} requiredFields - Campos requeridos 
   * @returns {string|null} Mensaje de error o null si todo es válido
   */
  static validateRequiredFields(req, requiredFields) {
    for (const field of requiredFields) {
      if (!req.body[field]) {
        return `El campo '${field}' es obligatorio`;
      }
    }
    return null;
  }
}

module.exports = BaseController;
