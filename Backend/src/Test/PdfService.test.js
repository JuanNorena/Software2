/**
 * @fileoverview Pruebas de integración para el servicio de generación de documentos PDF
 * @version 1.0.0
 */
const mongoose = require('mongoose');
const PdfService = require('../service/PdfService');

/**
 * @description Suite de pruebas de integración para el servicio de generación de PDF
 * Verifica la existencia y funcionalidad básica del servicio
 */
describe('PdfService (integración)', () => {
  /**
   * @description Configuración inicial antes de todas las pruebas
   * Establece conexión a la base de datos MongoDB
   */
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/personalpay', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
  });

  /**
   * @description Limpieza después de todas las pruebas
   * Cierra la conexión con la base de datos MongoDB
   */
  afterAll(async () => {
    await mongoose.connection.close();
  });

  /**
   * @description Prueba básica para verificar que el servicio está definido
   * @test Comprueba que el objeto PdfService existe en el sistema
   */
  test('PdfService está definido', () => {
    expect(PdfService).toBeDefined();
  });
  // Agrega aquí más pruebas si tienes métodos públicos en PdfService
});