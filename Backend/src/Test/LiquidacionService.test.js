/**
 * @fileoverview Pruebas de integración para el servicio de liquidación de sueldos
 * @version 1.0.0
 */
const mongoose = require('mongoose');
const LiquidacionService = require('../service/LiquidacionService');
const Empleado = require('../Model/Empleado');
const RegistroAsistencia = require('../Model/RegistroAsistencia');
const LiquidacionSueldo = require('../Model/LiquidacionSueldo');
const { randomUUID } = require('crypto');

/**
 * @description Suite de pruebas de integración para el servicio de liquidación de sueldos
 * Verifica la correcta generación y consulta de liquidaciones de sueldo
 */
describe('LiquidacionService (integración)', () => {
  let empleado;
  let liquidacion;

  /**
   * @description Configuración inicial antes de todas las pruebas
   * Establece conexión a la base de datos, crea un empleado de prueba y un registro de asistencia
   */
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/personalpay', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    empleado = await Empleado.create({
      nombre: 'Empleado Liquidacion',
      cargo: 'Tester',
      fechaNacimiento: new Date('1992-01-01'),
      rut: 'LQ' + Math.floor(Math.random() * 1000000),
      sueldoBase: 950000,
      empresa: null
    });
    // Crear un registro de asistencia para el mes actual
    await RegistroAsistencia.create({
      empleado: empleado._id,
      fecha: new Date(),
      horaEntrada: '08:00:00',
      horaSalida: '16:00:00',
      totalHorasTrabajadas: 8
    });
  });

  /**
   * @description Limpieza después de todas las pruebas
   * Elimina las liquidaciones, registros de asistencia y empleado creados durante la prueba
   */
  afterAll(async () => {
    await LiquidacionSueldo.deleteMany({ empleado: empleado._id });
    await RegistroAsistencia.deleteMany({ empleado: empleado._id });
    await Empleado.deleteOne({ _id: empleado._id });
    await mongoose.connection.close();
  });

  /**
   * @description Prueba la generación de una liquidación de sueldo
   * @test Verifica que se cree correctamente una liquidación con los datos del empleado y valores calculados
   */
  test('generarLiquidacion crea una liquidación', async () => {
    const fecha = new Date();
    const mes = fecha.getMonth() + 1;
    const anio = fecha.getFullYear();
    liquidacion = await LiquidacionService.generarLiquidacion(empleado._id, mes, anio);
    expect(liquidacion.empleado.toString()).toBe(empleado._id.toString());
    expect(liquidacion.sueldoBruto).toBeGreaterThan(0);
    expect(liquidacion.sueldoNeto).toBeGreaterThan(0);
  });

  /**
   * @description Prueba la verificación de existencia de liquidaciones
   * @test Comprueba que el método detecte correctamente si existe una liquidación para un empleado en un período específico
   */
  test('verificarLiquidacionExistente retorna true si existe', async () => {
    const fecha = new Date();
    const mes = fecha.getMonth() + 1;
    const anio = fecha.getFullYear();
    const existe = await LiquidacionService.verificarLiquidacionExistente(empleado._id, mes, anio);
    expect(existe).toBe(true);
  });
});