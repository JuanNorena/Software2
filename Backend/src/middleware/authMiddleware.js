/**
 * @fileoverview Middleware para la autenticación y autorización de usuarios
 * @author Juan Sebastian Noreña
 * @version 1.0.0
 */

const jwt = require('jsonwebtoken');
const Usuario = require('../Model/Usuario');

/**
 * Middleware para verificar si el usuario está autenticado
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} res - Objeto de respuesta Express
 * @param {Function} next - Función para continuar con el siguiente middleware
 */
const authenticateUser = async (req, res, next) => {
  try {
    // Obtener el token del encabezado de autorización
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No autorizado. Token no proporcionado' });
    }

    const token = authHeader.split(' ')[1];
    
    // Verificar el token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'personalpay_secret_key');
    
    // Buscar el usuario en la base de datos
    const usuario = await Usuario.findById(decoded.id);
    if (!usuario) {
      return res.status(401).json({ message: 'No autorizado. Usuario no encontrado' });
    }

    // Verificar si la cuenta está habilitada
    if (!usuario.enabled || !usuario.accountNonLocked || !usuario.accountNonExpired || !usuario.credentialsNonExpired) {
      return res.status(401).json({ message: 'Cuenta deshabilitada o bloqueada' });
    }

    // Agregar la información del usuario al objeto de solicitud
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'No autorizado. Token inválido o expirado' });
    }
    res.status(500).json({ message: 'Error en la autenticación' });
  }
};

/**
 * Middleware para verificar si el usuario tiene el rol requerido
 * @param {string[]} roles - Roles permitidos
 * @returns {Function} Middleware para verificar roles
 */
const authorizeRoles = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'No autorizado. Usuario no autenticado' });
    }

    if (!roles.includes(req.user.rol)) {
      return res.status(403).json({ message: 'Prohibido. No tiene permisos para esta acción' });
    }

    next();
  };
};

module.exports = {
  authenticateUser,
  authorizeRoles
};