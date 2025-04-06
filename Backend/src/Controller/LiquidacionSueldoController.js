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
const LiquidacionService = require('../service/LiquidacionService');
const { authenticateUser, authorizeRoles } = require('../middleware/authMiddleware');
const asyncHandler = require('../middleware/asyncHandler');

/**
 * @description Obtiene todas las liquidaciones de sueldo registradas en el sistema
 * @route GET /api/liquidaciones-sueldo
 * @returns {Array} Lista de todas las liquidaciones con información del empleado y descuentos
 */
router.get('/', authenticateUser, authorizeRoles(['ADMIN']), async (req, res) => {
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

/**
 * @description Genera liquidación de sueldo para un empleado
 * @route POST /api/liquidaciones-sueldo/generar
 * @access Admin
 */
router.post('/generar', authenticateUser, authorizeRoles(['ADMIN']), asyncHandler(async (req, res) => {
  const { empleadoId, mes, anio } = req.body;
  
  if (!empleadoId || !mes || !anio) {
    return res.status(400).json({ 
      mensaje: 'Debe proporcionar empleadoId, mes y anio' 
    });
  }
  
  try {
    const liquidacion = await LiquidacionService.generarLiquidacion(empleadoId, parseInt(mes), parseInt(anio));
    
    res.status(201).json({
      mensaje: 'Liquidación generada correctamente',
      liquidacion
    });
  } catch (error) {
    res.status(400).json({
      mensaje: 'Error al generar liquidación',
      error: error.message
    });
  }
}));

/**
 * @description Genera liquidaciones para todos los empleados de una empresa
 * @route POST /api/liquidaciones-sueldo/generar-empresa
 * @access Admin
 */
router.post('/generar-empresa', authenticateUser, authorizeRoles(['ADMIN']), asyncHandler(async (req, res) => {
  const { empresaId, mes, anio } = req.body;
  
  if (!empresaId || !mes || !anio) {
    return res.status(400).json({
      mensaje: 'Debe proporcionar empresaId, mes y anio'
    });
  }
  
  try {
    const resultados = await LiquidacionService.generarLiquidacionesEmpresa(empresaId, parseInt(mes), parseInt(anio));
    
    res.json({
      mensaje: 'Proceso de generación de liquidaciones completado',
      resultados
    });
  } catch (error) {
    res.status(400).json({
      mensaje: 'Error en el proceso de generación',
      error: error.message
    });
  }
}));

/**
 * @description Obtiene liquidaciones pendientes de aprobación
 * @route GET /api/liquidaciones-sueldo/pendientes
 * @access Admin
 */
router.get('/pendientes', authenticateUser, authorizeRoles(['ADMIN']), asyncHandler(async (req, res) => {
  const liquidaciones = await LiquidacionSueldo.find({ estado: 'pendiente' })
    .populate('empleado', 'nombre rut cargo')
    .sort({ fecha: -1 });
  
  res.json(liquidaciones);
}));

/**
 * @description Aprueba una liquidación de sueldo
 * @route PUT /api/liquidaciones-sueldo/:id/aprobar
 * @access Admin
 */
router.put('/:id/aprobar', authenticateUser, authorizeRoles(['ADMIN']), asyncHandler(async (req, res) => {
  try {
    const liquidacion = await LiquidacionService.aprobarLiquidacion(
      req.params.id,
      req.user.id
    );
    
    res.json({
      mensaje: 'Liquidación aprobada correctamente',
      liquidacion
    });
  } catch (error) {
    res.status(400).json({
      mensaje: 'Error al aprobar la liquidación',
      error: error.message
    });
  }
}));

/**
 * @description Rechaza una liquidación de sueldo
 * @route PUT /api/liquidaciones-sueldo/:id/rechazar
 * @access Admin
 */
router.put('/:id/rechazar', authenticateUser, authorizeRoles(['ADMIN']), asyncHandler(async (req, res) => {
  const { motivo } = req.body;
  
  if (!motivo) {
    return res.status(400).json({
      mensaje: 'Debe proporcionar un motivo para el rechazo'
    });
  }
  
  try {
    const liquidacion = await LiquidacionService.rechazarLiquidacion(
      req.params.id,
      motivo
    );
    
    res.json({
      mensaje: 'Liquidación rechazada',
      liquidacion
    });
  } catch (error) {
    res.status(400).json({
      mensaje: 'Error al rechazar la liquidación',
      error: error.message
    });
  }
}));

/**
 * @description Procesa el pago de una liquidación
 * @route POST /api/liquidaciones-sueldo/:id/pagar
 * @access Admin
 */
router.post('/:id/pagar', authenticateUser, authorizeRoles(['ADMIN']), asyncHandler(async (req, res) => {
  const { metodoPago, banco } = req.body;
  
  if (!metodoPago || !banco) {
    return res.status(400).json({
      mensaje: 'Debe proporcionar método de pago y banco'
    });
  }
  
  try {
    const resultado = await LiquidacionService.procesarPagoLiquidacion(
      req.params.id,
      { metodoPago, banco }
    );
    
    res.json({
      mensaje: 'Pago procesado correctamente',
      liquidacion: resultado.liquidacion,
      pagoSueldo: resultado.pagoSueldo,
      pagoProvisional: resultado.pagoProvisional
    });
  } catch (error) {
    res.status(400).json({
      mensaje: 'Error al procesar el pago',
      error: error.message
    });
  }
}));

/**
 * @description Obtiene las liquidaciones disponibles del empleado
 * @route GET /api/liquidaciones-sueldo/empleado/mis-liquidaciones
 * @access Empleado
 */
router.get('/empleado/mis-liquidaciones', authenticateUser, asyncHandler(async (req, res) => {
  if (!req.user.empleadoId) {
    return res.status(403).json({
      mensaje: 'Acceso denegado. Usuario no es un empleado.'
    });
  }
  
  const liquidaciones = await LiquidacionSueldo.find({
    empleado: req.user.empleadoId,
    estado: { $in: ['aprobado', 'pagado'] }
  }).populate('empleado', 'nombre rut cargo')
    .sort({ fecha: -1 });
  
  res.json(liquidaciones);
}));

/**
 * @description Actualiza una liquidación de sueldo
 * @route PUT /api/liquidaciones-sueldo/:id
 * @param {string} req.params.id - ID de la liquidación a actualizar
 * @param {Object} req.body - Datos de la liquidación a actualizar
 * @returns {Object} Datos de la liquidación actualizada
 */
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

/**
 * @description Elimina una liquidación de sueldo
 * @route DELETE /api/liquidaciones-sueldo/:id
 * @param {string} req.params.id - ID de la liquidación a eliminar
 * @returns {Object} Mensaje de confirmación de eliminación
 */
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

/**
 * @description Genera informe de pagos previsionales
 * @route GET /api/liquidaciones-sueldo/informe-previsional/:mes/:anio
 * @access Admin
 */
router.get('/informe-previsional/:mes/:anio', authenticateUser, authorizeRoles(['ADMIN']), asyncHandler(async (req, res) => {
  const { mes, anio } = req.params;
  
  try {
    const informe = await LiquidacionService.generarInformePrevisional(
      parseInt(mes),
      parseInt(anio)
    );
    
    res.json(informe);
  } catch (error) {
    res.status(400).json({
      mensaje: 'Error al generar el informe previsional',
      error: error.message
    });
  }
}));

module.exports = router;