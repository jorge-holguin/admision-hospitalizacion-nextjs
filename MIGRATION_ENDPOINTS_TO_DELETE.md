# Endpoints Next.js Obsoletos - Lista para Eliminación

Después de la migración a Spring Boot, los siguientes endpoints de Next.js son **redundantes** y pueden eliminarse de forma segura. Los servicios migrados ya llaman directamente al backend Spring Boot.

## ✅ IP del Backend Actualizada
- **Antes:** `192.168.0.252:9011`
- **Ahora:** `192.168.5.239:9011` (actualizado en `lib/api-config.ts`)

---

## 📁 Endpoints a Eliminar

### 1. Master Tables - Médicos
**Directorio:** `/app/api/master-tables/medicos/`

Archivos:
- `route.ts` - GET/POST para listar y crear médicos
- `[id]/route.ts` - GET/PUT/DELETE para médico específico
- `search/route.ts` - Búsqueda de médicos
- `suggest-code/route.ts` - Sugerir código de médico

**Razón:** El servicio `medicoServerService` en `services/master-tables/medicoService.ts` ya llama directamente a Spring Boot.

**Componentes que usan estos endpoints (necesitan actualización):**
- `hooks/useMedicosOnDemand.ts` - línea 39: `/api/master-tables/medicos/search`
- `contexts/MedicosContext.tsx` - líneas 60, 64, 114: `/api/master-tables/medicos/search`
- `hooks/useMedicos.ts` - línea 19: `/api/master-tables/medicos/search`
- `components/appointments/selectors/MedicoSelector.tsx` - línea 91: `/api/master-tables/medicos/search`
- `components/master-tables/modals/MedicoForm.tsx` - línea 287: `/api/master-tables/medicos/suggest-code`
- `hooks/master-tables/useOptimizedMedicos.ts` - líneas 14, 32, 57: `/api/master-tables/medicos`
- `hooks/master-tables/useMedicos.ts` - líneas 60, 104, 129, 154, 178: `/api/master-tables/medicos`
- `hooks/master-tables/useMedicoById.ts` - línea 20: `/api/master-tables/medicos/${id}`

---

### 2. Master Tables - Consultorios
**Directorio:** `/app/api/master-tables/consultorios/`

Archivos:
- `route.ts` - GET/POST para listar y crear consultorios
- `[id]/route.ts` - GET/PUT/DELETE para consultorio específico
- `search/route.ts` - Búsqueda de consultorios
- `by-specialty/route.ts` - Consultorios por especialidad

**Razón:** El servicio `consultorioServerService` ya llama directamente a Spring Boot.

---

### 3. Master Tables - Localidades
**Directorio:** `/app/api/master-tables/localidades/`

Archivos:
- `route.ts` - GET/POST para listar y crear localidades
- `[id]/route.ts` - GET/PUT/DELETE para localidad específica

**Razón:** El servicio `localidadServerService` ya llama directamente a Spring Boot.

---

### 4. Master Tables - Profesiones Colegio
**Directorio:** `/app/api/master-tables/profesiones-colegio/`

Archivos:
- `route.ts` - GET para listar profesiones colegio

**Razón:** El servicio `profesionesColegioService` ya llama directamente a Spring Boot.

---

### 5. Emergency
**Directorio:** `/app/api/emergency/`

Archivos:
- `route.ts` - GET/POST para listar y crear emergencias
- `[id]/` - Operaciones sobre emergencia específica
- `admission-types/route.ts` - Tipos de admisión
- `reasons/route.ts` - Motivos de emergencia
- `patient/route.ts` - Emergencias por paciente
- Otros subdirectorios

**Razón:** Los servicios en `services/emergencia/` ya llaman directamente a Spring Boot.

---

### 6. Filiation
**Directorio:** `/app/api/filiation/`

Archivos:
- `search/route.ts` - Búsqueda de pacientes
- `[id]/route.ts` - Paciente por ID
- `save/route.ts` - Guardar paciente
- `patient/route.ts` - Operaciones de paciente

**Razón:** Los servicios `filiacion2Service` y `filiacionService` ya llaman directamente a Spring Boot.

---

### 7. Hospitalization
**Directorio:** `/app/api/hospitalization/`

Archivos:
- `route.ts` - GET/POST para hospitalizaciones
- `[id]/route.ts` - Operaciones sobre hospitalización específica
- `accounts/` - Cuentas de hospitalización
- `diagnostics/` - Diagnósticos
- `origins/` - Orígenes de hospitalización
- Otros subdirectorios

**Razón:** Los servicios en `services/hospitalizacion/` ya llaman directamente a Spring Boot.

---

## 🔄 Pasos para Eliminación Segura

### Opción A: Eliminación Inmediata (Más Rápida)
1. Actualizar todos los componentes para usar servicios directamente
2. Eliminar directorios `/app/api/master-tables`, `/app/api/emergency`, `/app/api/filiation`, `/app/api/hospitalization`
3. Probar la aplicación

### Opción B: Eliminación Gradual (Más Segura)
1. Mantener endpoints como proxies temporalmente
2. Actualizar componentes uno por uno
3. Eliminar endpoints cuando todos los componentes estén migrados

---

## ⚠️ Endpoints que DEBEN MANTENERSE

Los siguientes endpoints NO deben eliminarse porque no tienen equivalente en Spring Boot:

- `/app/api/swagger/` - Documentación de API
- `/app/api/appointments/` - Algunos endpoints específicos de citas pueden no estar migrados completamente
- `/app/api/accounts/` - Verificar antes de eliminar
- `/app/api/utils/` - Verificar antes de eliminar

---

## 📝 Notas de Implementación

**Estado Actual:**
- ✅ Servicios migrados a Spring Boot
- ✅ IP del backend actualizada a `192.168.5.239:9011`
- ❌ Componentes aún llaman a endpoints de Next.js
- ❌ Endpoints de Next.js actúan como proxies innecesarios

**Próximos Pasos:**
1. Actualizar componentes para usar servicios migrados directamente
2. Eliminar endpoints obsoletos
3. Verificar funcionamiento completo

---

## 🐛 Error Actual

**Problema:**
```
URL solicitada: http://localhost:3000/api/master-tables/medicos?page=1&pageSize=10
Error: 500 Internal Server Error
```

**Causa:**
El endpoint de Next.js `/app/api/master-tables/medicos/route.ts` llama a `medicoServerService.getMedicos()`, que hace fetch a Spring Boot pero falla con 404.

**Solución:**
Los componentes deben llamar directamente al servicio `medicoServerService` en lugar de usar el endpoint de Next.js.
