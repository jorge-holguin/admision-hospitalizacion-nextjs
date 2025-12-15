/**
 * Configuración de Swagger/OpenAPI para el Sistema de Gestión Hospitalaria
 * Este archivo contiene la documentación completa de todos los endpoints de la API
 */

export const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Sistema de Gestión Hospitalaria - API',
    version: '1.0.0',
    description: `
# API del Sistema de Gestión Hospitalaria

Este documento describe todos los endpoints disponibles en el sistema de gestión hospitalaria.

## Módulos Principales

- **🚑 Emergencias**: Gestión de atenciones de emergencia
- **🏥 Hospitalización**: Gestión de órdenes de hospitalización
- **📋 Filiación**: Gestión de historias clínicas y pacientes
- **📅 Citas**: Gestión de citas médicas
- **👨‍⚕️ Tablas Maestras**: Médicos, consultorios, localidades
- **🔧 Utilidades**: Seguros, tipos de documento, ubigeo, fecha/hora

## Autenticación

La mayoría de endpoints requieren un token JWT válido enviado en:
- Cookie: \`authToken\`
- Header: \`Authorization: Bearer <token>\`

## Códigos de Estado

- \`200\`: Operación exitosa
- \`201\`: Recurso creado exitosamente
- \`400\`: Error de validación o datos incorrectos
- \`401\`: No autorizado (token inválido o ausente)
- \`403\`: Prohibido (sin permisos para la operación)
- \`404\`: Recurso no encontrado
- \`500\`: Error interno del servidor
    `,
    contact: {
      name: 'Equipo de Desarrollo',
      email: 'desarrollo@hospital.gob.pe'
    },
    license: {
      name: 'Privado',
      url: '#'
    }
  },
  servers: [
    {
      url: '/api',
      description: 'Servidor de desarrollo local'
    }
  ],
  tags: [
    {
      name: 'Emergencias',
      description: 'Endpoints para gestión de emergencias médicas'
    },
    {
      name: 'Hospitalización',
      description: 'Endpoints para gestión de hospitalizaciones'
    },
    {
      name: 'Filiación',
      description: 'Endpoints para gestión de historias clínicas y pacientes'
    },
    {
      name: 'Citas',
      description: 'Endpoints para gestión de citas médicas'
    },
    {
      name: 'Tablas Maestras',
      description: 'Endpoints para gestión de médicos, consultorios y localidades'
    },
    {
      name: 'Utilidades',
      description: 'Endpoints de utilidad: seguros, tipos de documento, ubigeo, etc.'
    },
    {
      name: 'Cuentas',
      description: 'Endpoints para gestión de cuentas de pacientes'
    }
  ],
  paths: {
    // ==================== EMERGENCIAS ====================
    '/emergency': {
      get: {
        tags: ['Emergencias'],
        summary: 'Listar emergencias',
        description: `
Obtiene la lista de emergencias con paginación y filtros opcionales.
Si no se proporcionan mes y año, se usa el mes y año actual.

**Funcionalidad adicional:** Si se envía \`next-id=true\`, retorna el siguiente ID disponible para crear una emergencia.
        `,
        parameters: [
          {
            name: 'month',
            in: 'query',
            description: 'Mes a filtrar (1-12)',
            schema: { type: 'integer', minimum: 1, maximum: 12 }
          },
          {
            name: 'year',
            in: 'query',
            description: 'Año a filtrar (ej: 2025)',
            schema: { type: 'integer', example: 2025 }
          },
          {
            name: 'search',
            in: 'query',
            description: 'Término de búsqueda (nombre, DNI, historia)',
            schema: { type: 'string' }
          },
          {
            name: 'page',
            in: 'query',
            description: 'Número de página',
            schema: { type: 'integer', default: 1 }
          },
          {
            name: 'pageSize',
            in: 'query',
            description: 'Cantidad de registros por página',
            schema: { type: 'integer', default: 10 }
          },
          {
            name: 'next-id',
            in: 'query',
            description: 'Si es "true", retorna el siguiente ID de emergencia disponible',
            schema: { type: 'string', enum: ['true', 'false'] }
          }
        ],
        responses: {
          '200': {
            description: 'Lista de emergencias obtenida exitosamente',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Emergencia' }
                    },
                    pagination: {
                      type: 'object',
                      properties: {
                        page: { type: 'integer' },
                        pageSize: { type: 'integer' },
                        total: { type: 'integer' },
                        totalPages: { type: 'integer' }
                      }
                    }
                  }
                }
              }
            }
          },
          '400': { description: 'Parámetros inválidos' },
          '500': { description: 'Error interno del servidor' }
        }
      },
      post: {
        tags: ['Emergencias'],
        summary: 'Crear emergencia',
        description: 'Crea un nuevo registro de emergencia para un paciente',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/EmergenciaCreate' }
            }
          }
        },
        responses: {
          '201': {
            description: 'Emergencia creada exitosamente',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/Emergencia' }
                  }
                }
              }
            }
          },
          '400': { description: 'Datos de emergencia inválidos' },
          '500': { description: 'Error al crear emergencia' }
        }
      }
    },
    '/emergency/{id}': {
      get: {
        tags: ['Emergencias'],
        summary: 'Obtener emergencia por ID',
        description: 'Obtiene los detalles de una emergencia específica',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'ID de la emergencia',
            schema: { type: 'string' }
          }
        ],
        responses: {
          '200': {
            description: 'Emergencia encontrada',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/Emergencia' }
                  }
                }
              }
            }
          },
          '400': { description: 'ID de emergencia no válido' },
          '404': { description: 'Emergencia no encontrada' },
          '500': { description: 'Error interno del servidor' }
        }
      },
      put: {
        tags: ['Emergencias'],
        summary: 'Actualizar emergencia completa',
        description: 'Actualiza todos los campos de una emergencia',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'ID de la emergencia',
            schema: { type: 'string' }
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/EmergenciaUpdate' }
            }
          }
        },
        responses: {
          '200': { description: 'Emergencia actualizada exitosamente' },
          '400': { description: 'ID de emergencia no válido' },
          '500': { description: 'Error al actualizar emergencia' }
        }
      },
      patch: {
        tags: ['Emergencias'],
        summary: 'Actualizar emergencia parcialmente',
        description: `
Actualiza parcialmente una emergencia con validación de estado.

**Reglas de negocio:**
- Si \`ESTADO="0"\`: Se realiza eliminación lógica
- Si es PAGANTE o SOAT: Se permite edición sin importar el estado
- Para otros casos: Se verifica que el estado permita edición
        `,
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'ID de la emergencia',
            schema: { type: 'string' }
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/EmergenciaUpdate' }
            }
          }
        },
        responses: {
          '200': { description: 'Emergencia actualizada exitosamente' },
          '403': { description: 'No se puede editar - estado no permite modificación' },
          '404': { description: 'Emergencia no encontrada' },
          '500': { description: 'Error al actualizar emergencia' }
        }
      },
      delete: {
        tags: ['Emergencias'],
        summary: 'Eliminar emergencia (lógico)',
        description: 'Elimina lógicamente una emergencia cambiando su estado a "0"',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'ID de la emergencia',
            schema: { type: 'string' }
          }
        ],
        responses: {
          '200': { description: 'Emergencia eliminada exitosamente' },
          '400': { description: 'ID de emergencia no válido' },
          '500': { description: 'Error al eliminar emergencia' }
        }
      }
    },
    '/emergency/patient/{patientId}': {
      get: {
        tags: ['Emergencias'],
        summary: 'Listar emergencias de un paciente',
        description: 'Obtiene todas las emergencias de un paciente específico con paginación',
        parameters: [
          {
            name: 'patientId',
            in: 'path',
            required: true,
            description: 'ID del paciente (historia clínica)',
            schema: { type: 'string' }
          },
          {
            name: 'page',
            in: 'query',
            description: 'Número de página',
            schema: { type: 'integer', default: 1 }
          },
          {
            name: 'pageSize',
            in: 'query',
            description: 'Cantidad de registros por página',
            schema: { type: 'integer', default: 10 }
          }
        ],
        responses: {
          '200': { description: 'Lista de emergencias del paciente' },
          '400': { description: 'ID de paciente requerido' },
          '500': { description: 'Error interno del servidor' }
        }
      }
    },
    '/emergency/reasons': {
      get: {
        tags: ['Emergencias'],
        summary: 'Listar motivos de emergencia',
        description: 'Obtiene la lista de motivos de emergencia disponibles',
        responses: {
          '200': {
            description: 'Lista de motivos de emergencia',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      codigo: { type: 'string' },
                      nombre: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/emergency/admission-types': {
      get: {
        tags: ['Emergencias'],
        summary: 'Listar tipos de admisión',
        description: 'Obtiene la lista de formas de ingreso a emergencia',
        responses: {
          '200': { description: 'Lista de tipos de admisión' }
        }
      }
    },

    // ==================== HOSPITALIZACIÓN ====================
    '/hospitalization': {
      get: {
        tags: ['Hospitalización'],
        summary: 'Listar hospitalizaciones u obtener siguiente ID',
        description: `
Obtiene hospitalizaciones o el siguiente ID disponible.

**Parámetros especiales:**
- \`next-id=true\`: Retorna el siguiente ID de hospitalización
- \`id=<ID>\`: Obtiene una hospitalización específica
        `,
        parameters: [
          {
            name: 'id',
            in: 'query',
            description: 'ID de hospitalización específica',
            schema: { type: 'string' }
          },
          {
            name: 'next-id',
            in: 'query',
            description: 'Si es "true", retorna el siguiente ID disponible',
            schema: { type: 'string', enum: ['true', 'false'] }
          }
        ],
        responses: {
          '200': { description: 'Datos obtenidos exitosamente' },
          '404': { description: 'Hospitalización no encontrada' },
          '500': { description: 'Error interno del servidor' }
        }
      },
      post: {
        tags: ['Hospitalización'],
        summary: 'Crear hospitalización',
        description: `
Crea una nueva orden de hospitalización.

**Campos requeridos:**
- IDHOSPITALIZACION, PACIENTE, NOMBRES, CONSULTORIO1
- HORA1, FECHA1, ORIGEN, SEGURO, MEDICO1
- ESTADO, USUARIO, DIAGNOSTICO, EDAD

**Nota:** \`ORIGENID\` es requerido excepto si \`ORIGEN='RN'\` (Recién Nacido)
        `,
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/HospitalizacionCreate' }
            }
          }
        },
        responses: {
          '201': { description: 'Hospitalización creada exitosamente' },
          '400': { description: 'Faltan campos requeridos' },
          '500': { description: 'Error al crear hospitalización' }
        }
      },
      delete: {
        tags: ['Hospitalización'],
        summary: 'Eliminar hospitalización',
        description: 'Elimina una hospitalización por su ID',
        responses: {
          '200': { description: 'Hospitalización eliminada' },
          '400': { description: 'ID requerido' },
          '500': { description: 'Error al eliminar' }
        }
      }
    },
    '/hospitalization/{id}': {
      get: {
        tags: ['Hospitalización'],
        summary: 'Obtener hospitalización por ID',
        description: 'Obtiene los detalles de una hospitalización específica',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'ID de la hospitalización',
            schema: { type: 'string' }
          }
        ],
        responses: {
          '200': { description: 'Hospitalización encontrada' },
          '404': { description: 'Hospitalización no encontrada' },
          '500': { description: 'Error interno' }
        }
      }
    },
    '/hospitalization/patient/{patientId}': {
      get: {
        tags: ['Hospitalización'],
        summary: 'Listar hospitalizaciones de un paciente',
        description: 'Obtiene todas las hospitalizaciones de un paciente con paginación',
        parameters: [
          {
            name: 'patientId',
            in: 'path',
            required: true,
            description: 'ID del paciente (historia clínica)',
            schema: { type: 'string' }
          },
          {
            name: 'page',
            in: 'query',
            schema: { type: 'integer', default: 1 }
          },
          {
            name: 'pageSize',
            in: 'query',
            schema: { type: 'integer', default: 10 }
          }
        ],
        responses: {
          '200': { description: 'Lista de hospitalizaciones' },
          '400': { description: 'ID de paciente requerido' },
          '500': { description: 'Error interno' }
        }
      }
    },
    '/hospitalization/origins': {
      get: {
        tags: ['Hospitalización'],
        summary: 'Listar orígenes de hospitalización',
        description: 'Obtiene los tipos de origen de hospitalización (EM=Emergencia, CE=Consultorio Externo, RN=Recién Nacido, etc.)',
        responses: {
          '200': {
            description: 'Lista de orígenes',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      codigo: { type: 'string', example: 'EM' },
                      nombre: { type: 'string', example: 'Emergencia' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/hospitalization/diagnostics': {
      get: {
        tags: ['Hospitalización'],
        summary: 'Buscar diagnósticos CIE-10',
        description: 'Busca diagnósticos por código o nombre',
        parameters: [
          {
            name: 'search',
            in: 'query',
            description: 'Término de búsqueda',
            schema: { type: 'string' }
          },
          {
            name: 'origen',
            in: 'query',
            description: 'Filtrar por origen',
            schema: { type: 'string' }
          }
        ],
        responses: {
          '200': { description: 'Lista de diagnósticos' }
        }
      }
    },

    // ==================== FILIACIÓN ====================
    '/filiation/search': {
      get: {
        tags: ['Filiación'],
        summary: 'Buscar pacientes',
        description: 'Busca pacientes por historia clínica, documento o nombre',
        parameters: [
          {
            name: 'historia',
            in: 'query',
            description: 'Número de historia clínica',
            schema: { type: 'string' }
          },
          {
            name: 'documento',
            in: 'query',
            description: 'Número de documento (DNI, CE, etc.)',
            schema: { type: 'string' }
          },
          {
            name: 'nombres',
            in: 'query',
            description: 'Nombre del paciente (búsqueda parcial)',
            schema: { type: 'string' }
          },
          {
            name: 'page',
            in: 'query',
            schema: { type: 'integer', default: 1 }
          },
          {
            name: 'pageSize',
            in: 'query',
            schema: { type: 'integer', default: 10 }
          }
        ],
        responses: {
          '200': {
            description: 'Lista de pacientes encontrados',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Paciente' }
                    },
                    pagination: { $ref: '#/components/schemas/Pagination' }
                  }
                }
              }
            }
          },
          '500': { description: 'Error interno' }
        }
      }
    },
    '/filiation/save': {
      post: {
        tags: ['Filiación'],
        summary: 'Crear historia clínica',
        description: `
Crea una nueva historia clínica para un paciente.

**Requiere autenticación:** El usuario se obtiene del token JWT.

**Campos requeridos:**
- documento
- tipoDocumento
        `,
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/HistoriaClinicaCreate' }
            }
          }
        },
        responses: {
          '201': { description: 'Historia clínica creada exitosamente' },
          '400': { description: 'Documento y tipo de documento son requeridos' },
          '401': { description: 'No autorizado - Token inválido o ausente' },
          '500': { description: 'Error interno del servidor' }
        }
      }
    },
    '/filiation/patient': {
      post: {
        tags: ['Filiación'],
        summary: 'Crear paciente (alternativo)',
        description: 'Endpoint alternativo para crear historia clínica de paciente',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/HistoriaClinicaCreate' }
            }
          }
        },
        responses: {
          '201': { description: 'Paciente creado' },
          '401': { description: 'No autorizado' },
          '500': { description: 'Error interno' }
        }
      }
    },
    '/filiation/{id}': {
      get: {
        tags: ['Filiación'],
        summary: 'Obtener paciente por ID',
        description: 'Obtiene los datos completos de un paciente por su historia clínica',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'ID del paciente (historia clínica)',
            schema: { type: 'string' }
          }
        ],
        responses: {
          '200': { description: 'Datos del paciente' },
          '404': { description: 'Paciente no encontrado' }
        }
      }
    },

    // ==================== CITAS ====================
    '/appointments/{id}': {
      patch: {
        tags: ['Citas'],
        summary: 'Actualizar fecha de pago de cita',
        description: 'Actualiza la FECHA_PAGO de una cita médica',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'ID de la cita',
            schema: { type: 'string' }
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['FECHA_PAGO'],
                properties: {
                  FECHA_PAGO: { type: 'string', format: 'date-time', description: 'Fecha de pago' },
                  fechaPago: { type: 'string', format: 'date-time', description: 'Alias de FECHA_PAGO' },
                  ESTADO: { type: 'string', default: '3', description: 'Estado de la cita (3=Pagado)' }
                }
              }
            }
          }
        },
        responses: {
          '200': { description: 'Fecha de pago actualizada' },
          '400': { description: 'FECHA_PAGO es requerida' },
          '500': { description: 'Error al actualizar' }
        }
      }
    },
    '/appointments/search-by-document': {
      get: {
        tags: ['Citas'],
        summary: 'Buscar citas por documento',
        description: 'Busca citas de un paciente por su número de documento',
        parameters: [
          {
            name: 'documento',
            in: 'query',
            required: true,
            description: 'Número de documento del paciente',
            schema: { type: 'string' }
          }
        ],
        responses: {
          '200': { description: 'Lista de citas' }
        }
      }
    },
    '/appointments/search-by-name': {
      get: {
        tags: ['Citas'],
        summary: 'Buscar citas por nombre',
        description: 'Busca citas por nombre del paciente',
        parameters: [
          {
            name: 'nombre',
            in: 'query',
            required: true,
            description: 'Nombre del paciente',
            schema: { type: 'string' }
          }
        ],
        responses: {
          '200': { description: 'Lista de citas' }
        }
      }
    },
    '/appointments/doctor-by-date': {
      get: {
        tags: ['Citas'],
        summary: 'Obtener médicos disponibles por fecha',
        description: 'Obtiene la lista de médicos con citas disponibles para una fecha',
        parameters: [
          {
            name: 'fecha',
            in: 'query',
            required: true,
            description: 'Fecha en formato YYYY-MM-DD',
            schema: { type: 'string', format: 'date' }
          },
          {
            name: 'consultorio',
            in: 'query',
            description: 'Código del consultorio',
            schema: { type: 'string' }
          }
        ],
        responses: {
          '200': { description: 'Lista de médicos disponibles' }
        }
      }
    },
    '/appointments/types': {
      get: {
        tags: ['Citas'],
        summary: 'Listar tipos de cita',
        description: 'Obtiene los tipos de cita disponibles',
        responses: {
          '200': {
            description: 'Lista de tipos de cita',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      codigo: { type: 'string' },
                      nombre: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/appointments/insurances': {
      get: {
        tags: ['Citas'],
        summary: 'Listar seguros para citas',
        description: 'Obtiene los seguros disponibles para citas',
        responses: {
          '200': { description: 'Lista de seguros' }
        }
      }
    },
    '/appointments/sis-entities': {
      get: {
        tags: ['Citas'],
        summary: 'Listar entidades SIS',
        description: 'Obtiene las entidades del SIS (Sistema Integral de Salud)',
        responses: {
          '200': { description: 'Lista de entidades SIS' }
        }
      }
    },
    '/appointments/sis-entities/{code}': {
      get: {
        tags: ['Citas'],
        summary: 'Obtener entidad SIS por código',
        description: 'Obtiene los datos de una entidad SIS específica',
        parameters: [
          {
            name: 'code',
            in: 'path',
            required: true,
            description: 'Código de la entidad SIS',
            schema: { type: 'string' }
          }
        ],
        responses: {
          '200': { description: 'Datos de la entidad' },
          '404': { description: 'Entidad no encontrada' }
        }
      }
    },

    // ==================== TABLAS MAESTRAS: MÉDICOS ====================
    '/master-tables/medicos': {
      get: {
        tags: ['Tablas Maestras'],
        summary: 'Listar médicos',
        description: 'Obtiene la lista de médicos con paginación y filtros',
        parameters: [
          {
            name: 'page',
            in: 'query',
            schema: { type: 'integer', default: 1 }
          },
          {
            name: 'pageSize',
            in: 'query',
            schema: { type: 'integer', default: 10 }
          },
          {
            name: 'search',
            in: 'query',
            description: 'Búsqueda general',
            schema: { type: 'string' }
          },
          {
            name: 'nombre',
            in: 'query',
            description: 'Filtrar por nombre',
            schema: { type: 'string' }
          },
          {
            name: 'dni',
            in: 'query',
            description: 'Filtrar por DNI',
            schema: { type: 'string' }
          },
          {
            name: 'consultorio',
            in: 'query',
            description: 'Filtrar por consultorio',
            schema: { type: 'string' }
          }
        ],
        responses: {
          '200': {
            description: 'Lista de médicos',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Medico' }
                    },
                    pagination: { $ref: '#/components/schemas/Pagination' }
                  }
                }
              }
            }
          }
        }
      },
      post: {
        tags: ['Tablas Maestras'],
        summary: 'Crear médico',
        description: 'Crea un nuevo registro de médico',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/MedicoCreate' }
            }
          }
        },
        responses: {
          '201': { description: 'Médico creado exitosamente' },
          '400': { description: 'Código MEDICO y nombre son obligatorios' },
          '500': { description: 'Error al crear médico' }
        }
      }
    },
    '/master-tables/medicos/{id}': {
      get: {
        tags: ['Tablas Maestras'],
        summary: 'Obtener médico por ID',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' }
          }
        ],
        responses: {
          '200': { description: 'Datos del médico' },
          '404': { description: 'Médico no encontrado' }
        }
      },
      put: {
        tags: ['Tablas Maestras'],
        summary: 'Actualizar médico',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' }
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/MedicoCreate' }
            }
          }
        },
        responses: {
          '200': { description: 'Médico actualizado' },
          '404': { description: 'Médico no encontrado' }
        }
      },
      delete: {
        tags: ['Tablas Maestras'],
        summary: 'Eliminar médico',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' }
          }
        ],
        responses: {
          '200': { description: 'Médico eliminado' },
          '404': { description: 'Médico no encontrado' }
        }
      }
    },

    // ==================== TABLAS MAESTRAS: CONSULTORIOS ====================
    '/master-tables/consultorios': {
      get: {
        tags: ['Tablas Maestras'],
        summary: 'Listar consultorios',
        description: 'Obtiene la lista de consultorios con paginación y filtros',
        parameters: [
          {
            name: 'page',
            in: 'query',
            schema: { type: 'integer', default: 1 }
          },
          {
            name: 'pageSize',
            in: 'query',
            schema: { type: 'integer', default: 10 }
          },
          {
            name: 'nombre',
            in: 'query',
            description: 'Filtrar por nombre',
            schema: { type: 'string' }
          },
          {
            name: 'codigo',
            in: 'query',
            description: 'Filtrar por código',
            schema: { type: 'string' }
          },
          {
            name: 'servicio',
            in: 'query',
            description: 'Filtrar por servicio',
            schema: { type: 'string' }
          }
        ],
        responses: {
          '200': { description: 'Lista de consultorios' }
        }
      },
      post: {
        tags: ['Tablas Maestras'],
        summary: 'Crear consultorio',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ConsultorioCreate' }
            }
          }
        },
        responses: {
          '201': { description: 'Consultorio creado' },
          '400': { description: 'Nombre requerido' },
          '409': { description: 'Consultorio ya existe' }
        }
      }
    },
    '/master-tables/consultorios/{id}': {
      get: {
        tags: ['Tablas Maestras'],
        summary: 'Obtener consultorio por ID',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
        ],
        responses: {
          '200': { description: 'Datos del consultorio' },
          '404': { description: 'No encontrado' }
        }
      },
      put: {
        tags: ['Tablas Maestras'],
        summary: 'Actualizar consultorio',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
        ],
        responses: {
          '200': { description: 'Actualizado' }
        }
      },
      delete: {
        tags: ['Tablas Maestras'],
        summary: 'Eliminar consultorio',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
        ],
        responses: {
          '200': { description: 'Eliminado' }
        }
      }
    },
    '/master-tables/consultorios/search': {
      get: {
        tags: ['Tablas Maestras'],
        summary: 'Buscar consultorios por tipo',
        description: 'Busca consultorios filtrando por tipo (C=Citas, E=Emergencia, H=Hospitalización)',
        parameters: [
          {
            name: 'tipo',
            in: 'query',
            description: 'Tipo de consultorio',
            schema: { type: 'string', enum: ['C', 'E', 'H'] }
          },
          {
            name: 'search',
            in: 'query',
            description: 'Término de búsqueda',
            schema: { type: 'string' }
          }
        ],
        responses: {
          '200': { description: 'Lista de consultorios' }
        }
      }
    },
    '/master-tables/consultorios/by-specialty': {
      get: {
        tags: ['Tablas Maestras'],
        summary: 'Obtener consultorios por especialidad',
        parameters: [
          {
            name: 'especialidad',
            in: 'query',
            required: true,
            schema: { type: 'string' }
          }
        ],
        responses: {
          '200': { description: 'Consultorios de la especialidad' }
        }
      }
    },

    // ==================== TABLAS MAESTRAS: LOCALIDADES ====================
    '/master-tables/localidades': {
      get: {
        tags: ['Tablas Maestras'],
        summary: 'Listar localidades',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'pageSize', in: 'query', schema: { type: 'integer', default: 10 } },
          { name: 'search', in: 'query', schema: { type: 'string' } }
        ],
        responses: {
          '200': { description: 'Lista de localidades' }
        }
      },
      post: {
        tags: ['Tablas Maestras'],
        summary: 'Crear localidad',
        responses: {
          '201': { description: 'Localidad creada' }
        }
      }
    },

    // ==================== UTILIDADES ====================
    '/utils/insurances': {
      get: {
        tags: ['Utilidades'],
        summary: 'Listar seguros',
        description: 'Obtiene la lista de seguros disponibles',
        parameters: [
          {
            name: 'code',
            in: 'query',
            description: 'Código del seguro específico',
            schema: { type: 'string' }
          },
          {
            name: 'search',
            in: 'query',
            description: 'Término de búsqueda por nombre',
            schema: { type: 'string' }
          }
        ],
        responses: {
          '200': {
            description: 'Lista de seguros',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Seguro' }
                }
              }
            }
          },
          '404': { description: 'Seguro no encontrado (si se busca por código)' }
        }
      }
    },
    '/utils/document-types': {
      get: {
        tags: ['Utilidades'],
        summary: 'Listar tipos de documento',
        description: 'Obtiene los tipos de documento disponibles (DNI, CE, Pasaporte, etc.)',
        responses: {
          '200': {
            description: 'Lista de tipos de documento',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      TIPO_DOCUMENTO: { type: 'string', example: 'D' },
                      NOMBRE: { type: 'string', example: 'DNI' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/utils/datetime': {
      get: {
        tags: ['Utilidades'],
        summary: 'Obtener fecha y hora del servidor',
        description: 'Obtiene la fecha y hora actual del servidor en formato ISO y componentes separados',
        responses: {
          '200': {
            description: 'Fecha y hora del servidor',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    datetime: { type: 'string', format: 'date-time' },
                    date: { type: 'string', format: 'date' },
                    time: { type: 'string', example: '14:30:00' },
                    timestamp: { type: 'integer' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/utils/ubigeo': {
      get: {
        tags: ['Utilidades'],
        summary: 'Buscar ubigeo',
        description: 'Busca departamentos, provincias y distritos',
        parameters: [
          {
            name: 'type',
            in: 'query',
            description: 'Tipo de búsqueda',
            schema: { type: 'string', enum: ['departamento', 'provincia', 'distrito'] }
          },
          {
            name: 'parent',
            in: 'query',
            description: 'Código padre (para provincias y distritos)',
            schema: { type: 'string' }
          },
          {
            name: 'search',
            in: 'query',
            description: 'Término de búsqueda',
            schema: { type: 'string' }
          }
        ],
        responses: {
          '200': { description: 'Lista de ubigeos' }
        }
      }
    },
    '/utils/update-age': {
      post: {
        tags: ['Utilidades'],
        summary: 'Calcular y actualizar edad',
        description: 'Calcula la edad a partir de la fecha de nacimiento y opcionalmente actualiza en la base de datos',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  fechaNacimiento: { type: 'string', format: 'date', description: 'Fecha de nacimiento' },
                  pacienteId: { type: 'string', description: 'ID del paciente (para actualizar BD)' },
                  updateDatabase: { type: 'boolean', description: 'Si se debe actualizar en BD' }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Edad calculada',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    edad: { type: 'string', example: '029a08m01d' },
                    databaseUpdated: { type: 'boolean' }
                  }
                }
              }
            }
          }
        }
      }
    },

    // ==================== CUENTAS ====================
    '/accounts/validate': {
      post: {
        tags: ['Cuentas'],
        summary: 'Validar cuenta de paciente',
        description: 'Valida si existe una cuenta activa para un paciente',
        responses: {
          '200': { description: 'Resultado de validación' }
        }
      }
    },
    '/accounts/search-by-insurance/{pacienteId}': {
      get: {
        tags: ['Cuentas'],
        summary: 'Buscar cuentas por seguro',
        description: 'Busca las cuentas de un paciente filtradas por tipo de seguro',
        parameters: [
          {
            name: 'pacienteId',
            in: 'path',
            required: true,
            schema: { type: 'string' }
          }
        ],
        responses: {
          '200': { description: 'Lista de cuentas' }
        }
      }
    },
    '/accounts/update/{accountId}': {
      put: {
        tags: ['Cuentas'],
        summary: 'Actualizar cuenta',
        parameters: [
          {
            name: 'accountId',
            in: 'path',
            required: true,
            schema: { type: 'string' }
          }
        ],
        responses: {
          '200': { description: 'Cuenta actualizada' }
        }
      }
    }
  },
  components: {
    schemas: {
      Emergencia: {
        type: 'object',
        properties: {
          IDEMERGENCIA: { type: 'string', description: 'ID único de la emergencia' },
          PACIENTE: { type: 'string', description: 'ID del paciente (historia clínica)' },
          NOMBRES: { type: 'string', description: 'Nombres completos del paciente' },
          FECHA1: { type: 'string', format: 'date', description: 'Fecha de ingreso' },
          HORA1: { type: 'string', description: 'Hora de ingreso (HH:MM)' },
          MOTIVO: { type: 'string', description: 'Código del motivo de emergencia' },
          FORMAINGRESO: { type: 'string', description: 'Código de forma de ingreso' },
          CONSULTORIO: { type: 'string', description: 'Código del consultorio' },
          MEDICO1: { type: 'string', description: 'Código del médico atendiente' },
          SEGURO: { type: 'string', description: 'Código del seguro' },
          SEGUROLIQ: { type: 'string', description: 'Código del seguro liquidador' },
          ESTADO: { type: 'string', description: 'Estado (0=Anulado, 2=Registrado, 3=Atendido, etc.)' },
          EDAD: { type: 'string', description: 'Edad en formato 000a00m00d' },
          USUARIO: { type: 'string', description: 'Usuario que registró' }
        }
      },
      EmergenciaCreate: {
        type: 'object',
        required: ['PACIENTE'],
        properties: {
          PACIENTE: { type: 'string', description: 'ID del paciente (obligatorio)' },
          NOMBRES: { type: 'string' },
          FECHA1: { type: 'string', format: 'date' },
          HORA1: { type: 'string' },
          MOTIVO: { type: 'string' },
          FORMAINGRESO: { type: 'string' },
          CONSULTORIO: { type: 'string' },
          MEDICO1: { type: 'string' },
          SEGURO: { type: 'string' },
          SEGUROLIQ: { type: 'string' },
          EDAD: { type: 'string' },
          USUARIO: { type: 'string' }
        }
      },
      EmergenciaUpdate: {
        type: 'object',
        properties: {
          ESTADO: { type: 'string', description: 'Nuevo estado' },
          SEGUROLIQ: { type: 'string' },
          MOTIVO: { type: 'string' },
          FORMAINGRESO: { type: 'string' },
          CONSULTORIO: { type: 'string' },
          MEDICO1: { type: 'string' }
        }
      },
      HospitalizacionCreate: {
        type: 'object',
        required: ['IDHOSPITALIZACION', 'PACIENTE', 'NOMBRES', 'CONSULTORIO1', 'HORA1', 'FECHA1', 'ORIGEN', 'SEGURO', 'MEDICO1', 'ESTADO', 'USUARIO', 'DIAGNOSTICO', 'EDAD'],
        properties: {
          IDHOSPITALIZACION: { type: 'string', description: 'ID único de hospitalización' },
          PACIENTE: { type: 'string', description: 'ID del paciente' },
          NOMBRES: { type: 'string' },
          CONSULTORIO1: { type: 'string', description: 'Código del servicio/departamento' },
          HORA1: { type: 'string', description: 'Hora de ingreso' },
          FECHA1: { type: 'string', format: 'date', description: 'Fecha de ingreso' },
          ORIGEN: { type: 'string', description: 'Origen (EM=Emergencia, CE=Consultorio, RN=Recién Nacido)' },
          ORIGENID: { type: 'string', description: 'ID del origen (requerido si ORIGEN != RN)' },
          SEGURO: { type: 'string' },
          MEDICO1: { type: 'string' },
          ESTADO: { type: 'string' },
          USUARIO: { type: 'string' },
          DIAGNOSTICO: { type: 'string', description: 'Código CIE-10' },
          EDAD: { type: 'string', description: 'Edad en formato 000a00m00d' }
        }
      },
      Paciente: {
        type: 'object',
        properties: {
          HISTORIA: { type: 'string', description: 'Número de historia clínica' },
          DOCUMENTO: { type: 'string', description: 'Número de documento' },
          TIPO_DOCUMENTO: { type: 'string', description: 'Tipo de documento (D=DNI, CE, PP)' },
          NOMBRES: { type: 'string' },
          APATERNO: { type: 'string', description: 'Apellido paterno' },
          AMATERNO: { type: 'string', description: 'Apellido materno' },
          FECHA_NACIMIENTO: { type: 'string', format: 'date' },
          SEXO: { type: 'string', enum: ['M', 'F'] },
          EDAD: { type: 'string' },
          DIRECCION: { type: 'string' },
          TELEFONO1: { type: 'string' },
          SEGURO: { type: 'string' }
        }
      },
      HistoriaClinicaCreate: {
        type: 'object',
        required: ['documento', 'tipoDocumento'],
        properties: {
          documento: { type: 'string', description: 'Número de documento' },
          tipoDocumento: { type: 'string', description: 'Tipo de documento (D, CE, PP)' },
          paterno: { type: 'string', description: 'Apellido paterno' },
          materno: { type: 'string', description: 'Apellido materno' },
          nombre: { type: 'string', description: 'Nombres' },
          fechaNacimiento: { type: 'string', format: 'date' },
          sexo: { type: 'string', enum: ['M', 'F'] },
          estadoCivil: { type: 'string' },
          pais: { type: 'string', description: 'Código de país' },
          lugarNacimiento: { type: 'string', description: 'Código ubigeo de nacimiento' },
          direccion: { type: 'string' },
          distrito: { type: 'string', description: 'Código ubigeo de residencia' },
          seguro: { type: 'string' },
          gradoInstruccion: { type: 'string' },
          ocupacion: { type: 'string' },
          religion: { type: 'string' },
          codEtnia: { type: 'string' },
          telefono1: { type: 'string' },
          telefono2: { type: 'string' },
          email: { type: 'string' },
          padre: { type: 'string' },
          madre: { type: 'string' },
          conyugeNombre: { type: 'string' },
          conyugeOcupacion: { type: 'string' },
          direccionReniec: { type: 'string', description: 'Dirección según RENIEC' },
          distritoReniec: { type: 'string', description: 'Ubigeo según RENIEC' },
          validadoReniec: { type: 'boolean', description: 'Si fue validado con RENIEC' },
          localidad: { type: 'string', description: 'Código de localidad (12 caracteres)' },
          stringFoto: { type: 'string', description: 'Foto en base64' }
        }
      },
      Medico: {
        type: 'object',
        properties: {
          MEDICO: { type: 'string', description: 'Código del médico' },
          NOMBRE: { type: 'string', description: 'Nombre completo' },
          DNI: { type: 'string' },
          ESPECIALIDAD: { type: 'string' },
          CONSULTORIO: { type: 'string' },
          COLEGIO: { type: 'string', description: 'Número de colegiatura' },
          ACTIVO: { type: 'string', enum: ['0', '1'] }
        }
      },
      MedicoCreate: {
        type: 'object',
        required: ['MEDICO', 'NOMBRE'],
        properties: {
          MEDICO: { type: 'string', description: 'Código único (3 caracteres)' },
          NOMBRE: { type: 'string', description: 'Nombre completo' },
          NOMBRES: { type: 'string' },
          APATERNO: { type: 'string' },
          AMATERNO: { type: 'string' },
          DNI: { type: 'string' },
          TIPO_DOCUMENTO: { type: 'string', default: 'D' },
          ESPECIALIDAD: { type: 'string' },
          CONSULTORIO: { type: 'string' },
          COLEGIO: { type: 'string' },
          COLESP: { type: 'string', description: 'Número de especialidad' },
          ACTIVO: { type: 'string', default: '1' },
          PROFESION_COLEGIO: { type: 'string' }
        }
      },
      ConsultorioCreate: {
        type: 'object',
        required: ['NOMBRE'],
        properties: {
          CONSULTORIO: { type: 'string', description: 'Código del consultorio' },
          NOMBRE: { type: 'string', description: 'Nombre del consultorio' },
          TIPO: { type: 'string', description: 'Tipo (C=Citas, E=Emergencia, H=Hospitalización)' },
          ESPECIALIDAD: { type: 'string' },
          SERVICIO: { type: 'string' },
          ACTIVO: { type: 'string', default: '1' }
        }
      },
      Seguro: {
        type: 'object',
        properties: {
          Codigo: { type: 'string', description: 'Código del seguro' },
          Nombre: { type: 'string', description: 'Nombre del seguro' },
          Activo: { type: 'boolean' }
        }
      },
      Pagination: {
        type: 'object',
        properties: {
          page: { type: 'integer', description: 'Página actual' },
          pageSize: { type: 'integer', description: 'Registros por página' },
          total: { type: 'integer', description: 'Total de registros' },
          totalPages: { type: 'integer', description: 'Total de páginas' }
        }
      }
    },
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Token JWT obtenido del login'
      }
    }
  }
};

export default swaggerSpec;
