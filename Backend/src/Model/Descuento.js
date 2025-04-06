/**
 * @fileoverview Modelo de datos para los descuentos aplicados a las liquidaciones de sueldo
 * @author Juan Sebastian Noreña
 * @version 1.0.1
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Esquema de Mongoose para el modelo de Descuento
 * @typedef {Object} DescuentoSchema
 * @property {string} concepto - Concepto o razón del descuento aplicado
 * @property {number} valor - Valor monetario del descuento
 * @property {ObjectId} liquidacionSueldo - Referencia a la liquidación de sueldo asociada
 * @property {Date} fechaCreacion - Fecha de creación del registro
 */
const descuentoSchema = new Schema({
  concepto: {
    type: String,
    required: true,
    trim: true
  },
  valor: {
    type: Number,
    required: true
  },
  liquidacionSueldo: {
    type: Schema.Types.ObjectId,
    ref: 'LiquidacionSueldo',
    required: true
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
 * Modelo de Mongoose para Descuento
 * @type {Model<DescuentoSchema>}
 */
module.exports = mongoose.model('Descuento', descuentoSchema);