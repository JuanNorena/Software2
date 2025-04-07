/**
 * @fileoverview Utilidad para probar la conexión a MongoDB
 * @author Juan Sebastian Noreña
 * @version 1.0.1
 */

// Cargar variables de entorno
require('dotenv').config();

const mongoose = require('mongoose');

// Usar explícitamente 127.0.0.1 para IPv4
const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/personalpay';

// Opciones para la conexión
const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  family: 4 // Forzar a usar IPv4
};

console.log(`Intentando conectar a: ${uri}`);

// Intentar conectar
mongoose.connect(uri, options)
  .then(() => {
    console.log('✅ Conexión exitosa a MongoDB');
    console.log('Información de conexión:');
    console.log(`- Host: ${mongoose.connection.host}`);
    console.log(`- Puerto: ${mongoose.connection.port}`);
    console.log(`- Base de datos: ${mongoose.connection.name}`);
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error al conectar a MongoDB:');
    console.error(`- Mensaje de error: ${err.message}`);
    if (err.name === 'MongooseServerSelectionError') {
      console.error('- El servidor MongoDB podría no estar ejecutándose.');
      console.error('  Verifica que el servicio MongoDB esté activo usando:');
      console.error('  • Windows: services.msc (buscar MongoDB)');
      console.error('  • Linux/Mac: sudo systemctl status mongodb');
    }
    process.exit(1);
  });
