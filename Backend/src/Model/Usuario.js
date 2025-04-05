/**
 * @fileoverview Modelo de datos para los usuarios del sistema
 * @author Juan Sebastian Noreña
 * @version 1.0.0
 */

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Schema = mongoose.Schema;

/**
 * Esquema de Mongoose para el modelo de Usuario
 * @typedef {Object} UsuarioSchema
 * @property {string} username - Nombre de usuario para iniciar sesión
 * @property {string} password - Contraseña del usuario (almacenada con hash)
 * @property {string} rol - Rol del usuario (ADMIN o EMPLEADO)
 * @property {boolean} accountNonExpired - Indica si la cuenta no ha expirado
 * @property {boolean} accountNonLocked - Indica si la cuenta no está bloqueada
 * @property {boolean} credentialsNonExpired - Indica si las credenciales no han expirado
 * @property {boolean} enabled - Indica si la cuenta está habilitada
 * @property {ObjectId} empleado - Referencia al empleado asociado (solo para rol EMPLEADO)
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
  }
}, {
  timestamps: true,
  versionKey: false
});

/**
 * Método para comparar contraseñas
 * @param {string} candidatePassword - Contraseña a comparar
 * @returns {Promise<boolean>} - Resultado de la comparación
 */
usuarioSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

/**
 * Middleware para hashear la contraseña antes de guardar
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
 * Modelo de Mongoose para Usuario
 * @type {Model<UsuarioSchema>}
 */
module.exports = mongoose.model('Usuario', usuarioSchema);