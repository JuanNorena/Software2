/**
 * @fileoverview Servicio para la generación y manejo de documentos PDF
 * @author Juan Sebastian Noreña
 * @version 1.0.0
 */

const PDFDocument = require('pdfkit');
const fs = require('fs-extra');
const path = require('path');

/**
 * Servicio para la generación de documentos PDF
 * @class PdfService
 */
class PdfService {
  /**
   * Directorio donde se almacenarán temporalmente los PDFs generados
   */
  static PDF_DIR = path.join(process.cwd(), 'temp', 'pdf');

  /**
   * Inicializa el directorio de PDFs
   */
  static async init() {
    await fs.ensureDir(this.PDF_DIR);
  }

  /**
   * Genera un PDF de liquidación de sueldo
   * @param {Object} liquidacion - Liquidación de sueldo para generar el PDF
   * @param {Object} empleado - Datos del empleado
   * @param {Array} descuentos - Lista de descuentos aplicados
   * @param {Array} asistencias - Registros de asistencia (opcional)
   * @returns {Promise<string>} Ruta del archivo PDF generado
   */
  static async generarLiquidacionPdf(liquidacion, empleado, descuentos, asistencias = []) {
    // Crear nombre de archivo único basado en el ID de liquidación y fecha
    const filename = `liquidacion_${liquidacion._id}_${Date.now()}.pdf`;
    const filePath = path.join(this.PDF_DIR, filename);
    
    // Crear documento PDF
    const doc = new PDFDocument({
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
      size: 'A4'
    });

    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // Encabezado
    doc.font('Helvetica-Bold').fontSize(18)
      .text('LIQUIDACIÓN DE SUELDO', { align: 'center' });
    doc.moveDown();
    
    // Datos de la empresa
    if (empleado.empresa) {
      doc.font('Helvetica-Bold').fontSize(14)
        .text('EMPRESA', { underline: true });
      doc.font('Helvetica').fontSize(12)
        .text(`Nombre: ${empleado.empresa.nombre || 'N/A'}`)
        .text(`RUT: ${empleado.empresa.rut || 'N/A'}`)
        .text(`Dirección: ${empleado.empresa.direccion || 'N/A'}`);
      doc.moveDown();
    }
    
    // Datos del trabajador
    doc.font('Helvetica-Bold').fontSize(14)
      .text('TRABAJADOR', { underline: true });
    doc.font('Helvetica').fontSize(12)
      .text(`Nombre: ${empleado.nombre || 'N/A'}`)
      .text(`RUT: ${empleado.rut || 'N/A'}`)
      .text(`Cargo: ${empleado.cargo || 'N/A'}`)
      .text(`Fecha de ingreso: ${empleado.fechaIngreso ? new Date(empleado.fechaIngreso).toLocaleDateString() : 'N/A'}`);
    doc.moveDown();
    
    // Datos de la liquidación
    doc.font('Helvetica-Bold').fontSize(14)
      .text('DETALLE DE LIQUIDACIÓN', { underline: true });
    doc.font('Helvetica').fontSize(12)
      .text(`Período: ${new Date(liquidacion.fecha).toLocaleDateString('es-CL', { year: 'numeric', month: 'long' })}`)
      .text(`Sueldo Base: $${empleado.sueldoBase ? empleado.sueldoBase.toLocaleString('es-CL') : 'N/A'}`)
      .text(`Sueldo Bruto: $${liquidacion.sueldoBruto.toLocaleString('es-CL')}`)
      .text(`Total Descuentos: $${liquidacion.totalDescuentos.toLocaleString('es-CL')}`)
      .text(`Sueldo Líquido: $${liquidacion.sueldoNeto.toLocaleString('es-CL')}`)
      .text(`Estado: ${this.formatearEstadoLiquidacion(liquidacion.estado)}`);
    
    if (liquidacion.fechaAprobacion) {
      doc.text(`Fecha de aprobación: ${new Date(liquidacion.fechaAprobacion).toLocaleDateString()}`);
    }
    doc.moveDown();
    
    // Descuentos
    if (descuentos && descuentos.length > 0) {
      doc.font('Helvetica-Bold').fontSize(14)
        .text('DESCUENTOS', { underline: true });
      
      // Crear tabla de descuentos
      let y = doc.y + 10;
      
      // Encabezados
      doc.font('Helvetica-Bold').fontSize(12);
      doc.text('Concepto', 50, y);
      doc.text('Monto ($)', 400, y);
      y += 20;
      
      // Contenido
      doc.font('Helvetica').fontSize(12);
      descuentos.forEach(descuento => {
        doc.text(descuento.concepto, 50, y);
        doc.text(`$${descuento.valor.toLocaleString('es-CL')}`, 400, y);
        y += 20;
      });
      
      doc.moveDown(2);
    }
    
    // Asistencia
    if (asistencias && asistencias.length > 0) {
      doc.addPage();
      doc.font('Helvetica-Bold').fontSize(14)
        .text('REGISTRO DE ASISTENCIA', { underline: true });
      doc.moveDown();
      
      // Resumen de asistencia
      const diasTrabajados = asistencias.length;
      let totalHoras = 0;
      let horasExtras = 0;
      
      asistencias.forEach(reg => {
        const horas = reg.totalHorasTrabajadas || 0;
        totalHoras += horas;
        if (horas > 8) horasExtras += (horas - 8);
      });
      
      doc.font('Helvetica').fontSize(12)
        .text(`Días trabajados: ${diasTrabajados}`)
        .text(`Total horas trabajadas: ${totalHoras.toFixed(2)}`)
        .text(`Horas extras: ${horasExtras.toFixed(2)}`);
      doc.moveDown();
      
      // Tabla de asistencia
      let y = doc.y + 10;
      
      // Encabezados
      doc.font('Helvetica-Bold').fontSize(11);
      doc.text('Fecha', 50, y);
      doc.text('Entrada', 200, y);
      doc.text('Salida', 300, y);
      doc.text('Total Horas', 400, y);
      y += 20;
      
      // Contenido de asistencia
      doc.font('Helvetica').fontSize(11);
      asistencias.forEach(reg => {
        const fecha = new Date(reg.fecha).toLocaleDateString();
        doc.text(fecha, 50, y);
        doc.text(reg.horaEntrada || '-', 200, y);
        doc.text(reg.horaSalida || '-', 300, y);
        doc.text((reg.totalHorasTrabajadas || 0).toFixed(2), 400, y);
        y += 20;
        
        // Si estamos cerca del final de la página, añadir una nueva
        if (y > 700) {
          doc.addPage();
          y = 50;
          // Repetir encabezados
          doc.font('Helvetica-Bold').fontSize(11);
          doc.text('Fecha', 50, y);
          doc.text('Entrada', 200, y);
          doc.text('Salida', 300, y);
          doc.text('Total Horas', 400, y);
          y += 20;
          doc.font('Helvetica').fontSize(11);
        }
      });
    }
    
    // Pie de página
    const pageCount = doc.bufferedPageRange().count;
    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(i);
      
      // Agregar número de página al pie
      doc.fontSize(10).text(
        `Página ${i + 1} de ${pageCount}`,
        50,
        doc.page.height - 50,
        { align: 'center' }
      );
    }

    // Finalizar y guardar el documento
    doc.end();
    
    return new Promise((resolve, reject) => {
      stream.on('finish', () => resolve(filename));
      stream.on('error', reject);
    });
  }

  /**
   * Obtiene la ruta completa de un archivo PDF
   * @param {string} filename - Nombre del archivo PDF
   * @returns {string} Ruta completa del archivo
   */
  static getFilePath(filename) {
    return path.join(this.PDF_DIR, filename);
  }

  /**
   * Elimina un archivo PDF
   * @param {string} filename - Nombre del archivo a eliminar
   * @returns {Promise<void>}
   */
  static async deleteFile(filename) {
    const filePath = this.getFilePath(filename);
    if (await fs.pathExists(filePath)) {
      return fs.remove(filePath);
    }
  }

  /**
   * Formatea el estado de la liquidación para mostrarlo en el PDF
   * @param {string} estado - Estado de la liquidación
   * @returns {string} Estado formateado
   */
  static formatearEstadoLiquidacion(estado) {
    const estados = {
      'pendiente': 'Pendiente de aprobación',
      'aprobado': 'Aprobada',
      'rechazado': 'Rechazada',
      'pagado': 'Pagada'
    };
    return estados[estado] || estado;
  }
}

// Inicializar el directorio de PDFs al cargar el servicio
PdfService.init().catch(err => console.error('Error al crear directorio de PDFs:', err));

module.exports = PdfService;
