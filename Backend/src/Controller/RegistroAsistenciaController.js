/**
 * @fileoverview Controlador para gestionar las operaciones CRUD de registros de asistencia
 * @author Juan Sebastian Noreña
 * @version 1.0.0
 */

const express = require('express');
const router = express.Router();
const RegistroAsistencia = require('../Model/RegistroAsistencia');
const Empleado = require('../Model/Empleado');

/**
 * @description Obtiene todos los registros de asistencia en el sistema
 * @route GET /api/registros-asistencia
 * @returns {Array} Lista de todos los registros de asistencia con información del empleado
 */
router.get('/', async (req, res) => {
  try {
    const registros = await RegistroAsistencia.find().populate('empleado', 'nombre rut cargo');
    res.json(registros);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @description Obtiene un registro de asistencia específico por su ID
 * @route GET /api/registros-asistencia/:id
 * @param {string} req.params.id - ID del registro a buscar
 * @returns {Object} Datos del registro de asistencia encontrado
 */
router.get('/:id', async (req, res) => {
  try {
    const registro = await RegistroAsistencia.findById(req.params.id).populate('empleado', 'nombre rut cargo');
    if (!registro) {
      return res.status(404).json({ message: 'Registro de asistencia no encontrado' });
    }
    res.json(registro);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @description Obtiene todos los registros de asistencia de un empleado específico
 * @route GET /api/registros-asistencia/empleado/:empleadoId
 * @param {string} req.params.empleadoId - ID del empleado
 * @returns {Array} Lista de registros de asistencia del empleado ordenados por fecha
 */
router.get('/empleado/:empleadoId', async (req, res) => {
  try {
    const registros = await RegistroAsistencia.find({ empleado: req.params.empleadoId })
      .populate('empleado', 'nombre rut cargo')
      .sort({ fecha: -1 });
    res.json(registros);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @description Obtiene registros de asistencia dentro de un rango de fechas
 * @route GET /api/registros-asistencia/fecha/:inicio/:fin
 * @param {string} req.params.inicio - Fecha de inicio (formato YYYY-MM-DD)
 * @param {string} req.params.fin - Fecha de fin (formato YYYY-MM-DD)
 * @returns {Array} Lista de registros de asistencia dentro del rango de fechas
 */
router.get('/fecha/:inicio/:fin', async (req, res) => {
  try {
    const fechaInicio = new Date(req.params.inicio);
    const fechaFin = new Date(req.params.fin);
    
    const registros = await RegistroAsistencia.find({
      fecha: { $gte: fechaInicio, $lte: fechaFin }
    }).populate('empleado', 'nombre rut cargo');
    
    res.json(registros);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @description Crea un nuevo registro de asistencia en el sistema
 * @route POST /api/registros-asistencia
 * @param {Object} req.body - Datos del registro a crear
 * @param {string} req.body.empleado - ID del empleado asociado
 * @param {Date} req.body.fecha - Fecha del registro
 * @param {string} req.body.horaEntrada - Hora de entrada
 * @param {string} req.body.horaSalida - Hora de salida
 * @param {number} req.body.totalHorasTrabajadas - Total de horas trabajadas
 * @returns {Object} Datos del registro creado
 */
router.post('/', async (req, res) => {
  try {
    // Verificar si el empleado existe
    const empleadoExiste = await Empleado.findById(req.body.empleado);
    if (!empleadoExiste) {
      return res.status(404).json({ message: 'El empleado especificado no existe' });
    }

    const registro = new RegistroAsistencia({
      empleado: req.body.empleado,
      fecha: req.body.fecha,
      horaEntrada: req.body.horaEntrada,
      horaSalida: req.body.horaSalida,
      totalHorasTrabajadas: req.body.totalHorasTrabajadas
    });

    const nuevoRegistro = await registro.save();
    res.status(201).json(nuevoRegistro);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

/**
 * @description Actualiza los datos de un registro de asistencia existente
 * @route PUT /api/registros-asistencia/:id
 * @param {string} req.params.id - ID del registro a actualizar
 * @param {Object} req.body - Datos a actualizar
 * @param {string} [req.body.empleado] - ID del empleado asociado
 * @param {Date} [req.body.fecha] - Fecha del registro
 * @param {string} [req.body.horaEntrada] - Hora de entrada
 * @param {string} [req.body.horaSalida] - Hora de salida
 * @param {number} [req.body.totalHorasTrabajadas] - Total de horas trabajadas
 * @returns {Object} Datos del registro actualizado
 */
router.put('/:id', async (req, res) => {
  try {
    const registro = await RegistroAsistencia.findById(req.params.id);
    if (!registro) {
      return res.status(404).json({ message: 'Registro de asistencia no encontrado' });
    }

    // Si se actualiza el empleado, verificar que exista
    if (req.body.empleado) {
      const empleadoExiste = await Empleado.findById(req.body.empleado);
      if (!empleadoExiste) {
        return res.status(404).json({ message: 'El empleado especificado no existe' });
      }
      registro.empleado = req.body.empleado;
    }

    // Actualizar campos
    if (req.body.fecha) registro.fecha = req.body.fecha;
    if (req.body.horaEntrada) registro.horaEntrada = req.body.horaEntrada;
    if (req.body.horaSalida) registro.horaSalida = req.body.horaSalida;
    if (req.body.totalHorasTrabajadas) registro.totalHorasTrabajadas = req.body.totalHorasTrabajadas;

    const registroActualizado = await registro.save();
    res.json(registroActualizado);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Eliminar un registro de asistencia
router.delete('/:id', async (req, res) => {
  try {
    const registro = await RegistroAsistencia.findById(req.params.id);
    if (!registro) {
      return res.status(404).json({ message: 'Registro de asistencia no encontrado' });
    }

    await RegistroAsistencia.findByIdAndDelete(req.params.id);
    res.json({ message: 'Registro de asistencia eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;