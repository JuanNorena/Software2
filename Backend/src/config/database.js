/**
 * @fileoverview Clase para manejar la conexión a MongoDB
 * @author Juan Sebastian Noreña
 * @version 1.0.0
 */

const mongoose = require('mongoose');

/**
 * Clase que gestiona la conexión a la base de datos MongoDB
 * @class Database
 * @description Proporciona métodos para conectar, desconectar y obtener la conexión a MongoDB
 */
class Database {
  /**
   * Crea una instancia de la clase Database
   * @constructor
   */
  constructor() {
    /**
     * URI de conexión a MongoDB
     * @type {string}
     */
    this.mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/personalpay';
    
    /**
     * Opciones de configuración para la conexión a MongoDB
     * @type {Object}
     */
    this.options = {
      useNewUrlParser: true,
      useUnifiedTopology: true
    };
  }

  /**
   * Conecta a la base de datos MongoDB
   * @returns {Promise<void>} Promesa de conexión
   */
  connect() {
    return new Promise((resolve, reject) => {
      mongoose.connect(this.mongoURI, this.options)
        .then(() => {
          console.log('Conexión a MongoDB establecida correctamente');
          resolve();
        })
        .catch(err => {
          console.error('Error al conectar a MongoDB:', err);
          reject(err);
        });
    });
  }

  /**
   * Cierra la conexión a la base de datos
   * @returns {Promise<void>} Promesa de desconexión
   */
  disconnect() {
    return new Promise((resolve, reject) => {
      mongoose.disconnect()
        .then(() => {
          console.log('Conexión a MongoDB cerrada correctamente');
          resolve();
        })
        .catch(err => {
          console.error('Error al cerrar la conexión a MongoDB:', err);
          reject(err);
        });
    });
  }

  /**
   * Obtiene la instancia de conexión de mongoose
   * @returns {Object} Instancia de mongoose
   */
  getConnection() {
    return mongoose;
  }
}

module.exports = new Database();