# API Structure Documentation

## Nueva Estructura de APIs Reorganizada

Esta documentación describe la estructura reorganizada de las APIs del sistema de gestión hospitalaria.

---

## 📁 FILIATION (`/api/filiation/`)

APIs para búsqueda y gestión de filiación de pacientes.

### Endpoints:

- **GET** `/api/filiation/search` - Búsqueda de pacientes
  - Query params: `page`, `pageSize`, `documento`, `nombres`, `historia`
  - Ejemplo: `http://localhost:3000/api/filiation/search?page=1&pageSize=10&documento=73101361`

- **GET** `/api/filiation/[id]` - Obtener paciente por ID
  - Ejemplo: `http://localhost:3000/api/filiation/2015247539`

---

## 🚨 EMERGENCY (`/api/emergency/`)

APIs para gestión de emergencias.

### Endpoints:

- **GET** `/api/emergency/patient/[patientId]` - Lista de emergencias por paciente
  - Query params: `page`, `pageSize`
  - Ejemplo: `http://localhost:3000/api/emergency/patient/2015247539?page=1&pageSize=5`

- **GET** `/api/emergency/[id]` - Obtener emergencia específica
- **PATCH** `/api/emergency/[id]` - Actualizar emergencia
- **DELETE** `/api/emergency/[id]` - Eliminar emergencia (lógica)

- **POST** `/api/emergency` - Crear nueva emergencia
  - Query param: `next-id=true` para calcular numeración

- **POST** `/api/emergency/[id]/assign-account` - Asignar cuenta (PAGANTE/SOAT)

### Datos maestros:

- **GET** `/api/emergency/admission-types` - Formas de ingreso
- **GET** `/api/emergency/reasons` - Motivos de emergencia

---

## 🏥 HOSPITALIZATION (`/api/hospitalization/`)

APIs para gestión de hospitalizaciones.

### Endpoints:

- **GET** `/api/hospitalization` - Lista de hospitalizaciones
  - Query params: `page`, `pageSize`, `pacienteId`
  - Ejemplo: `http://localhost:3000/api/hospitalization?page=1&pageSize=5&pacienteId=2025352999`

- **GET** `/api/hospitalization/patient/[patientId]` - Hospitalizaciones por paciente
  - Query params: `page`, `pageSize`
  - Ejemplo: `http://localhost:3000/api/hospitalization/patient/2025352999?page=1&pageSize=5`

- **GET** `/api/hospitalization/[id]` - Obtener hospitalización específica
- **PATCH** `/api/hospitalization/[id]` - Actualizar hospitalización
- **DELETE** `/api/hospitalization/[id]` - Eliminar hospitalización

- **POST** `/api/hospitalization/[id]/assign-account` - Asignar cuenta

### Datos maestros:

- **GET** `/api/hospitalization/origins` - Orígenes de hospitalización (EM, CE, RN, TR, RE)
- **GET** `/api/hospitalization/diagnostics` - Diagnósticos
  - Query params: `search`, `limit`, `origen`, `codigo`

---

## 📅 APPOINTMENTS (`/api/appointments/`)

APIs para gestión de citas médicas.

### Endpoints:

- **GET** `/api/appointments/search-by-document` - Buscar citas por documento
  - Query params: `page`, `size`, `documento`
  - Ejemplo: `http://localhost:3000/api/appointments/search-by-document?page=0&size=10&documento=73101361`

- **GET** `/api/appointments/search-by-name` - Buscar citas por nombre
  - Query params: `page`, `size`, `nombres`
  - Ejemplo: `http://localhost:3000/api/appointments/search-by-name?page=0&size=10&nombres=HOLGUIN+CUCALON`

### Datos maestros:

- **GET** `/api/appointments/types` - Tipos de cita
- **GET** `/api/appointments/insurances` - Seguros para citas
  - Query param: `codCita`
  - Ejemplo: `http://localhost:3000/api/appointments/insurances?codCita=1`

- **GET** `/api/appointments/sis-entities` - Entidades SIS
  - Query param: `limit`

---

## 📋 MASTER-TABLES (`/api/master-tables/`)

APIs para tablas maestras del sistema.

### Médicos:

- **GET** `/api/master-tables/medicos` - Lista paginada de médicos
  - Query params: `page`, `pageSize`
  
- **GET** `/api/master-tables/medicos/[id]` - Obtener médico por ID
- **POST** `/api/master-tables/medicos` - Crear médico
- **PUT** `/api/master-tables/medicos/[id]` - Actualizar médico
- **DELETE** `/api/master-tables/medicos/[id]` - Eliminar médico

- **GET** `/api/master-tables/medicos/search` - Buscar médicos
  - Query params: `search`, `consultorio`, `codigos`, `limit`
  - Ejemplo: `http://localhost:3000/api/master-tables/medicos/search?search=garcia`

- **POST** `/api/master-tables/medicos/suggest-code` - Sugerir código para médico
  - Body: `{ "nombreCompleto": "string" }`

### Consultorios:

- **GET** `/api/master-tables/consultorios` - Lista paginada de consultorios
  - Query params: `page`, `pageSize`

- **GET** `/api/master-tables/consultorios/[id]` - Obtener consultorio por ID
- **POST** `/api/master-tables/consultorios` - Crear consultorio
- **PUT** `/api/master-tables/consultorios/[id]` - Actualizar consultorio
- **DELETE** `/api/master-tables/consultorios/[id]` - Eliminar consultorio

- **GET** `/api/master-tables/consultorios/search` - Buscar consultorios
  - Query params: `tipo` (E=Emergencia, H=Hospitalización, C=Citas), `search`
  - Ejemplo: `http://localhost:3000/api/master-tables/consultorios/search?tipo=E`
  - Ejemplo: `http://localhost:3000/api/master-tables/consultorios/search?tipo=H`

- **GET** `/api/master-tables/consultorios/by-specialty` - Consultorios por especialidad
  - Query param: `especialidad`
  - Ejemplo: `http://localhost:3000/api/master-tables/consultorios/by-specialty?especialidad=0024`

### Localidades:

- **GET** `/api/master-tables/localidades` - Lista paginada de localidades
  - Query params: `page`, `pageSize`

- **GET** `/api/master-tables/localidades/[id]` - Obtener localidad por ID
- **POST** `/api/master-tables/localidades` - Crear localidad
- **PUT** `/api/master-tables/localidades/[id]` - Actualizar localidad
- **DELETE** `/api/master-tables/localidades/[id]` - Eliminar localidad

### Datos de referencia:

- **GET** `/api/master-tables/specialties` - Especialidades médicas
- **GET** `/api/master-tables/consultorio-types` - Tipos de consultorio

---

## 🔧 UTILS (`/api/utils/`)

APIs de utilidades y datos comunes.

### Endpoints:

- **GET** `/api/utils/document-types` - Tipos de documento
  - Query params: `search`, `code`
  - Ejemplo: `http://localhost:3000/api/utils/document-types`

- **GET** `/api/utils/insurances` - Seguros
  - Query params: `code`, `search`
  - Ejemplo: `http://localhost:3000/api/utils/insurances`

- **GET** `/api/utils/datetime` - Fecha y hora del servidor
  - Ejemplo: `http://localhost:3000/api/utils/datetime`

---

## 💳 ACCOUNTS (`/api/accounts/`)

APIs para gestión de cuentas de pacientes.

### Endpoints:

- **GET** `/api/accounts/[pacienteId]` - Obtener cuenta por ID de paciente
  - Ejemplo: `http://localhost:3000/api/accounts/2015247539`

- **GET** `/api/accounts/search-by-insurance/[pacienteId]` - Buscar cuenta por seguro
  - Query param: `seguro`
  - Ejemplo: `http://localhost:3000/api/accounts/search-by-insurance/2025352999?seguro=0`

- **GET** `/api/accounts/validate` - Validar cuenta
  - Query params: `patientId`, `tipoSeguro`
  - Ejemplo: `http://localhost:3000/api/accounts/validate?patientId=2025352999&tipoSeguro=0`

---

## 📝 Notas Importantes

### Tipos de Consultorio:
- **E** = Emergencia
- **H** = Hospitalización
- **C** = Citas/Consulta Externa

### Códigos de Seguro:
- **0, 00** = PAGANTE
- **02** = SOAT
- **20-25, 01** = SIS (diversos tipos)
- **17** = Otros programas

### Paginación:
La mayoría de endpoints que devuelven listas soportan paginación con:
- `page`: Número de página (default: 1)
- `pageSize`: Tamaño de página (default: 10)

### Respuestas:
Formato estándar de respuesta exitosa:
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "pageSize": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

Formato estándar de error:
```json
{
  "success": false,
  "message": "Mensaje de error",
  "error": "Detalles del error"
}
```

---

## 🗑️ APIs Eliminadas (No Usadas)

Las siguientes APIs fueron eliminadas por no estar en uso:

- `/api/citas/a8b7citas/entidad-sis` (duplicado/typo)
- `/api/consultorio/check-codigo`
- `/api/consultorio/emergency-departments`
- `/api/cuenta/deactivate`
- `/api/cuenta/update/[cuentaId]`
- `/api/cuenta/update-with-fua/[cuentaId]`
- `/api/diagnosticos/[id]`
- `/api/docs`
- `/api/emergencia/active/[patientId]`
- `/api/emergencia/[id]/delete`
- `/api/filiacion2/count`
- `/api/filiacion2/optimized`
- `/api/fua/update/[nroFua]`
- `/api/hospitaliza/*` (toda la estructura antigua)
- `/api/localidad/check-codigo`
- `/api/paciente/*`

---

## 📂 Páginas Duplicadas

### `/app/pacientes` vs `/app/filiation`

Ambas páginas existen actualmente:
- **`/app/filiation`**: Página más completa con componentes modulares (RECOMENDADA)
- **`/app/pacientes`**: Página antigua, puede ser eliminada

**Recomendación**: Eliminar `/app/pacientes` y usar únicamente `/app/filiation`.

---

Última actualización: 13 de Octubre, 2025
