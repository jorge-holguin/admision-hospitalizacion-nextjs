import { useState } from 'react';
import { mapReniecToPatientForm } from '@/utils/reniecMapper';

interface ReniecData {
  codigoRespuesta: string;
  codigoError: string;
  dni: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  /** Apellido de casada (se concatena al apellidoMaterno si viene presente). */
  apellidoCasada?: string;
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
  nivelEstudios?: string;  // Código RENIEC de grado de instrucción
  gradoInstruccionCod?: string;  // Código RENIEC de grado de instrucción (campo alternativo)
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
      
      // Si no hay usuario en el token, usar el DNI del paciente como usuario

      const ip = getClientIP();
      const usuarioFinal = usuario || dni; // Usar el DNI del paciente si no hay usuario

      // Parámetros fijos según especificación
      const app = 'SIAH';
      const urlAplicativo = '192.168.0.18:3000';
      const moduloAplicativo = 'ADMISION';

      // URL de RENIEC desde variable de entorno
      const reniecBaseUrl = import.meta.env.VITE_API_CITAS_MASTER_URL || 'http://192.168.0.252:9011/api';
      const reniecUrl = `${reniecBaseUrl}/reniec/datos-completos?dni=${dni}&usuario=${usuarioFinal}&app=${app}&ip=${ip}&urlAplicativo=${urlAplicativo}&moduloAplicativo=${moduloAplicativo}`;

      // Crear AbortController para timeout de 15 segundos
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, 15000); // 15 segundos de timeout

      let reniecData: ReniecData;
      
      try {
        // Llamar directamente a la API de RENIEC con timeout
        const response = await fetch(reniecUrl, {
          method: 'GET',
          headers: {
            'accept': '*/*'
          },
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`Error al consultar RENIEC: ${response.statusText}`);
        }

        reniecData = await response.json();
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        
        // Detectar si fue un timeout (abort)
        if (fetchError.name === 'AbortError') {
          console.error('⏱️ Timeout de 15 segundos alcanzado al consultar RENIEC');
          throw new Error('RENIEC_TIMEOUT: La consulta a RENIEC ha excedido el tiempo de espera (15 segundos). Proceda con el registro manual.');
        }
        throw fetchError;
      }

      // Verificar si la respuesta es exitosa
      // 0000 = Éxito
      // 5114 = DNI no existe en base de datos RENIEC
      if (reniecData.codigoRespuesta === '5114') {
        throw new Error('DNI_NO_EXISTE: El DNI consultado no existe en la base de datos de RENIEC');
      }
      
      if (reniecData.codigoRespuesta !== '0000') {
        throw new Error(reniecData.codigoError || `Error RENIEC (código ${reniecData.codigoRespuesta})`);
      }

      // Detectar caso degradado: 200 pero campos importantes nulos/vacíos
      const primaryFields = [
        reniecData?.dni,
        reniecData?.apellidoPaterno,
        reniecData?.apellidoMaterno,
        reniecData?.nombres,
        reniecData?.fechaNacimiento,
        reniecData?.sexo,
        reniecData?.direccion,
        reniecData?.imagenFoto,
      ];
      const isDegraded = primaryFields.every((v) => v === null || v === undefined || String(v).trim() === '');

      // Mapear datos de RENIEC al formato del formulario (ahora es async)
      const mappedData = await mapReniecToPatientForm(reniecData);

      return {
        success: true,
        data: mappedData,
        rawData: reniecData,
        degraded: isDegraded,
        warning: isDegraded ? 'RENIEC_SIN_DATOS' : undefined,
      };

    } catch (err: any) {
      const errorMessage = err.message || 'Error al consultar RENIEC';
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
