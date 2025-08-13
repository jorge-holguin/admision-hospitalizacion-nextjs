import { useState, useEffect } from 'react';

/**
 * Hook personalizado para aplicar debounce a un valor
 * @param value Valor al que aplicar debounce
 * @param delay Tiempo de espera en milisegundos
 * @returns Valor con debounce aplicado
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
