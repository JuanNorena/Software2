/**
 * @fileoverview Pruebas de integración para el servicio de gestión de asistencias
 * @version 1.0.0
 */

const mongoose = require('mongoose');
const AsistenciaService = require('../service/AsistenciaService');
const Empleado = require('../Model/Empleado');
const RegistroAsistencia = require('../Model/RegistroAsistencia');
const { randomUUID } = require('crypto');

/**
 * @description Suite de pruebas de integración para el servicio de asistencia
 * Verifica la correcta funcionalidad de registro de entradas, salidas y consulta de historial
 */
describe('AsistenciaService (integración)', () => {
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
      nombre: 'Empleado Test',
      cargo: 'Tester',
      fechaNacimiento: new Date('1995-01-01'),
      rut: 'AST' + Math.floor(Math.random() * 1000000),
      sueldoBase: 900000,
      empresa: null
    });
  });

  /**
   * @description Limpieza después de todas las pruebas
   * Elimina los registros de prueba y cierra la conexión a la base de datos
   */
  afterAll(async () => {
    await RegistroAsistencia.deleteMany({ empleado: empleado._id });
    await Empleado.deleteOne({ _id: empleado._id });
    await mongoose.connection.close();
  });

  /**
   * @description Prueba la funcionalidad de registro de entrada
   * @test Verifica que se cree un registro de asistencia con el ID del empleado y hora de entrada
   */
  test('registrarEntrada crea un registro de asistencia', async () => {
    const registro = await AsistenciaService.registrarEntrada(empleado._id);
    expect(registro.empleado.toString()).toBe(empleado._id.toString());
    expect(registro.horaEntrada).toBeDefined();
  });

  /**
   * @description Prueba la funcionalidad de registro de salida
   * @test Verifica que se actualice el registro con la hora de salida y calcule las horas trabajadas
   */
  test('registrarSalida actualiza el registro de asistencia', async () => {
    await AsistenciaService.registrarEntrada(empleado._id);
    const registro = await AsistenciaService.registrarSalida(empleado._id);
    expect(registro.horaSalida).toBeDefined();
    expect(registro.totalHorasTrabajadas).toBeGreaterThanOrEqual(0);
  });

  /**
   * @description Prueba la funcionalidad de consulta de historial
   * @test Verifica que se obtenga un array con los registros de asistencia del empleado
   */
  test('obtenerHistorialAsistencia retorna registros', async () => {
    const historial = await AsistenciaService.obtenerHistorialAsistencia(empleado._id);
    expect(Array.isArray(historial)).toBe(true);
    expect(historial.length).toBeGreaterThan(0);
  });
});