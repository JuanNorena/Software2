/**
 * @fileoverview Modelo de datos para los pagos de contabilidad provisional en el sistema
 * @author Juan Sebastian Noreña
 * @version 1.0.0
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Esquema de Mongoose para el modelo de Pago de Contabilidad Provisional
 * @typedef {Object} PagoContabilidadProvisionalSchema
 * @property {ObjectId} liquidacionSueldo - Referencia a la liquidación de sueldo asociada al pago
 * @property {Date} fechaPago - Fecha en que se realizó el pago
 * @property {string} periodoCorrespondiente - Periodo al que corresponde el pago
 * @property {number} totalPago - Monto total del pago
 * @property {number} totalPagoPension - Monto del pago destinado a pensión
 * @property {number} totalPagoSalud - Monto del pago destinado a salud
 * @property {Date} fechaCreacion - Fecha de creación del registro
 */
const pagoContabilidadProvisionalSchema = new Schema({
  liquidacionSueldo: {
    type: Schema.Types.ObjectId,
    ref: 'LiquidacionSueldo',
    required: true
  },
  fechaPago: {
    type: Date,
    required: true
  },
  periodoCorrespondiente: {
    type: String,
    required: true,
    trim: true
  },
  totalPago: {
    type: Number,
    required: true
  },
  totalPagoPension: {
    type: Number,
    required: true
  },
  totalPagoSalud: {
    type: Number,
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
 * Modelo de Mongoose para Pago de Contabilidad Provisional
 * @type {Model<PagoContabilidadProvisionalSchema>}
 */
module.exports = mongoose.model('PagoContabilidadProvisional', pagoContabilidadProvisionalSchema);