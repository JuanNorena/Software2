/**
 * @fileoverview Controlador para gestionar las operaciones relacionadas con asistencia de empleados
 * @author Juan Sebastian Noreña
 * @version 1.0.1
 */

const express = require('express');
const router = express.Router();
const { authenticateUser, authorizeRoles } = require('../middleware/authMiddleware');
const AsistenciaService = require('../service/AsistenciaService');
const asyncHandler = require('../middleware/asyncHandler');
const mongoose = require('mongoose');

/**
 * @description Obtiene el historial de asistencia del empleado autenticado
 * @route GET /api/asistencia/mi-historial
 * @access Empleado
 * @param {string} [req.query.fechaInicio] - Fecha de inicio (opcional)
 * @param {string} [req.query.fechaFin] - Fecha de fin (opcional)
 * @returns {Array} Lista de registros de asistencia del empleado
 */
router.get('/mi-historial', authenticateUser, asyncHandler(async (req, res) => {
  try {
    if (!req.user.empleadoId) {
      return res.status(403).json({ message: 'Acceso denegado. Usuario no es un empleado.' });
    }

    const { fechaInicio, fechaFin } = req.query;
    const registros = await AsistenciaService.obtenerHistorialAsistencia(
      req.user.empleadoId,
      fechaInicio,
      fechaFin
    );

    res.json(registros);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}));

/**
 * @description Obtiene el historial de asistencia de un empleado específico (solo admin)
 * @route GET /api/asistencia/empleado/:empleadoId
 * @access Admin
 * @param {string} empleadoId - ID del empleado
 * @param {string} [req.query.fechaInicio] - Fecha de inicio (opcional)
 * @param {string} [req.query.fechaFin] - Fecha de fin (opcional)
 * @returns {Array} Lista de registros de asistencia del empleado
 */
router.get('/empleado/:empleadoId', authenticateUser, authorizeRoles(['ADMIN']), asyncHandler(async (req, res) => {
  try {
    const { fechaInicio, fechaFin } = req.query;
    const registros = await AsistenciaService.obtenerHistorialAsistencia(
      req.params.empleadoId,
      fechaInicio,
      fechaFin
    );

    res.json(registros);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}));

/**
 * @description Obtiene todos los registros de asistencia (solo admin)
 * @route GET /api/asistencia
 * @access Admin
 * @param {string} [req.query.fechaInicio] - Fecha de inicio (opcional)
 * @param {string} [req.query.fechaFin] - Fecha de fin (opcional)
 * @param {string} [req.query.empleadoId] - ID de empleado específico (opcional)
 * @returns {Array} Lista de registros de asistencia
 */
router.get('/', authenticateUser, authorizeRoles(['ADMIN']), asyncHandler(async (req, res) => {
  try {
    const { fechaInicio, fechaFin, empleadoId } = req.query;
    
    let registros;
    if (empleadoId) {
      registros = await AsistenciaService.obtenerHistorialAsistencia(
        empleadoId,
        fechaInicio,
        fechaFin
      );
    } else {
      // Para obtener todos los registros, se pasa null como empleadoId
      // AsistenciaService necesitaría una modificación para manejar este caso
      const RegistroAsistencia = require('../Model/RegistroAsistencia');
      
      let query = {};
      if (fechaInicio || fechaFin) {
        query.fecha = {};
        if (fechaInicio) query.fecha.$gte = new Date(fechaInicio);
        if (fechaFin) query.fecha.$lte = new Date(fechaFin);
      }
      
      registros = await RegistroAsistencia.find(query)
        .sort({ fecha: -1 })
        .populate('empleado', 'nombre rut cargo');
    }

    res.json(registros);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}));

/**
 * @description Obtiene el resumen de horas trabajadas del empleado autenticado
 * @route GET /api/asistencia/horas
 * @access Empleado
 * @param {string} [req.query.fechaInicio] - Fecha de inicio (opcional)
 * @param {string} [req.query.fechaFin] - Fecha de fin (opcional)
 * @returns {Object} Resumen de horas trabajadas
 */
router.get('/horas', authenticateUser, asyncHandler(async (req, res) => {
  try {
    if (!req.user.empleadoId) {
      return res.status(403).json({ message: 'Acceso denegado. Usuario no es un empleado.' });
    }

    const { fechaInicio, fechaFin } = req.query;
    const resumen = await AsistenciaService.obtenerResumenHoras(
      req.user.empleadoId,
      fechaInicio,
      fechaFin
    );

    res.json(resumen);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}));

/**
 * @description Obtiene el resumen de horas trabajadas de un empleado específico (solo admin)
 * @route GET /api/asistencia/empleado/:empleadoId/horas
 * @access Admin
 * @param {string} empleadoId - ID del empleado
 * @param {string} [req.query.fechaInicio] - Fecha de inicio (opcional)
 * @param {string} [req.query.fechaFin] - Fecha de fin (opcional)
 * @returns {Object} Resumen de horas trabajadas
 */
router.get('/empleado/:empleadoId/horas', authenticateUser, authorizeRoles(['ADMIN']), asyncHandler(async (req, res) => {
  try {
    const { fechaInicio, fechaFin } = req.query;
    const resumen = await AsistenciaService.obtenerResumenHoras(
      req.params.empleadoId,
      fechaInicio,
      fechaFin
    );

    res.json(resumen);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}));

/**
 * @description Registra manualmente una entrada para un empleado (solo admin)
 * @route POST /api/asistencia/entrada/:empleadoId
 * @access Admin
 * @param {string} empleadoId - ID del empleado
 * @returns {Object} Registro de asistencia creado
 */
router.post('/entrada/:empleadoId', authenticateUser, authorizeRoles(['ADMIN']), asyncHandler(async (req, res) => {
  try {
    if (!req.params.empleadoId) {
      return res.status(400).json({ message: 'El ID del empleado es obligatorio' });
    }
    
    // Validar que el empleadoId sea un ObjectId válido
    if (!mongoose.Types.ObjectId.isValid(req.params.empleadoId)) {
      return res.status(400).json({ message: 'El ID del empleado no es válido' });
    }
    
    const registro = await AsistenciaService.registrarEntrada(req.params.empleadoId);
    res.status(201).json({
      message: 'Entrada registrada exitosamente',
      registro
    });
  } catch (error) {
    console.error('Error al registrar entrada:', error);
    res.status(400).json({ message: error.message });
  }
}));

/**
 * @description Registra manualmente una salida para un empleado (solo admin)
 * @route POST /api/asistencia/salida/:empleadoId
 * @access Admin
 * @param {string} empleadoId - ID del empleado
 * @returns {Object} Registro de asistencia actualizado
 */
router.post('/salida/:empleadoId', authenticateUser, authorizeRoles(['ADMIN']), asyncHandler(async (req, res) => {
  try {
    if (!req.params.empleadoId) {
      return res.status(400).json({ message: 'El ID del empleado es obligatorio' });
    }
    
    // Validar que el empleadoId sea un ObjectId válido
    if (!mongoose.Types.ObjectId.isValid(req.params.empleadoId)) {
      return res.status(400).json({ message: 'El ID del empleado no es válido' });
    }
    
    const registro = await AsistenciaService.registrarSalida(req.params.empleadoId);
    res.status(200).json({
      message: 'Salida registrada exitosamente',
      registro
    });
  } catch (error) {
    console.error('Error al registrar salida:', error);
    res.status(400).json({ message: error.message });
  }
}));

/**
 * @description Obtiene el detalle de días y horas trabajadas del empleado autenticado
 * @route GET /api/asistencias/mis-registros
 * @access Empleado
 * @param {number} req.query.mes - Mes (1-12)
 * @param {number} req.query.anio - Año
 * @returns {Object} Detalles de días y horas trabajadas
 */
router.get('/mis-registros', authenticateUser, asyncHandler(async (req, res) => {
  try {
    // Verificar si el usuario es un empleado
    if (!req.user.empleadoId) {
      return res.status(403).json({
        mensaje: 'Acceso denegado. Usuario no es un empleado.'
      });
    }
    
    const { mes, anio } = req.query;
    
    // Validar que se proporcionaron mes y año
    if (!mes || !anio) {
      return res.status(400).json({ 
        mensaje: 'Debe proporcionar mes y año para consultar registros de asistencia'
      });
    }
    
    const resultado = await asistenciaService.obtenerDetalleAsistenciaPeriodo(
      req.user.empleadoId, 
      parseInt(mes), 
      parseInt(anio)
    );
    
    res.json(resultado);
  } catch (error) {
    console.error('Error al obtener registros de asistencia:', error);
    res.status(500).json({ mensaje: 'Error al obtener los registros de asistencia', error: error.message });
  }
}));

/**
 * @description Obtiene el detalle de asistencia de un empleado específico (solo para admin)
 * @route GET /api/asistencias/empleado/:empleadoId/detalle
 * @access Admin
 * @param {string} req.params.empleadoId - ID del empleado
 * @param {number} req.query.mes - Mes (1-12)
 * @param {number} req.query.anio - Año
 * @returns {Object} Detalles de días y horas trabajadas del empleado
 */
router.get('/empleado/:empleadoId/detalle', authenticateUser, authorizeRoles(['ADMIN']), asyncHandler(async (req, res) => {
  try {
    const { empleadoId } = req.params;
    const { mes, anio } = req.query;
    
    // Validar que se proporcionaron mes y año
    if (!mes || !anio) {
      return res.status(400).json({ 
        mensaje: 'Debe proporcionar mes y año para consultar registros de asistencia'
      });
    }
    
    const resultado = await asistenciaService.obtenerDetalleAsistenciaPeriodo(
      empleadoId, 
      parseInt(mes), 
      parseInt(anio)
    );
    
    res.json(resultado);
  } catch (error) {
    console.error('Error al obtener detalles de asistencia:', error);
    res.status(500).json({ mensaje: 'Error al obtener los detalles de asistencia', error: error.message });
  }
}));

// Añadir estas dos nuevas rutas justo antes de las rutas de "/entrada/:empleadoId" y "/salida/:empleadoId":

/**
 * @description Permite a un empleado registrar su propia entrada
 * @route POST /api/asistencia/mi-entrada
 * @access Empleado
 * @returns {Object} Registro de asistencia creado
 */
router.post('/mi-entrada', authenticateUser, asyncHandler(async (req, res) => {
  try {
    // Verificar si el usuario es un empleado
    if (!req.user.empleadoId) {
      return res.status(403).json({ message: 'Acceso denegado. Usuario no es un empleado.' });
    }
    
    // Utilizamos el ID del empleado desde el token autenticado
    const empleadoId = req.user.empleadoId;
    
    console.log(`Empleado ${empleadoId} intentando registrar su entrada manualmente`);
    
    const registro = await AsistenciaService.registrarEntrada(empleadoId);
    res.status(201).json({
      message: 'Entrada registrada exitosamente',
      registro
    });
  } catch (error) {
    console.error('Error al registrar entrada:', error);
    res.status(400).json({ message: error.message });
  }
}));

/**
 * @description Permite a un empleado registrar su propia salida
 * @route POST /api/asistencia/mi-salida
 * @access Empleado
 * @returns {Object} Registro de asistencia actualizado
 */
router.post('/mi-salida', authenticateUser, asyncHandler(async (req, res) => {
  try {
    // Verificar si el usuario es un empleado
    if (!req.user.empleadoId) {
      return res.status(403).json({ message: 'Acceso denegado. Usuario no es un empleado.' });
    }
    
    // Utilizamos el ID del empleado desde el token autenticado
    const empleadoId = req.user.empleadoId;
    
    console.log(`Empleado ${empleadoId} intentando registrar su salida manualmente`);
    
    const registro = await AsistenciaService.registrarSalida(empleadoId);
    res.status(200).json({
      message: 'Salida registrada exitosamente',
      registro
    });
  } catch (error) {
    console.error('Error al registrar salida:', error);
    res.status(400).json({ message: error.message });
  }
}));

module.exports = router;
