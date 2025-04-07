/**
 * @fileoverview Servicio para envío de correos electrónicos con MailerSend
 * @author Juan Sebastian Noreña
 * @version 1.0.2
 */

const axios = require('axios'); // Asegúrate de tener axios instalado: npm install axios

/**
 * Servicio para gestionar el envío de correos electrónicos
 * @class EmailService
 */
class EmailService {
  constructor() {
    this.apiKey = process.env.MAILERSEND_API_KEY;
    this.emailFrom = process.env.EMAIL_FROM;
    this.baseUrl = 'https://api.mailersend.com/v1';

    // Verificar que dotenv está cargando las variables correctamente
    console.log('=== Verificación de variables de entorno ===');
    console.log(`MAILERSEND_API_KEY cargada: ${this.apiKey ? 'SÍ' : 'NO'}`);
    console.log(`MAILERSEND_API_KEY longitud: ${this.apiKey ? this.apiKey.length : 0} caracteres`);
    console.log(`EMAIL_FROM cargado: ${this.emailFrom ? this.emailFrom : 'NO'}`);
    
    // Validar que la API key esté configurada
    if (!this.apiKey) {
      console.warn('⚠️ ADVERTENCIA: MAILERSEND_API_KEY no está configurada en las variables de entorno');
      // En desarrollo, podríamos seguir permitiendo el funcionamiento para pruebas
      if (process.env.NODE_ENV !== 'production') {
        console.log('📧 Modo desarrollo: Los correos se simularán en la consola en lugar de enviarse');
      }
    }
    
    this.headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`
    };
  }

  /**
   * Envía un correo electrónico para restablecer contraseña
   * @param {string} to - Dirección de correo del destinatario
   * @param {string} token - Token de restablecimiento
   * @returns {Promise<Object>} Resultado del envío
   */
  async enviarCorreoRestablecimiento(to, token) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4200';
    const resetLink = `${frontendUrl}/restablecer-password/${token}`;
    
    // Verificar si hay destinatario y token
    if (!to || !token) {
      console.error('Error: Correo de destinatario o token no proporcionados');
      throw new Error('Correo de destinatario o token no proporcionados');
}
    
    // Objeto de correo a enviar      
      const emailData = {
        from: {
          email: this.emailFrom || 'nelsone.apachem@uqvirtual.edu.co',
          name: 'PersonalPay'
        },
        to: [{
          email: to
        }],
        subject: 'Restablecimiento de contraseña - PersonalPay',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 5px;">
            <h2 style="color: #00306e;">Restablecimiento de contraseña</h2>
            <p>Hemos recibido una solicitud para restablecer la contraseña de su cuenta en PersonalPay.</p>
            <p>Haga clic en el siguiente enlace para establecer una nueva contraseña:</p>
            <p style="margin: 20px 0;">
              <a href="${resetLink}" style="background-color: #00306e; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px;">
                Restablecer contraseña
              </a>
            </p>
            <p>Este enlace expirará en 24 horas.</p>
            <p>Si no solicitó restablecer su contraseña, puede ignorar este correo.</p>
            <p style="margin-top: 30px; font-size: 12px; color: #666;">
              Este es un correo automático, por favor no responda a este mensaje.
            </p>
          </div>
        `
      };
    
    try {
      // En desarrollo sin API key, simular el envío
      if (!this.apiKey && process.env.NODE_ENV !== 'production') {
        console.log(`\n========== SIMULACIÓN DE CORREO (DESARROLLO) ==========`);
        console.log(`Para: ${to}`);
        console.log(`Asunto: Restablecimiento de contraseña - PersonalPay`);
        console.log(`Enlace: ${resetLink}`);
        console.log(`======================================================\n`);
        return { 
          id: 'simulated-email-id',
          message: 'Correo simulado en modo desarrollo' 
        };
      }
      
      console.log(`Enviando correo de restablecimiento a: ${to}`);
      
      const response = await axios.post(
        `${this.baseUrl}/email`, 
        emailData, 
        { headers: this.headers }
);
      
      console.log('Correo de restablecimiento enviado exitosamente');
      return response.data;
    } catch (error) {
      // Extraer información detallada del error
      const errorDetails = error.response?.data 
        ? JSON.stringify(error.response.data) 
        : error.message;
        
      console.error(`Error detallado al enviar correo con MailerSend: ${errorDetails}`);
      
      // Verificar si es un error de autenticación
      if (error.response?.status === 401) {
        throw new Error('Error de autenticación con MailerSend. Verifique su API key.');
      }
      
      // Verificar si es un error de límites excedidos
      if (error.response?.status === 429) {
        throw new Error('Límite de envío de correos excedido. Intente más tarde.');
      }
      
      throw new Error(`Error al enviar correo de restablecimiento: ${error.message}`);
    }
  }

  /**
   * Envía un correo de confirmación de cambio de contraseña
   * @param {string} to - Dirección de correo del destinatario
   * @returns {Promise<Object>} Resultado del envío
   */
  async enviarConfirmacionCambioPassword(to) {
    // Verificar si hay destinatario
    if (!to) {
      console.error('Error: Correo de destinatario no proporcionado');
      throw new Error('Correo de destinatario no proporcionado');
    }

    // Objeto de correo a enviar
    const emailData = {
      from: {
        email: this.emailFrom || 'nelsone.apachem@uqvirtual.edu.co',
        name: 'PersonalPay'
      },
      to: [{
        email: to
      }],
      subject: 'Contraseña actualizada - PersonalPay',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 5px;">
          <h2 style="color: #00306e;">Contraseña actualizada</h2>
          <p>Su contraseña ha sido actualizada exitosamente.</p>
          <p>Si usted no realizó este cambio, contacte inmediatamente al soporte técnico.</p>
          <p style="margin-top: 30px; font-size: 12px; color: #666;">
            Este es un correo automático, por favor no responda a este mensaje.
          </p>
        </div>
      `
    };
    
    try {
      // En desarrollo sin API key, simular el envío
      if (!this.apiKey && process.env.NODE_ENV !== 'production') {
        console.log(`\n========== SIMULACIÓN DE CORREO (DESARROLLO) ==========`);
        console.log(`Para: ${to}`);
        console.log(`Asunto: Contraseña actualizada - PersonalPay`);
        console.log(`======================================================\n`);
        return { 
          id: 'simulated-confirmation-email-id',
          message: 'Correo de confirmación simulado en modo desarrollo' 
        };
      }
      
      console.log(`Enviando correo de confirmación a: ${to}`);
      
      const response = await axios.post(
        `${this.baseUrl}/email`, 
        emailData, 
        { headers: this.headers }
      );
      
      console.log('Correo de confirmación enviado exitosamente');
      return response.data;
    } catch (error) {
      // Extraer información detallada del error
      const errorDetails = error.response?.data 
        ? JSON.stringify(error.response.data) 
        : error.message;
        
      console.error(`Error detallado al enviar correo de confirmación: ${errorDetails}`);
      
      // Verificar si es un error de autenticación
      if (error.response?.status === 401) {
        throw new Error('Error de autenticación con MailerSend. Verifique su API key.');
      }
      
      throw new Error(`Error al enviar confirmación de cambio de contraseña: ${error.message}`);
    }
  }
}

module.exports = new EmailService();