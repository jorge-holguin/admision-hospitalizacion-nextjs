"use client"

import { useState } from 'react';

/**
 * Función para formatear fechas desde la base de datos
 */
export const formatDate = (dateString: string | Date | null | undefined): string => {
  if (!dateString) return '';
  
  try {
    // Si es una cadena con formato ISO o SQL Server (YYYY-MM-DD)
    if (typeof dateString === 'string') {
      // Para convertir a formato YYYY-MM-DD (para inputs type="date")
      const isoMatch = dateString.match(/(\d{4})-(\d{2})-(\d{2})/);
      if (isoMatch) {
        return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
      }
      
      // Si está en formato DD/MM/YYYY, convertir a YYYY-MM-DD
      const ddmmyyyyMatch = dateString.match(/(\d{2})\/(\d{2})\/(\d{4})/);
      if (ddmmyyyyMatch) {
        const [_, day, month, year] = ddmmyyyyMatch;
        return `${year}-${month}-${day}`;
      }
    }
    
    // Si es un objeto Date o puede convertirse a uno
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0]; // Formato YYYY-MM-DD
    }
    
    // Si ya está en el formato correcto o no podemos analizarlo
    return typeof dateString === 'string' ? dateString : '';
  } catch (e) {
    console.error('Error al formatear fecha:', e);
    return '';
  }
};

/**
 * Función para formatear la hora desde la base de datos
 */
export const formatTime = (timeStr: string | null | undefined, defaultTime: string): string => {
  if (!timeStr) return defaultTime;
  
  try {
    // Limpiar espacios
    const cleanTimeStr = timeStr.trim();
    
    // Si la hora viene como '13:45:00', extraer solo HH:MM
    if (cleanTimeStr.includes(':')) {
      const parts = cleanTimeStr.split(':');
      if (parts.length >= 2) {
        const hours = parts[0].padStart(2, '0');
        const minutes = parts[1].padStart(2, '0');
        return `${hours}:${minutes}`;
      }
    } 
    
    // Si la hora viene en otro formato, devolverla como está
    return cleanTimeStr;
  } catch (error) {
    console.error('Error al formatear la hora:', error);
    return defaultTime;
  }
};

/**
 * Hook personalizado para manejar el estado de los selectores abiertos
 */
export function useSelectsState() {
  const [openSelects, setOpenSelects] = useState({
    hospitalizedIn: false,
    attentionOrigin: false,
    authorizingDoctor: false,
    diagnosis: false,
    financing: false,
    hospitalizationOrigin: false,
    seguro: false,
  });

  const toggleSelect = (name: keyof typeof openSelects) => {
    setOpenSelects(prev => ({
      ...prev,
      [name]: !prev[name]
    }));
  };

  const closeAllSelects = () => {
    setOpenSelects({
      hospitalizedIn: false,
      attentionOrigin: false,
      authorizingDoctor: false,
      diagnosis: false,
      financing: false,
      hospitalizationOrigin: false,
      seguro: false,
    });
  };

  return { openSelects, toggleSelect, closeAllSelects };
}
