/**
 * Servicio para obtener la fecha y hora actual del servidor
 * Esto evita problemas de zona horaria en el cliente
 */
export const datetimeService = {
  /**
   * Obtener la fecha y hora actual del servidor
   * @returns Objeto con fecha y hora formateados
   */
  async getCurrentDateTime() {
    try {
      const response = await fetch('/api/utils/datetime', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Error al obtener fecha y hora: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Error desconocido al obtener fecha y hora');
      }

      return {
        date: data.date,       // Formato YYYY-MM-DD
        time: data.time,       // Formato HH:MM (24h)
        time12: data.time12,   // Formato HH:MM AM/PM (12h)
        timestamp: data.timestamp,
        timezone: data.timezone,
        fullDateTime: data.fullDateTime
      };
    } catch (error) {
      console.error('Error en datetimeService:', error);
      // Fallback a fecha y hora local en caso de error
      const now = new Date();
      // Usar métodos locales para obtener la fecha correcta
      const year = now.getFullYear();
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      const day = now.getDate().toString().padStart(2, '0');
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      
      // Formatear hora en formato 12 horas
      const hour12 = now.getHours() % 12 || 12;
      const ampm = now.getHours() >= 12 ? 'PM' : 'AM';
      const time12Format = `${hour12.toString().padStart(2, '0')}:${minutes} ${ampm}`;
      
      return {
        date: `${year}-${month}-${day}`,
        time: `${hours}:${minutes}`,
        time12: time12Format,
        timestamp: now.getTime(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        fullDateTime: now.toISOString()
      };
    }
  }
};
