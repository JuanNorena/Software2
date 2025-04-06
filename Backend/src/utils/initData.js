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
      
      // Crear usuario administrador
      const usuarioAdmin = new Usuario({
        username: "admin",
        password: await bcrypt.hash("admin123", 10),
        rol: "ADMIN"
      });
      
      await usuarioAdmin.save();
      console.log('✅ Usuario administrador creado (usuario: admin, contraseña: admin123)');
    } else {
      const empresa = await Empresa.findOne();
      console.log('✅ Empresa ya existe con ID:', empresa._id);
      console.log('Datos de la empresa para pruebas:');
      console.log(JSON.stringify(empresa, null, 2));
    }
  } catch (error) {
    console.error('❌ Error al inicializar datos:', error);
  }
}

module.exports = { initData };
