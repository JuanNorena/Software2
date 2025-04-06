/**
 * @fileoverview Servicio para manejar la autenticación y gestión de usuarios
 * @author Juan Sebastian Noreña
 * @version 1.0.0
 */

const Usuario = require('../Model/Usuario');
const Empleado = require('../Model/Empleado');
const jwt = require('jsonwebtoken');
const AsistenciaService = require('./AsistenciaService');

/**
 * Servicio para la gestión de autenticación y usuarios
 * @class AuthService
 */
class AuthService {
  /**
   * Registra un nuevo usuario en el sistema
   * @param {Object} userData - Datos del usuario
   * @param {string} userData.username - Nombre de usuario
   * @param {string} userData.password - Contraseña (sin encriptar)
   * @param {string} userData.rol - Rol del usuario (ADMIN, EMPLEADO)
   * @param {string} [userData.empleadoId] - ID del empleado asociado (si aplica)
   * @returns {Promise<Object>} Usuario creado
   * @throws {Error} Si el usuario ya existe o hay error en la creación
   */
  async register(userData) {
    // ...existing code...
  }

  /**
   * Autentica a un usuario y genera un token JWT
   * @param {string} username - Nombre de usuario
   * @param {string} password - Contraseña
   * @returns {Promise<Object>} Información del usuario y token JWT
   * @throws {Error} Si las credenciales son inválidas
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
   * Cierra la sesión de un usuario y registra la salida si es empleado
   * @param {string} empleadoId - ID del empleado
   * @returns {Promise<Object>} Registro de asistencia actualizado
   * @throws {Error} Si no se puede registrar la salida
   */
  async logout(empleadoId) {
    if (!empleadoId) {
      throw new Error('ID de empleado no proporcionado');
    }
    
    return await AsistenciaService.registrarSalida(empleadoId);
  }

  /**
   * Genera un token JWT para un usuario
   * @param {Object} userData - Datos del usuario a incluir en el token
   * @param {string} userData.id - ID del usuario
   * @param {string} userData.username - Nombre de usuario
   * @param {string} userData.rol - Rol del usuario
   * @param {string} [userData.empleadoId] - ID del empleado (si aplica)
   * @returns {string} Token JWT generado
   */
  generateToken(userData) {
    // ...existing code...
  }

  /**
   * Verifica un token JWT
   * @param {string} token - Token JWT a verificar
   * @returns {Object} Datos del payload del token si es válido
   * @throws {Error} Si el token es inválido o ha expirado
   */
  verifyToken(token) {
    // ...existing code...
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
