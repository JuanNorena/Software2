/**
 * @fileoverview Controlador para gestionar las operaciones CRUD de liquidaciones de sueldo
 * @author Juan Sebastian Noreña
 * @version 1.0.0
 */

const express = require('express');
const router = express.Router();
const LiquidacionSueldo = require('../Model/LiquidacionSueldo');
const Empleado = require('../Model/Empleado');
const Descuento = require('../Model/Descuento');

/**
 * @description Obtiene todas las liquidaciones de sueldo registradas en el sistema
 * @route GET /api/liquidaciones-sueldo
 * @returns {Array} Lista de todas las liquidaciones con información del empleado y descuentos
 */
router.get('/', async (req, res) => {
  try {
    const liquidaciones = await LiquidacionSueldo.find()
      .populate('empleado', 'nombre rut cargo sueldoBase')
      .populate('descuentos');
    res.json(liquidaciones);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @description Obtiene una liquidación de sueldo específica por su ID
 * @route GET /api/liquidaciones-sueldo/:id
 * @param {string} req.params.id - ID de la liquidación a buscar
 * @returns {Object} Datos de la liquidación encontrada con información del empleado y descuentos
 */
router.get('/:id', async (req, res) => {
  try {
    const liquidacion = await LiquidacionSueldo.findById(req.params.id)
      .populate('empleado', 'nombre rut cargo sueldoBase')
      .populate('descuentos');
    if (!liquidacion) {
      return res.status(404).json({ message: 'Liquidación de sueldo no encontrada' });
    }
    res.json(liquidacion);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @description Obtiene todas las liquidaciones de sueldo de un empleado específico
 * @route GET /api/liquidaciones-sueldo/empleado/:empleadoId
 * @param {string} req.params.empleadoId - ID del empleado
 * @returns {Array} Lista de liquidaciones del empleado con sus descuentos
 */
router.get('/empleado/:empleadoId', async (req, res) => {
  try {
    const liquidaciones = await LiquidacionSueldo.find({ empleado: req.params.empleadoId })
      .populate('empleado', 'nombre rut cargo sueldoBase')
      .populate('descuentos');
    res.json(liquidaciones);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @description Obtiene liquidaciones de sueldo filtradas por estado
 * @route GET /api/liquidaciones-sueldo/estado/:estado
 * @param {string} req.params.estado - Estado de las liquidaciones (emitido o pagado)
 * @returns {Array} Lista de liquidaciones que coinciden con el estado
 */
router.get('/estado/:estado', async (req, res) => {
  try {
    const liquidaciones = await LiquidacionSueldo.find({ estado: req.params.estado })
      .populate('empleado', 'nombre rut cargo sueldoBase')
      .populate('descuentos');
    res.json(liquidaciones);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @description Crea una nueva liquidación de sueldo en el sistema
 * @route POST /api/liquidaciones-sueldo
 * @param {Object} req.body - Datos de la liquidación a crear
 * @param {string} req.body.empleado - ID del empleado asociado
 * @param {string} [req.body.estado=emitido] - Estado de la liquidación
 * @param {Date} req.body.fecha - Fecha de la liquidación
 * @param {number} req.body.sueldoBruto - Monto del sueldo bruto
 * @param {number} req.body.sueldoNeto - Monto del sueldo neto
 * @param {number} [req.body.totalDescuentos=0] - Total de descuentos aplicados
 * @param {Array} [req.body.descuentos] - Lista de descuentos a aplicar
 * @returns {Object} Datos de la liquidación creada con sus descuentos
 */
router.post('/', async (req, res) => {
  try {
    // Verificar si el empleado existe
    const empleadoExiste = await Empleado.findById(req.body.empleado);
    if (!empleadoExiste) {
      return res.status(404).json({ message: 'El empleado especificado no existe' });
    }

    const liquidacion = new LiquidacionSueldo({
      empleado: req.body.empleado,
      estado: req.body.estado || 'emitido',
      fecha: req.body.fecha,
      sueldoBruto: req.body.sueldoBruto,
      sueldoNeto: req.body.sueldoNeto,
      totalDescuentos: req.body.totalDescuentos || 0
    });

    const nuevaLiquidacion = await liquidacion.save();

    // Si hay descuentos, crearlos y asociarlos a la liquidación
    if (req.body.descuentos && Array.isArray(req.body.descuentos)) {
      const descuentosPromises = req.body.descuentos.map(descuento => {
        const nuevoDescuento = new Descuento({
          concepto: descuento.concepto,
          valor: descuento.valor,
          liquidacionSueldo: nuevaLiquidacion._id
        });
        return nuevoDescuento.save();
      });

      await Promise.all(descuentosPromises);
    }

    // Obtener la liquidación con los descuentos asociados
    const liquidacionCompleta = await LiquidacionSueldo.findById(nuevaLiquidacion._id)
      .populate('empleado', 'nombre rut cargo sueldoBase')
      .populate('descuentos');

    res.status(201).json(liquidacionCompleta);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Actualizar una liquidación de sueldo
router.put('/:id', async (req, res) => {
  try {
    const liquidacion = await LiquidacionSueldo.findById(req.params.id);
    if (!liquidacion) {
      return res.status(404).json({ message: 'Liquidación de sueldo no encontrada' });
    }

    // Si se actualiza el empleado, verificar que exista
    if (req.body.empleado) {
      const empleadoExiste = await Empleado.findById(req.body.empleado);
      if (!empleadoExiste) {
        return res.status(404).json({ message: 'El empleado especificado no existe' });
      }
      liquidacion.empleado = req.body.empleado;
    }

    // Actualizar campos
    if (req.body.estado) liquidacion.estado = req.body.estado;
    if (req.body.fecha) liquidacion.fecha = req.body.fecha;
    if (req.body.sueldoBruto) liquidacion.sueldoBruto = req.body.sueldoBruto;
    if (req.body.sueldoNeto) liquidacion.sueldoNeto = req.body.sueldoNeto;
    if (req.body.totalDescuentos) liquidacion.totalDescuentos = req.body.totalDescuentos;

    const liquidacionActualizada = await liquidacion.save();
    res.json(liquidacionActualizada);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Eliminar una liquidación de sueldo
router.delete('/:id', async (req, res) => {
  try {
    const liquidacion = await LiquidacionSueldo.findById(req.params.id);
    if (!liquidacion) {
      return res.status(404).json({ message: 'Liquidación de sueldo no encontrada' });
    }

    // Eliminar los descuentos asociados
    await Descuento.deleteMany({ liquidacionSueldo: req.params.id });

    // Eliminar la liquidación
    await LiquidacionSueldo.findByIdAndDelete(req.params.id);
    res.json({ message: 'Liquidación de sueldo y sus descuentos eliminados correctamente' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;