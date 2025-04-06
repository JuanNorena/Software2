/**
 * @fileoverview Controlador para gestionar descuentos de liquidaciones de sueldo
 * @author Juan Sebastian Noreña
 * @version 1.0.1
 */

const express = require('express');
const router = express.Router();
const Descuento = require('../Model/Descuento');
const LiquidacionSueldo = require('../Model/LiquidacionSueldo');
const asyncHandler = require('../middleware/asyncHandler');
const { authenticateUser, authorizeRoles } = require('../middleware/authMiddleware');

/**
 * @description Obtiene todos los descuentos
 * @route GET /api/descuentos
 * @access Private
 * @returns {Array} Lista de descuentos
 */
router.get('/', authenticateUser, asyncHandler(async (req, res) => {
  const descuentos = await Descuento.find()
    .populate('liquidacionSueldo', 'fecha sueldoBruto sueldoNeto')
    .populate({
      path: 'liquidacionSueldo',
      populate: { path: 'empleado', select: 'nombre rut cargo' }
    });
  res.json(descuentos);
}));

/**
 * @description Obtiene un descuento por su ID
 * @route GET /api/descuentos/:id
 * @access Private
 * @param {string} id - ID del descuento
 * @returns {Object} Descuento encontrado
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const descuento = await Descuento.findById(req.params.id)
    .populate('liquidacionSueldo', 'fecha sueldoBruto sueldoNeto')
    .populate({
      path: 'liquidacionSueldo',
      populate: { path: 'empleado', select: 'nombre rut cargo' }
    });
  
  if (!descuento) {
    return res.status(404).json({ message: 'Descuento no encontrado' });
  }
  
  res.json(descuento);
}));

/**
 * @description Obtiene descuentos por liquidación de sueldo
 * @route GET /api/descuentos/liquidacion/:liquidacionId
 * @access Private
 * @param {string} liquidacionId - ID de la liquidación de sueldo
 * @returns {Array} Lista de descuentos asociados a la liquidación
 */
router.get('/liquidacion/:liquidacionId', asyncHandler(async (req, res) => {
  const descuentos = await Descuento.find({ liquidacionSueldo: req.params.liquidacionId })
    .populate('liquidacionSueldo', 'fecha sueldoBruto sueldoNeto')
    .populate({
      path: 'liquidacionSueldo',
      populate: { path: 'empleado', select: 'nombre rut cargo' }
    });
  
  res.json(descuentos);
}));

/**
 * @description Crea un nuevo descuento
 * @route POST /api/descuentos
 * @access Admin
 * @param {Object} req.body - Datos del descuento
 * @param {string} req.body.concepto - Concepto del descuento
 * @param {number} req.body.valor - Valor monetario del descuento
 * @param {string} req.body.liquidacionSueldo - ID de la liquidación asociada
 * @returns {Object} Nuevo descuento creado
 */
router.post('/', asyncHandler(async (req, res) => {
  // Verificar si la liquidación existe
  const liquidacionExiste = await LiquidacionSueldo.findById(req.body.liquidacionSueldo);
  if (!liquidacionExiste) {
    return res.status(404).json({ message: 'La liquidación de sueldo especificada no existe' });
  }

  const descuento = new Descuento({
    concepto: req.body.concepto,
    valor: req.body.valor,
    liquidacionSueldo: req.body.liquidacionSueldo
  });

  const nuevoDescuento = await descuento.save();
  
  // Actualizar el total de descuentos en la liquidación
  liquidacionExiste.totalDescuentos += req.body.valor;
  liquidacionExiste.sueldoNeto = liquidacionExiste.sueldoBruto - liquidacionExiste.totalDescuentos;
  await liquidacionExiste.save();
  
  res.status(201).json(nuevoDescuento);
}));

/**
 * @description Actualiza un descuento existente
 * @route PUT /api/descuentos/:id
 * @access Admin
 * @param {string} id - ID del descuento
 * @param {Object} req.body - Datos actualizados del descuento
 * @returns {Object} Descuento actualizado
 */
router.put('/:id', asyncHandler(async (req, res) => {
  const descuento = await Descuento.findById(req.params.id);
  if (!descuento) {
    return res.status(404).json({ message: 'Descuento no encontrado' });
  }

  // Obtener la liquidación actual
  const liquidacionActual = await LiquidacionSueldo.findById(descuento.liquidacionSueldo);
  
  // Si se cambia la liquidación, verificar que exista
  let liquidacionNueva = liquidacionActual;
  if (req.body.liquidacionSueldo && req.body.liquidacionSueldo !== descuento.liquidacionSueldo.toString()) {
    liquidacionNueva = await LiquidacionSueldo.findById(req.body.liquidacionSueldo);
    if (!liquidacionNueva) {
      return res.status(404).json({ message: 'La liquidación de sueldo especificada no existe' });
    }
  }

  // Guardar el valor anterior para ajustar el total de descuentos
  const valorAnterior = descuento.valor;
  
  // Actualizar campos
  if (req.body.concepto) descuento.concepto = req.body.concepto;
  if (req.body.valor) descuento.valor = req.body.valor;
  if (req.body.liquidacionSueldo) descuento.liquidacionSueldo = req.body.liquidacionSueldo;

  const descuentoActualizado = await descuento.save();
  
  // Actualizar los totales de las liquidaciones
  if (liquidacionActual) {
    liquidacionActual.totalDescuentos -= valorAnterior;
    liquidacionActual.sueldoNeto = liquidacionActual.sueldoBruto - liquidacionActual.totalDescuentos;
    await liquidacionActual.save();
  }
  
  if (liquidacionNueva && liquidacionNueva._id.toString() !== liquidacionActual._id.toString()) {
    liquidacionNueva.totalDescuentos += descuento.valor;
    liquidacionNueva.sueldoNeto = liquidacionNueva.sueldoBruto - liquidacionNueva.totalDescuentos;
    await liquidacionNueva.save();
  } else if (liquidacionActual) {
    liquidacionActual.totalDescuentos += descuento.valor;
    liquidacionActual.sueldoNeto = liquidacionActual.sueldoBruto - liquidacionActual.totalDescuentos;
    await liquidacionActual.save();
  }
  
  res.json(descuentoActualizado);
}));

/**
 * @description Elimina un descuento
 * @route DELETE /api/descuentos/:id
 * @access Admin
 * @param {string} id - ID del descuento
 * @returns {Object} Mensaje de confirmación
 */
router.delete('/:id', asyncHandler(async (req, res) => {
  const descuento = await Descuento.findById(req.params.id);
  if (!descuento) {
    return res.status(404).json({ message: 'Descuento no encontrado' });
  }

  // Actualizar el total de descuentos en la liquidación
  const liquidacion = await LiquidacionSueldo.findById(descuento.liquidacionSueldo);
  if (liquidacion) {
    liquidacion.totalDescuentos -= descuento.valor;
    liquidacion.sueldoNeto = liquidacion.sueldoBruto - liquidacion.totalDescuentos;
    await liquidacion.save();
  }

  await Descuento.findByIdAndDelete(req.params.id);
  res.json({ message: 'Descuento eliminado correctamente' });
}));

module.exports = router;