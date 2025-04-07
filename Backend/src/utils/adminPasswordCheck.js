/**
 * @fileoverview Herramienta de diagnóstico para verificar la contraseña del usuario admin
 * @author Juan Sebastian Noreña
 * @version 1.0.0
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Usuario = require('../Model/Usuario');

async function checkAdminPassword() {
  try {
    // Configurar conexión a MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/personalpay', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      family: 4
    });
    
    console.log('✅ Conexión a MongoDB establecida');
    
    // Buscar el usuario admin
    const adminUser = await Usuario.findOne({ username: 'admin' });
    
    if (!adminUser) {
      console.log('❌ No se encontró usuario admin en la base de datos');
      return;
    }
    
    console.log('✅ Usuario admin encontrado');
    console.log(`- ID: ${adminUser._id}`);
    console.log(`- Rol: ${adminUser.rol}`);
    console.log(`- Hash de contraseña: ${adminUser.password.substring(0, 20)}...`);
    
    // Verificar si el hash comienza con $2 (formato bcrypt)
    if (!adminUser.password.startsWith('$2')) {
      console.log('❌ La contraseña NO está hasheada con bcrypt');
    } else {
      console.log('✅ Formato de hash bcrypt correcto');
      
      // Intentar verificar con la contraseña esperada
      const expectedPassword = process.env.DEFAULT_ADMIN_PASSWORD || '123admin';
      const isMatch = await bcrypt.compare(expectedPassword, adminUser.password);
      
      if (isMatch) {
        console.log(`✅ La contraseña "${expectedPassword}" es VÁLIDA`);
      } else {
        console.log(`❌ La contraseña "${expectedPassword}" es INVÁLIDA`);
        
        // Reparar contraseña si se especifica
        if (process.argv.includes('--repair')) {
          console.log('🔧 Reparando contraseña de administrador...');
          
          // Actualizar con un nuevo hash
          adminUser.password = await bcrypt.hash(expectedPassword, 10);
          await adminUser.save();
          
          console.log('✅ Contraseña de administrador reparada correctamente');
        } else {
          console.log('Para reparar la contraseña, ejecute: node src/utils/adminPasswordCheck.js --repair');
        }
      }
    }
  } catch (error) {
    console.error('❌ Error durante la verificación:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Desconexión de MongoDB completada');
  }
}

// Ejecutar la verificación
checkAdminPassword().catch(console.error);
