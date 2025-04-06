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
  email: {
    type: String,
    required: false, // Cambiar de true a false para hacer el campo opcional
    unique: true,
    sparse: true, // Permite múltiples documentos sin email pero mantiene unicidad entre los que sí lo tienen
    trim: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Por favor ingrese un email válido']
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
  intentosFallidos: {
    type: Number,
    default: 0
  },
  fechaBloqueo: {
    type: Date,
    default: null
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
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
  // Solo hashear la contraseña si ha sido modificada
  if (!this.isModified('password')) return next();
  
  try {
    console.log('Hasheando contraseña para usuario:', this.username);
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    console.log('Contraseña hasheada correctamente');
    next();
  } catch (error) {
    console.error('Error al hashear contraseña:', error);
    next(error);
  }
});

/**
 * Compara la contraseña proporcionada con la contraseña hasheada almacenada del usuario
 * @param {string} candidatePassword - Contraseña a comparar
 * @returns {Promise<boolean>} Verdadero si la contraseña coincide
 */
usuarioSchema.methods.comparePassword = async function(candidatePassword) {
  console.log('Iniciando comparación de contraseñas...');
  try {
    console.log('Comparando contraseña');
    
    // Asegurarse de que la contraseña candidata sea una cadena
    if (typeof candidatePassword !== 'string') {
      console.error('La contraseña proporcionada no es una cadena, tipo:', typeof candidatePassword);
      return false;
    }
    
    // Verificar que la contraseña almacenada exista
    if (!this.password) {
      console.error('No hay contraseña almacenada para este usuario');
      return false;
    }

    // Verificar que la contraseña esté hasheada correctamente
    if (!this.password.startsWith('$2')) {
      console.error('La contraseña almacenada no está hasheada correctamente:', this.password.substring(0, 3));
      
      // En desarrollo, podemos intentar una comparación directa como fallback
      if (process.env.NODE_ENV === 'development') {
        console.warn('ADVERTENCIA: Intentando comparación directa de contraseña en modo desarrollo');
        return candidatePassword === this.password;
      }
      return false;
    }
    
    // Comparar contraseñas con bcrypt
    console.log(this.password);
    console.log(candidatePassword);
    try {
      const isMatch = await bcrypt.compare(candidatePassword, this.password);
      console.log(`Resultado de la comparación bcrypt: ${isMatch}`);
      return isMatch;
    } catch (bcryptError) {
      console.error('Error específico de bcrypt al comparar:', bcryptError);
      return false;
    }
  } catch (error) {
    console.error('Error general al comparar contraseñas:', error);
    return false;
  }
};

/**
 * Modelo de Mongoose para Usuario
 * @type {Model<UsuarioSchema>}
 */
module.exports = mongoose.model('Usuario', usuarioSchema);