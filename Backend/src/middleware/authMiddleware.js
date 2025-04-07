/**
 * @fileoverview Middleware para autenticación y autorización de usuarios
 * @author Juan Sebastian Noreña
 * @version 1.0.1
 */

const jwt = require('jsonwebtoken');
const Usuario = require('../Model/Usuario');

/**
 * Middleware para autenticar usuarios mediante JWT
 * @param {Request} req - Objeto de solicitud Express
 * @param {Response} res - Objeto de respuesta Express
 * @param {Function} next - Función next de Express
 * @returns {void}
 */
const authenticateUser = async (req, res, next) => {
  try {
    // Verificar si existe token en el header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Acceso no autorizado, token no proporcionado' });
    }
    
    // Extraer el token
    const token = authHeader.split(' ')[1];
    
    // Verificar el token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'personalpay_secret_key');
    
    // Buscar el usuario en la base de datos
    const user = await Usuario.findById(decoded.id);
    
    if (!user) {
      return res.status(401).json({ message: 'Usuario no encontrado' });
    }
    
    // Agregar información del usuario al objeto de solicitud
    req.user = {
      id: user._id,
      username: user.username,
      rol: user.rol,
      empleadoId: user.empleado
    };
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Token inválido' });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expirado' });
    }
    
    res.status(401).json({ message: 'No autorizado, error de autenticación' });
  }
};

/**
 * Middleware para autorizar usuarios por roles
 * @param {Array<string>} roles - Roles permitidos
 * @returns {Function} Middleware de Express para autorización
 */
const authorizeRoles = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(500).json({ 
        message: 'Error del servidor: usuario no autenticado' 
      });
    }
    
    if (!roles.includes(req.user.rol)) {
      return res.status(403).json({ 
        message: 'Acceso denegado. No tiene permisos para esta operación' 
      });
    }
    
    next();
  };
};

module.exports = { authenticateUser, authorizeRoles };