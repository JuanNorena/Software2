/**
 * @fileoverview Controlador para gestionar las operaciones CRUD de empleados
 * @author Juan Sebastian Noreña
 * @version 1.0.0
 */

const express = require('express');
const router = express.Router();
const Empleado = require('../Model/Empleado');
const Empresa = require('../Model/Empresa');
const { authenticateUser, authorizeRoles } = require('../middleware/authMiddleware');
const asyncHandler = require('../middleware/asyncHandler');

/**
 * @description Obtiene todos los empleados registrados en el sistema
 * @route GET /api/empleados
 * @returns {Array} Lista de todos los empleados con información básica de su empresa
 */
router.get('/', authenticateUser, authorizeRoles(['ADMIN']), asyncHandler(async (req, res) => {
  const empleados = await Empleado.find().populate('empresa', 'nombre rut');
  res.json(empleados);
}));

/**
 * @description Obtiene un empleado específico por su ID
 * @route GET /api/empleados/:id
 * @param {string} req.params.id - ID del empleado a buscar
 * @returns {Object} Datos del empleado encontrado con información de su empresa
 */
router.get('/:id', authenticateUser, asyncHandler(async (req, res) => {
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
 * @description Obtiene todos los empleados que pertenecen a una empresa específica
 * @route GET /api/empleados/empresa/:empresaId
 * @param {string} req.params.empresaId - ID de la empresa
 * @returns {Array} Lista de empleados que pertenecen a la empresa especificada
 */
router.get('/empresa/:empresaId', authenticateUser, authorizeRoles(['ADMIN']), asyncHandler(async (req, res) => {
  const empleados = await Empleado.find({ empresa: req.params.empresaId }).populate('empresa', 'nombre rut');
  res.json(empleados);
}));

/**
 * @description Crea un nuevo empleado en el sistema
 * @route POST /api/empleados
 * @param {Object} req.body - Datos del empleado a crear
 * @param {string} req.body.nombre - Nombre completo del empleado
 * @param {string} req.body.cargo - Cargo o puesto del empleado
 * @param {Date} req.body.fechaNacimiento - Fecha de nacimiento
 * @param {string} req.body.id - Identificador único del empleado
 * @param {string} req.body.numeroCuentaDigital - Número de cuenta bancaria
 * @param {string} req.body.profesion - Profesión o título
 * @param {string} req.body.rut - RUT del empleado
 * @param {number} req.body.sueldoBase - Sueldo base
 * @param {string} req.body.empresa - ID de la empresa donde trabaja
 * @param {boolean} [req.body.esEncargadoPersonal=false] - Indica si es encargado de personal
 * @returns {Object} Datos del empleado creado
 */
router.post('/', authenticateUser, authorizeRoles(['ADMIN']), asyncHandler(async (req, res) => {
  // Verificar si la empresa existe
  const empresaExiste = await Empresa.findById(req.body.empresa);
  if (!empresaExiste) {
    return res.status(404).json({ message: 'La empresa especificada no existe' });
  }

  // Verificar si el RUT ya existe
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
    empresa: req.body.empresa,
    esEncargadoPersonal: req.body.esEncargadoPersonal || false
  });

  const nuevoEmpleado = await empleado.save();
  res.status(201).json(nuevoEmpleado);
}));

/**
 * @description Actualiza la información de un empleado existente
 * @route PUT /api/empleados/:id
 * @param {string} req.params.id - ID del empleado a actualizar
 * @param {Object} req.body - Nuevos datos del empleado
 * @returns {Object} Datos actualizados del empleado
 */
router.put('/:id', authenticateUser, authorizeRoles(['ADMIN']), asyncHandler(async (req, res) => {
  // Verificar si la empresa existe, si se está actualizando
  if (req.body.empresa) {
    const empresaExiste = await Empresa.findById(req.body.empresa);
    if (!empresaExiste) {
      return res.status(404).json({ message: 'La empresa especificada no existe' });
    }
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
}));

/**
 * @description Elimina un empleado del sistema
 * @route DELETE /api/empleados/:id
 * @param {string} req.params.id - ID del empleado a eliminar
 * @returns {Object} Mensaje de confirmación
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