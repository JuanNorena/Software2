/**
 * @fileoverview Programador de tareas de limpieza para archivos temporales
 * @version 1.0.0
 */

const fs = require('fs-extra');
const path = require('path');
const schedule = require('node-schedule');

/**
 * Programador de tareas de limpieza del sistema
 * @class CleanupScheduler
 */
class CleanupScheduler {
  /**
   * Inicia las tareas programadas de limpieza
   */
  static init() {
    console.log('Iniciando programador de tareas de limpieza');
    this.programarLimpiezaPDF();
  }

  /**
   * Programa la limpieza periódica de archivos PDF temporales
   */
  static programarLimpiezaPDF() {
    // Programar tarea diaria a las 2:00 AM
    schedule.scheduleJob('0 2 * * *', async () => {
      try {
        console.log('Ejecutando limpieza de archivos PDF temporales');
        await this.limpiarArchivosTemporalesPDF();
      } catch (err) {
        console.error('Error durante la limpieza de archivos PDF:', err);
      }
    });
  }

  /**
   * Limpia archivos PDF temporales que tengan más de 24 horas
   */
  static async limpiarArchivosTemporalesPDF() {
    const dirPDF = path.join(process.cwd(), 'temp', 'pdf');
    
    try {
      // Verificar si el directorio existe
      if (!await fs.pathExists(dirPDF)) {
        console.log('El directorio de PDFs temporales no existe');
        return;
      }
      
      const ahora = Date.now();
      const archivos = await fs.readdir(dirPDF);
      
      // Filtrar archivos con más de 24 horas
      for (const archivo of archivos) {
        const rutaArchivo = path.join(dirPDF, archivo);
        const stats = await fs.stat(rutaArchivo);
        
        // Calcular tiempo de vida del archivo en milisegundos
        const edadArchivo = ahora - stats.mtime.getTime();
        const horasMaximas = 24 * 60 * 60 * 1000; // 24 horas en ms
        
        // Si el archivo tiene más de 24 horas, eliminarlo
        if (edadArchivo > horasMaximas) {
          await fs.remove(rutaArchivo);
          console.log(`Archivo eliminado: ${archivo}`);
        }
      }
      
      console.log('Limpieza de archivos PDF completada');
    } catch (error) {
      console.error('Error al limpiar archivos PDF:', error);
      throw error;
    }
  }
}

module.exports = CleanupScheduler;
