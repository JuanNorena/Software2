/**
 * @fileoverview Pruebas de integración para el servicio de notificaciones
 * @version 1.0.0
 */
const mongoose = require('mongoose');
const NotificacionService = require('../service/NotificacionService');
const Empleado = require('../Model/Empleado');
const { randomUUID } = require('crypto');

/**
 * @description Suite de pruebas de integración para el servicio de notificaciones
 * Verifica la correcta funcionalidad del envío de notificaciones a empleados
 */
describe('NotificacionService (integración)', () => {
  let empleado;

  /**
   * @description Configuración inicial antes de todas las pruebas
   * Establece conexión a la base de datos y crea un empleado de prueba
   */
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/personalpay', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    empleado = await Empleado.create({
      nombre: 'Empleado Notif',
      cargo: 'Tester',
      fechaNacimiento: new Date('1994-01-01'),
      rut: 'NT' + Math.floor(Math.random() * 1000000),
      sueldoBase: 800000,
      empresa: null
    });
  });

  /**
   * @description Limpieza después de todas las pruebas
   * Elimina el empleado de prueba y cierra la conexión a la base de datos
   */
  afterAll(async () => {
    await Empleado.deleteOne({ _id: empleado._id });
    await mongoose.connection.close();
  });

  /**
   * @description Prueba la funcionalidad de envío de notificaciones
   * @test Verifica que el método de envío de notificaciones retorne el estado correcto
   * y mantenga la integridad de los datos enviados
   */
  test('enviarNotificacion retorna entregada true', async () => {
    const result = await NotificacionService.enviarNotificacion(
      empleado._id,
      'test',
      'Mensaje de prueba',
      { extra: 'info' }
    );
    expect(result.entregada).toBe(true);
    expect(result.tipo).toBe('test');
    expect(result.mensaje).toBe('Mensaje de prueba');
  });
});