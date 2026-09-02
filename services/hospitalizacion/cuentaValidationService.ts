// cuentaValidationService.ts - Migrado a Spring Boot API
import { API_ENDPOINTS, buildUrl, fetchApi } from '@/lib/api-config';
import { normalizarSeguroCuenta } from '@/utils/seguroCuentaUtils';

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

export interface CuentaValidationResult {
  isValid: boolean;
  cuentaId: string | null;
  fuaId: string | null;
  message: string;
  tipoValidacion: 'SIS' | 'PAGANTE_SOAT';
}

export interface CuentaActiva {
  CUENTAID: string;
  PACIENTE: string;
  SEGURO: string;
  ESTADO: string;
  ORIGEN: string;
  NROFUA?: string;
}

export interface FuaActivo {
  NUMATENCION: string;
  PACIENTE: string;
  ESTADO: string;
  FECHA_ATENCION: Date | string;
  HORA_ATENCION: string;
}

// ============================================================================
// SERVICIO DE VALIDACIÓN DE CUENTAS - SPRING BOOT API
// ============================================================================

export class CuentaValidationService {
  
  /**
   * Obtiene cuenta activa del paciente por tipo de seguro
   */
  async getCuentaActivaByPacienteIdAndSeguro(pacienteId: string, tipoSeguro: string): Promise<CuentaActiva | null> {
    try {
      const seguroNormalizado = normalizarSeguroCuenta(tipoSeguro);
      console.log(`🔍 Buscando cuenta activa para paciente: ${pacienteId} con seguro: ${tipoSeguro} → ${seguroNormalizado}`);
      
      const url = buildUrl(API_ENDPOINTS.cuentas.byPacienteAndSeguro(pacienteId), {
        seguro: seguroNormalizado,
        origen: 'HO',
        estado: '1',
      });
      
      const response = await fetchApi(url);
      
      if (response.status === 404) {
        console.log(`⚠️ No se encontró cuenta activa para paciente ${pacienteId}`);
        return null;
      }
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const cuenta = await response.json();
      console.log(`✅ Cuenta encontrada para paciente ${pacienteId}:`, cuenta);
      
      return cuenta;
    } catch (error: any) {
      console.error(`❌ Error al obtener cuenta del paciente ${pacienteId}:`, error);
      return null;
    }
  }

  /**
   * Valida si un FUA está activo según las reglas de 3 u 8 horas
   */
  async validateFuaActivo(fuaNumber: string): Promise<boolean> {
    try {
      console.log(`🔍 Validando FUA activo: ${fuaNumber}`);
      
      const url = API_ENDPOINTS.cuentas.fua.validate(fuaNumber);
      const response = await fetchApi(url);
      
      if (!response.ok) {
        console.log(`⚠️ FUA ${fuaNumber} no encontrado o no válido`);
        return false;
      }
      
      const data = await response.json();
      const esValido = data.isValid || data.esValido || false;
      
      console.log(`✅ FUA ${fuaNumber} validación: ${esValido}`);
      return esValido;
    } catch (error) {
      console.error(`❌ Error al validar FUA ${fuaNumber}:`, error);
      return false;
    }
  }

  /**
   * Valida cuenta y FUA según el tipo de seguro
   */
  async validateCuentaAndFua(pacienteId: string, tipoSeguro: string): Promise<CuentaValidationResult> {
    try {
      const seguroNormalizado = normalizarSeguroCuenta(tipoSeguro);
      console.log(`🔍 Validando cuenta y FUA para paciente: ${pacienteId}, seguro: ${tipoSeguro} → ${seguroNormalizado}`);
      
      const url = buildUrl(API_ENDPOINTS.cuentas.validateCuentaAndFua, {
        pacienteId,
        tipoSeguro: seguroNormalizado,
      });
      
      const response = await fetchApi(url);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          isValid: false,
          cuentaId: null,
          fuaId: null,
          message: errorData.message || 'Error al validar cuenta y FUA',
          tipoValidacion: 'SIS'
        };
      }
      
      const result = await response.json();
      console.log(`✅ Resultado validación:`, result);
      
      return {
        isValid: result.isValid || result.valid || false,
        cuentaId: result.cuentaId || null,
        fuaId: result.fuaId || null,
        message: result.message || '',
        tipoValidacion: result.tipoValidacion || 'SIS'
      };
    } catch (error) {
      console.error(`❌ Error al validar cuenta y FUA:`, error);
      return {
        isValid: false,
        cuentaId: null,
        fuaId: null,
        message: 'Error interno al validar cuenta y FUA',
        tipoValidacion: 'SIS'
      };
    }
  }

  /**
   * Obtiene información detallada de una cuenta específica
   */
  async getCuentaDetails(cuentaId: string): Promise<CuentaActiva | null> {
    try {
      console.log(`🔍 Obteniendo detalles de cuenta: ${cuentaId}`);
      
      const url = API_ENDPOINTS.cuentas.byId(cuentaId);
      const response = await fetchApi(url);
      
      if (response.status === 404) {
        return null;
      }
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const cuenta = await response.json();
      return cuenta;
    } catch (error) {
      console.error(`❌ Error al obtener detalles de cuenta ${cuentaId}:`, error);
      return null;
    }
  }

  /**
   * Obtiene información detallada de un FUA específico
   */
  async getFuaDetails(fuaNumber: string): Promise<FuaActivo | null> {
    try {
      console.log(`🔍 Obteniendo detalles de FUA: ${fuaNumber}`);
      
      const url = API_ENDPOINTS.cuentas.fua.details(fuaNumber);
      const response = await fetchApi(url);
      
      if (response.status === 404) {
        return null;
      }
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const fua = await response.json();
      return fua;
    } catch (error) {
      console.error(`❌ Error al obtener detalles de FUA ${fuaNumber}:`, error);
      return null;
    }
  }

  /**
   * Obtiene el número de FUA activa asociado a una cuenta
   */
  async getFUAActivaByCuentaId(cuentaId: string): Promise<string | null> {
    try {
      console.log(`🔍 Buscando FUA activa para cuenta: ${cuentaId}`);
      
      const cuenta = await this.getCuentaDetails(cuentaId);
      
      if (cuenta && cuenta.NROFUA) {
        const nroFua = cuenta.NROFUA.trim();
        console.log(`✅ FUA encontrada para cuenta ${cuentaId}: ${nroFua}`);
        return nroFua;
      }
      
      console.log(`⚠️ No se encontró FUA activa para la cuenta ${cuentaId}`);
      return null;
    } catch (error: any) {
      console.error(`❌ Error al obtener FUA de cuenta ${cuentaId}:`, error);
      return null;
    }
  }

  /**
   * Actualiza el estado de una FUA a 0 (inactiva)
   */
  async updateFUA(nroFua: string): Promise<boolean> {
    try {
      console.log(`🔄 Actualizando estado de FUA ${nroFua} a inactivo`);
      
      const url = API_ENDPOINTS.cuentas.fua.updateEstado(nroFua);
      const response = await fetchApi(url, {
        method: 'PUT',
        body: JSON.stringify({ estado: '0' }),
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      console.log(`✅ FUA ${nroFua} actualizada a estado inactivo`);
      return true;
    } catch (error: any) {
      console.error(`❌ Error al actualizar estado de FUA ${nroFua}:`, error);
      return false;
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
      console.error(`❌ Error al actualizar estado de cuenta ${cuentaId}:`, error);
      return false;
    }
  }

  /**
   * Actualiza tanto la cuenta como la FUA asociada a estado inactivo (0)
   * Implementa borrado lógico
   */
  async updateCuentaAndFUA(cuentaId: string): Promise<{ success: boolean, message: string }> {
    try {
      console.log(`🔄 Iniciando borrado lógico para cuenta: ${cuentaId}`);
      
      const url = API_ENDPOINTS.cuentas.logicalDelete(cuentaId);
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
      
      const result = await response.json();
      console.log(`✅ Borrado lógico completado:`, result);
      
      return {
        success: true,
        message: result.message || `Cuenta ${cuentaId} actualizada correctamente`
      };
    } catch (error: any) {
      const errorMessage = `Error al actualizar cuenta y FUA: ${error.message || 'Error desconocido'}`;
      console.error(`❌ ${errorMessage}`, error);
      return { success: false, message: errorMessage };
    }
  }
}

// Instancia singleton del servicio
export const cuentaValidationService = new CuentaValidationService();
