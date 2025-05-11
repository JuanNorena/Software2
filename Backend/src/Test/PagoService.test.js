/**
 * @fileoverview Pruebas de integración para el servicio de pagos de sueldos
 * @version 1.0.0
 */
const mongoose = require('mongoose');
const PagoService = require('../service/PagoService');
const Empleado = require('../Model/Empleado');
const LiquidacionSueldo = require('../Model/LiquidacionSueldo');
const PagoSueldo = require('../Model/PagoSueldo');
const { randomUUID } = require('crypto');

/**
 * @description Suite de pruebas de integración para el servicio de pagos
 * Verifica el correcto procesamiento de pagos a partir de liquidaciones aprobadas
 */
describe('PagoService (integración)', () => {
  let empleado;
  let liquidacion;

  /**
   * @description Configuración inicial antes de todas las pruebas
   * Establece conexión a la base de datos y crea un empleado y una liquidación de prueba
   */
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/personalpay', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    empleado = await Empleado.create({
      nombre: 'Empleado Pago',
      cargo: 'Tester',
      fechaNacimiento: new Date('1993-01-01'),
      rut: 'PG' + Math.floor(Math.random() * 1000000),
      sueldoBase: 1000000,
      empresa: null
    });
    // Crear liquidación aprobada
    liquidacion = await LiquidacionSueldo.create({
      empleado: empleado._id,
      fecha: new Date(),
      sueldoBruto: 1000000,
      sueldoNeto: 900000,
      totalDescuentos: 100000,
      estado: 'aprobado'
    });
  });

  /**
   * @description Limpieza después de todas las pruebas
   * Elimina los registros de pago, liquidación y empleado de prueba, y cierra la conexión a la base de datos
   */
  afterAll(async () => {
    await PagoSueldo.deleteMany({ liquidacionSueldo: liquidacion._id });
    await LiquidacionSueldo.deleteOne({ _id: liquidacion._id });
    await Empleado.deleteOne({ _id: empleado._id });
    await mongoose.connection.close();
  });

  /**
   * @description Prueba el procesamiento de pago de una liquidación de sueldo
   * @test Verifica que el pago se realice correctamente, actualizando el estado de la liquidación
   * y guardando la información del método de pago utilizado
   */
  test('procesarPagoLiquidacion realiza el pago', async () => {
    const datosPago = { metodoPago: 'deposito', banco: 'BancoTest' };
    const result = await PagoService.procesarPagoLiquidacion(liquidacion._id, datosPago);
    expect(result.liquidacion.estado).toBe('pagado');
    expect(result.pagoSueldo.banco).toBe('BancoTest');
    expect(result.pagoSueldo.metodoPago).toBe('deposito');
  });
});