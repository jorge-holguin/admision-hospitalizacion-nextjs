// Interfaz para los detalles de hospitalización
export interface HospitalizacionDetalle {
  ID_HOSPITALIZACION: string;
  PACIENTEID: string;
  FECHA1: string;
  HORA1: string;
  ORIGEN: string;
  CUENTAID: string;
  CONSULTORIO1: string;
  MEDICO1: string;
  SEGURO: string;
  DIAGNOSTICO: string;
  ACOMPANANTE?: string;
  TELEFONO_ACOMP?: string;
  DIRECCION_ACOMP?: string;
  ESTADO: string;
}

export default HospitalizacionDetalle;
