package software2.backend.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import software2.backend.dto.EmpleadoActualizacionRequest;
import software2.backend.dto.EmpleadoRegistroRequest;
import software2.backend.dto.EmpleadoResponse;
import software2.backend.exception.ResourceNotFoundException;
import software2.backend.model.Empleado;
import software2.backend.service.EmpleadoService;

/**
 * Controlador para la gestión de empleados por parte del administrador.
 * Proporciona endpoints para listar, crear, actualizar y eliminar empleados.
 */
@RestController
@RequestMapping("/api/admin/empleados")
@Validated
@RequiredArgsConstructor
public class EmpleadosAdminController {

    private final EmpleadoService empleadoService;
    
    /**
     * Endpoint para obtener todos los empleados
     * @return Lista de empleados
     */
    @GetMapping
    public ResponseEntity<?> obtenerEmpleados() {
        List<Empleado> empleados = empleadoService.obtenerTodosLosEmpleados();
        return ResponseEntity.ok(empleados);
    }
    
    /**
     * Endpoint para obtener todos los empleados (retorna DTO)
     * @return Lista de empleados con datos seguros para mostrar
     */
    @GetMapping("/dto")
    public ResponseEntity<?> obtenerEmpleadosDTO() {
        List<EmpleadoResponse> respuesta = empleadoService.obtenerTodosLosEmpleadosDTO();
        return ResponseEntity.ok(respuesta);
    }
    
    /**
     * Endpoint para obtener un empleado por su ID
     * @param id ID del empleado
     * @return Empleado encontrado
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> obtenerEmpleado(@PathVariable String id) {
        try {
            Empleado empleado = empleadoService.obtenerEmpleadoPorId(id);
            return ResponseEntity.ok(empleado);
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    /**
     * Endpoint para crear un nuevo empleado usando DTO
     * @param registroRequest DTO con datos del empleado y credenciales
     * @return Empleado creado
     */
    @PostMapping("/registro")
    public ResponseEntity<?> registrarEmpleado(@Valid @RequestBody EmpleadoRegistroRequest registroRequest) {
        try {
            Empleado empleadoGuardado = empleadoService.registrarEmpleado(registroRequest);
            return ResponseEntity.ok(empleadoGuardado);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    
    /**
     * Endpoint para actualizar un empleado existente (usando DTO)
     * @param id ID del empleado a actualizar
     * @param actualizacionRequest DTO con datos actualizados
     * @return Empleado actualizado
     */
    @PutMapping("/{id}/dto")
    public ResponseEntity<?> actualizarEmpleadoConDTO(
            @PathVariable String id, 
            @Valid @RequestBody EmpleadoActualizacionRequest actualizacionRequest) {
        
        try {
            EmpleadoResponse respuesta = empleadoService.actualizarEmpleado(id, actualizacionRequest);
            return ResponseEntity.ok(respuesta);
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    
    /**
     * Endpoint para eliminar un empleado
     * @param id ID del empleado a eliminar
     * @return Respuesta sin contenido
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminarEmpleado(@PathVariable String id) {
        try {
            empleadoService.eliminarEmpleado(id);
            return ResponseEntity.noContent().build();
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error al eliminar empleado: " + e.getMessage());
        }
    }
} 