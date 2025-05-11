/**
 * @fileoverview Pruebas de integración para el servicio de autenticación (AuthService)
 * @version 1.0.0
 */
const mongoose = require('mongoose');
const AuthService = require('../service/AuthService');
const Usuario = require('../Model/Usuario');
const Empleado = require('../Model/Empleado');
const { randomUUID } = require('crypto');

/**
 * @description Suite de pruebas de integración para verificar la funcionalidad del servicio de autenticación
 */
describe('AuthService (integración)', () => {
  let connection;
  let empleado;
  let usuario;

  /**
   * @description Configuración inicial que se ejecuta antes de todas las pruebas
   * Se conecta a la base de datos y crea un empleado y usuario de prueba
   */
  beforeAll(async () => {
    // Conectar a la base de datos de pruebas
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/personalpay', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    // Crear un empleado aleatorio
    empleado = await Empleado.create({
      nombre: 'Test User',
      cargo: 'Tester',
      fechaNacimiento: new Date('1990-01-01'),
      rut: 'TST' + Math.floor(Math.random() * 1000000),
      sueldoBase: 1000000,
      empresa: null
    });
    // Crear un usuario aleatorio
    usuario = await Usuario.create({
      username: 'user_' + randomUUID().slice(0, 8),
      password: 'Test1234!',
      rol: 'EMPLEADO',
      empleado: empleado._id,
      enabled: true
    });
  });

  /**
   * @description Limpieza después de todas las pruebas
   * Elimina el usuario y empleado de prueba y cierra la conexión a la base de datos
   */
  afterAll(async () => {
    await Usuario.deleteOne({ _id: usuario._id });
    await Empleado.deleteOne({ _id: empleado._id });
    await mongoose.connection.close();
  });

  /**
   * @description Verifica que el inicio de sesión sea exitoso con credenciales correctas
   * @test Espera recibir un token y datos de usuario cuando las credenciales son válidas
   */
  test('login exitoso con credenciales válidas', async () => {
    const result = await AuthService.login(usuario.username, 'Test1234!');
    expect(result).toHaveProperty('token');
    expect(result.usuario.username).toBe(usuario.username);
  });

  /**
   * @description Verifica que el inicio de sesión falle con contraseña incorrecta
   * @test Espera que se lance un error con mensaje específico cuando la contraseña es inválida
   */
  test('login falla con contraseña incorrecta', async () => {
    await expect(AuthService.login(usuario.username, 'incorrecta')).rejects.toThrow('Credenciales inválidas');
  });

  /**
   * @description Verifica que la función verificarRol devuelva true cuando el usuario tiene el rol adecuado
   * @test Comprueba que el método identifique correctamente cuando un usuario tiene el rol requerido
   */
  test('verificarRol retorna true para rol correcto', () => {
    const user = { rol: 'ADMIN' };
    expect(AuthService.verificarRol(user, 'ADMIN')).toBe(true);
    expect(AuthService.verificarRol(user, ['ADMIN', 'EMPLEADO'])).toBe(true);
  });

  /**
   * @description Verifica que la función verificarRol devuelva false cuando el usuario no tiene el rol requerido
   * @test Comprueba que el método identifique correctamente cuando un usuario no tiene permiso
   */
  test('verificarRol retorna false para rol incorrecto', () => {
    const user = { rol: 'EMPLEADO' };
    expect(AuthService.verificarRol(user, 'ADMIN')).toBe(false);
    expect(AuthService.verificarRol(user, ['ADMIN'])).toBe(false);
  });
});