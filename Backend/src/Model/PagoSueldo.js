/**
 * @fileoverview Modelo de datos para los pagos de sueldo en el sistema
 * @author Juan Sebastian Noreña
 * @version 1.0.0
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Esquema de Mongoose para el modelo de Pago de Sueldo
 * @typedef {Object} PagoSueldoSchema
 * @property {ObjectId} liquidacionSueldo - Referencia a la liquidación de sueldo asociada al pago
 * @property {string} banco - Nombre del banco donde se realiza el pago
 * @property {Date} fecha - Fecha en que se realizó el pago
 * @property {string} metodoPago - Método utilizado para el pago (cheque o depósito)
 * @property {number} monto - Monto total del pago
 * @property {Date} fechaCreacion - Fecha de creación del registro
 */
const pagoSueldoSchema = new Schema({
  liquidacionSueldo: {
    type: Schema.Types.ObjectId,
    ref: 'LiquidacionSueldo',
    required: true
  },
  banco: {
    type: String,
    required: true,
    trim: true
  },
  fecha: {
    type: Date,
    required: true
  },
  metodoPago: {
    type: String,
    enum: ['cheque', 'deposito'],
    required: true
  },
  monto: {
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
 * Modelo de Mongoose para Pago de Sueldo
 * @type {Model<PagoSueldoSchema>}
 */
module.exports = mongoose.model('PagoSueldo', pagoSueldoSchema);