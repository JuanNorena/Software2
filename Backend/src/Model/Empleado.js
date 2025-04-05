/**
 * @fileoverview Modelo de datos para los empleados en el sistema
 * @author Juan Sebastian Noreña
 * @version 1.0.0
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Esquema de Mongoose para el modelo de Empleado
 * @typedef {Object} EmpleadoSchema
 * @property {string} nombre - Nombre completo del empleado
 * @property {string} cargo - Cargo o puesto que ocupa el empleado
 * @property {Date} fechaNacimiento - Fecha de nacimiento del empleado
 * @property {string} id - Identificador único del empleado
 * @property {string} numeroCuentaDigital - Número de cuenta bancaria digital
 * @property {string} profesion - Profesión o título del empleado
 * @property {string} rut - RUT (Rol Único Tributario) del empleado
 * @property {number} sueldoBase - Sueldo base del empleado
 * @property {ObjectId} empresa - Referencia a la empresa donde trabaja
 * @property {boolean} esEncargadoPersonal - Indica si es encargado de personal
 * @property {Date} fechaCreacion - Fecha de creación del registro
 */
const empleadoSchema = new Schema({
  nombre: {
    type: String,
    required: true,
    trim: true
  },
  cargo: {
    type: String,
    required: true,
    trim: true
  },
  fechaNacimiento: {
    type: Date,
    required: true
  },
  id: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  numeroCuentaDigital: {
    type: String,
    required: true,
    trim: true
  },
  profesion: {
    type: String,
    required: true,
    trim: true
  },
  rut: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  sueldoBase: {
    type: Number,
    required: true
  },
  empresa: {
    type: Schema.Types.ObjectId,
    ref: 'Empresa',
    required: true
  },
  esEncargadoPersonal: {
    type: Boolean,
    default: false
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
 * Modelo de Mongoose para Empleado
 * @type {Model<EmpleadoSchema>}
 */
module.exports = mongoose.model('Empleado', empleadoSchema);