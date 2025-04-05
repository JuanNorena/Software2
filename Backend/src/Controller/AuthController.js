/**
 * @fileoverview Controlador para gestionar la autenticación de usuarios
 * @author Juan Sebastian Noreña
 * @version 1.0.0
 */

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const Usuario = require('../Model/Usuario');
const Empleado = require('../Model/Empleado');
const asyncHandler = require('../middleware/asyncHandler');

/**
 * @description Registra un nuevo empleado en el sistema con su usuario
 * @route POST /api/auth/register
 * @param {Object} req.body - Datos del empleado y usuario a crear
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

    // Verificar si la empresa existe
    const empresaExiste = await require('../Model/Empresa').findById(req.body.empresa);
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
      empresa: req.body.empresa,
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
 * @description Inicia sesión de un usuario
 * @route POST /api/auth/login
 * @param {Object} req.body - Credenciales de inicio de sesión
 * @param {string} req.body.username - Nombre de usuario
 * @param {string} req.body.password - Contraseña
 * @returns {Object} Token de autenticación y datos del usuario
 */
router.post('/login', asyncHandler(async (req, res) => {
  try {
    // Buscar el usuario por nombre de usuario
    const usuario = await Usuario.findOne({ username: req.body.username });
    if (!usuario) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    // Verificar si la cuenta está habilitada
    if (!usuario.enabled || !usuario.accountNonLocked || !usuario.accountNonExpired || !usuario.credentialsNonExpired) {
      return res.status(401).json({ message: 'Cuenta deshabilitada o bloqueada' });
    }

    // Verificar la contraseña
    const isPasswordValid = await usuario.comparePassword(req.body.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
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

    res.json({
      message: 'Inicio de sesión exitoso',
      token,
      usuario: {
        id: usuario._id,
        username: usuario.username,
        rol: usuario.rol,
        ...userData
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}));

module.exports = router;