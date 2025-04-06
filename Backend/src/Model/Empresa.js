/**
 * @fileoverview Modelo de datos para las empresas en el sistema
 * @author Juan Sebastian Noreña
 * @version 1.0.0
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Esquema de Mongoose para el modelo de Empresa
 * @typedef {Object} EmpresaSchema
 * @property {string} nombre - Nombre de la empresa
 * @property {string} rut - RUT de la empresa
 * @property {string} direccion - Dirección física de la empresa
 * @property {string} telefono - Teléfono de contacto
 * @property {string} email - Correo electrónico de contacto
 * @property {Date} fechaCreacion - Fecha de creación del registro
 */
const empresaSchema = new Schema({
  nombre: {
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
  direccion: {
    type: String,
    required: true,
    trim: true
  },
  telefono: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
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
 * Modelo de Mongoose para Empresa
 * @type {Model<EmpresaSchema>}
 */
module.exports = mongoose.model('Empresa', empresaSchema);