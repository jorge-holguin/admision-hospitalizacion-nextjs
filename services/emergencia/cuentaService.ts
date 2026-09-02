// cuentaService.ts - Migrado a Spring Boot API
import { API_ENDPOINTS, buildUrl, fetchApi } from '@/lib/api-config';
import { normalizarSeguroCuenta } from '@/utils/seguroCuentaUtils';

// ============================================================================
// SERVICIO DE CUENTAS - SPRING BOOT API
// ============================================================================

class CuentaService {
  /**
   * Obtiene el número de cuenta activa del paciente
   */
  async getCuentaActivaByPacienteId(pacienteId: string): Promise<string | null> {
    try {
      console.log(`🔍 Buscando cuenta activa para paciente: ${pacienteId}`);
      
      const url = buildUrl(API_ENDPOINTS.cuentas.activaByPaciente(pacienteId), {
        estado: '1',
        origen: 'EM',
        seguro: '01',
      });
      
      const response = await fetchApi(url);
      
      if (response.status === 404) {
        console.log(`⚠️ No se encontró cuenta activa para paciente ${pacienteId}`);
        return null;
      }
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data && data.CUENTAID) {
        console.log(`✅ Cuenta encontrada para paciente ${pacienteId}:`, data.CUENTAID);
        return data.CUENTAID;
      }
      
      console.log(`⚠️ No se encontró cuenta activa para paciente ${pacienteId}`);
      return null;
    } catch (error: any) {
      const errorMessage = `Error al obtener cuenta del paciente ${pacienteId}: ${error.message || 'Error desconocido'}`;
      console.error(`❌ ${errorMessage}`, error);
      return null;
    }
  }

  /**
   * Obtiene el número de cuenta activa del paciente por tipo de seguro
   */
  async getCuentaActivaByPacienteIdAndSeguro(pacienteId: string, tipoSeguro: string): Promise<string | null> {
    try {
      console.log(`🔍 Buscando cuenta activa para paciente: ${pacienteId} con seguro: ${tipoSeguro}`);
      
      // Mapear el tipo de seguro al código correcto
      const codigoSeguro = normalizarSeguroCuenta(tipoSeguro);
      
      console.log(`Seguro recibido: '${tipoSeguro}' -> Código para búsqueda: '${codigoSeguro}'`);
      
      const url = buildUrl(API_ENDPOINTS.cuentas.activaByPacienteAndSeguro(pacienteId), {
        estado: '1',
        origen: 'EM',
        seguro: codigoSeguro,
      });
      const response = await fetchApi(url);
      
      if (response.status === 404) {
        console.log(`⚠️ No se encontró cuenta activa para paciente ${pacienteId} con seguro ${codigoSeguro}`);
        return null;
      }
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data && data.CUENTAID) {
        console.log(`✅ Cuenta encontrada para paciente ${pacienteId} con seguro ${codigoSeguro}:`, data.CUENTAID);
        return data.CUENTAID;
      }
      
      console.log(`⚠️ No se encontró cuenta activa para paciente ${pacienteId} con seguro ${codigoSeguro}`);
      return null;
    } catch (error: any) {
      const errorMessage = `Error al obtener cuenta del paciente ${pacienteId} con seguro ${tipoSeguro}: ${error.message || 'Error desconocido'}`;
      console.error(`❌ ${errorMessage}`, error);
      return null;
    }
  }

  async getFUAActivaByCuentaId(cuentaId: string): Promise<string | null> {
    try {
      console.log(`🔍 Buscando FUA activa para cuenta: ${cuentaId}`);
      
      const url = API_ENDPOINTS.cuentas.fua.activaByCuenta(cuentaId);
      const response = await fetchApi(url);
      
      if (response.status === 404) {
        console.log(`⚠️ No se encontró FUA activa para cuenta ${cuentaId}`);
        return null;
      }
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data && data.NROFUA) {
        console.log(`✅ FUA encontrada para cuenta ${cuentaId}:`, data.NROFUA);
        return data.NROFUA;
      }
      
      console.log(`⚠️ No se encontró FUA activa para cuenta ${cuentaId}`);
      return null;
    } catch (error: any) {
      const errorMessage = `Error al obtener FUA de la cuenta ${cuentaId}: ${error.message || 'Error desconocido'}`;
      console.error(`❌ ${errorMessage}`, error);
      return null;
    }
  }

  /**
   * Actualiza el estado de una cuenta a 0 (inactiva)
   */
  async updateCUENTA(cuentaId: string): Promise<boolean> {
    try {
      console.log(`🔄 Actualizando estado de cuenta ${cuentaId} a inactivo`);
      
      const url = API_ENDPOINTS.cuentas.updateEstado(cuentaId);
      const response = await fetchApi(url, {
        method: 'PUT',
        body: JSON.stringify({ estado: '0' }),
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      console.log(`✅ Cuenta ${cuentaId} actualizada a estado inactivo`);
      return true;
    } catch (error: any) {
      const errorMessage = `Error al actualizar estado de cuenta ${cuentaId}: ${error.message || 'Error desconocido'}`;
      console.error(`❌ ${errorMessage}`, error);
      return false;
    }
  }

  /**
   * Actualiza el estado de una FUA a 0 (inactiva) en la tabla ATENCION_SEGURO
   */
  async updateFUA(nroFua: string): Promise<boolean> {
    try {
      console.log(`🔄 Actualizando estado de FUA ${nroFua} a inactivo`);
      
      const url = API_ENDPOINTS.cuentas.fua.updateEstado(nroFua);
      const response = await fetchApi(url, {
        method: 'PUT',
        body: JSON.stringify({ estado: '0' }),
      });
      
      if (response.status === 404) {
        console.log(`⚠️ No se encontró FUA ${nroFua} en ATENCION_SEGURO`);
        return false;
      }
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      console.log(`✅ FUA ${nroFua} actualizada a estado inactivo`);
      return true;
    } catch (error: any) {
      const errorMessage = `Error al actualizar estado de FUA ${nroFua}: ${error.message || 'Error desconocido'}`;
      console.error(`❌ ${errorMessage}`, error);
      return false;
    }
  }

  /**
   * Actualiza tanto la cuenta como la FUA asociada a estado inactivo (0)
   */
  async updateCuentaAndFUA(cuentaId: string): Promise<{ success: boolean, message: string }> {
    try {
      console.log(`🔄 Inactivando cuenta ${cuentaId} y FUA asociada`);
      
      const url = API_ENDPOINTS.cuentas.updateCuentaAndFua(cuentaId);
      const response = await fetchApi(url, {
        method: 'PUT',
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return { 
          success: false, 
          message: errorData.message || `Error al actualizar cuenta ${cuentaId}` 
        };
      }
      
      const data = await response.json();
      
      return { 
        success: true, 
        message: data.message || `Cuenta ${cuentaId} y FUA actualizadas correctamente a estado inactivo` 
      };
    } catch (error: any) {
      const errorMessage = `Error al actualizar cuenta y FUA: ${error.message || 'Error desconocido'}`;
      console.error(`❌ ${errorMessage}`, error);
      return { success: false, message: errorMessage };
    }
  }

  /**
   * Actualiza el campo SEGURO de una cuenta específica
   */
  async updateCuentaSeguro(cuentaId: string, nuevoSeguro: string): Promise<any> {
    try {
      console.log(`🔄 Actualizando cuenta ${cuentaId} con nuevo seguro: ${nuevoSeguro}`);
      
      // Normalizar el código de seguro
      let seguroNormalizado = nuevoSeguro.trim();
      
      const url = API_ENDPOINTS.cuentas.updateSeguro(cuentaId);
      const response = await fetchApi(url, {
        method: 'PUT',
        body: JSON.stringify({ seguro: seguroNormalizado }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          message: errorData.message || `No se pudo actualizar la cuenta ${cuentaId}`
        };
      }
      
      const data = await response.json();
      console.log(`✅ Cuenta ${cuentaId} actualizada con seguro ${seguroNormalizado}`);
      
      return {
        success: true,
        message: `Cuenta ${cuentaId} actualizada correctamente con seguro ${seguroNormalizado}`,
        data: data
      };
    } catch (error: any) {
      const errorMessage = `Error al actualizar seguro de cuenta ${cuentaId}: ${error.message || 'Error desconocido'}`;
      console.error(`❌ ${errorMessage}`, error);
      return { success: false, message: errorMessage };
    }
  }

  /**
   * Actualiza la OBSERVACION y EMPRESASEGURO de una cuenta específica
   */
  async updateCuentaObservacionYEmpresa(
    cuentaId: string, 
    observacion?: string, 
    empresaSeguro?: string
  ): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      console.log(`📝 Actualizando cuenta ${cuentaId}:`);
      console.log(`   - OBSERVACION: ${observacion || '(sin cambio)'}`);
      console.log(`   - EMPRESASEGURO: ${empresaSeguro || '(sin cambio)'}`);
      
      const body: Record<string, string> = {};
      if (observacion !== undefined && observacion !== null) {
        body.observacion = observacion;
      }
      if (empresaSeguro !== undefined && empresaSeguro !== null) {
        body.empresaSeguro = empresaSeguro.trim();
      }
      
      if (Object.keys(body).length === 0) {
        return {
          success: true,
          message: 'No hay campos para actualizar'
        };
      }
      
      const url = API_ENDPOINTS.cuentas.updateObservacionYEmpresa(cuentaId);
      const response = await fetchApi(url, {
        method: 'PUT',
        body: JSON.stringify(body),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          message: errorData.message || `No se encontró la cuenta ${cuentaId}`
        };
      }
      
      const data = await response.json();
      console.log(`✅ Cuenta ${cuentaId} actualizada correctamente`);
      
      return {
        success: true,
        message: `Cuenta ${cuentaId} actualizada correctamente`,
        data: data
      };
    } catch (error: any) {
      const errorMessage = `Error al actualizar cuenta ${cuentaId}: ${error.message || 'Error desconocido'}`;
      console.error(`❌ ${errorMessage}`, error);
      return { success: false, message: errorMessage };
    }
  }

  /**
   * Obtiene una cuenta por su ID
   */
  async getCuentaById(cuentaId: string): Promise<any | null> {
    try {
      console.log(`🔍 Buscando cuenta: ${cuentaId}`);
      
      const url = API_ENDPOINTS.cuentas.byId(cuentaId);
      const response = await fetchApi(url);
      
      if (response.status === 404) {
        console.log(`⚠️ No se encontró cuenta ${cuentaId}`);
        return null;
      }
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`✅ Cuenta encontrada: ${cuentaId}`);
      
      return data;
    } catch (error: any) {
      console.error(`❌ Error al obtener cuenta ${cuentaId}:`, error);
      return null;
    }
  }
}

export const cuentaService = new CuentaService();
