/**
 * @fileoverview Modelo de datos para las liquidaciones de sueldo en el sistema
 * @author Juan Sebastian Noreña
 * @version 1.0.0
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Esquema de Mongoose para el modelo de Liquidación de Sueldo
 * @typedef {Object} LiquidacionSueldoSchema
 * @property {ObjectId} empleado - Referencia al empleado asociado a la liquidación
 * @property {string} estado - Estado de la liquidación (emitido o pagado)
 * @property {Date} fecha - Fecha de la liquidación
 * @property {number} sueldoBruto - Monto del sueldo bruto
 * @property {number} sueldoNeto - Monto del sueldo neto (después de descuentos)
 * @property {number} totalDescuentos - Suma total de los descuentos aplicados
 * @property {Date} fechaCreacion - Fecha de creación del registro
 */
const liquidacionSueldoSchema = new Schema({
  empleado: {
    type: Schema.Types.ObjectId,
    ref: 'Empleado',
    required: true
  },
  estado: {
    type: String,
    enum: ['emitido', 'pagado'],
    default: 'emitido',
    required: true
  },
  fecha: {
    type: Date,
    required: true
  },
  sueldoBruto: {
    type: Number,
    required: true
  },
  sueldoNeto: {
    type: Number,
    required: true
  },
  totalDescuentos: {
    type: Number,
    required: true,
    default: 0
  },
  fechaCreacion: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  versionKey: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

/**
 * Campo virtual para acceder a los descuentos asociados a la liquidación
 * Permite obtener todos los descuentos relacionados con esta liquidación
 */
liquidacionSueldoSchema.virtual('descuentos', {
  ref: 'Descuento',
  localField: '_id',
  foreignField: 'liquidacionSueldo'
});

/**
 * Modelo de Mongoose para Liquidación de Sueldo
 * @type {Model<LiquidacionSueldoSchema>}
 */
module.exports = mongoose.model('LiquidacionSueldo', liquidacionSueldoSchema);