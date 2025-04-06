/**
 * @fileoverview Controlador para gestionar las operaciones relacionadas con los pagos de sueldos
 * @author Juan Sebastian Noreña
 * @version 1.0.1
 */

const express = require('express');
const router = express.Router();
const PagoSueldo = require('../Model/PagoSueldo');
const LiquidacionSueldo = require('../Model/LiquidacionSueldo');
const PagoService = require('../service/PagoService');
const BaseController = require('./BaseController');
const asyncHandler = require('../middleware/asyncHandler');
const { authenticateUser, authorizeRoles } = require('../middleware/authMiddleware');

/**
 * @description Obtiene todos los pagos de sueldo
 * @route GET /api/pagos-sueldo
 * @access Admin
 * @returns {Array} Lista de pagos de sueldo
 */
router.get('/', authenticateUser, authorizeRoles(['ADMIN']), asyncHandler(async (req, res) => {
  try {
    const pagosSueldo = await PagoService.obtenerTodosPagosSueldo();
    BaseController.sendResponse(res, pagosSueldo);
  } catch (error) {
    BaseController.handleError(res, error);
  }
}));

/**
 * @description Obtiene un pago de sueldo por su ID
 * @route GET /api/pagos-sueldo/:id
 * @access Private
 * @param {string} id - ID del pago de sueldo
 * @returns {Object} Pago de sueldo encontrado
 */
router.get('/:id', authenticateUser, asyncHandler(async (req, res) => {
  try {
    const pagoSueldo = await PagoSueldo.findById(req.params.id)
      .populate('liquidacionSueldo', 'fecha sueldoBruto sueldoNeto')
      .populate({
        path: 'liquidacionSueldo',
        populate: { path: 'empleado', select: 'nombre rut cargo' }
      });
    
    if (!pagoSueldo) {
      return BaseController.handleNotFound(res, 'Pago de sueldo');
    }
    
    BaseController.sendResponse(res, pagoSueldo);
  } catch (error) {
    BaseController.handleError(res, error);
  }
}));

/**
 * @description Obtiene pagos de sueldo por liquidación
 * @route GET /api/pagos-sueldo/liquidacion/:liquidacionId
 * @access Private
 * @param {string} liquidacionId - ID de la liquidación de sueldo
 * @returns {Array} Lista de pagos asociados a la liquidación
 */
router.get('/liquidacion/:liquidacionId', authenticateUser, asyncHandler(async (req, res) => {
  try {
    const pagosSueldo = await PagoSueldo.find({ liquidacionSueldo: req.params.liquidacionId })
      .populate('liquidacionSueldo', 'fecha sueldoBruto sueldoNeto')
      .populate({
        path: 'liquidacionSueldo',
        populate: { path: 'empleado', select: 'nombre rut cargo' }
      });
    
    BaseController.sendResponse(res, pagosSueldo);
  } catch (error) {
    BaseController.handleError(res, error);
  }
}));

/**
 * @description Crea un nuevo pago de sueldo
 * @route POST /api/pagos-sueldo
 * @access Admin
 * @param {Object} req.body - Datos del pago de sueldo
 * @param {string} req.body.liquidacionSueldo - ID de la liquidación
 * @param {string} req.body.banco - Banco que procesa el pago
 * @param {Date} req.body.fecha - Fecha del pago
 * @param {string} req.body.metodoPago - Método (cheque o deposito)
 * @param {number} req.body.monto - Monto del pago
 * @returns {Object} Nuevo pago de sueldo creado
 */
router.post('/', authenticateUser, asyncHandler(async (req, res) => {
  try {
    // Verificar si la liquidación existe
    const liquidacionExiste = await LiquidacionSueldo.findById(req.body.liquidacionSueldo);
    if (!liquidacionExiste) {
      return BaseController.handleNotFound(res, 'La liquidación de sueldo especificada');
    }

    // Verificar si la liquidación ya está pagada
    if (liquidacionExiste.estado === 'pagado') {
      return BaseController.handleBadRequest(res, 'Esta liquidación de sueldo ya ha sido pagada');
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

    BaseController.sendResponse(res, nuevoPagoSueldo, 201);
  } catch (error) {
    BaseController.handleError(res, error);
  }
}));

/**
 * @description Actualiza un pago de sueldo existente
 * @route PUT /api/pagos-sueldo/:id
 * @access Admin
 * @param {string} id - ID del pago de sueldo
 * @param {Object} req.body - Datos actualizados del pago
 * @returns {Object} Pago de sueldo actualizado
 */
router.put('/:id', authenticateUser, asyncHandler(async (req, res) => {
  try {
    const pagoSueldo = await PagoSueldo.findById(req.params.id);
    if (!pagoSueldo) {
      return BaseController.handleNotFound(res, 'Pago de sueldo');
    }

    // Si se actualiza la liquidación, verificar que exista
    if (req.body.liquidacionSueldo) {
      const liquidacionExiste = await LiquidacionSueldo.findById(req.body.liquidacionSueldo);
      if (!liquidacionExiste) {
        return BaseController.handleNotFound(res, 'La liquidación de sueldo especificada');
      }
      pagoSueldo.liquidacionSueldo = req.body.liquidacionSueldo;
    }

    // Actualizar campos
    if (req.body.banco) pagoSueldo.banco = req.body.banco;
    if (req.body.fecha) pagoSueldo.fecha = req.body.fecha;
    if (req.body.metodoPago) pagoSueldo.metodoPago = req.body.metodoPago;
    if (req.body.monto) pagoSueldo.monto = req.body.monto;

    const pagoSueldoActualizado = await pagoSueldo.save();
    BaseController.sendResponse(res, pagoSueldoActualizado);
  } catch (error) {
    BaseController.handleError(res, error);
  }
}));

/**
 * @description Elimina un pago de sueldo
 * @route DELETE /api/pagos-sueldo/:id
 * @access Admin
 * @param {string} id - ID del pago de sueldo
 * @returns {Object} Mensaje de confirmación
 */
router.delete('/:id', authenticateUser, asyncHandler(async (req, res) => {
  try {
    const pagoSueldo = await PagoSueldo.findById(req.params.id);
    if (!pagoSueldo) {
      return BaseController.handleNotFound(res, 'Pago de sueldo');
    }

    // Obtener la liquidación asociada y cambiar su estado a 'emitido'
    const liquidacion = await LiquidacionSueldo.findById(pagoSueldo.liquidacionSueldo);
    if (liquidacion) {
      liquidacion.estado = 'emitido';
      await liquidacion.save();
    }

    await PagoSueldo.findByIdAndDelete(req.params.id);
    BaseController.sendResponse(res, { message: 'Pago de sueldo eliminado correctamente' });
  } catch (error) {
    BaseController.handleError(res, error);
  }
}));

module.exports = router;