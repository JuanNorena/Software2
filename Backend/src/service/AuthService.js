/**
 * @fileoverview Servicio para manejar la autenticación y gestión de usuarios
 * @version 1.0.0
 */

const Usuario = require('../Model/Usuario');
const Empleado = require('../Model/Empleado');
const jwt = require('jsonwebtoken');
const AsistenciaService = require('./AsistenciaService');

class AuthService {
  /**
   * Autentica a un usuario y genera un token JWT
   * @param {string} username - Nombre de usuario
   * @param {string} password - Contraseña del usuario
   * @returns {Promise<Object>} Objeto con token y datos del usuario
   */
  async login(username, password) {
    // Buscar el usuario por nombre de usuario
    const usuario = await Usuario.findOne({ username });
    if (!usuario) {
      throw new Error('Credenciales inválidas');
    }

    // Verificar si la cuenta está habilitada
    if (!usuario.enabled || !usuario.accountNonLocked || !usuario.accountNonExpired || !usuario.credentialsNonExpired) {
      throw new Error('Cuenta deshabilitada o bloqueada');
    }

    // Verificar la contraseña
    const isPasswordValid = await usuario.comparePassword(password);
    if (!isPasswordValid) {
      throw new Error('Credenciales inválidas');
    }

    // Obtener información adicional según el rol
    let userData = {};
    if (usuario.rol === 'EMPLEADO' && usuario.empleado) {
      const empleado = await Empleado.findById(usuario.empleado).populate('empresa', 'nombre');
      if (empleado) {
        userData = {
          empleadoId: empleado._id,
          nombre: empleado.nombre,
          cargo: empleado.cargo,
          empresa: empleado.empresa
        };
        
        // Registrar entrada del empleado
        try {
          await AsistenciaService.registrarEntrada(empleado._id);
          console.log(`Entrada registrada para empleado: ${empleado._id}`);
        } catch (asistenciaError) {
          console.error(`Error al registrar entrada: ${asistenciaError.message}`);
          // No interrumpimos el login si falla el registro de asistencia
        }
      }
    }

    // Generar token JWT
    const token = jwt.sign(
      { 
        id: usuario._id,
        username: usuario.username,
        rol: usuario.rol,
        ...userData
      },
      process.env.JWT_SECRET || 'personalpay_secret_key',
      { expiresIn: '24h' }
    );

    return {
      token,
      usuario: {
        id: usuario._id,
        username: usuario.username,
        rol: usuario.rol,
        ...userData
      }
    };
  }

  /**
   * Registra la salida de un empleado
   * @param {string} empleadoId - ID del empleado
   * @returns {Promise<Object>} Registro de asistencia actualizado
   */
  async logout(empleadoId) {
    if (!empleadoId) {
      throw new Error('ID de empleado no proporcionado');
    }
    
    return await AsistenciaService.registrarSalida(empleadoId);
  }
  
  /**
   * Verifica si el usuario tiene el rol especificado
   * @param {Object} user - Usuario autenticado
   * @param {string|Array} roles - Rol o roles permitidos
   * @returns {boolean} True si tiene acceso, false si no
   */
  verificarRol(user, roles) {
    if (!user || !user.rol) return false;
    
    if (Array.isArray(roles)) {
      return roles.includes(user.rol);
    }
    
    return user.rol === roles;
  }
}

module.exports = new AuthService();
