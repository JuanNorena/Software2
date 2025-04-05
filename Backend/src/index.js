/**
 * @fileoverview Punto de entrada principal de la API de PersonalPay
 * @author Juan Sebastian Noreña
 * @version 1.0.0
 */

// Cargar variables de entorno
require('dotenv').config();

// Configurar variable de entorno JWT_SECRET si no existe
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'personalpay_secret_key';
  console.warn('ADVERTENCIA: JWT_SECRET no está definido en el archivo .env. Se está utilizando una clave predeterminada.');
}

const express = require('express');
const cors = require('cors');

// Importar rutas
const empresaRoutes = require('./Controller/EmpresaController');
const empleadoRoutes = require('./Controller/EmpleadoController');
const registroAsistenciaRoutes = require('./Controller/RegistroAsistenciaController');
const liquidacionSueldoRoutes = require('./Controller/LiquidacionSueldoController');
const pagoSueldoRoutes = require('./Controller/PagoSueldoController');
const pagoContabilidadProvisionalRoutes = require('./Controller/PagoContabilidadProvisionalController');
const descuentoRoutes = require('./Controller/DescuentoController');
const authRoutes = require('./Controller/AuthController');

const app = express();
const PORT = process.env.PORT || 3000;

/**
 * Configuración de middleware
 */
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:4200',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * Conexión a MongoDB usando la clase Database
 */
const database = require('./config/database');
database.connect()
  .then(() => console.log('Conexión a MongoDB establecida usando la clase Database'))
  .catch(err => console.error('Error al conectar a MongoDB:', err));

/**
 * Configuración de rutas de la API
 */
app.use('/api/auth', authRoutes);
app.use('/api/empresas', empresaRoutes);
app.use('/api/empleados', empleadoRoutes);
app.use('/api/registros-asistencia', registroAsistenciaRoutes);
app.use('/api/liquidaciones-sueldo', liquidacionSueldoRoutes);
app.use('/api/pagos-sueldo', pagoSueldoRoutes);
app.use('/api/pagos-contabilidad-provisional', pagoContabilidadProvisionalRoutes);
app.use('/api/descuentos', descuentoRoutes);

/**
 * Ruta de prueba para verificar el funcionamiento de la API
 * @route GET /
 * @returns {string} Mensaje de confirmación
 */
app.get('/', (req, res) => {
  res.send('API de PersonalPay funcionando correctamente');
});

/**
 * Iniciar el servidor
 */
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});