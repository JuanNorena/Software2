package software2.backend.model;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import com.fasterxml.jackson.annotation.JsonIgnore;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Representa una liquidación de sueldo de un empleado en el sistema PersonalPay.
 * Contiene la información de fecha, estado, sueldo bruto, sueldo neto y descuentos.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "liquidaciones_sueldo")
public class LiquidacionSueldo {
    
    @Id
    private String id;
    
    private LocalDate fecha;
    private String estado; // "emitido" o "pagado"
    private double sueldoBruto;
    private double sueldoNeto;
    private double totalDescuentos;
    
    // Relación con empleado (una liquidación pertenece a un empleado)
    @JsonIgnore // Evita ciclos infinitos en la serialización JSON
    private Empleado empleado;
    
    // Relación con descuentos
    private List<Descuento> descuentos = new ArrayList<>();
    
    // Relación con pagos
    private List<PagoSueldo> pagos = new ArrayList<>();
    
    // Relación con pagos provisionales
    private List<PagoContabilidadProvisional> pagosProvisionales = new ArrayList<>();
    
    /**
     * Agrega un descuento a la liquidación
     * @param descuento El descuento a agregar
     */
    public void agregarDescuento(Descuento descuento) {
        if (descuentos == null) {
            descuentos = new ArrayList<>();
        }
        descuentos.add(descuento);
    }
    
    /**
     * Agrega un pago a la liquidación
     * @param pago El pago a agregar
     */
    public void agregarPago(PagoSueldo pago) {
        if (pagos == null) {
            pagos = new ArrayList<>();
        }
        pagos.add(pago);
    }
    
    /**
     * Agrega un pago provisional a la liquidación
     * @param pagoProvisional El pago provisional a agregar
     */
    public void agregarPagoProvisional(PagoContabilidadProvisional pagoProvisional) {
        if (pagosProvisionales == null) {
            pagosProvisionales = new ArrayList<>();
        }
        pagosProvisionales.add(pagoProvisional);
    }
    
    /**
     * Calcula el sueldo neto en base al sueldo bruto y los descuentos
     * @return El sueldo neto
     */
    public double calcularSueldoNeto() {
        return sueldoBruto - totalDescuentos;
    }
    
    /**
     * Calcula el total de descuentos en base a los descuentos agregados
     * @return El total de descuentos
     */
    public double calcularTotalDescuentos() {
        double total = 0.0;
        if (descuentos != null) {
            for (Descuento descuento : descuentos) {
                total += descuento.getValor();
            }
        }
        return total;
    }
    
    /**
     * Actualiza los cálculos de la liquidación
     */
    public void actualizarCalculos() {
        this.totalDescuentos = calcularTotalDescuentos();
        this.sueldoNeto = calcularSueldoNeto();
    }
}