/**
 * @fileoverview Controlador para gestionar las operaciones relacionadas con los pagos de sueldos
 * @author Juan Sebastian Noreña
 * @version 1.0.0
 */

const express = require('express');
const router = express.Router();
const PagoSueldo = require('../Model/PagoSueldo');
const LiquidacionSueldo = require('../Model/LiquidacionSueldo');
const asyncHandler = require('../middleware/asyncHandler');

/**
 * @description Obtiene todos los pagos de sueldo
 * @route GET /api/pagos-sueldo
 * @returns {Array} Lista de pagos de sueldo
 */
router.get('/', asyncHandler(async (req, res) => {
  const pagosSueldo = await PagoSueldo.find()
    .populate('liquidacionSueldo', 'fecha sueldoBruto sueldoNeto')
    .populate({
      path: 'liquidacionSueldo',
      populate: { path: 'empleado', select: 'nombre rut cargo' }
    });
  res.json(pagosSueldo);
}));

/**
 * @description Obtiene un pago de sueldo por su ID
 * @route GET /api/pagos-sueldo/:id
 * @param {string} id - ID del pago de sueldo
 * @returns {Object} Pago de sueldo encontrado
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const pagoSueldo = await PagoSueldo.findById(req.params.id)
    .populate('liquidacionSueldo', 'fecha sueldoBruto sueldoNeto')
    .populate({
      path: 'liquidacionSueldo',
      populate: { path: 'empleado', select: 'nombre rut cargo' }
    });
  
  if (!pagoSueldo) {
    return res.status(404).json({ message: 'Pago de sueldo no encontrado' });
  }
  
  res.json(pagoSueldo);
}));

/**
 * @description Obtiene pagos de sueldo por liquidación
 * @route GET /api/pagos-sueldo/liquidacion/:liquidacionId
 * @param {string} liquidacionId - ID de la liquidación de sueldo
 * @returns {Array} Lista de pagos asociados a la liquidación
 */
router.get('/liquidacion/:liquidacionId', asyncHandler(async (req, res) => {
  const pagosSueldo = await PagoSueldo.find({ liquidacionSueldo: req.params.liquidacionId })
    .populate('liquidacionSueldo', 'fecha sueldoBruto sueldoNeto')
    .populate({
      path: 'liquidacionSueldo',
      populate: { path: 'empleado', select: 'nombre rut cargo' }
    });
  
  res.json(pagosSueldo);
}));

/**
 * @description Crea un nuevo pago de sueldo
 * @route POST /api/pagos-sueldo
 * @param {Object} req.body - Datos del pago de sueldo
 * @returns {Object} Nuevo pago de sueldo creado
 */
router.post('/', asyncHandler(async (req, res) => {
  // Verificar si la liquidación existe
  const liquidacionExiste = await LiquidacionSueldo.findById(req.body.liquidacionSueldo);
  if (!liquidacionExiste) {
    return res.status(404).json({ message: 'La liquidación de sueldo especificada no existe' });
  }

  // Verificar si la liquidación ya está pagada
  if (liquidacionExiste.estado === 'pagado') {
    return res.status(400).json({ message: 'Esta liquidación de sueldo ya ha sido pagada' });
  }

  const pagoSueldo = new PagoSueldo({
    liquidacionSueldo: req.body.liquidacionSueldo,
    banco: req.body.banco,
    fecha: req.body.fecha,
    metodoPago: req.body.metodoPago,
    monto: req.body.monto
  });

  const nuevoPagoSueldo = await pagoSueldo.save();

  // Actualizar el estado de la liquidación a 'pagado'
  liquidacionExiste.estado = 'pagado';
  await liquidacionExiste.save();

  res.status(201).json(nuevoPagoSueldo);
}));

/**
 * @description Actualiza un pago de sueldo existente
 * @route PUT /api/pagos-sueldo/:id
 * @param {string} id - ID del pago de sueldo
 * @param {Object} req.body - Datos actualizados del pago
 * @returns {Object} Pago de sueldo actualizado
 */
router.put('/:id', asyncHandler(async (req, res) => {
  const pagoSueldo = await PagoSueldo.findById(req.params.id);
  if (!pagoSueldo) {
    return res.status(404).json({ message: 'Pago de sueldo no encontrado' });
  }

  // Si se actualiza la liquidación, verificar que exista
  if (req.body.liquidacionSueldo) {
    const liquidacionExiste = await LiquidacionSueldo.findById(req.body.liquidacionSueldo);
    if (!liquidacionExiste) {
      return res.status(404).json({ message: 'La liquidación de sueldo especificada no existe' });
    }
    pagoSueldo.liquidacionSueldo = req.body.liquidacionSueldo;
  }

  // Actualizar campos
  if (req.body.banco) pagoSueldo.banco = req.body.banco;
  if (req.body.fecha) pagoSueldo.fecha = req.body.fecha;
  if (req.body.metodoPago) pagoSueldo.metodoPago = req.body.metodoPago;
  if (req.body.monto) pagoSueldo.monto = req.body.monto;

  const pagoSueldoActualizado = await pagoSueldo.save();
  res.json(pagoSueldoActualizado);
}));

/**
 * @description Elimina un pago de sueldo
 * @route DELETE /api/pagos-sueldo/:id
 * @param {string} id - ID del pago de sueldo
 * @returns {Object} Mensaje de confirmación
 */
router.delete('/:id', asyncHandler(async (req, res) => {
  const pagoSueldo = await PagoSueldo.findById(req.params.id);
  if (!pagoSueldo) {
    return res.status(404).json({ message: 'Pago de sueldo no encontrado' });
  }

  // Obtener la liquidación asociada y cambiar su estado a 'emitido'
  const liquidacion = await LiquidacionSueldo.findById(pagoSueldo.liquidacionSueldo);
  if (liquidacion) {
    liquidacion.estado = 'emitido';
    await liquidacion.save();
  }

  await PagoSueldo.findByIdAndDelete(req.params.id);
  res.json({ message: 'Pago de sueldo eliminado correctamente' });
}));

module.exports = router;