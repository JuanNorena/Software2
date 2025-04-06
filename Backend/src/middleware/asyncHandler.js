/**
  * @fileoverview Middleware para manejar funciones asíncronas en rutas Express
 * Envuelve las funciones de controlador para capturar errores y pasarlos al middleware de manejo de errores
 * @author Juan Sebastian Noreña
 * @version 1.0.1
 */

/**
 * @param {Function} fn - Función asíncrona del controlador
 * @returns {Function} Middleware de Express con manejo de errores
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next))
      .catch(next); // Captura cualquier error y lo pasa al siguiente middleware (errorHandler)
  };
};

module.exports = asyncHandler;