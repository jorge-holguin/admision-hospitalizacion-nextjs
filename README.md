# Sistema de Gestión Hospitalaria

[![Next.js](https://img.shields.io/badge/Next.js-13.5+-000000?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-4.0+-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.0+-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)

## Descripción General

Sistema integral de gestión hospitalaria desarrollado con Next.js, diseñado para administrar los procesos de emergencia y hospitalización en centros médicos. La plataforma ofrece una solución modular y escalable para la gestión de pacientes, personal médico y recursos hospitalarios.

## Características Principales

- **Módulo de Emergencias**: Registro y seguimiento de atenciones de emergencia
- **Módulo de Hospitalización**: Gestión completa de ingresos y altas hospitalarias
- **Módulo de Citas**: Programación y gestión de citas médicas
- **Pacientes**: Registro centralizado de historias clínicas
- **Tablas Maestras**: Administración de recursos médicos y referenciales
- **Autenticación**: Control de acceso basado en roles
- **API RESTful**: Arquitectura modular con endpoints bien definidos

## Estructura del Proyecto

### API (app/api/)

```
api/
├── consultorio/               # Endpoints de consultorios
│   ├── check-codigo/          # Verificación de códigos únicos
│   └── [id]/                  # Operaciones por ID de consultorio
├── citas/                     # Módulo de citas médicas
│   ├── disponibilidad/        # Verificación de disponibilidad
│   ├── calendario/            # Vista de calendario
│   ├── reprogramar/           # Reprogramación de citas
│   └── [id]/                  # Operaciones por ID de cita
├── cuenta/                    # Gestión de cuentas de pacientes
│   ├── buscar-por-seguro/     # Búsqueda por tipo de seguro
│   ├── validate/              # Validación de cuentas y FUAs
│   ├── deactivate/            # Desactivación lógica
│   └── update/                # Actualización de cuentas
├── dashboard/                 # Datos para el dashboard
│   └── kpis/                  # Métricas principales
├── emergencia/                # Módulo de emergencias
│   ├── active/                # Emergencias activas
│   ├── patient/               # Emergencias por paciente
│   └── [id]/                  # Operaciones por ID de emergencia
├── hospitaliza/               # Módulo de hospitalización
│   ├── orden-hospitalizacion/ # Gestión de órdenes
│   └── origen-hospitalizacion/ # Orígenes de hospitalización
├── medicos/                   # Gestión de médicos
│   ├── sugerir-codigo/        # Generación automática de códigos
│   └── [id]/                  # Operaciones por ID de médico
├── especialidad/              # Gestión de especialidades médicas
├── seguros/                   # Gestión de seguros médicos
├── tipo/                      # Catálogo de tipos (tabla T)
└── master-tables/             # Tablas de referencia
    ├── consultorios/          # Gestión de consultorios
    │   └── [id]/              # Operaciones por ID
    ├── localidades/           # Gestión de localidades
    │   └── [id]/              # Operaciones por ID
    └── medicos/               # Gestión de médicos
        └── [id]/              # Operaciones por ID
```

### Frontend (app/)

```
app/
├── appointments/             # Módulo de citas médicas
│   ├── calendar/             # Vista de calendario
│   ├── new/                  # Creación de citas
│   └── [id]/                 # Detalle de cita
├── change-password/          # Cambio de contraseña
├── dashboard/                # Panel principal
├── emergency/                # Módulo de emergencias
│   ├── [patientId]/          # Detalle de emergencia
│   ├── edit/                 # Edición de emergencia
│   └── register/             # Registro de emergencia
├── hospitalization/          # Módulo de hospitalización
│   ├── orders/               # Órdenes de hospitalización
│   ├── register/             # Registro de hospitalización
│   └── view/                 # Visualización de hospitalización
└── master-tables/            # Gestión de tablas maestras
    ├── consultorios/         # Gestión de consultorios
    ├── localidades/          # Gestión de localidades
    └── medicos/              # Gestión de médicos
```

### Estructura de Código

```
components/                   # Componentes reutilizables
├── appointments/             # Componentes de citas médicas
│   ├── AppointmentCalendar.tsx # Calendario de citas
│   ├── AppointmentDetailsModal.tsx # Modal de detalles
│   └── AppointmentsTable.tsx # Tabla de citas
├── dashboard/                # Componentes del dashboard
├── emergency/                # Componentes de emergencias
│   ├── register/             # Registro de emergencias
│   └── view/                 # Visualización de emergencias
├── hospitalization/          # Componentes de hospitalización
│   ├── register/             # Registro de hospitalizaciones
│   └── view/                 # Visualización de hospitalizaciones
├── master-tables/            # Componentes para tablas maestras
│   ├── modals/               # Formularios modales
│   └── tables/               # Tablas de datos
└── ui/                       # Componentes de interfaz base

contexts/                     # Contextos de React
├── ConsultoriosContext.tsx   # Gestión de consultorios
├── MedicosContext.tsx        # Gestión de médicos
├── PatientAccountContext.tsx # Cuentas de pacientes
├── PatientContext.tsx        # Datos de pacientes
└── PatientDataContext.tsx    # Datos clínicos

hooks/                        # Hooks personalizados
├── master-tables/            # Hooks para tablas maestras
│   ├── useConsultorios.ts    # Hook para consultorios
│   ├── useConsultorioById.ts # Hook para un consultorio específico
│   ├── useMedicos.ts         # Hook para médicos
│   └── useMedicoById.ts      # Hook para un médico específico
├── use-mobile.tsx            # Detección móvil
└── use-toast.ts              # Notificaciones

services/                     # Lógica de negocio
├── citas/                    # Servicios de citas
│   └── entidadSisService.ts  # Validación de entidades SIS
├── emergencia/               # Servicios de emergencia
│   ├── consultorioService.ts # Gestión de consultorios
│   ├── emergenciaService.ts  # Gestión de emergencias
│   └── cuentaService.ts      # Gestión de cuentas
├── hospitalizacion/          # Servicios de hospitalización
│   ├── consultorioService.ts # Gestión de consultorios
│   ├── cuentaFuaService.ts   # Gestión de FUAs
│   └── cuentaValidationService.ts # Validación de cuentas
└── master-tables/            # Servicios de tablas maestras
    ├── consultorioService.ts # Servicio de consultorios
    ├── localidadService.ts   # Servicio de localidades
    └── medicoService.ts      # Servicio de médicos

utils/                        # Utilidades
├── civilStatusUtils.ts       # Estados civiles
├── dateFormatUtils.ts        # Formato de fechas
├── debuggerUtils.ts          # Herramientas de depuración
└── jwtUtils.ts               # Manejo de JWT
```

## Base de Datos

El sistema utiliza Prisma como ORM con un esquema relacional que incluye:

- **Pacientes**: Información personal y clínica
- **Emergencias**: Registros de atención de emergencia
- **Hospitalizaciones**: Ingresos y estancias hospitalarias
- **Médicos**: Personal médico
- **Consultorios**: Áreas de atención
- **Localidades**: Ubicaciones geográficas

## Configuración

1. Crear archivo `.env` en la raíz:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/hospital_db"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
```

2. Instalar dependencias:
```bash
npm install
```

3. Ejecutar migraciones:
```bash
npx prisma migrate dev
```

4. Iniciar servidor de desarrollo:
```bash
npm run dev
```

## Módulos Principales

### Citas Médicas
- Programación de citas con médicos
- Calendario de disponibilidad
- Asignación de consultorios
- Reprogramación y cancelación
- Validación de seguros SIS
- Generación de referencias

### Emergencias
- Registro de pacientes en emergencia
- Asignación de consultorios
- Validación de seguros
- Generación de FUA

### Hospitalización
- Órdenes de hospitalización
- Gestión de camas
- Control de altas
- Seguimiento clínico

### Tablas Maestras
- Gestión de recursos médicos
- Catálogos del sistema
- Datos de referencia

## Tecnologías

- **Frontend**: Next.js 13+, React 18+, TypeScript
- **Estilos**: Tailwind CSS, Shadcn UI
- **Backend**: Next.js API Routes
- **Base de Datos**: PostgreSQL con Prisma ORM
- **Autenticación**: NextAuth.js
- **Validación**: Zod
- **Iconos**: Lucide React
- **Documentación API**: Swagger UI

## Licencia

Este proyecto está bajo la licencia MIT. Ver el archivo `LICENSE` para más detalles.

---

Desarrollado por [Tu Organización] - 2025

## Servicios

La lógica de negocio está organizada en servicios modulares:

- **citasService**: Gestión de citas médicas y disponibilidad
- **entidadSisService**: Validación de entidades SIS para citas
- **emergenciaService**: Gestión de casos de emergencia
- **hospitalizacionService**: Gestión de hospitalizaciones
- **cuentaService**: Validación y gestión de cuentas
- **cuentaFuaService**: Gestión de FUAs
- **cuentaValidationService**: Validación de cuentas según tipo de seguro
- **consultorioService**: Administración de consultorios
- **medicoService**: Gestión de médicos y especialidades
- **localidadService**: Gestión de localidades

# Documentación de Endpoints API

## Módulo de Citas

El módulo de citas proporciona funcionalidades para la gestión completa de citas médicas, incluyendo programación, reprogramación, cancelación y validación de seguros.

### Endpoints de Citas

#### `GET /api/citas`
Obtiene un listado paginado de citas médicas.

**Parámetros de consulta:**
- `page`: Número de página (default: 1)
- `pageSize`: Tamaño de página (default: 10)
- `fecha`: Filtrar por fecha (formato: YYYY-MM-DD)
- `medico`: Filtrar por código de médico
- `consultorio`: Filtrar por código de consultorio
- `estado`: Filtrar por estado (1: Programada, 2: Atendida, 0: Cancelada)

**Respuesta:**
```json
{
  "data": [
    {
      "ID_CITA": "123456",
      "PACIENTE": "2008083192",
      "NOMBRES": "GARCIA MIGUEL ANGEL",
      "DOCUMENTO": "41877141",
      "FECHA": "2025-09-15",
      "HORA": "08:30",
      "MEDICO": "ABC",
      "NOM_MEDICO": "DR. JUAN PEREZ",
      "CONSULTORIO": "C123",
      "NOM_CONSULTORIO": "MEDICINA GENERAL",
      "ESTADO": "1",
      "REFERENCIA": "REF123456"
    }
  ],
  "page": 1,
  "pageSize": 10,
  "total": 45
}
```

#### `GET /api/citas/[id]`
Obtiene los detalles de una cita específica por su ID.

**Parámetros de ruta:**
- `id`: ID de la cita

**Respuesta:**
```json
{
  "ID_CITA": "123456",
  "PACIENTE": "2008083192",
  "NOMBRES": "GARCIA MIGUEL ANGEL",
  "DOCUMENTO": "41877141",
  "FECHA": "2025-09-15",
  "HORA": "08:30",
  "MEDICO": "ABC",
  "NOM_MEDICO": "DR. JUAN PEREZ",
  "CONSULTORIO": "C123",
  "NOM_CONSULTORIO": "MEDICINA GENERAL",
  "ESTADO": "1",
  "REFERENCIA": "REF123456",
  "OBSERVACIONES": "Primera consulta",
  "SEGURO": "20",
  "NOM_SEGURO": "SIS"
}
```

#### `POST /api/citas`
Crea una nueva cita médica.

**Cuerpo de la solicitud:**
```json
{
  "PACIENTE": "2008083192",
  "FECHA": "2025-09-15",
  "HORA": "08:30",
  "MEDICO": "ABC",
  "CONSULTORIO": "C123",
  "REFERENCIA": "REF123456",
  "OBSERVACIONES": "Primera consulta",
  "SEGURO": "20"
}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Cita creada correctamente",
  "data": {
    "ID_CITA": "123456"
  }
}
```

#### `PUT /api/citas/[id]`
Actualiza una cita existente.

**Parámetros de ruta:**
- `id`: ID de la cita

**Cuerpo de la solicitud:**
```json
{
  "FECHA": "2025-09-16",
  "HORA": "09:30",
  "MEDICO": "XYZ",
  "CONSULTORIO": "C456",
  "OBSERVACIONES": "Cita reprogramada"
}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Cita actualizada correctamente"
}
```

#### `DELETE /api/citas/[id]`
Cancela una cita (borrado lógico).

**Parámetros de ruta:**
- `id`: ID de la cita

**Respuesta:**
```json
{
  "success": true,
  "message": "Cita cancelada correctamente"
}
```

#### `GET /api/citas/disponibilidad`
Verifica la disponibilidad de horarios para un médico y fecha específicos.

**Parámetros de consulta:**
- `fecha`: Fecha a consultar (formato: YYYY-MM-DD)
- `medico`: Código del médico
- `consultorio`: Código del consultorio (opcional)

**Respuesta:**
```json
{
  "disponibilidad": [
    { "hora": "08:00", "disponible": true },
    { "hora": "08:30", "disponible": false },
    { "hora": "09:00", "disponible": true },
    { "hora": "09:30", "disponible": true }
  ]
}
```

#### `GET /api/citas/calendario`
Obtiene las citas programadas para visualización en calendario.

**Parámetros de consulta:**
- `inicio`: Fecha de inicio (formato: YYYY-MM-DD)
- `fin`: Fecha de fin (formato: YYYY-MM-DD)
- `medico`: Código del médico (opcional)
- `consultorio`: Código del consultorio (opcional)

**Respuesta:**
```json
{
  "eventos": [
    {
      "id": "123456",
      "title": "GARCIA MIGUEL - MEDICINA GENERAL",
      "start": "2025-09-15T08:30:00",
      "end": "2025-09-15T09:00:00",
      "backgroundColor": "#4CAF50",
      "borderColor": "#388E3C",
      "extendedProps": {
        "paciente": "2008083192",
        "nombres": "GARCIA MIGUEL ANGEL",
        "documento": "41877141",
        "medico": "ABC",
        "nomMedico": "DR. JUAN PEREZ",
        "consultorio": "C123",
        "nomConsultorio": "MEDICINA GENERAL"
      }
    }
  ]
}
```

#### `POST /api/citas/reprogramar`
Reprograma una cita existente.

**Cuerpo de la solicitud:**
```json
{
  "ID_CITA": "123456",
  "FECHA": "2025-09-16",
  "HORA": "10:30",
  "MEDICO": "ABC",
  "CONSULTORIO": "C123",
  "OBSERVACIONES": "Cita reprogramada por disponibilidad"
}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Cita reprogramada correctamente",
  "data": {
    "ID_CITA": "123456"
  }
}
```

# Servicio de Validación de Cuentas y FUAs

## Descripción General
El servicio `CuentaValidationService` proporciona funcionalidades para validar cuentas activas y FUAs (Formatos Únicos de Atención) según el tipo de seguro del paciente. Implementa reglas específicas para cada tipo de seguro y maneja la lógica de validación temporal para los FUAs.

## Tipos de Seguro Soportados

- **SIS** (códigos: 20, 21, 22, 23, 24, 25)
  - Requiere cuenta activa (ESTADO='1', ORIGEN='HO')
  - Requiere FUA activo (ESTADO='2')
  - El FUA debe ser reciente (último día)
  - El FUA debe tener menos de 8 horas de antigüedad

- **PAGANTE** (códigos: 0, 00)
  - Solo requiere cuenta activa (ESTADO='1', ORIGEN='HO')
  - No requiere validación de FUA

- **SOAT** (código: 02)
  - Solo requiere cuenta activa (ESTADO='1', ORIGEN='HO')
  - No requiere validación de FUA

## Métodos Principales

### `validateCuentaAndFua(pacienteId: string, tipoSeguro: string)`
Método principal que determina el tipo de seguro y aplica la validación correspondiente.

### `validateSISAccount(pacienteId: string, tipoSeguro: string)`
Valida cuentas SIS verificando:
1. Existencia de cuenta activa
2. Existencia de número de FUA asociado
3. Validez del FUA según reglas temporales

### `validatePaganteSoatAccount(pacienteId: string, tipoSeguro: string)`
Valida cuentas PAGANTE/SOAT verificando solo la existencia de una cuenta activa.

### `validateFuaActivo(fuaNumber: string)`
Valida si un FUA está activo según las reglas temporales:
1. Verifica que el FUA exista y tenga ESTADO='2'
2. Verifica que la fecha sea reciente (último día)
3. Calcula el tiempo transcurrido desde la creación del FUA
4. Valida que el tiempo transcurrido sea menor a 8 horas

## Manejo de Formatos de Hora
El método `validateFuaActivo` implementa un manejo robusto de diferentes formatos de hora:

- Utiliza `TRY_CAST` para evitar errores de conversión
- Maneja múltiples formatos de hora:
  - HH:MM (ej. "8:30", "08:30")
  - HHMM sin separador (ej. "830", "0830")
  - Solo hora (ej. "8", "08")
  - Vacío o nulo
  - Con segundos (ej. "8:30:00")
  - Con punto como separador (ej. "8.30")

## Estrategias de Fallback
Si la conversión de fecha/hora falla, el servicio implementa estrategias alternativas:

1. **Cálculo alternativo**: Usa solo la fecha sin la hora
2. **Enfoque de último recurso**: Verifica solo la existencia del FUA activo reciente

## Métodos de Actualización (Borrado Lógico)

### `updateFUA(nroFua: string)`
Actualiza el estado de un FUA a inactivo (ESTADO='0').

### `updateCUENTA(cuentaId: string)`
Actualiza el estado de una cuenta a inactiva (ESTADO='0').

### `updateCuentaAndFUA(cuentaId: string)`
Actualiza tanto la cuenta como su FUA asociado a estado inactivo.

## Endpoints API

### `/api/cuenta/validate`
Valida cuentas y FUAs según el tipo de seguro.
- **GET**: Acepta parámetros `patientId`, `tipoSeguro` y `debug`
- **POST**: Acepta body con `patientId` y `tipoSeguro`

### `/api/cuenta/deactivate`
Desactiva cuentas y FUAs (borrado lógico).
- **POST/PATCH**: Acepta body con `cuentaId` y `deactivateFua` (opcional)

### `/api/cuenta/test-fua-validation`
Endpoint de prueba para validar FUAs con diferentes formatos de hora.
- **GET**: Acepta parámetro `fuaNumber`


## Instalación y Configuración

### Requisitos Previos

- Node.js 16.x o superior
- NPM o Yarn
- PostgreSQL 13+ (recomendado) o compatible con Prisma

### Pasos de Instalación

1. Clonar el repositorio:
   ```bash
   git clone https://github.com/tu-organizacion/hospital-management-system.git
   cd hospital-management-system
   ```

2. Instalar dependencias:
   ```bash
   npm install
   # o
   yarn install
   ```

3. Configurar variables de entorno:
   ```bash
   cp .env.example .env
   # Editar el archivo .env con tus credenciales
   ```

4. Ejecutar migraciones iniciales:
   ```bash
   npx prisma migrate dev --name init
   ```

5. Poblar datos iniciales (opcional):
   ```bash
   npx prisma db seed
   ```

## Desarrollo

### Scripts Disponibles

- `dev`: Inicia el servidor de desarrollo
  ```bash
  npm run dev
  ```

- `build`: Compila la aplicación para producción
  ```bash
  npm run build
  ```

- `start`: Inicia la aplicación en producción
  ```bash
  npm start
  ```

- `lint`: Ejecuta el linter
  ```bash
  npm run lint
  ```

- `prisma:studio`: Abre el cliente visual de Prisma
  ```bash
  npx prisma studio
  ```

### Documentación de API

El sistema incluye documentación completa de la API usando Swagger UI:

- **URL**: `/api/docs` o directamente `/swagger.html`
- **Contenido**: Documentación detallada de todos los endpoints de la API
- **Módulos documentados**:
  - Citas médicas
  - Emergencias
  - Hospitalización
  - Tablas maestras (médicos, consultorios, localidades)
  - Cuentas y validaciones

Para acceder a la documentación, inicie el servidor de desarrollo y navegue a `http://localhost:3001/api/docs`

### Convenciones de Código

- **Componentes**: Usar PascalCase (ej. `PatientForm.tsx`)
- **Hooks**: Prefijo `use` (ej. `usePatientData.ts`)
- **Servicios**: Sufijo `Service` (ej. `emergenciaService.ts`)
- **Utilidades**: Sufijo `Utils` (ej. `dateFormatUtils.ts`)

## Contribución

1. Haz un fork del repositorio
2. Crea una rama para tu feature (`git checkout -b feature/amazing-feature`)
3. Haz commit de tus cambios (`git commit -m 'Add some amazing feature'`)
4. Haz push a la rama (`git push origin feature/amazing-feature`)
5. Abre un Pull Request

### Guía de Estilo

- Sigue el [Código de Conducta](CODE_OF_CONDUCT.md)
- Asegúrate de que los tests pasen
- Actualiza la documentación según sea necesario
- Mantén los commits atómicos y con mensajes descriptivos

## Despliegue

### Producción

1. Configurar variables de entorno de producción
2. Construir la aplicación:
   ```bash
   npm run build
   ```
3. Iniciar la aplicación:
   ```bash
   npm start
   ```

### Docker

```bash
docker-compose up -d
```

## Soporte

Para reportar problemas o solicitar características, por favor abre un [issue](https://github.com/tu-organizacion/hospital-management-system/issues).

## Licencia

Distribuido bajo la licencia MIT. Ver `LICENSE` para más información.

---

Desarrollado por Jorge Holguin - 2025
## Docker

El proyecto incluye configuración para Docker Compose. Para iniciar la aplicación con Docker:

1. Crear un archivo `.env` basado en `.env.example`
2. Ejecutar:
   ```bash
   docker-compose up -d
   ```

La aplicación estará disponible en `http://localhost:3000`

## Pruebas

Para ejecutar las pruebas unitarias:

```bash
npm test
```

Para ejecutar pruebas de extremo a extremo:

```bash
npm run test:e2e
```

## Contribución

1. Crear una rama para tu característica (`git checkout -b feature/amazing-feature`)
2. Realizar cambios y pruebas
3. Confirmar cambios (`git commit -m 'Add some amazing feature'`)
4. Enviar a la rama (`git push origin feature/amazing-feature`)
5. Abrir un Pull Request

## Licencia

Este proyecto está licenciado bajo [Licencia Privada] - ver el archivo LICENSE para más detalles.
