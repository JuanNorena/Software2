/**
 * @fileoverview Servicio para envío de correos electrónicos
 * @author Juan Sebastian Noreña
 * @version 1.0.0
 */

const nodemailer = require('nodemailer');

/**
 * Servicio para gestionar el envío de correos electrónicos
 * @class EmailService
 */
class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: process.env.EMAIL_PORT || 587,
      secure: process.env.EMAIL_SECURE === 'true' || false,
      auth: {
        user: process.env.EMAIL_USER || 'personalpay@example.com',
        pass: process.env.EMAIL_PASSWORD || 'password'
      }
    });
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
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'PersonalPay <personalpay@example.com>',
      to,
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

    return this.transporter.sendMail(mailOptions);
  }

  /**
   * Envía un correo de confirmación de cambio de contraseña
   * @param {string} to - Dirección de correo del destinatario
   * @returns {Promise<Object>} Resultado del envío
   */
  async enviarConfirmacionCambioPassword(to) {
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'PersonalPay <personalpay@example.com>',
      to,
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

    return this.transporter.sendMail(mailOptions);
  }
}

module.exports = new EmailService();
