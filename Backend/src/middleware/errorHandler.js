/**
 * Middleware para manejo centralizado de errores
 */

/**
 * Maneja errores de validación de Mongoose
 * @param {Error} err - Error de mongoose
 * @returns {Object} Objeto con mensajes de error formateados
 */
const handleValidationError = (err) => {
  const errors = Object.values(err.errors).map(error => error.message);
  return {
    status: 400,
    message: 'Error de validación',
    errors
  };
};

/**
 * Maneja errores de duplicación de clave única en MongoDB
 * @param {Error} err - Error de MongoDB
 * @returns {Object} Objeto con mensaje de error formateado
 */
const handleDuplicateKeyError = (err) => {
  const field = Object.keys(err.keyValue)[0];
  return {
    status: 409,
    message: `El valor '${err.keyValue[field]}' para el campo '${field}' ya existe. Por favor use otro valor.`
  };
};

/**
 * Maneja errores de ID no válido en MongoDB
 * @param {Error} err - Error de MongoDB
 * @returns {Object} Objeto con mensaje de error formateado
 */
const handleCastError = (err) => {
  return {
    status: 400,
    message: `ID no válido: ${err.value}`
  };
};

/**
 * Middleware para manejar errores en Express
 */
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Error por defecto
  let customError = {
    status: err.status || 500,
    message: err.message || 'Error interno del servidor'
  };

  // Manejar diferentes tipos de errores
  if (err.name === 'ValidationError') {
    customError = handleValidationError(err);
  } else if (err.code && err.code === 11000) {
    customError = handleDuplicateKeyError(err);
  } else if (err.name === 'CastError') {
    customError = handleCastError(err);
  }

  // Responder con el error formateado
  return res.status(customError.status).json({
    success: false,
    message: customError.message,
    errors: customError.errors || null,
    stack: process.env.NODE_ENV === 'development' ? err.stack : null
  });
};

module.exports = errorHandler;