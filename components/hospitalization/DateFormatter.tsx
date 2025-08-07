"use client"

/**
 * Componente utilitario para formatear fechas en el sistema de hospitalización
 * Evita problemas de zona horaria y maneja diferentes formatos de entrada
 */
export const formatDate = (date: Date | string | null | undefined): string => {
  if (!date) return '-';
  try {
    // Manejar el caso cuando date es un string en formato ISO
    if (typeof date === 'string') {
      // Extraer solo la parte de la fecha (YYYY-MM-DD) para evitar problemas de zona horaria
      const dateParts = date.split('T')[0].split('-');
      if (dateParts.length === 3) {
        // Obtener los componentes de la fecha directamente del string
        const year = parseInt(dateParts[0]);
        const month = parseInt(dateParts[1]); // No restamos 1 ya que queremos el número real del mes
        const day = parseInt(dateParts[2]);
        
        // Formatear manualmente para evitar problemas de zona horaria
        return `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`;
      }
    }
    
    // Si no es un string en formato ISO o no se pudo parsear, usar el método anterior
    const dateObj = date instanceof Date ? date : new Date(date);
    if (isNaN(dateObj.getTime())) {
      // Si invalid date, return the original value as string
      return typeof date === 'string' ? date : '-';
    }
    
    // Extraer día, mes y año directamente para evitar problemas de zona horaria
    const day = dateObj.getDate();
    const month = dateObj.getMonth() + 1;
    const year = dateObj.getFullYear();
    
    // Formatear manualmente
    return `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`;
  } catch (error) {
    // No usar console.log en producción
    return typeof date === 'string' ? date : '-';
  }
};
