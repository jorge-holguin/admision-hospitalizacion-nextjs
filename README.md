# Sistema de Gestión Hospitalaria

[![Next.js](https://img.shields.io/badge/Next.js-13.5+-000000?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-4.0+-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.0+-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)

## Descripción General

Este sistema de gestión hospitalaria es una aplicación web completa diseñada para administrar los procesos de admisión, emergencia y hospitalización en centros médicos. La plataforma permite gestionar pacientes, consultorios, médicos, cuentas de seguro y registros médicos en un entorno integrado y seguro.

## Características Principales

- **Gestión de Emergencias**: Registro, seguimiento y actualización de casos de emergencia.
- **Gestión de Hospitalización**: Administración de ingresos, estancias y altas hospitalarias.
- **Gestión de Pacientes**: Registro completo de información de pacientes y sus historias clínicas.
- **Validación de Seguros**: Integración con sistemas de seguros (SIS y otros) para validación de cobertura.
- **Tablas Maestras**: Administración de catálogos de médicos, consultorios, localidades y otros datos de referencia.
- **Autenticación y Seguridad**: Sistema de login y control de acceso basado en roles.

## Estructura del Proyecto

```
├── app/                        # Aplicación principal de Next.js
│   ├── api/                    # Endpoints de la API REST
│   │   ├── auth/               # Endpoints de autenticación
│   │   ├── consultorio/        # Endpoints de consultorios
│   │   ├── cuenta/             # Endpoints de cuentas
│   │   ├── dashboard/          # Endpoints del dashboard
│   │   ├── emergencia/         # Endpoints de emergencias
│   │   └── hospitalizacion/    # Endpoints de hospitalización
│   │
│   ├── change-password/        # Página de cambio de contraseña
│   ├── dashboard/              # Panel principal
│   ├── emergency/              # Módulo de emergencias
│   │   ├── [patientId]/        # Vista detallada de emergencia
│   │   ├── edit/               # Edición de emergencia
│   │   └── register/           # Registro de emergencia
│   ├── hospitalization/        # Módulo de hospitalización
│   └── ...                     # Otras rutas y páginas
│
├── components/                 # Componentes React reutilizables
│   ├── emergency/              # Componentes de emergencias
│   │   ├── register/           # Componentes de registro
│   │   └── view/               # Componentes de visualización
│   │
│   ├── hospitalization/        # Componentes de hospitalización
│   │   ├── register/           # Componentes de registro
│   │   └── view/               # Componentes de visualización
│   │
│   ├── master-tables/          # Componentes para tablas maestras
│   │   ├── modals/             # Modales para CRUD
│   │   └── tables/             # Tablas de datos
│   │
│   └── ui/                     # Componentes de interfaz de usuario
│       ├── alert/              # Alertas y notificaciones
│       ├── button/             # Botones personalizados
│       ├── card/               # Tarjetas de contenido
│       ├── dialog/             # Diálogos modales
│       ├── form/               # Componentes de formulario
│       └── ...                 # Otros componentes UI
│
├── constants/                  # Constantes y configuraciones
│   └── index.ts                # Exportaciones de constantes
│
├── contexts/                   # Contextos de React
│   ├── MedicosContext.tsx      # Contexto de médicos
│   ├── PatientAccountContext.tsx # Contexto de cuenta de paciente
│   ├── PatientContext.tsx      # Contexto de paciente
│   └── PatientDataContext.tsx  # Contexto de datos de paciente
│
├── docs/                       # Documentación del proyecto
│   └── document-types-integration.md
│
├── hooks/                      # Hooks personalizados
│   ├── master-tables/          # Hooks para tablas maestras
│   │   ├── useConsultorios.ts
│   │   ├── useLocalidades.ts
│   │   └── useMedicos.ts
│   ├── use-mobile.tsx          # Detección de dispositivos móviles
│   ├── use-toast.ts            # Notificaciones toast
│   └── ...                     # Otros hooks personalizados
│
├── lib/                        # Utilidades y configuraciones
│   ├── prisma/                 # Cliente de Prisma
│   │   └── client.ts           # Instancia del cliente Prisma
│   ├── auth.ts                 # Configuración de autenticación
│   ├── env.ts                  # Validación de variables de entorno
│   └── prisma.ts               # Exportación del cliente Prisma
│
├── prisma/                     # Configuración de Prisma
│   └── schema.prisma           # Esquema de la base de datos
│
├── public/                     # Archivos estáticos
│   ├── login-bg.png            # Imagen de fondo de login
│   ├── placeholder-logo.png    # Logo predeterminado
│   ├── placeholder-logo.svg    # Logo SVG predeterminado
│   └── placeholder-user.jpg    # Avatar de usuario predeterminado
│
├── services/                   # Lógica de negocio
│   ├── emergencia/             # Servicios de emergencia
│   │   ├── consultorioService.ts
│   │   ├── cuentaService.ts
│   │   └── emergenciaService.ts
│   │
│   ├── hospitalizacion/        # Servicios de hospitalización
│   │   ├── consultorioService.ts
│   │   ├── dashboardService.ts
│   │   ├── diagnosticoService.ts
│   │   └── ...
│   │
│   └── master-tables/          # Servicios de tablas maestras
│       ├── consultorioService.ts
│       ├── localidadService.ts
│       └── medicoService.ts
│
├── styles/                     # Estilos globales
│   └── globals.css             # Estilos CSS globales
│
├── utils/                      # Funciones utilitarias
│   ├── civilStatusUtils.ts     # Utilidades de estado civil
│   ├── dateFormatUtils.ts      # Formateo de fechas
│   ├── debuggerUtils.ts        # Utilidades de depuración
│   ├── jwtUtils.ts             # Manejo de JWT
│   ├── pdfUtils.ts             # Generación de PDFs
│   └── statusUtils.ts          # Utilidades de estado
│
├── .env                        # Variables de entorno
├── .gitignore                  # Archivos ignorados por Git
├── components.json             # Configuración de componentes UI
├── docker-compose.yml          # Configuración de Docker Compose
├── dockerfile                  # Configuración de Docker
├── next.config.mjs             # Configuración de Next.js
├── package.json                # Dependencias del proyecto
├── package-lock.json           # Versiones exactas de dependencias
├── postcss.config.mjs          # Configuración de PostCSS
├── tailwind.config.ts          # Configuración de Tailwind CSS
└── tsconfig.json               # Configuración de TypeScript
```

## Módulos Principales

### Módulo de Emergencias

Permite el registro y seguimiento de pacientes que ingresan por emergencia:

- Registro de datos del paciente
- Asignación de consultorio y médico
- Validación de seguro y cuenta
- Seguimiento del estado del paciente
- Generación de reportes

### Módulo de Hospitalización

Gestiona el proceso completo de hospitalización de pacientes:

- Admisión de pacientes
- Asignación de camas y habitaciones
- Seguimiento de tratamientos
- Registro de evolución médica
- Proceso de alta

### Sistema de Cuentas y Seguros

Administra la información financiera y de seguros:

- Validación de cobertura de seguros
- Gestión de cuentas de pacientes
- Integración con sistema SIS
- Validación de FUA para seguros específicos

## Tecnologías Utilizadas

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS, Shadcn UI
- **Backend**: Next.js API Routes, Prisma ORM
- **Base de Datos**: Compatible con PostgreSQL, MySQL, SQL Server
- **Autenticación**: NextAuth.js
- **Validación**: Zod
- **Iconos**: Lucide React

## Contextos React

El sistema utiliza varios contextos para compartir estado entre componentes:

- **PatientContext**: Información del paciente actual
- **PatientAccountContext**: Datos de cuenta y seguro del paciente
- **PatientDataContext**: Datos clínicos del paciente
- **MedicosContext**: Información de médicos disponibles

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
- Base de datos (PostgreSQL, MySQL o SQL Server)

### Pasos de Instalación

1. Clonar el repositorio:
   ```bash
   git clone https://github.com/tu-usuario/hospital-management-system.git
   cd hospital-management-system
   ```

2. Instalar dependencias:
   ```bash
   npm install
   # o
   yarn install
   ```

3. Configurar variables de entorno:
   - Copiar `.env.example` a `.env`
   - Configurar las variables de conexión a la base de datos y otras configuraciones

4. Ejecutar migraciones de base de datos:
   ```bash
   npx prisma migrate dev
   ```

5. Iniciar el servidor de desarrollo:
   ```bash
   npm run dev
   # o
   yarn dev
   ```

6. Acceder a la aplicación en `http://localhost:3000`

## Despliegue con Docker

El proyecto incluye configuración para Docker:

```bash
# Construir la imagen
docker-compose build

# Iniciar los contenedores
docker-compose up -d
```

## Contribución

1. Crear una rama para tu característica (`git checkout -b feature/amazing-feature`)
2. Realizar cambios y pruebas
3. Confirmar cambios (`git commit -m 'Add some amazing feature'`)
4. Enviar a la rama (`git push origin feature/amazing-feature`)
5. Abrir un Pull Request

## Licencia

Este proyecto está licenciado bajo [Licencia Privada] - ver el archivo LICENSE para más detalles.
