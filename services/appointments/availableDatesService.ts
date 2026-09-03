export interface AvailableDate {
  fecha: string;  // "2025-10-17 00:00:00.0"
  consultorio: string;
  totalDisponibles?: number;  // ✅ Total de citas disponibles (0 = sin citas disponibles)
}

export interface FetchAvailableDatesParams {
  fechaInicio: string;  // "2025-10-17"
  fechaFin: string;      // "2025-10-31"
  turnoConsulta?: 'M' | 'T';  // M = Mañana, T = Tarde, opcional para obtener ambos
  consultorioId: string;    // "6092" - Código del consultorio
}

/**
 * Servicio para obtener las fechas con citas disponibles desde la API externa
 */
export const availableDatesService = {
  /**
   * Obtiene las fechas con citas disponibles para un consultorio y turno
   */
  async fetchAvailableDates(params: FetchAvailableDatesParams): Promise<AvailableDate[]> {
    try {
      const { fechaInicio, fechaFin, turnoConsulta, consultorioId } = params;
      const baseUrl = import.meta.env.VITE_API_CITAS_MASTER_URL;
      
      // Convertir formato de fecha de yyyy-MM-dd a dd/MM/yyyy
      const formatDate = (date: string) => {
        const [year, month, day] = date.split('-');
        return `${day}/${month}/${year}`;
      };
      
      const desde = formatDate(fechaInicio);
      const hasta = formatDate(fechaFin);
      
      // Usar /api/cita/citas-por-medico-consultorio con consultorioId
      let url = `${baseUrl}/cita/citas-por-medico-consultorio?desde=${desde}&hasta=${hasta}&consultorioId=${consultorioId}`;
      if (turnoConsulta) {
        url += `&turnoConsulta=${turnoConsulta}`;
      }
      
      console.log('🔍 availableDatesService: Consultando fechas disponibles:', url);
      const response = await fetch(url);
      
      if (!response.ok) {
        console.error('❌ Error al obtener fechas disponibles:', response.status, response.statusText);
        return [];
      }
      
      const data = await response.json();
      console.log('✅ availableDatesService: Respuesta recibida:', data);
      
      // La respuesta puede ser un array o un objeto con content
      const list = Array.isArray(data) ? data : 
                   Array.isArray(data?.content) ? data.content : [];
      
      // Extraer fechas únicas del resultado
      const fechasMap = new Map<string, AvailableDate>();
      list.forEach((item: any) => {
        const fecha = item.fecha || item.FECHA;
        if (fecha) {
          const fechaKey = fecha.split(' ')[0]; // Obtener solo la parte de fecha
          if (!fechasMap.has(fechaKey)) {
            fechasMap.set(fechaKey, {
              fecha: fecha,
              consultorio: item.consultorio || item.CONSULTORIO || consultorioId,
              totalDisponibles: typeof item.totalDisponibles === 'number' ? item.totalDisponibles : 1
            });
          }
        }
      });
      
      return Array.from(fechasMap.values());
    } catch (error) {
      console.error('❌ Error en fetchAvailableDates:', error);
      return [];
    }
  },

  /**
   * Obtiene fechas disponibles para ambos turnos (Mañana y Tarde)
   */
  async fetchAvailableDatesAllShifts(
    fechaInicio: string,
    fechaFin: string,
    consultorioId: string
  ): Promise<AvailableDate[]> {
    try {
      // Llamar a ambos turnos en paralelo
      const [morning, afternoon] = await Promise.all([
        this.fetchAvailableDates({
          fechaInicio,
          fechaFin,
          turnoConsulta: 'M',
          consultorioId,
        }),
        this.fetchAvailableDates({
          fechaInicio,
          fechaFin,
          turnoConsulta: 'T',
          consultorioId,
        }),
      ]);

      // Combinar ambos resultados
      return [...morning, ...afternoon];
    } catch (error) {
      console.error('Error en fetchAvailableDatesAllShifts:', error);
      return [];
    }
  },

  /**
   * Convierte una fecha string a objeto Date
   */
  parseDateString(dateString: string): Date {
    // dateString viene como "2025-10-17 00:00:00.0"
    const [datePart] = dateString.split(' ');
    const [year, month, day] = datePart.split('-');
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  },

  /**
   * Obtiene fechas únicas (sin duplicados) con información de disponibilidad
   * @param dates Array de fechas disponibles
   * @param consultorioFilter Código del consultorio para filtrar (opcional)
   */
  getUniqueDates(dates: AvailableDate[], consultorioFilter?: string): Date[] {
    const uniqueDateStrings = new Set<string>();
    const uniqueDates: Date[] = [];

    dates.forEach(item => {
      // Si hay filtro de consultorio, solo incluir fechas de ese consultorio
      if (consultorioFilter && item.consultorio.trim() !== consultorioFilter.trim()) {
        return; // Skip esta fecha
      }

      const [datePart] = item.fecha.split(' ');
      if (!uniqueDateStrings.has(datePart)) {
        uniqueDateStrings.add(datePart);
        uniqueDates.push(this.parseDateString(item.fecha));
      }
    });

    return uniqueDates;
  },

  /**
   * ✅ Obtiene fechas con información de disponibilidad (verdes y rojas)
   * @param dates Array de fechas disponibles
   * @param consultorioFilter Código del consultorio para filtrar (opcional)
   */
  getDatesWithAvailability(dates: AvailableDate[], consultorioFilter?: string): { 
    available: Date[], 
    unavailable: Date[] 
  } {
    const availableDates: Date[] = [];
    const unavailableDates: Date[] = [];
    const processedDates = new Set<string>();

    dates.forEach(item => {
      // Si hay filtro de consultorio, solo incluir fechas de ese consultorio
      if (consultorioFilter && item.consultorio.trim() !== consultorioFilter.trim()) {
        return;
      }

      const [datePart] = item.fecha.split(' ');
      
      // Evitar duplicados
      if (processedDates.has(datePart)) {
        return;
      }
      processedDates.add(datePart);

      const date = this.parseDateString(item.fecha);
      
      // ✅ Si totalDisponibles es 0, es fecha sin citas (roja)
      if (item.totalDisponibles === 0) {
        unavailableDates.push(date);
      } else {
        // Si tiene disponibles o no viene el campo, es fecha con citas (verde)
        availableDates.push(date);
      }
    });

    return { available: availableDates, unavailable: unavailableDates };
  },
};
