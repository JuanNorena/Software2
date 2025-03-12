package software2.backend.model;

import java.time.LocalDate;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import com.fasterxml.jackson.annotation.JsonIgnore;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Representa un pago de contabilidad provisional en el sistema PersonalPay.
 * Contiene información sobre pagos provisionales relacionados con AFP, salud y otros conceptos.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "pagos_contabilidad_provisional")
public class PagoContabilidadProvisional {
    
    @Id
    private String id;
    
    private LocalDate fechaPago;
    private String periodoCorrespondiente; // Por ejemplo: "Enero 2023", "Febrero 2023", etc.
    private double totalPago;
    private double totalPagoAFP;
    private double totalPagoSalud;
    
    // Relación con liquidación de sueldo (un pago provisional pertenece a una liquidación)
    @JsonIgnore // Evita ciclos infinitos en la serialización JSON
    private LiquidacionSueldo liquidacionSueldo;
    
    /**
     * Genera un pago de contabilidad provisional
     * @param periodoCorrespondiente El período al que corresponde el pago
     * @param totalPagoAFP El total de pago a AFP
     * @param totalPagoSalud El total de pago a salud
     * @return El pago provisional generado
     */
    public static PagoContabilidadProvisional generarPagoProvisional(String periodoCorrespondiente, 
                                                                    double totalPagoAFP, 
                                                                    double totalPagoSalud) {
        PagoContabilidadProvisional pago = new PagoContabilidadProvisional();
        pago.setFechaPago(LocalDate.now());
        pago.setPeriodoCorrespondiente(periodoCorrespondiente);
        pago.setTotalPagoAFP(totalPagoAFP);
        pago.setTotalPagoSalud(totalPagoSalud);
        pago.setTotalPago(totalPagoAFP + totalPagoSalud);
        return pago;
    }
}