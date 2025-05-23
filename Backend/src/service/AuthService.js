/**
 * @fileoverview Servicio para manejar la autenticación y gestión de usuarios
 * @author Juan Sebastian Noreña
 * @version 1.0.1
 */

const Usuario = require('../Model/Usuario');
const Empleado = require('../Model/Empleado');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const AsistenciaService = require('./AsistenciaService');
const EmailService = require('./EmailService');

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
   * @param {boolean} recordarme - Extender duración del token si es true
   * @returns {Promise<Object>} Información del usuario y token JWT
   * @throws {Error} Si las credenciales son inválidas
   */
  async login(username, password, recordarme = false) {
    console.log(`Intento de login con username: ${username}`);
    
    // Buscar el usuario por nombre de usuario
    const usuario = await Usuario.findOne({ username });
    
    if (!usuario) {
      console.log(`Usuario no encontrado: ${username}`);
      throw new Error('Credenciales inválidas');
    }
  
    console.log(`Usuario encontrado con ID: ${usuario._id}, rol: ${usuario.rol}`);
  
    // Caso especial para el desarrollo, permitir el login del admin con la contraseña directa
    if (process.env.NODE_ENV === 'development' && username === 'admin' && password === (process.env.DEFAULT_ADMIN_PASSWORD || '123admin')) {
      console.log('Inicio de sesión de administrador en modo desarrollo');
      
      // Resetear contador de intentos fallidos
      usuario.intentosFallidos = 0;
      usuario.fechaBloqueo = null;
      usuario.ultimoAcceso = new Date();
      await usuario.save();
      
      // Generar token directamente
      const token = this.generateToken({
        id: usuario._id,
        username: usuario.username,
        rol: usuario.rol
      });
      
      return {
        token,
        usuario: {
          id: usuario._id,
          username: usuario.username,
          rol: usuario.rol
        }
      };
    }
  
    // Verificar si la cuenta está bloqueada temporalmente
    if (usuario.fechaBloqueo && usuario.fechaBloqueo > new Date()) {
      const minutosRestantes = Math.ceil((usuario.fechaBloqueo - new Date()) / (1000 * 60));
      console.log(`Cuenta bloqueada por ${minutosRestantes} minutos más`);
      throw new Error(`Cuenta bloqueada temporalmente. Intente nuevamente en ${minutosRestantes} minutos`);
    }
  
    // Verificar si la cuenta está habilitada
    if (usuario.enabled === false) {
      console.log(`Cuenta deshabilitada para usuario: ${username}`);
      throw new Error('Cuenta deshabilitada. Contacte al administrador');
    }
  
    // Verificar la contraseña
    console.log(`Verificando contraseña para usuario ${username}`);
    const isPasswordValid = await usuario.comparePassword(password);
    console.log(`Resultado de verificación de contraseña: ${isPasswordValid ? 'válida' : 'inválida'}`);
    
    if (!isPasswordValid) {
      // Incrementar contador de intentos fallidos
      usuario.intentosFallidos = (usuario.intentosFallidos || 0) + 1;
      console.log(`Intento fallido ${usuario.intentosFallidos} para usuario: ${username}`);
      
      // Si alcanza el límite, bloquear la cuenta temporalmente (30 minutos)
      if (usuario.intentosFallidos >= 5) {
        const tiempoBloqueo = new Date();
        tiempoBloqueo.setMinutes(tiempoBloqueo.getMinutes() + 30);
        usuario.fechaBloqueo = tiempoBloqueo;
        usuario.intentosFallidos = 0;
        await usuario.save();
        throw new Error('Demasiados intentos fallidos. Cuenta bloqueada por 30 minutos');
      }
      
      await usuario.save();
      throw new Error('Credenciales inválidas');
    }
  
    // Resetear contador de intentos fallidos
    usuario.intentosFallidos = 0;
    usuario.fechaBloqueo = null;
    usuario.ultimoAcceso = new Date();
    await usuario.save();
    
    console.log(`Login exitoso para usuario: ${username}`);
  
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
  
    // Generar token JWT con duración según recordarme
    const duracionToken = recordarme ? '30d' : '24h';
    
    const token = jwt.sign(
      { 
        id: usuario._id,
        username: usuario.username,
        rol: usuario.rol,
        ...userData
      },
      process.env.JWT_SECRET || 'personalpay_secret_key',
      { expiresIn: duracionToken }
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

  /**
   * Solicita restablecer contraseña del usuario
   * @param {string} email - Email del usuario
   * @returns {Promise<boolean>} True si se envía el correo con éxito
   * @throws {Error} Si no existe el usuario con ese email
   */
  async solicitarRestablecerPassword(email) {
    try {
      console.log(`Buscando usuario con email: ${email}`);
      
      // Buscar usuario por email (case-insensitive)
      const usuario = await Usuario.findOne({ 
        email: { $regex: new RegExp(`^${email}$`, 'i') }
      });
      
      if (!usuario) {
        console.log(`No se encontró usuario con email: ${email}`);
        return false; // Indicamos que no se encontró, pero el controlador maneja esto sin revelarlo
      }
      
      console.log(`Usuario encontrado: ${usuario.username} (ID: ${usuario._id})`);
  
      // Generar token aleatorio
      const token = crypto.randomBytes(20).toString('hex');
      
      // Establecer token y expiración (24 horas)
      usuario.resetPasswordToken = token;
      usuario.resetPasswordExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 horas
      
      await usuario.save();
      console.log(`Token de recuperación generado para usuario: ${usuario.username}`);
      
      // Enviar correo
      try {
        await EmailService.enviarCorreoRestablecimiento(email, token);
        console.log(`Correo de restablecimiento enviado a: ${email}`);
        return true;
      } catch (error) {
        console.error('Error al enviar correo de restablecimiento:', error);
        // Invalidar el token si falla el envío
        usuario.resetPasswordToken = undefined;
        usuario.resetPasswordExpires = undefined;
        await usuario.save();
        throw new Error('Error al enviar correo de restablecimiento');
      }
    } catch (error) {
      console.error(`Error en recuperación de contraseña para ${email}:`, error);
      throw error;
    }
  }

  /**
   * Valida un token para restablecer contraseña
   * @param {string} token - Token de restablecimiento
   * @returns {Promise<Object>} Información básica del usuario
   * @throws {Error} Si el token es inválido o ha expirado
   */
  async validarTokenRestablecimiento(token) {
    const usuario = await Usuario.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!usuario) {
      throw new Error('Token inválido o expirado');
    }

    return {
      username: usuario.username,
      email: usuario.email
    };
  }

  /**
   * Restablece la contraseña de un usuario
   * @param {string} token - Token de restablecimiento
   * @param {string} newPassword - Nueva contraseña
   * @returns {Promise<boolean>} True si se cambia correctamente
   * @throws {Error} Si el token es inválido o ha expirado
   */
  async restablecerPassword(token, newPassword) {
    const usuario = await Usuario.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!usuario) {
      throw new Error('Token inválido o expirado');
    }

    // Actualizar contraseña
    usuario.password = newPassword;
    usuario.resetPasswordToken = undefined;
    usuario.resetPasswordExpires = undefined;
    await usuario.save();
    
    // Enviar correo de confirmación
    try {
      await EmailService.enviarConfirmacionCambioPassword(usuario.email);
    } catch (error) {
      console.error('Error al enviar confirmación de cambio de contraseña:', error);
      // No interrumpimos el proceso si falla el envío
    }
    
    return true;
  }
}

module.exports = new AuthService();
