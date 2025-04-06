/**
 * @fileoverview Controlador para gestionar las operaciones relacionadas con los pagos de contabilidad provisional
 * @author Juan Sebastian Noreña 
 * @version 1.0.1
 */

const express = require('express');
const router = express.Router();
const PagoContabilidadProvisional = require('../Model/PagoContabilidadProvisional');
const LiquidacionSueldo = require('../Model/LiquidacionSueldo');
const PagoService = require('../service/PagoService');
const BaseController = require('./BaseController');
const asyncHandler = require('../middleware/asyncHandler');
const { authenticateUser, authorizeRoles } = require('../middleware/authMiddleware');

/**
 * @description Obtiene todos los pagos de contabilidad provisional
 * @route GET /api/pagos-contabilidad-provisional
 * @access Admin
 * @returns {Array} Lista de pagos de contabilidad provisional
 */
router.get('/', authenticateUser, authorizeRoles(['ADMIN']), asyncHandler(async (req, res) => {
  try {
    const pagos = await PagoService.obtenerTodosPagosProvisionales();
    BaseController.sendResponse(res, pagos);
  } catch (error) {
    BaseController.handleError(res, error);
  }
}));

/**
 * @description Genera informe de pagos previsionales
 * @route GET /api/pagos-contabilidad-provisional/informe/:mes/:anio
 * @access Admin
 * @param {number} mes - Mes (1-12)
 * @param {number} anio - Año
 * @returns {Object} Informe generado
 */
router.get('/informe/:mes/:anio', authenticateUser, authorizeRoles(['ADMIN']), asyncHandler(async (req, res) => {
  try {
    const { mes, anio } = req.params;
    const informe = await PagoService.generarInformePrevisional(
      parseInt(mes),
      parseInt(anio)
    );
    
    BaseController.sendResponse(res, informe, 'Informe generado correctamente');
  } catch (error) {
    BaseController.handleError(res, error, 400);
  }
}));

/**
 * @description Obtiene un pago de contabilidad provisional por su ID
 * @route GET /api/pagos-contabilidad-provisional/:id
 * @access Private
 * @param {string} id - ID del pago de contabilidad provisional
 * @returns {Object} Pago de contabilidad provisional encontrado
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const pago = await PagoContabilidadProvisional.findById(req.params.id)
    .populate('liquidacionSueldo', 'fecha sueldoBruto sueldoNeto')
    .populate({
      path: 'liquidacionSueldo',
      populate: { path: 'empleado', select: 'nombre rut cargo' }
    });
  
  if (!pago) {
    return res.status(404).json({ message: 'Pago de contabilidad provisional no encontrado' });
  }
  
  res.json(pago);
}));

/**
 * @description Obtiene pagos de contabilidad provisional por liquidación
 * @route GET /api/pagos-contabilidad-provisional/liquidacion/:liquidacionId
 * @access Private
 * @param {string} liquidacionId - ID de la liquidación de sueldo
 * @returns {Array} Lista de pagos asociados a la liquidación
 */
router.get('/liquidacion/:liquidacionId', asyncHandler(async (req, res) => {
  const pagos = await PagoContabilidadProvisional.find({ liquidacionSueldo: req.params.liquidacionId })
    .populate('liquidacionSueldo', 'fecha sueldoBruto sueldoNeto')
    .populate({
      path: 'liquidacionSueldo',
      populate: { path: 'empleado', select: 'nombre rut cargo' }
    });
  
  res.json(pagos);
}));

/**
 * @description Crea un nuevo pago de contabilidad provisional
 * @route POST /api/pagos-contabilidad-provisional
 * @access Admin
 * @param {Object} req.body - Datos del pago de contabilidad provisional
 * @param {string} req.body.liquidacionSueldo - ID de la liquidación
 * @param {Date} req.body.fechaPago - Fecha del pago
 * @param {string} req.body.periodoCorrespondiente - Período al que corresponde
 * @param {number} req.body.totalPago - Monto total del pago
 * @param {number} req.body.totalPagoPension - Monto para pensión
 * @param {number} req.body.totalPagoSalud - Monto para salud
 * @returns {Object} Nuevo pago de contabilidad provisional creado
 */
router.post('/', asyncHandler(async (req, res) => {
  // Verificar si la liquidación existe
  const liquidacionExiste = await LiquidacionSueldo.findById(req.body.liquidacionSueldo);
  if (!liquidacionExiste) {
    return res.status(404).json({ message: 'La liquidación de sueldo especificada no existe' });
  }

  const pago = new PagoContabilidadProvisional({
    liquidacionSueldo: req.body.liquidacionSueldo,
    fechaPago: req.body.fechaPago,
    periodoCorrespondiente: req.body.periodoCorrespondiente,
    totalPago: req.body.totalPago,
    totalPagoPension: req.body.totalPagoPension,
    totalPagoSalud: req.body.totalPagoSalud
  });

  const nuevoPago = await pago.save();
  res.status(201).json(nuevoPago);
}));

/**
 * @description Actualiza un pago de contabilidad provisional existente
 * @route PUT /api/pagos-contabilidad-provisional/:id
 * @access Admin
 * @param {string} id - ID del pago de contabilidad provisional
 * @param {Object} req.body - Datos actualizados del pago
 * @returns {Object} Pago de contabilidad provisional actualizado
 */
router.put('/:id', asyncHandler(async (req, res) => {
  const pago = await PagoContabilidadProvisional.findById(req.params.id);
  if (!pago) {
    return res.status(404).json({ message: 'Pago de contabilidad provisional no encontrado' });
  }

  // Si se actualiza la liquidación, verificar que exista
  if (req.body.liquidacionSueldo) {
    const liquidacionExiste = await LiquidacionSueldo.findById(req.body.liquidacionSueldo);
    if (!liquidacionExiste) {
      return res.status(404).json({ message: 'La liquidación de sueldo especificada no existe' });
    }
    pago.liquidacionSueldo = req.body.liquidacionSueldo;
  }

  // Actualizar campos
  if (req.body.fechaPago) pago.fechaPago = req.body.fechaPago;
  if (req.body.periodoCorrespondiente) pago.periodoCorrespondiente = req.body.periodoCorrespondiente;
  if (req.body.totalPago) pago.totalPago = req.body.totalPago;
  if (req.body.totalPagoPension) pago.totalPagoPension = req.body.totalPagoPension;
  if (req.body.totalPagoSalud) pago.totalPagoSalud = req.body.totalPagoSalud;

  const pagoActualizado = await pago.save();
  res.json(pagoActualizado);
}));

/**
 * @description Elimina un pago de contabilidad provisional
 * @route DELETE /api/pagos-contabilidad-provisional/:id
 * @access Admin
 * @param {string} id - ID del pago de contabilidad provisional
 * @returns {Object} Mensaje de confirmación
 */
router.delete('/:id', asyncHandler(async (req, res) => {
  const pago = await PagoContabilidadProvisional.findById(req.params.id);
  if (!pago) {
    return res.status(404).json({ message: 'Pago de contabilidad provisional no encontrado' });
  }

  await PagoContabilidadProvisional.findByIdAndDelete(req.params.id);
  res.json({ message: 'Pago de contabilidad provisional eliminado correctamente' });
}));

module.exports = router;