package software2.backend.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import com.fasterxml.jackson.annotation.JsonIgnore;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Representa un descuento aplicado a la liquidación de sueldo de un empleado.
 * Contiene información sobre el concepto y valor del descuento.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "descuentos")
public class Descuento {
    
    @Id
    private String id;
    
    private String concepto; // Por ejemplo: "AFP", "ISAPRE", "Impuesto", etc.
    private double valor;
    
    // Relación con liquidación de sueldo (un descuento pertenece a una liquidación)
    @JsonIgnore // Evita ciclos infinitos en la serialización JSON
    private LiquidacionSueldo liquidacionSueldo;
}