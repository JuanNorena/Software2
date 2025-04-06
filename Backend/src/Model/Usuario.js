/**
 * @fileoverview Modelo de datos para los usuarios del sistema
 * @author Juan Sebastian Noreña
 * @version 1.0.1
 */

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Schema = mongoose.Schema;

/**
 * Esquema de Mongoose para el modelo de Usuario
 * @typedef {Object} UsuarioSchema
 * @property {string} username - Nombre de usuario único
 * @property {string} password - Contraseña encriptada
 * @property {string} rol - Rol del usuario (ADMIN, EMPLEADO)
 * @property {ObjectId} [empleado] - Referencia al empleado asociado (si corresponde)
 * @property {Date} fechaCreacion - Fecha de creación del registro
 * @property {Date} ultimoAcceso - Fecha del último acceso
 * @property {boolean} activo - Indica si el usuario está activo
 */
const usuarioSchema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  rol: {
    type: String,
    enum: ['ADMIN', 'EMPLEADO'],
    required: true
  },
  accountNonExpired: {
    type: Boolean,
    default: true
  },
  accountNonLocked: {
    type: Boolean,
    default: true
  },
  credentialsNonExpired: {
    type: Boolean,
    default: true
  },
  enabled: {
    type: Boolean,
    default: true
  },
  empleado: {
    type: Schema.Types.ObjectId,
    ref: 'Empleado',
    required: function() {
      return this.rol === 'EMPLEADO';
    }
  },
  fechaCreacion: {
    type: Date,
    default: Date.now
  },
  ultimoAcceso: {
    type: Date
  },
  activo: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  versionKey: false
});

/**
 * Método pre-save para encriptar la contraseña antes de guardar
 * @function
 * @name preSave
 * @memberof UsuarioSchema
 */
usuarioSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

/**
 * Método para comparar contraseñas
 * @function
 * @name comparePassword
 * @memberof UsuarioSchema.methods
 * @param {string} candidatePassword - Contraseña a comparar
 * @returns {Promise<boolean>} Verdadero si la contraseña coincide
 */
usuarioSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

/**
 * Modelo de Mongoose para Usuario
 * @type {Model<UsuarioSchema>}
 */
module.exports = mongoose.model('Usuario', usuarioSchema);