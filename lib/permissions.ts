/**
 * Códigos de permiso del sistema S028 - Admisión Web
 * Estos códigos se corresponden con los `opciones.codigo` del módulo S028
 * que retorna el endpoint de permisos del backend.
 */
export const PERMISOS = {
  // ─── MÓDULO CITAS (/appointments) ─────────────────────────────────────────
  CITAS: {
    LISTAR:            'LIS-CITAS-01',
    ASIGNAR:           'ASG-CITAS-02',
    VER_DETALLE:       'VER-CITAS-03',
    REAGENDAR:         'REA-CITAS-04',
    REASIGNAR_MEDICO:  'REM-CITAS-05',
    LIBERAR:           'LIB-CITAS-06',
    CREAR_ADICIONAL:   'ADD-CITAS-07',
    HISTORIAL:         'HIS-CITAS-08',
    IMPRIMIR:          'IMP-CITAS-09',
    APOYO_DIAGNOSTICO: 'APO-CITAS-10',
    VER_RESERVAS:      'RES-CITAS-11',
    NUEVO_PACIENTE:    'NUE-CITAS-12',
    VER_PASADAS:       'PAS-CITAS-13',
    ASG_CITAS_PASADAS: 'ASG-CITAS-14',
  },

  // ─── MÓDULO FILIACIÓN (/filiation) ────────────────────────────────────────
  PACIENTES: {
    LISTAR:  'LIS-PAC-01',
    CREAR:   'CRE-PAC-02',
    VER:     'VER-PAC-03',
    EDITAR:  'EDI-PAC-04',
    VER_SIS: 'SIS-PAC-05',
  },

  // ─── HOSPITALIZACIÓN ──────────────────────────────────────────────────────
  HOSPITALIZACION: {
    CREAR: 'CRE-HOSP-01',
    VER:   'VER-HOSP-02',
  },

  // ─── EMERGENCIA ───────────────────────────────────────────────────────────
  EMERGENCIA: {
    CREAR: 'CRE-EMER-01',
    VER:   'VER-EMER-02',
  },

  // ─── MÓDULO SEGUROS (/insurance) ──────────────────────────────────────────
  SEGUROS: {
    LISTAR:      'LIS-SEG-01',
    VER_FUA:     'VER-SEG-02',
    LIQUIDACION: 'LIQ-SEG-03',
    EXPORTAR:    'EXP-SEG-04',
    BUSCAR_FUA:  'BUS-SEG-05',
  },

  // ─── MÓDULO TABLAS MAESTRAS (/master-tables) ──────────────────────────────
  MEDICOS: {
    LISTAR: 'LIS-MED-01',
    CREAR:  'CRE-MED-02',
    EDITAR: 'EDI-MED-03',
  },
  CONSULTORIOS: {
    LISTAR: 'LIS-CON-01',
    CREAR:  'CRE-CON-02',
    EDITAR: 'EDI-CON-03',
  },
  LOCALIDADES: {
    LISTAR: 'LIS-LOC-01',
    CREAR:  'CRE-LOC-02',
    EDITAR: 'EDI-LOC-03',
  },
} as const;
