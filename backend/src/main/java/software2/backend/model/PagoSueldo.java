package software2.backend.model;

import java.time.LocalDate;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import com.fasterxml.jackson.annotation.JsonIgnore;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Representa un pago de sueldo a un empleado en el sistema PersonalPay.
 * Contiene la información del banco, fecha, método de pago y monto.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "pagos_sueldo")
public class PagoSueldo {
    
    @Id
    private String id;
    
    private String banco;
    private LocalDate fecha;
    private String metodoPago; // "cheque" o "deposito"
    private double monto;
    
    // Relación con liquidación de sueldo (un pago pertenece a una liquidación)
    @JsonIgnore // Evita ciclos infinitos en la serialización JSON
    private LiquidacionSueldo liquidacionSueldo;
    
    /**
     * Genera un pago de sueldo
     * @param banco El banco donde se realiza el pago
     * @param metodoPago El método de pago (cheque o depósito)
     * @param monto El monto del pago
     * @return El pago generado
     */
    public static PagoSueldo generarPago(String banco, String metodoPago, double monto) {
        PagoSueldo pago = new PagoSueldo();
        pago.setBanco(banco);
        pago.setFecha(LocalDate.now());
        pago.setMetodoPago(metodoPago);
        pago.setMonto(monto);
        return pago;
    }
}