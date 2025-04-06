/**
 * @fileoverview Servicio para la generación y cálculo de liquidaciones de sueldo
 * @version 1.0.0
 */

const LiquidacionSueldo = require('../Model/LiquidacionSueldo');
const Empleado = require('../Model/Empleado');
const RegistroAsistencia = require('../Model/RegistroAsistencia');
const Descuento = require('../Model/Descuento');
const PagoSueldo = require('../Model/PagoSueldo');
const PagoContabilidadProvisional = require('../Model/PagoContabilidadProvisional');
const NotificacionService = require('./NotificacionService');
const FinancialUtils = require('../utils/FinancialUtils');

class LiquidacionService {
  /**
   * Constantes para cálculos
   */
  static TASA_AFP = 0.10; // 10% de cotización AFP
  static TASA_SALUD = 0.07; // 7% de cotización de salud
  static DIAS_LABORABLES = 20; // Días laborables por mes (promedio)
  static HORAS_JORNADA = 8; // Horas por jornada laboral

  /**
   * Genera una liquidación de sueldo para un empleado y período específico
   * @param {string} empleadoId - ID del empleado
   * @param {number} mes - Mes para el cual generar la liquidación (1-12)
   * @param {number} anio - Año para el cual generar la liquidación
   * @returns {Promise<Object>} Liquidación generada
   */
  async generarLiquidacion(empleadoId, mes, anio) {
    try {
      // 1. Obtener datos del empleado
      const empleado = await Empleado.findById(empleadoId);
      if (!empleado) {
        throw new Error('Empleado no encontrado');
      }

      // 2. Verificar si ya existe una liquidación para este período
      const liquidacionExistente = await this.verificarLiquidacionExistente(empleadoId, mes, anio);
      if (liquidacionExistente) {
        throw new Error(`Ya existe una liquidación para el empleado en el período ${mes}/${anio}`);
      }

      // 3. Obtener registros de asistencia del periodo
      const registrosAsistencia = await this.obtenerRegistrosAsistencia(empleadoId, mes, anio);

      // 4. Calcular sueldo bruto basado en asistencia
      const sueldoBruto = FinancialUtils.calcularSueldoBruto(empleado.sueldoBase, registrosAsistencia);

      // 5. Calcular descuentos legales
      const descuentos = FinancialUtils.calcularDescuentosLegales(sueldoBruto);

      // 6. Calcular sueldo neto
      const sueldoNeto = sueldoBruto - descuentos.totalDescuentos;

      // 7. Crear liquidación
      const fechaLiquidacion = new Date(anio, mes - 1, 1);
      const nuevaLiquidacion = new LiquidacionSueldo({
        empleado: empleadoId,
        fecha: fechaLiquidacion,
        sueldoBruto,
        sueldoNeto,
        totalDescuentos: descuentos.totalDescuentos,
        estado: 'pendiente' // Estado inicial: pendiente de revisión
      });

      const liquidacion = await nuevaLiquidacion.save();

      // 8. Crear registros de descuentos asociados
      await this.crearRegistrosDescuentos(liquidacion._id, descuentos);

      return liquidacion;
    } catch (error) {
      console.error('Error al generar liquidación:', error);
      throw error;
    }
  }

  /**
   * Verifica si ya existe una liquidación para el empleado en el período especificado
   * @param {string} empleadoId - ID del empleado
   * @param {number} mes - Mes (1-12)
   * @param {number} anio - Año
   * @returns {Promise<boolean>} True si existe, false si no
   */
  async verificarLiquidacionExistente(empleadoId, mes, anio) {
    const { inicio, fin } = FinancialUtils.obtenerPeriodoMensual(mes, anio);
    
    const liquidacion = await LiquidacionSueldo.findOne({
      empleado: empleadoId,
      fecha: {
        $gte: inicio,
        $lt: fin
      }
    });
    
    return !!liquidacion;
  }

  /**
   * Obtiene los registros de asistencia del empleado para un período específico
   * @param {string} empleadoId - ID del empleado
   * @param {number} mes - Mes (1-12)
   * @param {number} anio - Año
   * @returns {Promise<Array>} Registros de asistencia
   */
  async obtenerRegistrosAsistencia(empleadoId, mes, anio) {
    const { inicio, fin } = FinancialUtils.obtenerPeriodoMensual(mes, anio);
    
    return await RegistroAsistencia.find({
      empleado: empleadoId,
      fecha: {
        $gte: inicio,
        $lt: fin
      }
    });
  }

  /**
   * Crea los registros de descuentos asociados a una liquidación
   * @param {string} liquidacionId - ID de la liquidación
   * @param {Object} descuentos - Objeto con los descuentos calculados
   * @returns {Promise<Array>} Descuentos creados
   */
  async crearRegistrosDescuentos(liquidacionId, descuentos) {
    const promesasDescuentos = descuentos.detalles.map(detalle => {
      const descuento = new Descuento({
        concepto: detalle.concepto,
        valor: detalle.valor,
        liquidacionSueldo: liquidacionId
      });
      return descuento.save();
    });
    
    return await Promise.all(promesasDescuentos);
  }

  /**
   * Aprueba una liquidación de sueldo
   * @param {string} liquidacionId - ID de la liquidación
   * @param {string} aprobadorId - ID del usuario que aprueba
   * @returns {Promise<Object>} Liquidación aprobada
   */
  async aprobarLiquidacion(liquidacionId, aprobadorId) {
    const liquidacion = await LiquidacionSueldo.findById(liquidacionId);
    if (!liquidacion) {
      throw new Error('Liquidación no encontrada');
    }
    
    if (liquidacion.estado !== 'pendiente') {
      throw new Error(`La liquidación no puede ser aprobada (estado actual: ${liquidacion.estado})`);
    }
    
    liquidacion.estado = 'aprobado';
    liquidacion.aprobadoPor = aprobadorId;
    liquidacion.fechaAprobacion = new Date();
    
    const liquidacionAprobada = await liquidacion.save();
    
    // Notificar al empleado
    await NotificacionService.notificarLiquidacionDisponible(liquidacion.empleado, liquidacionId);
    
    return liquidacionAprobada;
  }

  /**
   * Rechaza una liquidación de sueldo
   * @param {string} liquidacionId - ID de la liquidación
   * @param {string} motivo - Motivo del rechazo
   * @returns {Promise<Object>} Liquidación rechazada
   */
  async rechazarLiquidacion(liquidacionId, motivo) {
    const liquidacion = await LiquidacionSueldo.findById(liquidacionId);
    if (!liquidacion) {
      throw new Error('Liquidación no encontrada');
    }
    
    if (liquidacion.estado !== 'pendiente') {
      throw new Error(`La liquidación no puede ser rechazada (estado actual: ${liquidacion.estado})`);
    }
    
    liquidacion.estado = 'rechazado';
    liquidacion.motivoRechazo = motivo;
    liquidacion.fechaRechazo = new Date();
    
    return await liquidacion.save();
  }

  /**
   * Procesa el pago de una liquidación
   * @param {string} liquidacionId - ID de la liquidación
   * @param {Object} datosPago - Datos para el pago (método, banco, etc.)
   * @returns {Promise<Object>} Información del pago realizado
   */
  async procesarPagoLiquidacion(liquidacionId, datosPago) {
    // 1. Verificar que la liquidación exista y esté aprobada
    const liquidacion = await LiquidacionSueldo.findById(liquidacionId)
        .populate('empleado');
        
    if (!liquidacion) {
      throw new Error('Liquidación no encontrada');
    }
    
    if (liquidacion.estado !== 'aprobado') {
      throw new Error('La liquidación debe estar aprobada para procesar el pago');
    }
    
    // 2. Realizar el pago del sueldo
    const pagoSueldo = await this.crearPagoSueldo(liquidacion, datosPago);
    
    // 3. Generar los pagos provisionales (AFP, Salud)
    const pagoProvisional = await this.generarPagoProvisional(liquidacion);
    
    // 4. Actualizar estado de la liquidación
    liquidacion.estado = 'pagado';
    await liquidacion.save();
    
    // 5. Notificar al empleado sobre el pago realizado
    await NotificacionService.notificarPagoRealizado(liquidacion.empleado._id, liquidacionId);
    
    return {
      liquidacion,
      pagoSueldo,
      pagoProvisional
    };
  }

  /**
   * Crea un nuevo pago de sueldo
   * @param {Object} liquidacion - Liquidación de sueldo
   * @param {Object} datosPago - Datos para el pago
   * @returns {Promise<Object>} Pago creado
   */
  async crearPagoSueldo(liquidacion, datosPago) {
    if (!datosPago.metodoPago || !['cheque', 'deposito'].includes(datosPago.metodoPago)) {
      throw new Error('El método de pago debe ser "cheque" o "deposito"');
    }
    
    if (!datosPago.banco) {
      throw new Error('Se debe especificar el banco para el pago');
    }
    
    // Verificar que la liquidación no esté ya pagada
    if (liquidacion.estado === 'pagado') {
      throw new Error('Esta liquidación ya ha sido pagada');
    }
    
    const nuevoPago = new PagoSueldo({
      liquidacionSueldo: liquidacion._id,
      banco: datosPago.banco,
      fecha: new Date(),
      metodoPago: datosPago.metodoPago,
      monto: liquidacion.sueldoNeto
    });
    
    return await nuevoPago.save();
  }

  /**
   * Genera un pago provisional para una liquidación
   * @param {Object} liquidacion - Liquidación de sueldo
   * @returns {Promise<Object>} Pago provisional generado
   */
  async generarPagoProvisional(liquidacion) {
    // 1. Obtener los descuentos de la liquidación
    const descuentos = await Descuento.find({ liquidacionSueldo: liquidacion._id });
    
    // 2. Filtrar y calcular montos de AFP y Salud
    const descuentoAFP = descuentos.find(d => d.concepto === 'AFP');
    const descuentoSalud = descuentos.find(d => d.concepto === 'Salud');
    
    const montoAFP = descuentoAFP ? descuentoAFP.valor : 0;
    const montoSalud = descuentoSalud ? descuentoSalud.valor : 0;
    const totalProvisional = montoAFP + montoSalud;
    
    if (totalProvisional <= 0) {
      throw new Error('No hay montos previsionales para generar el pago');
    }
    
    // 3. Crear registro de pago provisional
    const fecha = new Date();
    const mesAnio = `${fecha.getMonth() + 1}/${fecha.getFullYear()}`;
    
    const nuevoPago = new PagoContabilidadProvisional({
      liquidacionSueldo: liquidacion._id,
      fechaPago: fecha,
      periodoCorrespondiente: mesAnio,
      totalPago: totalProvisional,
      totalPagoPension: montoAFP,
      totalPagoSalud: montoSalud
    });
    
    return await nuevoPago.save();
  }

  /**
   * Genera liquidaciones para todos los empleados de una empresa
   * @param {string} empresaId - ID de la empresa
   * @param {number} mes - Mes para generar liquidaciones (1-12)
   * @param {number} anio - Año para generar liquidaciones
   * @returns {Promise<Object>} Resultados de la generación
   */
  async generarLiquidacionesEmpresa(empresaId, mes, anio) {
    // Obtener todos los empleados de la empresa
    const empleados = await Empleado.find({ empresa: empresaId });
    
    const resultados = {
      exitosas: [],
      fallidas: []
    };
    
    // Generar liquidaciones para cada empleado
    for (const empleado of empleados) {
      try {
        const liquidacion = await this.generarLiquidacion(empleado._id, mes, anio);
        resultados.exitosas.push({
          empleadoId: empleado._id,
          empleadoNombre: empleado.nombre,
          liquidacionId: liquidacion._id
        });
      } catch (error) {
        resultados.fallidas.push({
          empleadoId: empleado._id,
          empleadoNombre: empleado.nombre,
          error: error.message
        });
      }
    }
    
    return resultados;
  }

  /**
   * Genera informe de pagos previsionales
   * @param {number} mes - Mes (1-12)
   * @param {number} anio - Año
   * @returns {Promise<Object>} Informe generado
   */
  async generarInformePrevisional(mes, anio) {
    const pagos = await this.obtenerPagosPorPeriodo(mes, anio);
    
    // Agrupar por AFP e ISAPRE para el informe
    const resumenAFP = {};
    const resumenSalud = {};
    let totalAFP = 0;
    let totalSalud = 0;
    
    pagos.forEach(pago => {
      // En un sistema real, aquí se obtendría la AFP y la ISAPRE específica de cada empleado
      // Para este ejemplo, agrupamos todos los pagos
      totalAFP += pago.totalPagoPension;
      totalSalud += pago.totalPagoSalud;
      
      // Si tuviéramos la información específica de AFP e ISAPRE:
      // const afp = pago.liquidacionSueldo.empleado.afp || 'Desconocida';
      // resumenAFP[afp] = (resumenAFP[afp] || 0) + pago.totalPagoPension;
    });
    
    return {
      periodo: `${mes}/${anio}`,
      fechaGeneracion: new Date(),
      cantidadPagos: pagos.length,
      montoTotalAFP: totalAFP,
      montoTotalSalud: totalSalud,
      montoTotal: totalAFP + totalSalud,
      detalleAFP: resumenAFP,
      detalleSalud: resumenSalud
    };
  }

  /**
   * Obtiene pagos provisionales filtrados por período
   * @param {number} mes - Mes (1-12)
   * @param {number} anio - Año
   * @param {string} [empresaId] - ID de la empresa (opcional)
   * @returns {Promise<Array>} Lista de pagos provisionales
   */
  async obtenerPagosPorPeriodo(mes, anio, empresaId = null) {
    const primerDiaMes = new Date(anio, mes - 1, 1);
    const primerDiaSiguienteMes = new Date(anio, mes, 1);
    
    let query = {
      fechaPago: {
        $gte: primerDiaMes,
        $lt: primerDiaSiguienteMes
      }
    };
    
    // Si se especificó una empresa, filtramos por empleados de esa empresa
    if (empresaId) {
      // Necesitamos hacer un join más complejo con la empresa del empleado
      // En un entorno real, esto podría optimizarse con una agregación
      const pagos = await PagoContabilidadProvisional.find(query)
        .populate({
          path: 'liquidacionSueldo',
          populate: { path: 'empleado', select: 'empresa nombre rut' }
        });
      
      return pagos.filter(pago => 
        pago.liquidacionSueldo && 
        pago.liquidacionSueldo.empleado && 
        pago.liquidacionSueldo.empleado.empresa.toString() === empresaId
      );
    }
    
    return await PagoContabilidadProvisional.find(query)
      .populate({
        path: 'liquidacionSueldo',
        populate: { path: 'empleado', select: 'nombre rut' }
      });
  }
}

module.exports = new LiquidacionService();
