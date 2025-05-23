/**
 * @fileoverview Servicio para gestionar el registro de asistencia de empleados
 * @author Juan Sebastian Noreña
 * @version 1.0.1
 */

const RegistroAsistencia = require('../Model/RegistroAsistencia');
const Empleado = require('../Model/Empleado');

/**
 * Servicio para gestionar asistencias de empleados
 * @class AsistenciaService
 */
class AsistenciaService {
  /**
   * Registra la entrada de un empleado
   * @param {string} empleadoId - ID del empleado
   * @returns {Promise<Object>} Registro de asistencia creado o actualizado
   * @throws {Error} Si el empleado no existe
   */
  async registrarEntrada(empleadoId) {
    try {
      // Verificar si el empleado existe
      const empleado = await Empleado.findById(empleadoId);
      if (!empleado) {
        throw new Error('Empleado no encontrado');
      }

      const fecha = new Date();
      const horaActual = fecha.toTimeString().split(' ')[0];
      
      // Buscar si ya existe un registro para hoy
      const fechaHoy = new Date();
      fechaHoy.setHours(0, 0, 0, 0);
      
      let registro = await RegistroAsistencia.findOne({
        empleado: empleadoId,
        fecha: {
          $gte: fechaHoy,
          $lt: new Date(fechaHoy.getTime() + 24 * 60 * 60 * 1000)
        }
      });

      if (registro) {
        // Si ya existe un registro hoy pero no tiene hora de entrada, actualizarlo
        if (!registro.horaEntrada) {
          registro.horaEntrada = horaActual;
          await registro.save();
        }
        return registro;
      } else {
        // Crear un nuevo registro con la hora de entrada
        const nuevoRegistro = new RegistroAsistencia({
          empleado: empleadoId,
          fecha: fecha,
          horaEntrada: horaActual,
          horaSalida: '',
          totalHorasTrabajadas: 0
        });
        return await nuevoRegistro.save();
      }
    } catch (error) {
      console.error('Error al registrar entrada:', error);
      throw error;
    }
  }

  /**
   * Registra la salida de un empleado
   * @param {string} empleadoId - ID del empleado
   * @returns {Promise<Object>} Registro de asistencia actualizado
   * @throws {Error} Si no hay registro de entrada o empleado no encontrado
   */
  async registrarSalida(empleadoId) {
    try {
      // Verificar si el empleado existe
      const empleado = await Empleado.findById(empleadoId);
      if (!empleado) {
        throw new Error('Empleado no encontrado');
      }

      const fecha = new Date();
      const horaActual = fecha.toTimeString().split(' ')[0];
      
      // Buscar registro de hoy para este empleado
      const fechaHoy = new Date();
      fechaHoy.setHours(0, 0, 0, 0);
      
      const registro = await RegistroAsistencia.findOne({
        empleado: empleadoId,
        fecha: {
          $gte: fechaHoy,
          $lt: new Date(fechaHoy.getTime() + 24 * 60 * 60 * 1000)
        }
      });

      if (!registro) {
        // Si no hay registro de entrada, creamos uno completo
        const nuevoRegistro = new RegistroAsistencia({
          empleado: empleadoId,
          fecha: fecha,
          horaEntrada: "00:00:00", // Hora de entrada predeterminada
          horaSalida: horaActual,
          totalHorasTrabajadas: 0 // Se calculará a continuación
        });
        
        // Calcular el total de horas trabajadas (asumiendo que trabajó desde las 00:00)
        const horasSalida = horaActual.split(':').map(Number);
        const salidaMinutos = horasSalida[0] * 60 + horasSalida[1];
        nuevoRegistro.totalHorasTrabajadas = parseFloat((salidaMinutos / 60).toFixed(2));
        
        return await nuevoRegistro.save();
      }

      // Actualizar hora de salida
      registro.horaSalida = horaActual;
      
      // Calcular el total de horas trabajadas
      let horasEntrada = [0, 0, 0];
      if (registro.horaEntrada) {
        horasEntrada = registro.horaEntrada.split(':').map(Number);
      }
      const horasSalida = horaActual.split(':').map(Number);
      
      const entradaMinutos = horasEntrada[0] * 60 + horasEntrada[1];
      const salidaMinutos = horasSalida[0] * 60 + horasSalida[1];
      
      // Calcular diferencia en horas (considerando posibilidad de salida al día siguiente)
      const diferenciaMinutos = salidaMinutos >= entradaMinutos 
        ? salidaMinutos - entradaMinutos 
        : (24 * 60) - entradaMinutos + salidaMinutos;
      
      registro.totalHorasTrabajadas = parseFloat((diferenciaMinutos / 60).toFixed(2));
      
      return await registro.save();
    } catch (error) {
      console.error('Error al registrar salida:', error);
      throw error;
    }
  }

  /**
   * Obtiene el historial de asistencia de un empleado
   * @param {string} empleadoId - ID del empleado
   * @param {Date} fechaInicio - Fecha de inicio opcional
   * @param {Date} fechaFin - Fecha de fin opcional
   * @returns {Promise<Array>} Lista de registros de asistencia
   */
  async obtenerHistorialAsistencia(empleadoId, fechaInicio, fechaFin) {
    try {
      let query = { empleado: empleadoId };
      
      if (fechaInicio || fechaFin) {
        query.fecha = {};
        if (fechaInicio) query.fecha.$gte = new Date(fechaInicio);
        if (fechaFin) query.fecha.$lte = new Date(fechaFin);
      }
      
      return await RegistroAsistencia.find(query)
        .sort({ fecha: -1 })
        .populate('empleado', 'nombre rut cargo');
    } catch (error) {
      console.error('Error al obtener historial de asistencia:', error);
      throw error;
    }
  }

  /**
   * Obtiene el resumen de horas trabajadas en un período
   * @param {string} empleadoId - ID del empleado
   * @param {Date} fechaInicio - Fecha de inicio
   * @param {Date} fechaFin - Fecha de fin
   * @returns {Promise<Object>} Resumen de horas trabajadas
   */
  async obtenerResumenHoras(empleadoId, fechaInicio, fechaFin) {
    try {
      // Verificar si el empleado existe
      const empleado = await Empleado.findById(empleadoId);
      if (!empleado) {
        throw new Error('Empleado no encontrado');
      }
      
      // Preparar filtro de fechas
      const filtro = { empleado: empleadoId };
      if (fechaInicio || fechaFin) {
        filtro.fecha = {};
        if (fechaInicio) filtro.fecha.$gte = new Date(fechaInicio);
        if (fechaFin) filtro.fecha.$lte = new Date(fechaFin);
      }
      
      // Obtener registros de asistencia en el período
      const registros = await RegistroAsistencia.find(filtro).sort({ fecha: 1 });
      
      // Calcular totales
      const totalDias = registros.length;
      let totalHoras = 0;
      let horasRegulares = 0;
      let horasExtra = 0;
      const horasEsperadasPorDia = 8; // 8 horas por jornada laboral
      
      registros.forEach(registro => {
        totalHoras += registro.totalHorasTrabajadas;
        
        if (registro.totalHorasTrabajadas > horasEsperadasPorDia) {
          horasRegulares += horasEsperadasPorDia;
          horasExtra += (registro.totalHorasTrabajadas - horasEsperadasPorDia);
        } else {
          horasRegulares += registro.totalHorasTrabajadas;
        }
      });
      
      return {
        empleado: {
          id: empleado._id,
          nombre: empleado.nombre,
          cargo: empleado.cargo
        },
        periodo: {
          inicio: fechaInicio || registros[0]?.fecha || new Date(),
          fin: fechaFin || registros[registros.length - 1]?.fecha || new Date()
        },
        resumen: {
          diasTrabajados: totalDias,
          horasTotales: parseFloat(totalHoras.toFixed(2)),
          horasRegulares: parseFloat(horasRegulares.toFixed(2)),
          horasExtras: parseFloat(horasExtra.toFixed(2))
        },
        registrosDetallados: registros
      };
    } catch (error) {
      console.error('Error al obtener resumen de horas:', error);
      throw error;
    }
  }

  /**
   * Obtiene el detalle de días y horas trabajadas de un empleado en un periodo específico
   * @param {string} empleadoId - ID del empleado
   * @param {number} mes - Mes (1-12) 
   * @param {number} anio - Año
   * @returns {Promise<Object>} Detalles de días y horas trabajadas
   */
  async obtenerDetalleAsistenciaPeriodo(empleadoId, mes, anio) {
    try {
      // Validar que el empleado existe
      const empleado = await Empleado.findById(empleadoId);
      if (!empleado) {
        throw new Error('Empleado no encontrado');
      }
      
      // Obtener el periodo (inicio y fin del mes)
      const { inicio, fin } = FinancialUtils.obtenerPeriodoMensual(mes, anio);
      
      // Obtener registros de asistencia
      const registros = await RegistroAsistencia.find({
        empleado: empleadoId,
        fecha: {
          $gte: inicio,
          $lt: fin
        }
      }).sort({ fecha: 1 });
      
      // Calcular días trabajados, horas totales, horas extras, etc.
      const diasDelMes = new Date(anio, mes, 0).getDate(); // Obtener número de días del mes
      const diasLaborables = FinancialUtils.DIAS_LABORABLES; // Días laborables promedio
      const diasTrabajados = registros.length;
      
      let totalHoras = 0;
      let horasRegulares = 0;
      let horasExtra = 0;
      let diasConHorasExtra = 0;
      const horasEsperadasPorDia = FinancialUtils.HORAS_JORNADA;
      
      // Contabilizar tipo de días
      const diasPorTipo = {
        completos: 0,
        incompletos: 0,
        ausencias: 0
      };
      
      // Mapeo de días de la semana (0 = domingo, 1 = lunes, ..., 6 = sábado)
      const diasSemana = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
      
      // Registros procesados para devolver al cliente
      const registrosProcesados = [];
      
      // Crear mapa de fechas para identificar rápidamente días trabajados
      const fechasRegistradas = new Set(registros.map(r => new Date(r.fecha).toISOString().split('T')[0]));
      
      // Procesar cada día del mes
      for (let dia = 1; dia <= diasDelMes; dia++) {
        const fecha = new Date(anio, mes - 1, dia);
        const fechaStr = fecha.toISOString().split('T')[0];
        const diaSemana = diasSemana[fecha.getDay()];
        
        // Verificar si es día laborable (lunes a viernes)
        const esLaborable = fecha.getDay() > 0 && fecha.getDay() < 6;
        
        // Datos del día
        const datoDia = {
          fecha,
          diaSemana,
          esLaborable
        };
        
        // Si hay registro de asistencia para este día
        if (fechasRegistradas.has(fechaStr)) {
          const registro = registros.find(r => new Date(r.fecha).toISOString().split('T')[0] === fechaStr);
          datoDia.horaEntrada = registro.horaEntrada;
          datoDia.horaSalida = registro.horaSalida;
          datoDia.totalHoras = registro.totalHorasTrabajadas;
          datoDia.asistio = true;
          
          totalHoras += registro.totalHorasTrabajadas;
          
          if (registro.totalHorasTrabajadas >= horasEsperadasPorDia) {
            diasPorTipo.completos++;
            
            if (registro.totalHorasTrabajadas > horasEsperadasPorDia) {
              horasRegulares += horasEsperadasPorDia;
              horasExtra += (registro.totalHorasTrabajadas - horasEsperadasPorDia);
              diasConHorasExtra++;
              datoDia.tieneHorasExtra = true;
              datoDia.horasExtra = registro.totalHorasTrabajadas - horasEsperadasPorDia;
            } else {
              horasRegulares += registro.totalHorasTrabajadas;
              datoDia.tieneHorasExtra = false;
            }
          } else {
            diasPorTipo.incompletos++;
            horasRegulares += registro.totalHorasTrabajadas;
            datoDia.tieneHorasExtra = false;
          }
        } else {
          // No hay registro para este día
          datoDia.asistio = false;
          datoDia.totalHoras = 0;
          
          // Solo contar ausencias en días laborables
          if (esLaborable) {
            diasPorTipo.ausencias++;
          }
        }
        
        registrosProcesados.push(datoDia);
      }
      
      return {
        empleado: {
          id: empleado._id,
          nombre: empleado.nombre,
          cargo: empleado.cargo
        },
        periodo: {
          mes,
          anio,
          inicio,
          fin,
          diasDelMes,
          diasLaborables
        },
        resumen: {
          diasTrabajados,
          diasCompletos: diasPorTipo.completos,
          diasIncompletos: diasPorTipo.incompletos,
          diasAusentes: diasPorTipo.ausencias,
          horasTotales: parseFloat(totalHoras.toFixed(2)),
          horasRegulares: parseFloat(horasRegulares.toFixed(2)),
          horasExtras: parseFloat(horasExtra.toFixed(2)),
          diasConHorasExtra
        },
        registrosDiarios: registrosProcesados
      };
    } catch (error) {
      console.error('Error al obtener detalle de asistencia:', error);
      throw error;
    }
  }
}

module.exports = new AsistenciaService();
