# PersonalPay

**PersonalPay** es un sistema web diseñado para facilitar la administración del personal y las remuneraciones en pequeñas empresas. Permite gestionar empleados, controlar asistencia y generar liquidaciones de sueldo de forma automatizada, todo desde una plataforma centralizada y accesible.

## 🧩 Funcionalidades principales (Módulos del Sistema)
1. Gestión de empleados (Backoffice):

    - Registro y edición de datos del empleado: nombre, RUT, fecha de nacimiento, profesión, cargo, jornada, sueldo bruto, descuentos, etc.


2. Marcación de entrada/salida (Kiosko Digital):

    - nterfaz para que los empleados registren su entrada y salida diaria digitando su cédula.

    - Registro de fecha y hora del evento.


3. Control de asistencia:

    -Visualización y administración de los registros de entrada y salida.

    -Cálculo de días trabajados y horas totales para la generación de la nómina.


4. Liquidación de sueldo:

    -Cálculo automático de sueldos netos.

    -Descuentos (ISAPRE, AFP, adicionales).

    -Generación de archivo para depósito o impresión de cheque.


5. Portal del empleado (Kiosko e Internet):

    -Acceso individual al perfil.

    -Visualización e impresión de liquidaciones pasadas.

    -Información sobre cotizaciones pagadas y días trabajados.

## 🔧 Tecnologías utilizadas
- Backend: `JavaScript`
- Frontend: `Angular`
- Base de datos: `MongoDB`
- Notificaciones: Sistema de alertas en tiempo real
- Almacenamiento de imágenes: Servicio externo
