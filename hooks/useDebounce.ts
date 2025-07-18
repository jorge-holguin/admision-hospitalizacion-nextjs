import { useState, useEffect } from 'react';

/**
 * Hook para aplicar un debounce a cualquier valor
 * Útil para retrasar la ejecución de operaciones costosas como llamadas API
 * @param value El valor a aplicar debounce
 * @param delay Tiempo de retraso en milisegundos
 * @returns El valor con debounce aplicado
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Establecer un timeout para actualizar el valor después del retraso
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Limpiar el timeout si el valor cambia antes del retraso
    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
