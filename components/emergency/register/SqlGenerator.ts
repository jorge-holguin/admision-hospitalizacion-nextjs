/**
 * Utility to generate SQL INSERT statements for emergency records
 */

export interface EmergencyData {
  EMERGENCIA_ID: string;
  PACIENTE: string;
  FECHA: string;
  HORA: string;
  CONSULTORIO: string;
  MEDICO: string;
  MOTIVO_EMERGENCIA: string;
  SEGURO: string;
  CIEX1: string;
  OBSERVACION1: string;
  OBSERVACION2: string;
  ESTADO: string;
  USUARIO: string;
  ORDEN: string;
  NOMBRES: string;
  TIPO_DOCUMENTO: string;
  DOCUMENTO: string;
  FECHA_NACIMIENTO: string;
  EDAD: string;
  SEXO: string;
  ESTADO_CIVIL: string;
  DIRECCION: string;
  DISTRITO: string;
  TELEFONO1: string;
  TELEFONO2: string;
  ACOMPANANTE: string;
  TIPO_DOCUMENTOA: string;
  DOCUMENTOA: string;
  PRE_AFILIACION: string;
  LOCALIDAD: string;
  TIPOATENCION: string;
  RELIGION: string;
  SEGUROLIQ: string;
  FORMA_INGRESO: string;
  CUENTAID: string;
  [key: string]: any;
}

/**
 * Generates a SQL INSERT statement for an emergency record
 * @param data Emergency data object
 * @returns SQL INSERT statement string
 */
export const generateSqlInsert = (data: EmergencyData): string => {
  // Format current date and time for SQL
  const currentDate = new Date();
  const formattedDate = `${currentDate.getFullYear()}${String(currentDate.getMonth() + 1).padStart(2, '0')}${String(currentDate.getDate()).padStart(2, '0')}`;
  const formattedTime = `${String(currentDate.getHours()).padStart(2, '0')}:${String(currentDate.getMinutes()).padStart(2, '0')}`;

  // Create SQL INSERT statement
  const sqlInsert = `INSERT INTO Emergencia (
    EMERGENCIA_ID,
    FECHA,
    HORA,
    ORDEN,
    PATERNO,
    MATERNO,
    NOMBRE,
    NOMBRES,
    PACIENTE,
    FECHA_NACIMIENTO,
    EDAD,
    SEXO,
    ESTADO_CIVIL,
    DIRECCION,
    DISTRITO,
    TELEFONO1,
    TELEFONO2,
    TIPO_DOCUMENTO,
    DOCUMENTO,
    ACOMPANANTE,
    TIPO_DOCUMENTOA,
    DOCUMENTOA,
    CONSULTORIO,
    MOTIVO_EMERGENCIA,
    SEGURO,
    OBSERVACION1,
    OBSERVACION2,
    ESTADO,
    CUENTAID,
    USUARIO,
    PRE_AFILIACION,
    LOCALIDAD,
    TIPOATENCION,
    RELIGION,
    SEGUROLIQ,
    FORMA_INGRESO
) VALUES (
    '${data.EMERGENCIA_ID || ''}',           -- EMERGENCIA_ID
    '${formattedDate}',                      -- FECHA
    '${formattedTime}',                      -- HORA
    '${data.ORDEN || ''}',                   -- ORDEN
    '${data.PATERNO || ''}',                 -- PATERNO
    '${data.MATERNO || ''}',                 -- MATERNO
    '${data.NOMBRE || ''}',                  -- NOMBRE
    '${data.NOMBRES || ''}',                 -- NOMBRES
    '${data.PACIENTE || ''}',                -- PACIENTE
    '${data.FECHA_NACIMIENTO || ''}',        -- FECHA_NACIMIENTO
    '${data.EDAD || ''}',                    -- EDAD
    '${data.SEXO || ''}',                    -- SEXO
    '${data.ESTADO_CIVIL || ''}',            -- ESTADO_CIVIL
    '${data.DIRECCION || ''}',               -- DIRECCION
    '${data.DISTRITO || ''}',                -- DISTRITO
    '${data.TELEFONO1 || ''}',               -- TELEFONO1
    '${data.TELEFONO2 || ''}',               -- TELEFONO2
    '${data.TIPO_DOCUMENTO || ''}',          -- TIPO_DOCUMENTO
    '${data.DOCUMENTO || ''}',               -- DOCUMENTO
    '${data.ACOMPANANTE || ''}',             -- ACOMPANANTE
    '${data.TIPO_DOCUMENTOA || ''}',         -- TIPO_DOCUMENTOA
    '${data.DOCUMENTOA || ''}',              -- DOCUMENTOA
    '${data.CONSULTORIO || ''}',             -- CONSULTORIO
    '${data.MOTIVO_EMERGENCIA || ''}',       -- MOTIVO_EMERGENCIA
    '${data.SEGURO || ''}',                  -- SEGURO
    '${data.OBSERVACION1 || ''}',            -- OBSERVACION1
    '${data.OBSERVACION2 || ''}',            -- OBSERVACION2
    '${data.ESTADO || '2'}',                 -- ESTADO
    '${data.CUENTAID || ''}',                -- CUENTAID
    '${data.USUARIO || 'SUPERVISOR'}',       -- USUARIO
    '${data.PRE_AFILIACION || ''}',          -- PRE_AFILIACION
    '${data.LOCALIDAD || ''}',               -- LOCALIDAD
    '${data.TIPOATENCION || 'E'}',           -- TIPOATENCION
    '${data.RELIGION || '0'}',               -- RELIGION
    '${data.SEGUROLIQ || ''}',               -- SEGUROLIQ
    '${data.FORMA_INGRESO || '1'}'           -- FORMA_INGRESO
);`;

  return sqlInsert;
};
