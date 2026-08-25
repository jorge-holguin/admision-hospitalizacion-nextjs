import { serializeBigInt } from '@/lib/utils';
import { filiacionService } from '@/services/hospitalizacion/filiacionService';

/**
 * Servicio para obtener datos de pacientes directamente desde la API
 */
export const pacienteApiService = {
  /**
   * Obtener datos de un paciente por su ID desde la API
   * @param id ID del paciente
   * @returns Datos del paciente o null si no se encuentra
   */
  async getPacienteFromApi(id: string) {
    try {
      const paciente = await filiacionService.getFiliacionById(id);

      if (!paciente) {
        console.error('La API no devolvió datos válidos del paciente:', id);
        return null;
      }

      return serializeBigInt(paciente) as any;
    } catch (error) {
      console.error(`Error al obtener datos del paciente desde la API:`, error instanceof Error ? error.message : 'Error desconocido');
      throw error;
    }
  },
  
  /**
   * Obtener la edad formateada de un paciente
   * @param pacienteId ID del paciente
   * @returns Edad formateada en formato '000a00m00d' o null si no se puede obtener
   */
  async getFormattedAge(pacienteId: string) {
    try {
      
      // Obtener los datos del paciente desde la API
      const pacienteData = await this.getPacienteFromApi(pacienteId);
      
      if (!pacienteData) {
        console.error(`No se encontraron datos para el paciente ID: ${pacienteId}`);
        return '000a00m00d'; // Devolver un valor por defecto en lugar de null
      }
            
      // Verificar si ya tenemos una edad formateada como string en el formato correcto (000a00m00d)
      if (typeof pacienteData.EDAD === 'string' && /^\d{3}a\d{2}m\d{2}d$/.test(pacienteData.EDAD)) {
        return pacienteData.EDAD;
      }
      
      // Verificar si tenemos la fecha de nacimiento
      if (pacienteData.FECHA_NACIMIENTO && pacienteData.FECHA_NACIMIENTO !== null) {
        try {          
          // Convertir la fecha de nacimiento a objeto Date
          const fechaNacimiento = new Date(pacienteData.FECHA_NACIMIENTO);
          
          // Verificar que la fecha sea válida
          if (!isNaN(fechaNacimiento.getTime())) {
            const hoy = new Date();
            
            // Calcular años, meses y días
            let años = hoy.getFullYear() - fechaNacimiento.getFullYear();
            let meses = hoy.getMonth() - fechaNacimiento.getMonth();
            let dias = hoy.getDate() - fechaNacimiento.getDate();
            
            // Ajustar si los días son negativos
            if (dias < 0) {
              meses--;
              // Obtener el último día del mes anterior
              const ultimoDiaMesAnterior = new Date(hoy.getFullYear(), hoy.getMonth(), 0).getDate();
              dias += ultimoDiaMesAnterior;
            }
            
            // Ajustar si los meses son negativos
            if (meses < 0) {
              años--;
              meses += 12;
            }
            
            // Formatear como '000a00m00d'
            const edadFormateada = `${años.toString().padStart(3, '0')}a${meses.toString().padStart(2, '0')}m${dias.toString().padStart(2, '0')}d`;
            return edadFormateada;
          } else {
            console.error('La fecha de nacimiento no es válida:', pacienteData.FECHA_NACIMIENTO);
          }
        } catch (error) {
          console.error('Error al calcular edad a partir de fecha de nacimiento:', error);
        }
      }
      
      // Si tenemos la edad como número (años) o como string que se puede convertir a número
      if (pacienteData.EDAD !== undefined && pacienteData.EDAD !== null) {
        try {
          let edadAños;
          
          // Intentar extraer números de la edad si es una cadena
          if (typeof pacienteData.EDAD === 'string') {
            // Intentar extraer el primer grupo de dígitos
            const match = pacienteData.EDAD.match(/(\d+)/);
            if (match && match[1]) {
              edadAños = parseInt(match[1]);
            } else {
              // Si no hay dígitos, intentar convertir directamente
              edadAños = parseInt(pacienteData.EDAD);
            }
          } else {
            // Si no es string, intentar usar directamente
            edadAños = pacienteData.EDAD;
          }
          
          if (!isNaN(edadAños)) {
            // Formatear como '000a00m00d' (solo años, 0 meses, 0 días)
            const edadFormateada = `${edadAños.toString().padStart(3, '0')}a00m00d`;
            return edadFormateada;
          } else {
            console.error('No se pudo convertir la edad a un número válido:', pacienteData.EDAD);
          }
        } catch (error) {
          console.error('Error al formatear edad:', error);
        }
      }
      
      // No se pudo obtener la edad en ningún formato, devolver un valor por defecto
      console.error('No se pudo obtener la edad del paciente, usando valor por defecto');
      return '000a00m00d';
    } catch (error) {
      console.error(`Error al obtener la edad formateada:`, error instanceof Error ? error.message : 'Error desconocido');
      return '000a00m00d'; // Devolver un valor por defecto en caso de error
    }
  }
};
