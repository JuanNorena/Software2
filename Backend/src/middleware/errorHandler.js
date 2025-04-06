/**
 * @fileoverview Middleware para manejar errores de forma centralizada
 * @author Juan Sebastian Noreña
 * @version 1.0.1
 */

/**
 * Middleware para manejar errores en rutas Express
 * @param {Error} err - Error capturado
 * @param {Request} req - Objeto de solicitud Express
 * @param {Response} res - Objeto de respuesta Express
 * @param {Function} next - Función next de Express
 * @returns {void}
 */
const errorHandler = (err, req, res, next) => {
  // Determinar el código de estado HTTP apropiado
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message || 'Error del servidor';
  let stack = process.env.NODE_ENV === 'production' ? null : err.stack;
  
  // Errores específicos de Mongoose
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    statusCode = 400;
    message = 'ID de recurso inválido';
  } else if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors).map(val => val.message).join(', ');
  } else if (err.code === 11000) {
    statusCode = 400;
    message = 'Valor duplicado para un campo que debe ser único';
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Token inválido';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expirado';
  }

  // Crear objeto de error personalizado
  const customError = {
    statusCode,
    message,
    stack
  };

  // Enviar respuesta de error
  res.status(statusCode).json({
    success: false,
    message: customError.message,
    errors: customError.errors || null,
    stack: process.env.NODE_ENV === 'development' ? err.stack : null
  });
};

module.exports = errorHandler;