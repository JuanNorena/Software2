/**
 * @fileoverview Controlador para gestionar la autenticación de usuarios
 * @author Juan Sebastian Noreña
 * @version 1.0.1
 */

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const Usuario = require('../Model/Usuario');
const Empleado = require('../Model/Empleado');
const asyncHandler = require('../middleware/asyncHandler');
const { authenticateUser } = require('../middleware/authMiddleware');
const AuthService = require('../service/AuthService');
const BaseController = require('./BaseController');
const mongoose = require('mongoose');

/**
 * @description Registra un nuevo empleado en el sistema con su usuario
 * @route POST /api/auth/register
 * @access Public
 * @param {Object} req.body - Datos del empleado y usuario a crear
 * @param {string} req.body.username - Nombre de usuario
 * @param {string} req.body.password - Contraseña
 * @param {string} req.body.nombre - Nombre completo del empleado
 * @param {string} req.body.cargo - Cargo que desempeña
 * @param {Date} req.body.fechaNacimiento - Fecha de nacimiento
 * @param {string} req.body.id - Identificador único del empleado
 * @param {string} req.body.numeroCuentaDigital - Número de cuenta bancaria
 * @param {string} req.body.profesion - Profesión del empleado
 * @param {string} req.body.rut - RUT del empleado
 * @param {number} req.body.sueldoBase - Sueldo base del empleado
 * @param {string} req.body.empresaRut - RUT de la empresa
 * @param {boolean} [req.body.esEncargadoPersonal=false] - Si es encargado de personal
 * @returns {Object} Datos del empleado creado y token de autenticación
 */
router.post('/register', asyncHandler(async (req, res) => {
  try {
    // Verificar si el usuario ya existe
    const usuarioExistente = await Usuario.findOne({ username: req.body.username });
    if (usuarioExistente) {
      return res.status(400).json({ message: 'El nombre de usuario ya está en uso' });
    }

    // Verificar si el RUT ya existe
    const rutExistente = await Empleado.findOne({ rut: req.body.rut });
    if (rutExistente) {
      return res.status(400).json({ message: 'El RUT ya está registrado' });
    }

    // Validar que se proporcione el RUT de la empresa
    if (!req.body.empresaRut) {
      return res.status(400).json({ message: 'RUT de empresa no proporcionado' });
    }

    // Verificar si la empresa existe por RUT
    const empresaExiste = await require('../Model/Empresa').findOne({ rut: req.body.empresaRut });
    if (!empresaExiste) {
      return res.status(404).json({ message: 'La empresa especificada no existe' });
    }

    // Crear el empleado
    const empleado = new Empleado({
      nombre: req.body.nombre,
      cargo: req.body.cargo,
      fechaNacimiento: req.body.fechaNacimiento,
      id: req.body.id,
      numeroCuentaDigital: req.body.numeroCuentaDigital,
      profesion: req.body.profesion,
      rut: req.body.rut,
      sueldoBase: req.body.sueldoBase,
      empresa: empresaExiste._id, // Usamos el ID obtenido de la consulta por RUT
      esEncargadoPersonal: req.body.esEncargadoPersonal || false
    });

    const nuevoEmpleado = await empleado.save();

    // Crear el usuario asociado al empleado
    const usuario = new Usuario({
      username: req.body.username,
      password: req.body.password,
      rol: 'EMPLEADO',
      empleado: nuevoEmpleado._id
    });

    await usuario.save();

    // Generar token JWT
    const token = jwt.sign(
      { 
        id: usuario._id,
        username: usuario.username,
        rol: usuario.rol,
        empleadoId: nuevoEmpleado._id 
      },
      process.env.JWT_SECRET || 'personalpay_secret_key',
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'Empleado y usuario creados exitosamente',
      empleado: nuevoEmpleado,
      token
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}));

/**
 * @description Autentica un usuario y genera un token JWT
 * @route POST /api/auth/login
 * @access Public
 * @param {Object} req.body - Credenciales de inicio de sesión
 * @param {string} req.body.username - Nombre de usuario
 * @param {string} req.body.password - Contraseña
 * @param {boolean} [req.body.recordarme=false] - Recordar sesión
 * @returns {Object} Token de autenticación y datos básicos del usuario
 */
router.post('/login', asyncHandler(async (req, res) => {
  try {
    const { username, password, recordarme } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ message: 'Usuario y contraseña son requeridos' });
    }
    
    const resultado = await AuthService.login(username, password, !!recordarme);
    
    res.json({
      message: 'Inicio de sesión exitoso',
      token: resultado.token,
      usuario: resultado.usuario
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(401).json({ message: error.message });
  }
}));

/**
 * @description Cierra sesión y registra la salida del empleado
 * @route POST /api/auth/logout
 * @access Private
 * @returns {Object} Mensaje de confirmación y detalles del registro
 */
router.post('/logout', authenticateUser, asyncHandler(async (req, res) => {
  try {
    if (req.user.rol === 'EMPLEADO' && req.user.empleadoId) {
      // Registrar salida del empleado
      const registro = await AuthService.logout(req.user.empleadoId);
      
      return res.json({
        message: 'Sesión cerrada y salida registrada correctamente',
        registro: {
          fecha: registro.fecha,
          horaEntrada: registro.horaEntrada,
          horaSalida: registro.horaSalida,
          totalHorasTrabajadas: registro.totalHorasTrabajadas
        }
      });
    } else {
      return res.json({
        message: 'Sesión cerrada correctamente'
      });
    }
  } catch (error) {
    console.error('Error al cerrar sesión:', error);
    return res.status(400).json({
      message: 'Error al registrar salida',
      error: error.message
    });
  }
}));

/**
 * @description Solicita restablecer la contraseña de un usuario
 * @route POST /api/auth/solicitar-restablecimiento
 * @access Public
 * @param {Object} req.body - Datos para solicitud
 * @param {string} req.body.email - Email del usuario
 * @returns {Object} Mensaje de confirmación
 */
router.post('/solicitar-restablecimiento', asyncHandler(async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email es requerido' });
    }
    
    await AuthService.solicitarRestablecerPassword(email);
    
    // Por seguridad, siempre devolvemos la misma respuesta
    // independientemente de si el email existe o no
    res.json({
      message: 'Se ha enviado un correo con instrucciones para restablecer la contraseña'
    });
  } catch (error) {
    console.error('Error al solicitar restablecimiento:', error);
    res.status(500).json({ message: 'Error al procesar la solicitud' });
  }
}));

/**
 * @description Valida un token de restablecimiento de contraseña
 * @route GET /api/auth/validar-token/:token
 * @access Public
 * @param {string} token - Token de restablecimiento
 * @returns {Object} Información básica del usuario o mensaje de error
 */
router.get('/validar-token/:token', asyncHandler(async (req, res) => {
  try {
    const { token } = req.params;
    
    const usuario = await AuthService.validarTokenRestablecimiento(token);
    
    res.json({
      message: 'Token válido',
      usuario
    });
  } catch (error) {
    console.error('Error al validar token:', error);
    res.status(400).json({ message: error.message });
  }
}));

/**
 * @description Restablece la contraseña de un usuario
 * @route POST /api/auth/restablecer-password
 * @access Public
 * @param {Object} req.body - Datos para restablecer contraseña
 * @param {string} req.body.token - Token de restablecimiento
 * @param {string} req.body.password - Nueva contraseña
 * @returns {Object} Mensaje de confirmación
 */
router.post('/restablecer-password', asyncHandler(async (req, res) => {
  try {
    const { token, password } = req.body;
    
    if (!token || !password) {
      return res.status(400).json({ message: 'Token y contraseña son requeridos' });
    }
    
    // Validar requisitos de seguridad de la contraseña
    if (password.length < 8) {
      return res.status(400).json({ message: 'La contraseña debe tener al menos 8 caracteres' });
    }
    
    await AuthService.restablecerPassword(token, password);
    
    res.json({
      message: 'Contraseña restablecida exitosamente'
    });
  } catch (error) {
    console.error('Error al restablecer contraseña:', error);
    res.status(400).json({ message: error.message });
  }
}));


module.exports = router;