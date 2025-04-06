/**
 * @fileoverview Modelo de datos para los registros de asistencia de empleados
 * @author Juan Sebastian Noreña
 * @version 1.0.1
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Esquema de Mongoose para el modelo de Registro de Asistencia
 * @typedef {Object} RegistroAsistenciaSchema
 * @property {ObjectId} empleado - Referencia al empleado asociado al registro
 * @property {Date} fecha - Fecha del registro de asistencia
 * @property {string} tipoRegistro - Tipo de registro (entrada o salida)
 * @property {Date} hora - Hora exacta del registro
 * @property {Date} fechaCreacion - Fecha de creación del registro
 */
const registroAsistenciaSchema = new Schema({
  empleado: {
    type: Schema.Types.ObjectId,
    ref: 'Empleado',
    required: true
  },
  fecha: {
    type: Date,
    required: true
  },
  horaEntrada: {
    type: String,
    required: true,
    trim: true
  },
  horaSalida: {
    type: String,
    required: false, // Cambiado de true a false para que sea opcional
    trim: true,
    default: '' // Valor predeterminado vacío
  },
  totalHorasTrabajadas: {
    type: Number,
    required: false, // Cambiado a opcional ya que solo se calcula al registrar salida
    default: 0 // Valor predeterminado cero
  },
  fechaCreacion: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  versionKey: false
});

/**
 * Modelo de Mongoose para Registro de Asistencia
 * @type {Model<RegistroAsistenciaSchema>}
 */
module.exports = mongoose.model('RegistroAsistencia', registroAsistenciaSchema);