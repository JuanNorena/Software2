/**
 * @fileoverview Controlador para gestionar las operaciones CRUD de empleados y empresas
 * @author Juan Sebastian Noreña
 * @version 1.0.0
 */

const express = require('express');
const router = express.Router();
const Empleado = require('../Model/Empleado');
const Empresa = require('../Model/Empresa');
const BaseController = require('./BaseController');
const { authenticateUser, authorizeRoles } = require('../middleware/authMiddleware');
const asyncHandler = require('../middleware/asyncHandler');
const mongoose = require('mongoose');

/**
 * @description Obtiene todos los empleados registrados en el sistema
 * @route GET /api/empleados
 * @access Admin
 * @returns {Array} Lista de todos los empleados con información básica de su empresa
 */
router.get('/', authenticateUser, authorizeRoles(['ADMIN']), asyncHandler(async (req, res) => {
  const empleados = await Empleado.find().populate('empresa', 'nombre rut');
  res.json(empleados);
}));

/**
 * @description Obtiene un empleado específico por su ID
 * @route GET /api/empleados/:id
 * @access Admin
 * @param {string} id - ID del empleado a buscar
 * @returns {Object} Datos completos del empleado incluyendo su empresa
 */
router.get('/:id', authenticateUser, authorizeRoles(['ADMIN']), asyncHandler(async (req, res) => {
  // Verificar si el usuario es ADMIN o si está accediendo a su propio perfil
  if (req.user.rol !== 'ADMIN' && req.user.empleadoId !== req.params.id) {
    return res.status(403).json({ message: 'No tiene permisos para ver este empleado' });
  }
  
  const empleado = await Empleado.findById(req.params.id).populate('empresa', 'nombre rut');
  if (!empleado) {
    return res.status(404).json({ message: 'Empleado no encontrado' });
  }
  res.json(empleado);
}));

/**
 * @description Obtiene todos los empleados de una empresa específica
 * @route GET /api/empleados/empresa/:empresaRut
 * @access Admin
 * @param {string} empresaRut - RUT de la empresa
 * @returns {Array} Lista de empleados que pertenecen a la empresa especificada
 */
router.get('/empresa/:empresaRut', authenticateUser, authorizeRoles(['ADMIN']), asyncHandler(async (req, res) => {
  try {
    // Verificar que la empresa existe por RUT
    const empresaExiste = await Empresa.findOne({ rut: req.params.empresaRut });
    if (!empresaExiste) {
      return res.status(404).json({ message: 'Empresa no encontrada' });
    }

    const empleados = await Empleado.find({ empresa: empresaExiste._id }).populate('empresa', 'nombre rut');
    res.json(empleados);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}));

/**
 * @description Crea un nuevo empleado en el sistema
 * @route POST /api/empleados
 * @access Admin
 * @param {Object} req.body - Datos del empleado a crear
 * @param {string} req.body.nombre - Nombre completo del empleado
 * @param {string} req.body.cargo - Cargo o puesto del empleado
 * @param {Date} req.body.fechaNacimiento - Fecha de nacimiento
 * @param {string} req.body.id - Identificador único del empleado
 * @param {string} req.body.numeroCuentaDigital - Número de cuenta bancaria
 * @param {string} req.body.profesion - Profesión o título
 * @param {string} req.body.rut - RUT del empleado
 * @param {number} req.body.sueldoBase - Sueldo base
 * @param {string} req.body.empresaRut - RUT de la empresa donde trabaja
 * @param {boolean} [req.body.esEncargadoPersonal=false] - Indica si es encargado de personal
 * @returns {Object} Datos del empleado creado
 */
router.post('/', authenticateUser, authorizeRoles(['ADMIN']), asyncHandler(async (req, res) => {
  try {
    // Verificar si el RUT de empresa existe
    if (!req.body.empresaRut) {
      return res.status(400).json({ message: 'RUT de empresa no proporcionado' });
    }
    
    const empresaExiste = await Empresa.findOne({ rut: req.body.empresaRut });
    if (!empresaExiste) {
      return res.status(404).json({ message: 'La empresa especificada no existe' });
    }

    // Verificar si el RUT de empleado ya existe
    const rutExistente = await Empleado.findOne({ rut: req.body.rut });
    if (rutExistente) {
      return res.status(400).json({ message: 'El RUT ya está registrado' });
    }

    const empleado = new Empleado({
      nombre: req.body.nombre,
      cargo: req.body.cargo,
      fechaNacimiento: req.body.fechaNacimiento,
      id: req.body.id,
      numeroCuentaDigital: req.body.numeroCuentaDigital,
      profesion: req.body.profesion,
      rut: req.body.rut,
      sueldoBase: req.body.sueldoBase,
      empresa: empresaExiste._id,
      esEncargadoPersonal: req.body.esEncargadoPersonal || false
    });

    const nuevoEmpleado = await empleado.save();
    res.status(201).json(nuevoEmpleado);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}));

/**
 * @description Actualiza un empleado existente
 * @route PUT /api/empleados/:id
 * @access Admin
 * @param {string} id - ID del empleado a actualizar
 * @param {Object} req.body - Datos actualizados del empleado
 * @returns {Object} Datos del empleado actualizado
 */
router.put('/:id', authenticateUser, authorizeRoles(['ADMIN']), asyncHandler(async (req, res) => {
  try {
    // Verificar si se actualiza la empresa y validar por RUT
    if (req.body.empresaRut) {
      const empresaExiste = await Empresa.findOne({ rut: req.body.empresaRut });
      if (!empresaExiste) {
        return res.status(404).json({ message: 'La empresa especificada no existe' });
      }
      // Reemplazar el campo empresaRut con el ID real de la empresa
      req.body.empresa = empresaExiste._id;
      // Eliminar el campo empresaRut para que no cause conflicto
      delete req.body.empresaRut;
    }

    const empleadoActualizado = await Empleado.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('empresa', 'nombre rut');

    if (!empleadoActualizado) {
      return res.status(404).json({ message: 'Empleado no encontrado' });
    }

    res.json(empleadoActualizado);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}));

/**
 * @description Elimina un empleado del sistema
 * @route DELETE /api/empleados/:id
 * @access Admin
 * @param {string} id - ID del empleado a eliminar
 * @returns {Object} Mensaje de confirmación de eliminación
 */
router.delete('/:id', authenticateUser, authorizeRoles(['ADMIN']), asyncHandler(async (req, res) => {
  const empleado = await Empleado.findById(req.params.id);
  if (!empleado) {
    return res.status(404).json({ message: 'Empleado no encontrado' });
  }

  await Empleado.findByIdAndDelete(req.params.id);
  res.json({ message: 'Empleado eliminado correctamente' });
}));

module.exports = router;