# Sistema de Gestión Hospitalaria

[![Next.js](https://img.shields.io/badge/Next.js-15.0+-000000?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-4.0+-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.0+-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)

## Descripción General

Sistema integral de gestión hospitalaria desarrollado con Next.js 15, diseñado para administrar los procesos de admisión, emergencia y hospitalización en centros médicos. La plataforma ofrece una solución modular y escalable para la gestión de pacientes, personal médico y recursos hospitalarios.

## Características Principales

- **Módulo de Filiación**: Registro y gestión de datos de pacientes
- **Módulo de Emergencias**: Registro y seguimiento de atenciones de emergencia
- **Módulo de Hospitalización**: Gestión completa de ingresos y altas hospitalarias
- **Módulo de Citas**: Programación y gestión de citas médicas
- **Tablas Maestras**: Administración de recursos médicos y referenciales
- **Gestión de Cuentas**: Validación de cuentas y FUAs por tipo de seguro
- **API RESTful**: Arquitectura modular con endpoints bien definidos
- **Contextos Optimizados**: Sistema de contextos para evitar llamadas API redundantes

## Estructura del Proyecto

### API (app/api/)

```
api/
├── accounts/                  # Gestión de cuentas de pacientes
│   ├── search-by-insurance/   # Búsqueda por tipo de seguro
│   ├── validate/              # Validación de cuentas y FUAs
│   └── update/                # Actualización de cuentas
├── appointments/              # Módulo de citas médicas
│   ├── [id]/                  # Operaciones por ID de cita
│   ├── archivo-mov/           # Archivo de movimientos
│   ├── doctor-by-date/        # Médicos disponibles por fecha
│   ├── insurances/            # Seguros para citas
│   ├── search-by-document/    # Búsqueda por documento
│   ├── search-by-name/        # Búsqueda por nombre
│   ├── sis-entities/          # Entidades SIS
│   └── types/                 # Tipos de cita
├── emergency/                 # Módulo de emergencias
│   ├── [id]/                  # Operaciones por ID (GET, PATCH, DELETE)
│   ├── admission-types/       # Formas de ingreso
│   ├── patient/               # Emergencias por paciente
│   └── reasons/               # Motivos de emergencia
├── filiation/                 # Módulo de filiación
│   ├── [id]/                  # Operaciones por ID de paciente
│   ├── patient/               # Datos del paciente
│   ├── save/                  # Guardar filiación
│   └── search/                # Búsqueda de pacientes
├── historia-clinica/          # Historia clínica
├── hospitalization/           # Módulo de hospitalización
│   ├── [id]/                  # Operaciones por ID
│   ├── accounts/              # Cuentas de hospitalización
│   ├── attentions/            # Atenciones hospitalarias
│   ├── diagnostics/           # Diagnósticos (search, [id])
│   ├── hospitalization-order/ # Órdenes de hospitalización
│   ├── origins/               # Orígenes de hospitalización
│   └── patient/               # Hospitalizaciones por paciente
├── master-tables/             # Tablas maestras
│   ├── consultorio-types/     # Tipos de consultorio
│   ├── consultorios/          # Gestión de consultorios
│   ├── localidades/           # Gestión de localidades
│   ├── medicos/               # Gestión de médicos
│   ├── profesiones-colegio/   # Profesiones y colegios
│   └── specialties/           # Especialidades médicas
├── ubigeo/                    # Gestión de ubigeos
└── utils/                     # Utilidades de API
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
│   ├── AppointmentCalendar.tsx
│   ├── AppointmentDetailsModal.tsx
│   └── AppointmentsTable.tsx
├── dashboard/                # Componentes del dashboard
├── emergency/                # Componentes de emergencias
│   ├── modals/               # Modales de emergencia
│   │   ├── EmergencyMainModal.tsx
│   │   ├── EmergencyModalProvider.tsx
│   │   ├── EmergencyRegistrationModal.tsx
│   │   └── EmergencyListModal.tsx
│   ├── register/             # Registro de emergencias
│   │   ├── EmergencyFormRefactored.tsx
│   │   ├── EmergencySection.tsx
│   │   ├── AdditionalFieldsSection.tsx
│   │   ├── FormHeaderEmergency.tsx
│   │   └── FuaEmergencyStatusAlert.tsx
│   ├── selectors/            # Selectores reutilizables
│   └── view/                 # Visualización de emergencias
├── hospitalization/          # Componentes de hospitalización
│   ├── modals/               # Modales de hospitalización
│   ├── register/             # Registro de hospitalizaciones
│   └── view/                 # Visualización de hospitalizaciones
├── master-tables/            # Componentes para tablas maestras
│   ├── modals/               # Formularios modales
│   └── tables/               # Tablas de datos
└── ui/                       # Componentes de interfaz base
    ├── SearchableSelect.tsx  # Select con búsqueda
    ├── dialog.tsx            # Modal dialog
    └── ...                   # Componentes shadcn/ui

contexts/                     # Contextos de React
├── ConsultoriosContext.tsx   # Gestión de consultorios
├── DiagnosticosContext.tsx   # Gestión de diagnósticos
├── EmergencyAccountContext.tsx # Cuentas de emergencia (con caché)
├── EmergencyProvider.tsx     # Provider unificado de emergencias
├── FormasIngresoContext.tsx  # Formas de ingreso
├── MedicosContext.tsx        # Gestión de médicos
├── MotivosEmergenciaContext.tsx # Motivos de emergencia
├── OrigenHospitalizacionContext.tsx # Orígenes de hospitalización
├── PatientAccountContext.tsx # Cuentas de pacientes (con caché)
├── PatientContext.tsx        # Datos de pacientes
├── PatientDataContext.tsx    # Datos clínicos del paciente
├── ReferenciaContext.tsx     # Referencias médicas
├── SeguroContext.tsx         # Seguro individual
├── SegurosCitaContext.tsx    # Seguros para citas
├── SegurosContext.tsx        # Gestión de seguros
├── ServerDateTimeContext.tsx # Fecha/hora del servidor
├── TipoCitaContext.tsx       # Tipos de cita
├── TiposDocumentoContext.tsx # Tipos de documento (local)
└── filiation/                # Contextos de filiación
    ├── EstadoCivilContext.tsx
    ├── EtniaContext.tsx
    ├── FiliationProvider.tsx # Provider unificado de filiación
    ├── GradoInstruccionContext.tsx
    ├── OcupacionContext.tsx
    ├── PaisContext.tsx
    ├── ReligionContext.tsx
    ├── TipoDocumentoContext.tsx # Tipos de documento (global)
    └── index.ts

hooks/                        # Hooks personalizados
├── master-tables/            # Hooks para tablas maestras
│   ├── useConsultorios.ts
│   ├── useConsultorioById.ts
│   ├── useMedicos.ts
│   └── useMedicoById.ts
├── use-mobile.tsx            # Detección móvil
└── use-toast.ts              # Notificaciones

services/                     # Lógica de negocio
├── citas/                    # Servicios de citas
│   └── entidadSisService.ts
├── emergencia/               # Servicios de emergencia
│   ├── consultorioService.ts
│   ├── emergenciaService.ts
│   └── cuentaService.ts
├── hospitalizacion/          # Servicios de hospitalización
│   ├── consultorioService.ts
│   ├── cuentaFuaService.ts
│   └── cuentaValidationService.ts
└── master-tables/            # Servicios de tablas maestras
    ├── consultorioService.ts
    ├── localidadService.ts
    └── medicoService.ts

lib/                          # Librerías y utilidades core
├── ageCalculator.ts          # Cálculo de edad (formato: 000a00m00d)
├── auth.ts                   # Autenticación
├── constants/                # Constantes del sistema
├── env.ts                    # Variables de entorno
├── prisma.ts                 # Cliente Prisma
└── utils.ts                  # Utilidades generales
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

### Filiación de Pacientes
- Registro y búsqueda de pacientes
- Datos demográficos completos
- Gestión de documentos de identidad
- Datos de ubigeo y localización
- Contextos optimizados para evitar llamadas API redundantes

### Citas Médicas
- Programación de citas con médicos
- Calendario de disponibilidad
- Asignación de consultorios
- Reprogramación y cancelación
- Validación de seguros SIS
- Generación de referencias

### Emergencias
- Registro de pacientes en emergencia
- Formulario refactorizado con validaciones
- Asignación de consultorios y médicos
- Validación de seguros y FUA
- Formas de ingreso y motivos de emergencia
- Gestión de acompañantes
- Cálculo automático de edad (mínimo 1 día: `000a00m01d`)

### Hospitalización
- Órdenes de hospitalización
- Gestión de camas y consultorios
- Control de altas
- Seguimiento clínico
- Validación de cuentas por tipo de seguro

### Tablas Maestras
- Gestión de médicos y especialidades
- Gestión de consultorios y tipos
- Gestión de localidades
- Profesiones y colegios

## Optimización de Data Fetching

El sistema implementa un patrón de contextos optimizados para evitar llamadas API redundantes:

### Providers Unificados
- **EmergencyProvider**: Agrupa contextos de emergencia (Seguros, Médicos, Consultorios, etc.)
- **FiliationProvider**: Agrupa contextos de filiación (TipoDocumento, EstadoCivil, etc.)

### Caché de Datos
- Los contextos implementan caché por `patientId` y `tipoSeguro`
- Prevención de solicitudes duplicadas con `inFlightRequests`
- Reutilización de datos ya cargados entre componentes

### Contextos Globales vs Locales
- **TipoDocumentoContext** (global): Disponible en `layout.tsx` para toda la app
- **SegurosContext**: Cargado en `EmergencyProvider` para el módulo de emergencias

## Tecnologías

- **Frontend**: Next.js 15+, React 19+, TypeScript 5+
- **Estilos**: Tailwind CSS 3+, Shadcn UI
- **Backend**: Next.js API Routes (App Router)
- **Base de Datos**: SQL Server con Prisma ORM
- **Autenticación**: NextAuth.js
- **Validación**: Zod
- **Iconos**: Lucide React
- **Documentación API**: Swagger UI
- **Testing**: Jest, Playwright

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

## Módulo de Cuentas (`/api/accounts`)

### `GET /api/accounts/validate`
Valida cuentas y FUAs según el tipo de seguro.

**Parámetros de consulta:**
- `patientId`: ID del paciente
- `tipoSeguro`: Código de seguro

### `GET /api/accounts/search-by-insurance/[patientId]`
Busca cuenta activa por paciente y tipo de seguro.

**Parámetros de consulta:**
- `seguro`: Código de seguro

### `PATCH /api/accounts/update`
Actualiza el estado de una cuenta.

---

## Módulo de Citas (`/api/appointments`)

El módulo de citas proporciona funcionalidades para la gestión completa de citas médicas.

### `GET /api/appointments`
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

### `GET /api/appointments/insurances`
Obtiene la lista de seguros disponibles para citas.

**Parámetros de consulta:**
- `codCita`: Código de tipo de cita (default: 1)

### `GET /api/appointments/types`
Obtiene los tipos de cita disponibles.

### `GET /api/appointments/search-by-document`
Busca pacientes por documento.

**Parámetros de consulta:**
- `documento`: Número de documento

### `GET /api/appointments/search-by-name`
Busca pacientes por nombre.

**Parámetros de consulta:**
- `nombre`: Nombre a buscar

### `GET /api/appointments/[id]`
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

---

## Módulo de Emergencias (`/api/emergency`)

### `GET /api/emergency`
Obtiene listado de emergencias.

### `POST /api/emergency`
Crea una nueva emergencia.

**Cuerpo de la solicitud:**
```json
{
  "PACIENTE": "2008083192",
  "FECHA": "20250915",
  "HORA": "08:30 AM",
  "MEDICO": "ABC",
  "CONSULTORIO": "C123",
  "MOTIVO": "01",
  "DIAGNOSTICO": "A000",
  "SEGURO": "20",
  "FORMA_INGRESO": "1",
  "EDAD": "029a08m01d"
}
```

### `GET /api/emergency/[id]`
Obtiene los detalles de una emergencia específica.

### `PATCH /api/emergency/[id]`
Actualiza una emergencia existente.

### `DELETE /api/emergency/[id]`
Elimina (borrado lógico) una emergencia.

### `GET /api/emergency/patient/[patientId]`
Obtiene las emergencias de un paciente específico.

### `GET /api/emergency/reasons`
Obtiene los motivos de emergencia disponibles.

### `GET /api/emergency/admission-types`
Obtiene las formas de ingreso disponibles.

---

## Módulo de Hospitalización (`/api/hospitalization`)

### `GET /api/hospitalization`
Obtiene listado de hospitalizaciones.

### `POST /api/hospitalization`
Crea una nueva hospitalización.

### `GET /api/hospitalization/[id]`
Obtiene los detalles de una hospitalización específica.

### `PATCH /api/hospitalization/[id]`
Actualiza una hospitalización existente.

### `GET /api/hospitalization/patient/[patientId]`
Obtiene las hospitalizaciones de un paciente específico.

### `GET /api/hospitalization/origins`
Obtiene los orígenes de hospitalización disponibles.

### `GET /api/hospitalization/diagnostics/search`
Busca diagnósticos CIE-10.

**Parámetros de consulta:**
- `q`: Término de búsqueda

### `GET /api/hospitalization/accounts/[patientId]`
Obtiene las cuentas de hospitalización de un paciente.

---

## Módulo de Filiación (`/api/filiation`)

### `GET /api/filiation/search`
Busca pacientes en el sistema.

**Parámetros de consulta:**
- `documento`: Número de documento
- `nombre`: Nombre del paciente

### `GET /api/filiation/patient/[id]`
Obtiene datos completos de filiación de un paciente.

### `POST /api/filiation/save`
Guarda o actualiza datos de filiación.

### `GET /api/filiation/[id]`
Obtiene datos de filiación por ID de paciente.

---

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

## Pruebas

Para ejecutar las pruebas unitarias:

```bash
npm test
```

Para ejecutar pruebas de extremo a extremo:

```bash
npm run test:e2e
```

## Soporte

Para reportar problemas o solicitar características, por favor abre un [issue](https://github.com/jorge-holguin/hospital-management-system/issues).

## Licencia

Este proyecto está licenciado bajo Licencia Privada - ver el archivo LICENSE para más detalles.

---

Desarrollado por Jorge Holguin - 2025
