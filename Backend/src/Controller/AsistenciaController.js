/**
 * @fileoverview Controlador para gestionar las operaciones relacionadas con asistencia de empleados
 * @version 1.0.0
 */

const express = require('express');
const router = express.Router();
const { authenticateUser, authorizeRoles } = require('../middleware/authMiddleware');
const AsistenciaService = require('../service/AsistenciaService');
const asyncHandler = require('../middleware/asyncHandler');

/**
 * @description Obtiene el historial de asistencia del empleado autenticado
 * @route GET /api/asistencia/mi-historial
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
 * @param {string} empleadoId - ID del empleado
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
 * @param {string} empleadoId - ID del empleado
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
 * @param {string} empleadoId - ID del empleado
 * @returns {Object} Registro de asistencia creado
 */
router.post('/entrada/:empleadoId', authenticateUser, authorizeRoles(['ADMIN']), asyncHandler(async (req, res) => {
  try {
    const registro = await AsistenciaService.registrarEntrada(req.params.empleadoId);
    res.status(201).json(registro);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}));

/**
 * @description Registra manualmente una salida para un empleado (solo admin)
 * @route POST /api/asistencia/salida/:empleadoId
 * @param {string} empleadoId - ID del empleado
 * @returns {Object} Registro de asistencia actualizado
 */
router.post('/salida/:empleadoId', authenticateUser, authorizeRoles(['ADMIN']), asyncHandler(async (req, res) => {
  try {
    const registro = await AsistenciaService.registrarSalida(req.params.empleadoId);
    res.json(registro);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}));

module.exports = router;
