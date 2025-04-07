/**
 * @fileoverview Script para inicializar datos de prueba en la base de datos
 * @author Juan Sebastian Noreña
 * @version 1.0.1
 */

const Empresa = require('../Model/Empresa');
const Usuario = require('../Model/Usuario');
const bcrypt = require('bcrypt');

/**
 * Inicializa los datos básicos para pruebas
 */
async function initData() {
  try {
    console.log('Verificando datos iniciales...');
    
    // Verificar si ya existe una empresa
    const empresasCount = await Empresa.countDocuments();
    
    // Verificar si ya existe el usuario admin
    const adminExists = await Usuario.findOne({ username: 'admin' });
    
    if (adminExists) {
      console.log('✅ Usuario administrador ya existe');
      
      // Actualizar la contraseña del admin para asegurar que es la esperada
      if (process.env.NODE_ENV === 'development') {
        // Solo en desarrollo, actualizar la contraseña para pruebas
        adminExists.password = await bcrypt.hash("123admin", 10);
        await adminExists.save();
        console.log('✅ Contraseña de administrador actualizada a "123admin" para pruebas');
      }
    }
    
    if (empresasCount === 0) {
      // Crear empresa de prueba
      const empresaPrueba = new Empresa({
        nombre: "PersonalPay",
        rut: "76543210-8",
        direccion: "Av. Principal 123, Santiago",
        telefono: "+56912345678",
        email: "contacto@techsolutions.cl"
      });
      
      const empresaGuardada = await empresaPrueba.save();
      console.log('✅ Empresa de prueba creada con ID:', empresaGuardada._id);
      console.log('Datos de la empresa:');
      console.log(JSON.stringify(empresaGuardada, null, 2));
      
      // Crear usuario administrador con la contraseña esperada "123admin"
      if (!adminExists) {
        const usuarioAdmin = new Usuario({
          username: "admin",
          email: "admin@personalpay.com", 
          password: await bcrypt.hash("123admin", 10),
          rol: "ADMIN",
          enabled: true,
          accountNonExpired: true,
          accountNonLocked: true,
          credentialsNonExpired: true
        });
        
        await usuarioAdmin.save();
        console.log('✅ Usuario administrador creado (usuario: admin, contraseña: 123admin)');
      }
    } else {
      const empresa = await Empresa.findOne();
      console.log('✅ Empresa ya existe con ID:', empresa._id);
    }
  } catch (error) {
    console.error('❌ Error al inicializar datos:', error);
  }
}

module.exports = { initData };
