export interface AvailableDate {
  fecha: string;  // "2025-10-17 00:00:00.0"
  consultorio: string;
  totalDisponibles?: number;  // ✅ Total de citas disponibles (0 = sin citas disponibles)
}

export interface FetchAvailableDatesParams {
  fechaInicio: string;  // "2025-10-17"
  fechaFin: string;      // "2025-10-31"
  turnoConsulta?: 'M' | 'T';  // M = Mañana, T = Tarde, opcional para obtener ambos
  idEspecialidad: string;    // "0019"
}

/**
 * Servicio para obtener las fechas con citas disponibles desde la API externa
 */
export const availableDatesService = {
  /**
   * Obtiene las fechas con citas disponibles para una especialidad y turno
   */
  async fetchAvailableDates(params: FetchAvailableDatesParams): Promise<AvailableDate[]> {
    try {
      const { fechaInicio, fechaFin, turnoConsulta, idEspecialidad } = params;
      const baseUrl = process.env.NEXT_PUBLIC_API_CITAS_MASTER_URL;
      
      // ✅ Si turnoConsulta no está definido, no incluirlo en la URL (obtiene ambos turnos)
      let url = `${baseUrl}/cita/fechas-consultorios-solicitud?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}&idEspecialidad=${idEspecialidad}`;
      if (turnoConsulta) {
        url += `&turnoConsulta=${turnoConsulta}`;
      }      
      const response = await fetch(url);
      
      if (!response.ok) {
        console.error('❌ Error al obtener fechas disponibles:', response.status, response.statusText);
        return [];
      }
      
      const data: AvailableDate[] = await response.json();
      return data;
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
    idEspecialidad: string
  ): Promise<AvailableDate[]> {
    try {
      // Llamar a ambos turnos en paralelo
      const [morning, afternoon] = await Promise.all([
        this.fetchAvailableDates({
          fechaInicio,
          fechaFin,
          turnoConsulta: 'M',
          idEspecialidad,
        }),
        this.fetchAvailableDates({
          fechaInicio,
          fechaFin,
          turnoConsulta: 'T',
          idEspecialidad,
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
