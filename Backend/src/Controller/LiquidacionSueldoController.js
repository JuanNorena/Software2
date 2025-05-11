/**
 * @fileoverview Controlador para gestionar las operaciones CRUD de liquidaciones de sueldo
 * @author Juan Sebastian Noreña
 * @version 1.0.2
 */

const express = require('express');
const router = express.Router();
const LiquidacionSueldo = require('../Model/LiquidacionSueldo');
const Empleado = require('../Model/Empleado');
const Descuento = require('../Model/Descuento');
const LiquidacionService = require('../service/LiquidacionService');
const BaseController = require('./BaseController');
const { authenticateUser, authorizeRoles } = require('../middleware/authMiddleware');
const asyncHandler = require('../middleware/asyncHandler');

// IMPORTANTE: Las rutas con patrones específicos deben ir antes que las rutas con patrones dinámicos (:id)

/**
 * @description Obtiene todas las liquidaciones de sueldo registradas en el sistema
 * @route GET /api/liquidaciones-sueldo
 * @access Admin
 * @returns {Array} Lista de todas las liquidaciones con información del empleado y descuentos
 */
router.get('/', authenticateUser, authorizeRoles(['ADMIN']), asyncHandler(async (req, res) => {
  try {
    const liquidaciones = await LiquidacionSueldo.find()
      .populate('empleado', 'nombre rut cargo sueldoBase')
      .populate('descuentos');
    
    BaseController.sendResponse(res, liquidaciones);
  } catch (error) {
    BaseController.handleError(res, error);
  }
}));
/**
 * @description Procesa el pago de nómina (múltiples liquidaciones)
 * @route POST /api/liquidaciones-sueldo/pagar-nomina
 * @access Admin
 * @param {Object} req.body - Datos del pago
 * @param {Array} req.body.liquidacionesIds - IDs de las liquidaciones a pagar
 * @param {string} req.body.metodoPago - Método de pago (cheque o deposito)
 * @param {string} req.body.banco - Banco que procesa el pago
 * @param {Date} req.body.fechaPago - Fecha del pago
 * @returns {Object} Detalle de la operación de pago
 */
router.post('/pagar-nomina', authenticateUser, authorizeRoles(['ADMIN']), asyncHandler(async (req, res) => {
  const { liquidacionesIds, metodoPago, banco, fechaPago } = req.body;
  
  try {
    // Validación de campos obligatorios
    if (!liquidacionesIds || !Array.isArray(liquidacionesIds) || liquidacionesIds.length === 0) {
      return BaseController.handleBadRequest(res, 'Debe proporcionar un array con al menos una liquidación para procesar');
    }
    
    if (!metodoPago || !banco) {
      return BaseController.handleBadRequest(res, 'Debe proporcionar método de pago y banco');
    }
    
    // Validar que el método de pago sea válido
    if (!['cheque', 'deposito'].includes(metodoPago)) {
      return BaseController.handleBadRequest(res, 'El método de pago debe ser "cheque" o "deposito"');
    }
    
    // Iniciar una sesión de transacción
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      const resultados = [];
      const errores = [];
      
      // Procesar cada liquidación en la transacción
      for (const liquidacionId of liquidacionesIds) {
        try {
          // Verificar que la liquidación exista
          const liquidacion = await LiquidacionSueldo.findById(liquidacionId);
          if (!liquidacion) {
            errores.push(`La liquidación con ID ${liquidacionId} no existe`);
            continue;
          }
          
          // Verificar que la liquidación esté en estado adecuado para pago
          if (liquidacion.estado !== 'aprobado') {
            errores.push(`La liquidación con ID ${liquidacionId} no está en estado aprobado`);
            continue;
          }
          
          // Crear objeto de pago de sueldo
          const pagoSueldo = new PagoSueldo({
            liquidacionSueldo: liquidacionId,
            banco: banco,
            fecha: fechaPago || new Date(),
            metodoPago: metodoPago,
            monto: liquidacion.sueldoNeto
          });
          
          // Guardar el pago dentro de la transacción
          const nuevoPagoSueldo = await pagoSueldo.save({ session });
          
          // Actualizar el estado de la liquidación a 'pagado'
          liquidacion.estado = 'pagado';
          await liquidacion.save({ session });
          
          // Buscar o crear empleado asociado para incluir información en el resultado
          const empleado = await Empleado.findById(liquidacion.empleado).select('nombre rut');
          
          resultados.push({
            liquidacionId,
            pagoId: nuevoPagoSueldo._id,
            empleado: empleado ? {
              id: empleado._id,
              nombre: empleado.nombre,
              rut: empleado.rut
            } : { id: liquidacion.empleado },
            monto: nuevoPagoSueldo.monto,
            fecha: nuevoPagoSueldo.fecha
          });
        } catch (error) {
          errores.push(`Error al procesar la liquidación ${liquidacionId}: ${error.message}`);
        }
      }
      
      // Si no se procesó ninguna liquidación, abortar la transacción
      if (resultados.length === 0) {
        await session.abortTransaction();
        return BaseController.handleBadRequest(res, 'No se pudo procesar ninguna liquidación', { errores });
      }
      
      // Confirmar la transacción
      await session.commitTransaction();
      
      // Calcular el monto total procesado
      const montoTotal = resultados.reduce((total, r) => total + r.monto, 0);
      
      BaseController.sendResponse(
        res, 
        { 
          resultados, 
          errores: errores.length > 0 ? errores : null,
          resumen: {
            liquidacionesProcesadas: resultados.length,
            liquidacionesConError: errores.length,
            montoTotal
          }
        },
        `Se han procesado ${resultados.length} liquidaciones correctamente por un total de ${montoTotal}`,
        200
      );
    } catch (error) {
      // Si hay un error general, abortar la transacción
      await session.abortTransaction();
      throw error;
    } finally {
      // Finalizar la sesión
      session.endSession();
    }
  } catch (error) {
    console.error('Error al procesar pago de nómina:', error);
    BaseController.handleError(res, error);
  }
}));

/**
 * @description Obtiene las liquidaciones disponibles del empleado
 * @route GET /api/liquidaciones-sueldo/mis-liquidaciones
 * @access Empleado
 * @returns {Array} Liquidaciones disponibles del empleado autenticado
 */
router.get('/mis-liquidaciones', authenticateUser, asyncHandler(async (req, res) => {
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
 * @description Obtiene liquidaciones pendientes de aprobación
 * @route GET /api/liquidaciones-sueldo/pendientes
 * @access Admin
 * @returns {Array} Lista de liquidaciones pendientes
 */
router.get('/pendientes', authenticateUser, authorizeRoles(['ADMIN']), asyncHandler(async (req, res) => {
  const liquidaciones = await LiquidacionSueldo.find({ estado: 'pendiente' })
    .populate('empleado', 'nombre rut cargo')
    .sort({ fecha: -1 });
  
  res.json(liquidaciones);
}));

/**
 * @description Genera informe de pagos previsionales
 * @route GET /api/liquidaciones-sueldo/informe-previsional/:mes/:anio
 * @access Admin
 * @param {number} req.params.mes - Mes (1-12)
 * @param {number} req.params.anio - Año
 * @returns {Object} Informe generado
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

/**
 * @description Obtiene el histórico completo de liquidaciones con opciones de filtrado
 * @route GET /api/liquidaciones-sueldo/historico
 * @access Admin
 * @param {string} [req.query.desde] - Fecha de inicio (YYYY-MM-DD)
 * @param {string} [req.query.hasta] - Fecha de fin (YYYY-MM-DD)
 * @param {string} [req.query.estado] - Estado de las liquidaciones a filtrar
 * @param {string} [req.query.empleado] - ID del empleado para filtrar
 * @param {string} [req.query.empresa] - ID de la empresa para filtrar
 * @returns {Array} Lista histórica de liquidaciones que cumplen con los filtros
 */
router.get('/historico', authenticateUser, authorizeRoles(['ADMIN']), asyncHandler(async (req, res) => {
  try {
    const { desde, hasta, estado, empleado, empresa } = req.query;
    
    const filtro = {};
    
    // Aplicar filtro de rango de fechas
    if (desde || hasta) {
      filtro.fecha = {};
      if (desde) filtro.fecha.$gte = new Date(desde);
      if (hasta) filtro.fecha.$lte = new Date(hasta);
    }
    
    // Filtro por estado
    if (estado) filtro.estado = estado;
    
    // Filtro por empleado específico
    if (empleado) filtro.empleado = empleado;
    
    // Si se filtra por empresa, primero obtenemos los IDs de los empleados de esa empresa
    if (empresa) {
      const empleadosEmpresa = await Empleado.find({ empresa }).select('_id');
      const empleadosIds = empleadosEmpresa.map(e => e._id);
      filtro.empleado = { $in: empleadosIds };
    }
    
    // Realizar la consulta con los filtros aplicados
    const liquidaciones = await LiquidacionSueldo.find(filtro)
      .populate('empleado', 'nombre rut cargo sueldoBase')
      .populate({
        path: 'empleado',
        populate: { path: 'empresa', select: 'nombre rut' }
      })
      .populate('descuentos')
      .populate('aprobadoPor', 'nombre')
      .sort({ fecha: -1 });
    
    // Incluir estadísticas básicas en la respuesta
    const estadisticas = {
      total: liquidaciones.length,
      totalPorEstado: {
        pendiente: liquidaciones.filter(l => l.estado === 'pendiente').length,
        aprobado: liquidaciones.filter(l => l.estado === 'aprobado').length,
        rechazado: liquidaciones.filter(l => l.estado === 'rechazado').length,
        pagado: liquidaciones.filter(l => l.estado === 'pagado').length
      },
      montoTotal: liquidaciones.reduce((sum, l) => sum + l.sueldoNeto, 0)
    };
    
    res.json({
      liquidaciones,
      estadisticas
    });
  } catch (error) {
    console.error('Error al obtener histórico de liquidaciones:', error);
    res.status(500).json({ mensaje: 'Error al obtener histórico de liquidaciones', error: error.message });
  }
}));

/**
 * @description Obtiene liquidaciones de sueldo filtradas por estado
 * @route GET /api/liquidaciones-sueldo/estado/:estado
 * @access Private
 * @param {string} req.params.estado - Estado de las liquidaciones (emitido o pagado)
 * @returns {Array} Lista de liquidaciones que coinciden con el estado
 */
router.get('/estado/:estado', asyncHandler(async (req, res) => {
  try {
    const liquidaciones = await LiquidacionSueldo.find({ estado: req.params.estado })
      .populate('empleado', 'nombre rut cargo sueldoBase')
      .populate('descuentos');
    res.json(liquidaciones);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}));

/**
 * @description Obtiene las liquidaciones disponibles del empleado
 * @route GET /api/liquidaciones-sueldo/empleado/mis-liquidaciones
 * @access Empleado
 * @returns {Array} Liquidaciones disponibles del empleado autenticado
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
 * @description Obtiene todas las liquidaciones de sueldo de un empleado específico
 * @route GET /api/liquidaciones-sueldo/empleado/:empleadoId
 * @access Private
 * @param {string} req.params.empleadoId - ID del empleado
 * @returns {Array} Lista de liquidaciones del empleado con sus descuentos
 */
router.get('/empleado/:empleadoId', asyncHandler(async (req, res) => {
  try {
    const liquidaciones = await LiquidacionSueldo.find({ empleado: req.params.empleadoId })
      .populate('empleado', 'nombre rut cargo sueldoBase')
      .populate('descuentos');
    res.json(liquidaciones);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}));

/**
 * @description Genera liquidación de sueldo para un empleado
 * @route POST /api/liquidaciones-sueldo/generar
 * @access Admin
 * @param {Object} req.body - Datos para generar la liquidación
 * @param {string} req.body.empleadoId - ID del empleado
 * @param {number} req.body.mes - Mes (1-12)
 * @param {number} req.body.anio - Año
 * @returns {Object} Datos de la liquidación generada
 */
router.post('/generar', authenticateUser, authorizeRoles(['ADMIN']), asyncHandler(async (req, res) => {
  const { empleadoId, mes, anio } = req.body;
  
  const errorValidacion = BaseController.validateRequiredFields(req, ['empleadoId', 'mes', 'anio']);
  if (errorValidacion) {
    return res.status(400).json({ mensaje: errorValidacion });
  }
  
  try {
    const liquidacion = await LiquidacionService.generarLiquidacion(empleadoId, parseInt(mes), parseInt(anio));
    
    BaseController.sendResponse(
      res, 
      { liquidacion }, 
      'Liquidación generada correctamente',
      201
    );
  } catch (error) {
    BaseController.handleError(res, error, 400);
  }
}));

/**
 * @description Genera liquidaciones para todos los empleados de una empresa
 * @route POST /api/liquidaciones-sueldo/generar-empresa
 * @access Admin
 * @param {Object} req.body - Datos para generar liquidaciones
 * @param {string} req.body.empresaRut - RUT de la empresa
 * @param {number} req.body.mes - Mes (1-12)
 * @param {number} req.body.anio - Año
 * @returns {Object} Resultados de la generación
 */
router.post('/generar-empresa', authenticateUser, authorizeRoles(['ADMIN']), asyncHandler(async (req, res) => {
  const { empresaRut, mes, anio } = req.body;
  
  if (!empresaRut || !mes || !anio) {
    return res.status(400).json({
      mensaje: 'Debe proporcionar empresaRut, mes y anio'
    });
  }
  
  try {
    const resultados = await LiquidacionService.generarLiquidacionesEmpresa(empresaRut, parseInt(mes), parseInt(anio));
    
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
 * @description Obtiene una liquidación de sueldo específica por su ID
 * @route GET /api/liquidaciones-sueldo/:id
 * @access Private
 * @param {string} req.params.id - ID de la liquidación a buscar
 * @returns {Object} Datos de la liquidación encontrada con información del empleado y descuentos
 */
router.get('/:id', asyncHandler(async (req, res) => {
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
}));

/**
 * @description Aprueba una liquidación de sueldo
 * @route PUT /api/liquidaciones-sueldo/:id/aprobar
 * @access Admin
 * @param {string} req.params.id - ID de la liquidación
 * @returns {Object} Liquidación aprobada
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
 * @param {string} req.params.id - ID de la liquidación
 * @param {Object} req.body - Datos del rechazo
 * @param {string} req.body.motivo - Motivo del rechazo
 * @returns {Object} Liquidación rechazada
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
 * @param {string} req.params.id - ID de la liquidación
 * @param {Object} req.body - Datos del pago
 * @param {string} req.body.metodoPago - Método de pago (cheque o deposito)
 * @param {string} req.body.banco - Banco que procesa el pago
 * @returns {Object} Detalle de la operación de pago
 */
router.post('/:id/pagar', authenticateUser, authorizeRoles(['ADMIN']), asyncHandler(async (req, res) => {
  const { metodoPago, banco } = req.body;
  
  try {
    // Validación de campos obligatorios
    if (!metodoPago || !banco) {
      return res.status(400).json({
        mensaje: 'Debe proporcionar método de pago y banco'
      });
    }
    
    // Validar que el método de pago sea válido
    if (!['cheque', 'deposito'].includes(metodoPago)) {
      return res.status(400).json({
        mensaje: 'El método de pago debe ser "cheque" o "deposito"'
      });
    }
    
    // Validar que el ID de liquidación sea válido
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        mensaje: 'El ID de liquidación proporcionado no es válido'
      });
    }
    
    const resultado = await LiquidacionService.procesarPagoLiquidacion(
      req.params.id,
      { metodoPago, banco }
    );
    
    res.status(200).json({
      mensaje: 'Pago procesado correctamente',
      liquidacion: resultado.liquidacion,
      pagoSueldo: resultado.pagoSueldo,
      pagoProvisional: resultado.pagoProvisional
    });
  } catch (error) {
    console.error('Error al procesar pago:', error);
    res.status(400).json({
      mensaje: 'Error al procesar el pago',
      error: error.message
    });
  }
}));

/**
 * @description Obtiene el historial completo de asistencia del empleado para una liquidación específica
 * @route GET /api/liquidaciones-sueldo/:id/asistencia
 * @access Private
 * @param {string} req.params.id - ID de la liquidación
 * @returns {Array} Registros de asistencia del período correspondiente
 */
router.get('/:id/asistencia', authenticateUser, asyncHandler(async (req, res) => {
  try {
    const liquidacion = await LiquidacionSueldo.findById(req.params.id);
    
    if (!liquidacion) {
      return res.status(404).json({ mensaje: 'Liquidación no encontrada' });
    }
    
    // Verificar acceso
    if (req.user.roles.includes('ADMIN') || 
        (req.user.empleadoId && liquidacion.empleado.toString() === req.user.empleadoId.toString())) {
      
      // Obtener período de la liquidación
      const { inicio, fin } = FinancialUtils.obtenerPeriodoMensual(
        liquidacion.fecha.getMonth() + 1,
        liquidacion.fecha.getFullYear()
      );
      
      // Buscar registros de asistencia
      const registros = await RegistroAsistencia.find({
        empleado: liquidacion.empleado,
        fecha: {
          $gte: inicio,
          $lt: fin
        }
      }).sort({ fecha: 1 });
      
      // Calcular totales
      const totalDias = registros.length;
      let totalHoras = 0;
      let horasRegulares = 0;
      let horasExtra = 0;
      
      const horasEsperadasPorDia = FinancialUtils.HORAS_JORNADA;
      
      registros.forEach(registro => {
        if (registro.totalHorasTrabajadas) {
          totalHoras += registro.totalHorasTrabajadas;
          
          if (registro.totalHorasTrabajadas > horasEsperadasPorDia) {
            horasRegulares += horasEsperadasPorDia;
            horasExtra += (registro.totalHorasTrabajadas - horasEsperadasPorDia);
          } else {
            horasRegulares += registro.totalHorasTrabajadas;
          }
        }
      });
      
      res.json({
        liquidacion: {
          id: liquidacion._id,
          fecha: liquidacion.fecha,
          estado: liquidacion.estado
        },
        empleado: liquidacion.empleado,
        periodo: {
          inicio,
          fin
        },
        resumen: {
          diasTrabajados: totalDias,
          horasTotales: parseFloat(totalHoras.toFixed(2)),
          horasRegulares: parseFloat(horasRegulares.toFixed(2)),
          horasExtras: parseFloat(horasExtra.toFixed(2))
        },
        registros: registros.map(reg => ({
          fecha: reg.fecha,
          horaEntrada: reg.horaEntrada,
          horaSalida: reg.horaSalida,
          totalHoras: reg.totalHorasTrabajadas
        }))
      });
    } else {
      return res.status(403).json({ mensaje: 'No tienes permiso para acceder a esta información' });
    }
  } catch (error) {
    console.error('Error al obtener registros de asistencia:', error);
    res.status(500).json({ mensaje: 'Error al obtener registros de asistencia', error: error.message });
  }
}));

/**
 * @description Actualiza una liquidación de sueldo
 * @route PUT /api/liquidaciones-sueldo/:id
 * @access Admin
 * @param {string} req.params.id - ID de la liquidación a actualizar
 * @param {Object} req.body - Datos de la liquidación a actualizar
 * @returns {Object} Datos de la liquidación actualizada
 */
router.put('/:id', asyncHandler(async (req, res) => {
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
}));

/**
 * @description Elimina una liquidación de sueldo
 * @route DELETE /api/liquidaciones-sueldo/:id
 * @access Admin
 * @param {string} req.params.id - ID de la liquidación a eliminar
 * @returns {Object} Mensaje de confirmación de eliminación
 */
router.delete('/:id', asyncHandler(async (req, res) => {
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
}));

/**
 * @description Crea una nueva liquidación de sueldo en el sistema
 * @route POST /api/liquidaciones-sueldo
 * @access Admin
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
router.post('/', authenticateUser, authorizeRoles(['ADMIN']), asyncHandler(async (req, res) => {
  try {
    // Validar campos obligatorios
    const camposRequeridos = ['empleado', 'fecha', 'sueldoBruto', 'sueldoNeto'];
    for (const campo of camposRequeridos) {
      if (!req.body[campo]) {
        return res.status(400).json({ message: `El campo ${campo} es obligatorio` });
      }
    }
    
    // Validar que los montos sean números positivos
    if (isNaN(parseFloat(req.body.sueldoBruto)) || parseFloat(req.body.sueldoBruto) < 0) {
      return res.status(400).json({ message: 'El sueldo bruto debe ser un número positivo' });
    }
    
    if (isNaN(parseFloat(req.body.sueldoNeto)) || parseFloat(req.body.sueldoNeto) < 0) {
      return res.status(400).json({ message: 'El sueldo neto debe ser un número positivo' });
    }
    
    // Verificar si el empleado existe
    const empleadoExiste = await Empleado.findById(req.body.empleado);
    if (!empleadoExiste) {
      return res.status(404).json({ message: 'El empleado especificado no existe' });
    }

    // Iniciar una sesión de transacción
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      const liquidacion = new LiquidacionSueldo({
        empleado: req.body.empleado,
        estado: req.body.estado || 'emitido',
        fecha: req.body.fecha,
        sueldoBruto: req.body.sueldoBruto,
        sueldoNeto: req.body.sueldoNeto,
        totalDescuentos: req.body.totalDescuentos || 0
      });

      const nuevaLiquidacion = await liquidacion.save({ session });

      // Si hay descuentos, crearlos y asociarlos a la liquidación
      if (req.body.descuentos && Array.isArray(req.body.descuentos)) {
        const descuentosPromises = req.body.descuentos.map(descuento => {
          // Validar los campos de cada descuento
          if (!descuento.concepto || isNaN(parseFloat(descuento.valor))) {
            throw new Error('Los descuentos deben tener concepto y valor válido');
          }
          
          const nuevoDescuento = new Descuento({
            concepto: descuento.concepto,
            valor: descuento.valor,
            liquidacionSueldo: nuevaLiquidacion._id
          });
          return nuevoDescuento.save({ session });
        });

        await Promise.all(descuentosPromises);
      }
      
      // Confirmar la transacción
      await session.commitTransaction();

      // Obtener la liquidación con los descuentos asociados
      const liquidacionCompleta = await LiquidacionSueldo.findById(nuevaLiquidacion._id)
        .populate('empleado', 'nombre rut cargo sueldoBase')
        .populate('descuentos');

      res.status(201).json({
        message: 'Liquidación creada exitosamente',
        liquidacion: liquidacionCompleta
      });
    } catch (error) {
      // Si hay un error, abortar la transacción
      await session.abortTransaction();
      throw error;
    } finally {
      // Finalizar la sesión
      session.endSession();
    }
  } catch (error) {
    console.error('Error al crear liquidación:', error);
    res.status(400).json({ message: error.message });
  }
}));

module.exports = router;