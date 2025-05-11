/**
 * @fileoverview Pruebas de integración para el servicio de envío de correos electrónicos
 * @version 1.0.0
 */
const mongoose = require('mongoose');
const EmailService = require('../service/EmailService');

/**
 * @description Suite de pruebas de integración para el servicio de correo electrónico
 * Verifica la funcionalidad de envío de notificaciones por email
 */
describe('EmailService (integración)', () => {
  /**
   * @description Configuración inicial antes de ejecutar todas las pruebas
   * Establece la conexión con la base de datos MongoDB
   */
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/personalpay', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
  });

  /**
   * @description Limpieza después de ejecutar todas las pruebas
   * Cierra la conexión con la base de datos MongoDB
   */
  afterAll(async () => {
    await mongoose.connection.close();
  });

  /**
   * @description Verifica que se pueda enviar un correo de confirmación de cambio de contraseña
   * @test Comprueba que el método de envío de correo responda adecuadamente sin errores
   */
  test('enviarConfirmacionCambioPassword responde sin error', async () => {
    // Usar un correo ficticio, el método debe manejar el envío simulado o real
    const result = await EmailService.enviarConfirmacionCambioPassword('test@example.com');
    expect(result).toBeDefined();
  });
});