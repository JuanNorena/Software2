# Backend PersonalPay

Este es el backend para la aplicación PersonalPay, desarrollado con Node.js, Express y MongoDB. Proporciona una API REST para ser consumida por el frontend desarrollado en Angular.

## Requisitos

- Node.js (v14 o superior)
- MongoDB

## Configuración

1. Clona el repositorio
2. Instala las dependencias:

```bash
npm install
```

3. Crea un archivo `.env` en la raíz del proyecto basado en `.env.example` con tus configuraciones:

```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/personalpay
CORS_ORIGIN=http://localhost:4200
NODE_ENV=development
```

## Ejecución

Para desarrollo:

```bash
npm run dev
```

Para producción:

```bash
npm start
```

## API REST

El backend expone los siguientes endpoints:

### Empresas
- `GET /api/empresas` - Obtener todas las empresas
- `GET /api/empresas/:id` - Obtener una empresa por ID
- `POST /api/empresas` - Crear una nueva empresa
- `PUT /api/empresas/:id` - Actualizar una empresa
- `DELETE /api/empresas/:id` - Eliminar una empresa

### Empleados
- `GET /api/empleados` - Obtener todos los empleados
- `GET /api/empleados/:id` - Obtener un empleado por ID
- `GET /api/empleados/empresa/:empresaId` - Obtener empleados por empresa
- `POST /api/empleados` - Crear un nuevo empleado
- `PUT /api/empleados/:id` - Actualizar un empleado
- `DELETE /api/empleados/:id` - Eliminar un empleado

### Registros de Asistencia
- `GET /api/registros-asistencia` - Obtener todos los registros
- `POST /api/registros-asistencia` - Crear un nuevo registro

### Liquidaciones de Sueldo
- `GET /api/liquidaciones-sueldo` - Obtener todas las liquidaciones
- `POST /api/liquidaciones-sueldo` - Crear una nueva liquidación

### Pagos de Sueldo
- `GET /api/pagos-sueldo` - Obtener todos los pagos
- `POST /api/pagos-sueldo` - Crear un nuevo pago

### Pagos de Contabilidad Provisional
- `GET /api/pagos-contabilidad-provisional` - Obtener todos los pagos
- `POST /api/pagos-contabilidad-provisional` - Crear un nuevo pago

### Descuentos
- `GET /api/descuentos` - Obtener todos los descuentos
- `POST /api/descuentos` - Crear un nuevo descuento

## Integración con Angular

Para consumir esta API desde el frontend Angular, configura el servicio HTTP para apuntar a la URL base del backend (por defecto: `http://localhost:3000/api/`).

Ejemplo de servicio en Angular:

```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  // Ejemplo para empresas
  getEmpresas(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/empresas`);
  }

  getEmpresa(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/empresas/${id}`);
  }

  createEmpresa(empresa: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/empresas`, empresa);
  }

  updateEmpresa(id: string, empresa: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/empresas/${id}`, empresa);
  }

  deleteEmpresa(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/empresas/${id}`);
  }
}
```

Asegúrate de configurar el archivo `environment.ts` en tu proyecto Angular:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api'
};
```