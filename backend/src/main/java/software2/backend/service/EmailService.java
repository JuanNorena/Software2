package software2.backend.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import lombok.extern.slf4j.Slf4j;

/**
 * Servicio para enviar correos electrónicos.
 */
@Service
@Slf4j
public class EmailService {

    @Autowired
    private JavaMailSender emailSender;

    /**
     * Envía un correo electrónico simple
     * 
     * @param to      Destinatario
     * @param subject Asunto
     * @param text    Contenido
     */
    public void sendSimpleMessage(String to, String subject, String text) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(to);
            message.setSubject(subject);
            message.setText(text);
            emailSender.send(message);
            log.info("Correo enviado a {}", to);
        } catch (Exception e) {
            log.error("Error al enviar correo a {}: {}", to, e.getMessage());
        }
    }
} 