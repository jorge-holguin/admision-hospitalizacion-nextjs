// hospitalizaService.ts - Migrado a Spring Boot API
import { API_ENDPOINTS, fetchApi } from '@/lib/api-config';

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

export interface HospitalizaData {
  IDHOSPITALIZACION: string;
  PACIENTE: string;
  NOMBRES: string;
  CONSULTORIO1: string;
  HORA1: string;
  FECHA1: string | Date;
  ORIGEN: string;
  SEGURO: string;
  MEDICO1: string;
  ESTADO: string;
  USUARIO: string;
  USUARIO_IMP?: string | null;
  DIAGNOSTICO: string;
  EDAD: string;
  ORIGENID: string;
  ACOMPANANTE_NOMBRE?: string;
  ACOMPANANTE_TELEFONO?: string;
  ACOMPANANTE_DIRECCION?: string;
}

export interface HospitalizacionResponse {
  IDHOSPITALIZACION: string;
  PACIENTE: string;
  NOMBRES: string;
  CONSULTORIO1: string;
  HORA1: string;
  FECHA1: string;
  ORIGEN: string;
  SEGURO: string;
  MEDICO1: string;
  ESTADO: string;
  USUARIO: string;
  USUARIO_IMP?: string;
  DIAGNOSTICO: string;
  EDAD: string;
  ORIGENID: string;
  ACOMPANANTE_NOMBRE?: string;
  ACOMPANANTE_TELEFONO?: string;
  ACOMPANANTE_DIRECCION?: string;
  FECHA_BAJA?: string;
  USUARIO_BAJA?: string;
  [key: string]: any;
}

// ============================================================================
// SERVICIO DE HOSPITALIZACIÓN - SPRING BOOT API
// ============================================================================

class HospitalizaService {
  /**
   * Obtiene el siguiente ID de hospitalización
   */
  async getNextHospitalizacionId(): Promise<string> {
    try {      const response = await fetchApi(API_ENDPOINTS.hospitalizacion.nextId);
      
      if (!response.ok) {
        console.error('❌ Error al obtener siguiente ID:', response.status);
        return '2500000001';
      }
      
      const data = await response.json();      return data.nextId || data.toString();
    } catch (error) {
      console.error('❌ Error al obtener el siguiente ID de hospitalización:', error);
      return '2500000001';
    }
  }

  /**
   * Crea un nuevo registro de hospitalización
   */
  async create(data: HospitalizaData): Promise<HospitalizacionResponse | null> {
    try {      // Si no se proporciona un IDHOSPITALIZACION, obtener uno nuevo
      if (!data.IDHOSPITALIZACION) {
        data.IDHOSPITALIZACION = await this.getNextHospitalizacionId();
      }
      
      // Formatear la fecha si es necesario
      let fecha1 = data.FECHA1;
      if (fecha1 instanceof Date) {
        fecha1 = fecha1.toISOString().split('T')[0];
      } else if (typeof fecha1 === 'string') {
        // Normalizar formato de fecha
        if (fecha1.includes('/')) {
          const [day, month, year] = fecha1.split('/').map(Number);
          fecha1 = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        }
      }
      
      const payload = {
        ...data,
        FECHA1: fecha1,
        USUARIO_IMP: data.USUARIO_IMP || data.USUARIO,
      };      const response = await fetchApi(API_ENDPOINTS.hospitalizacion.create, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Error al crear hospitalización:', errorData);
        
        // Detectar error de trigger de emergencia no cerrada
        if (errorData.message && (
          errorData.message.includes('3616') || 
          errorData.message.includes('emergencia') ||
          errorData.message.includes('Emergencia')
        )) {
          throw new Error('La atención de Emergencia aún no ha sido cerrada (estado = \'3\'). Solicitar al médico cerrar o dar de alta la atención.');
        }
        
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();      return result;
    } catch (error: any) {
      console.error('❌ Error al crear hospitalización:', error);
      throw error;
    }
  }

  /**
   * Obtiene un registro de hospitalización por su ID
   */
  async findById(id: string): Promise<HospitalizacionResponse | null> {
    try {      const response = await fetchApi(API_ENDPOINTS.hospitalizacion.byId(id));
      
      if (response.status === 404) {        return null;
      }
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const hospitalizacion = await response.json();      return hospitalizacion;
    } catch (error) {
      console.error('❌ Error al buscar hospitalización:', error);
      throw error;
    }
  }

  /**
   * Obtiene todos los registros de hospitalización
   */
  async findAll(): Promise<HospitalizacionResponse[]> {
    try {      const response = await fetchApi(API_ENDPOINTS.hospitalizacion.list);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const resultados = await response.json();      return Array.isArray(resultados) ? resultados : resultados.data || [];
    } catch (error) {
      console.error('❌ Error al obtener hospitalizaciones:', error);
      throw error;
    }
  }
  
  /**
   * Obtiene el siguiente ID de hospitalización para mostrar en el frontend
   */
  async getNextId(): Promise<{ nextId: string }> {
    try {
      const nextId = await this.getNextHospitalizacionId();
      return { nextId };
    } catch (error) {
      console.error('❌ Error al obtener el siguiente ID:', error);
      throw error;
    }
  }
  
  /**
   * Elimina un registro de hospitalización por su ID (eliminación física)
   */
  async deleteById(id: string): Promise<{ success: boolean; message: string }> {
    try {      const response = await fetchApi(API_ENDPOINTS.hospitalizacion.delete(id), {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
      }      return { success: true, message: `Hospitalización ${id} eliminada correctamente` };
    } catch (error: any) {
      console.error(`❌ Error al eliminar hospitalización ${id}:`, error);
      throw error;
    }
  }

  /**
   * Realiza una eliminación lógica de un registro de hospitalización por su ID
   * Actualiza ESTADO='0', FECHA_BAJA, USUARIO_BAJA
   */
  async logicalDeleteById(
    id: string, 
    usuarioBaja: string, 
    motivo?: string
  ): Promise<{
    success: boolean;
    message: string;
    deletedHospitalizacion?: number;
    cuentaUpdateResult?: { success: boolean; message: string };
  }> {
    try {      const response = await fetchApi(API_ENDPOINTS.hospitalizacion.logicalDelete(id), {
        method: 'PUT',
        body: JSON.stringify({
          usuarioBaja,
          motivo,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();      return {
        success: true,
        message: result.message || `Hospitalización ${id} marcada como eliminada correctamente`,
        deletedHospitalizacion: result.deletedHospitalizacion || 1,
        cuentaUpdateResult: result.cuentaUpdateResult,
      };
    } catch (error: any) {
      console.error(`❌ Error al realizar eliminación lógica de hospitalización ${id}:`, error);
      throw error;
    }
  }
}

export default new HospitalizaService();
