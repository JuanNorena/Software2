/**
 * @fileoverview Controlador para gestionar las operaciones CRUD de empresas
 * @author Juan Sebastian Noreña
 * @version 1.0.0
 */

/**
 * @fileoverview Controlador para gestionar las operaciones CRUD de empresas
 * @author Juan Sebastian Noreña
 * @version 1.0.0
 */

const express = require('express');
const router = express.Router();
const Empresa = require('../Model/Empresa');
const mongoose = require('mongoose');

/**
 * @description Obtiene todas las empresas registradas en el sistema
 * @route GET /api/empresas
 * @returns {Array} Lista de todas las empresas
 */
router.get('/', async (req, res) => {
  try {
    const empresas = await Empresa.find();
    res.json(empresas);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @description Obtiene una empresa específica por su RUT
 * @route GET /api/empresas/:rut
 * @param {string} req.params.rut - RUT de la empresa a buscar
 * @returns {Object} Datos de la empresa encontrada
 */
router.get('/:rut', async (req, res) => {
  try {
    const empresa = await Empresa.findOne({ rut: req.params.rut });
    if (!empresa) {
      return res.status(404).json({ message: 'Empresa no encontrada' });
    }
    res.json(empresa);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @description Crea una nueva empresa en el sistema
 * @route POST /api/empresas
 * @param {Object} req.body - Datos de la empresa a crear
 * @param {string} req.body.nombre - Nombre de la empresa
 * @param {string} req.body.rut - RUT de la empresa
 * @param {string} req.body.direccion - Dirección de la empresa
 * @param {string} req.body.telefono - Teléfono de contacto
 * @param {string} req.body.email - Email de contacto
 * @returns {Object} Datos de la empresa creada
 */
router.post('/', async (req, res) => {
  const empresa = new Empresa({
    nombre: req.body.nombre,
    rut: req.body.rut,
    direccion: req.body.direccion,
    telefono: req.body.telefono,
    email: req.body.email
  });

  try {
    const nuevaEmpresa = await empresa.save();
    res.status(201).json(nuevaEmpresa);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

/**
 * @description Actualiza los datos de una empresa existente
 * @route PUT /api/empresas/:rut
 * @param {string} req.params.rut - RUT de la empresa a actualizar
 * @param {Object} req.body - Datos a actualizar
 * @param {string} [req.body.nombre] - Nombre de la empresa
 * @param {string} [req.body.rut] - RUT de la empresa
 * @param {string} [req.body.direccion] - Dirección de la empresa
 * @param {string} [req.body.telefono] - Teléfono de contacto
 * @param {string} [req.body.email] - Email de contacto
 * @returns {Object} Datos de la empresa actualizada
 */
router.put('/:rut', async (req, res) => {
  try {
    const empresa = await Empresa.findOne({ rut: req.params.rut });
    if (!empresa) {
      return res.status(404).json({ message: 'Empresa no encontrada' });
    }

    if (req.body.nombre) empresa.nombre = req.body.nombre;
    if (req.body.rut) empresa.rut = req.body.rut;
    if (req.body.direccion) empresa.direccion = req.body.direccion;
    if (req.body.telefono) empresa.telefono = req.body.telefono;
    if (req.body.email) empresa.email = req.body.email;

    const empresaActualizada = await empresa.save();
    res.json(empresaActualizada);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

/**
 * @description Elimina una empresa del sistema
 * @route DELETE /api/empresas/:rut
 * @param {string} req.params.rut - RUT de la empresa a eliminar
 * @returns {Object} Mensaje de confirmación
 */
router.delete('/:rut', async (req, res) => {
  try {
    const empresa = await Empresa.findOne({ rut: req.params.rut });
    if (!empresa) {
      return res.status(404).json({ message: 'Empresa no encontrada' });
    }

    await Empresa.findByIdAndDelete(empresa._id);
    res.json({ message: 'Empresa eliminada correctamente' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;