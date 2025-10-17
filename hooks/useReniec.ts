import { useState } from 'react';
import { mapReniecToPatientForm } from '@/utils/reniecMapper';

interface ReniecData {
  codigoRespuesta: string;
  codigoError: string;
  dni: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  nombres: string;
  fechaNacimiento: string;
  sexo: string;
  estadoCivil: string;
  pais: string;
  departamentoNacimiento: string;
  direccion: string;
  distrito: string;
  nombrePadre: string;
  nombreMadre: string;
  imagenFoto: string;
}

/**
 * Hook para consultar datos de RENIEC directamente
 */
export function useReniec() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Obtiene la IP del cliente - IP fija para RENIEC
   */
  const getClientIP = (): string => {
    // IP fija según especificación
    return '192.168.0.18';
  };

  /**
   * Obtiene el DNI del usuario desde el JWT
   */
  const getUserDNI = (): string => {
    try {
      if (typeof window === 'undefined') return '';
      
      const token = localStorage.getItem('token');
      if (!token) return '';

      const payload = token.split('.')[1];
      const decoded = JSON.parse(atob(payload));
      
      return decoded.documento || decoded.dni || '';
    } catch (error) {
      console.error('Error al obtener DNI del usuario:', error);
      return '';
    }
  };

  /**
   * Consulta datos de RENIEC por DNI - Consume directamente la API de RENIEC
   */
  const consultarReniec = async (dni: string) => {
    setLoading(true);
    setError(null);

    try {
      // Validar que el DNI tenga 8 dígitos
      if (!/^\d{8}$/.test(dni)) {
        throw new Error('El DNI debe tener 8 dígitos');
      }

      // Obtener datos necesarios para la consulta
      const usuario = getUserDNI();
      console.log('🔑 Token encontrado, DNI del usuario:', usuario);
      
      if (!usuario) {
        console.warn('⚠️ No se pudo obtener DNI del usuario, usando DNI del paciente como usuario');
        // Si no hay usuario en el token, usar el DNI del paciente como usuario
      }

      const ip = getClientIP();
      const usuarioFinal = usuario || dni; // Usar el DNI del paciente si no hay usuario

      // Parámetros fijos según especificación
      const app = 'SIAH';
      const urlAplicativo = '192.168.0.18:3000';
      const moduloAplicativo = 'ADMISION';

      // URL de RENIEC desde variable de entorno
      const reniecBaseUrl = process.env.NEXT_PUBLIC_API_CITAS_MASTER_URL || 'http://192.168.0.252:9011/api';
      const reniecUrl = `${reniecBaseUrl}/reniec/datos-completos?dni=${dni}&usuario=${usuarioFinal}&app=${app}&ip=${ip}&urlAplicativo=${urlAplicativo}&moduloAplicativo=${moduloAplicativo}`;

      console.log(`🔍 Consultando RENIEC para DNI: ${dni}`);
      console.log(`👤 Usuario: ${usuarioFinal}, IP: ${ip}`);
      console.log(`📡 URL: ${reniecUrl}`);

      // Llamar directamente a la API de RENIEC
      const response = await fetch(reniecUrl, {
        method: 'GET',
        headers: {
          'accept': '*/*'
        }
      });

      if (!response.ok) {
        throw new Error(`Error al consultar RENIEC: ${response.statusText}`);
      }

      const reniecData: ReniecData = await response.json();

      // Verificar si la respuesta es exitosa
      if (reniecData.codigoRespuesta !== '0000') {
        throw new Error(reniecData.codigoError || 'No se encontraron datos en RENIEC');
      }

      console.log('✅ Datos obtenidos de RENIEC:', reniecData);

      // Mapear datos de RENIEC al formato del formulario
      const mappedData = mapReniecToPatientForm(reniecData);

      return {
        success: true,
        data: mappedData,
        rawData: reniecData
      };

    } catch (err: any) {
      const errorMessage = err.message || 'Error al consultar RENIEC';
      console.error('❌ Error en consulta RENIEC:', errorMessage);
      setError(errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setLoading(false);
    }
  };

  return {
    consultarReniec,
    loading,
    error
  };
}
