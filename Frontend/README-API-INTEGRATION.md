# API Integration Guide for Angular Frontend

## Authentication

All authenticated requests should include the JWT token in the Authorization header:

```typescript
const httpOptions = {
  headers: new HttpHeaders({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${this.authService.getToken()}`
  })
};
```

## Available Endpoints

### Authentication
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user and record time exit

### Attendance
- `GET /api/asistencia/mi-historial` - Get current employee's attendance history
- `GET /api/asistencia/empleado/:empleadoId` - Get specific employee's attendance (admin only)

### Salary Settlements
- `GET /api/liquidaciones-sueldo` - Get all settlements (admin only)
- `GET /api/liquidaciones-sueldo/:id` - Get specific settlement
- `GET /api/liquidaciones-sueldo/empleado/mis-liquidaciones` - Get current employee's settlements
- `GET /api/liquidaciones-sueldo/pendientes` - Get pending settlements (admin only)
- `POST /api/liquidaciones-sueldo/generar` - Generate settlement (admin only)
- `POST /api/liquidaciones-sueldo/generar-empresa` - Generate settlements for company (admin only)
- `PUT /api/liquidaciones-sueldo/:id/aprobar` - Approve settlement (admin only)
- `PUT /api/liquidaciones-sueldo/:id/rechazar` - Reject settlement (admin only)
- `POST /api/liquidaciones-sueldo/:id/pagar` - Process settlement payment (admin only)

### Payments
- `GET /api/pagos-sueldo` - Get all salary payments (admin only)
- `GET /api/pagos-sueldo/:id` - Get specific payment
- `GET /api/pagos-contabilidad-provisional` - Get all provisional payments (admin only)

## Example Angular Service

```typescript
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class LiquidacionService {
  private apiUrl = `${environment.apiUrl}/liquidaciones-sueldo`;

  constructor(private http: HttpClient, private authService: AuthService) { }

  private getHeaders() {
    return {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.authService.getToken()}`
      })
    };
  }

  getMisLiquidaciones(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/empleado/mis-liquidaciones`, this.getHeaders());
  }

  getLiquidacionById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`, this.getHeaders());
  }

  generarLiquidacion(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/generar`, data, this.getHeaders());
  }

  aprobarLiquidacion(id: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}/aprobar`, {}, this.getHeaders());
  }

  rechazarLiquidacion(id: string, motivo: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}/rechazar`, { motivo }, this.getHeaders());
  }

  procesarPago(id: string, datosPago: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${id}/pagar`, datosPago, this.getHeaders());
  }
}
```

## CORS Configuration

The backend is already configured to accept requests from `http://localhost:4200`. If you're running your Angular application on a different port, modify the CORS configuration in the backend's `index.js` file.

## Error Handling

All API endpoints return appropriate HTTP status codes:

- `200 OK` - Request was successful
- `201 Created` - Resource was successfully created
- `400 Bad Request` - Invalid input data
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

Example Angular error handling:

```typescript
import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ErrorHandlingService {
  
  handleError(error: HttpErrorResponse) {
    let errorMessage = '';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.error.message || 'Unknown error'}`;
      
      // Handle specific error codes
      switch (error.status) {
        case 401:
          // Redirect to login page
          break;
        case 403:
          // Show permission denied message
          break;
        case 404:
          // Show resource not found message
          break;
      }
    }
    
    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
```
