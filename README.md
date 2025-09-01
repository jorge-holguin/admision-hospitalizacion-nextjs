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
- **Pacientes**: Registro centralizado de historias clínicas
- **Tablas Maestras**: Administración de recursos médicos y referenciales
- **Autenticación**: Control de acceso basado en roles
- **API RESTful**: Arquitectura modular con endpoints bien definidos

## Estructura del Proyecto

### API (app/api/)

```
api/
├── consultorio/               # Endpoints de consultorios
├── cuenta/                    # Gestión de cuentas de pacientes
│   ├── buscar-por-seguro/     # Búsqueda por tipo de seguro
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
└── master-tables/             # Tablas de referencia
    ├── consultorios/          # Gestión de consultorios
    ├── localidades/           # Gestión de localidades
    └── medicos/              # Gestión de médicos
```

### Frontend (app/)

```
app/
├── change-password/          # Cambio de contraseña
├── dashboard/                # Panel principal
├── emergency/                # Módulo de emergencias
│   ├── [patientId]/          # Detalle de emergencia
│   ├── edit/                 # Edición de emergencia
│   └── register/             # Registro de emergencia
└── hospitalization/          # Módulo de hospitalización
    ├── orders/              # Órdenes de hospitalización
    ├── register/            # Registro de hospitalización
    └── view/                # Visualización de hospitalización
```

### Estructura de Código

```
components/                   # Componentes reutilizables
├── dashboard/                # Componentes del dashboard
├── emergency/                # Componentes de emergencias
├── hospitalization/          # Componentes de hospitalización
├── master-tables/            # Componentes para tablas maestras
└── ui/                       # Componentes de interfaz base

contexts/                     # Contextos de React
├── MedicosContext.tsx        # Gestión de médicos
├── PatientAccountContext.tsx # Cuentas de pacientes
├── PatientContext.tsx        # Datos de pacientes
└── PatientDataContext.tsx    # Datos clínicos

hooks/                        # Hooks personalizados
├── master-tables/            # Hooks para tablas maestras
├── use-mobile.tsx            # Detección móvil
└── use-toast.ts              # Notificaciones

services/                     # Lógica de negocio
├── emergencia/               # Servicios de emergencia
├── hospitalizacion/          # Servicios de hospitalización
└── master-tables/            # Servicios de tablas maestras

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

## Licencia

Este proyecto está bajo la licencia MIT. Ver el archivo `LICENSE` para más detalles.

---

Desarrollado por [Tu Organización] - 2025

## Servicios

La lógica de negocio está organizada en servicios modulares:

- **emergenciaService**: Gestión de casos de emergencia
- **hospitalizacionService**: Gestión de hospitalizaciones
- **cuentaService**: Validación y gestión de cuentas
- **consultorioService**: Administración de consultorios
- **medicoService**: Gestión de médicos y especialidades

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
