import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface Seguro {
  Seguro: string;
  Nombre: string;
  CREA_CUENTA: string;
}

interface SegurosContextType {
  seguros: Seguro[];
  loading: boolean;
  error: string | null;
  getSegurosDescripcion: (codigo: string) => string;
  refetchSeguros: () => Promise<void>;
}

const SegurosContext = createContext<SegurosContextType | undefined>(undefined);

interface SegurosProviderProps {
  children: ReactNode;
}

export const SegurosProvider: React.FC<SegurosProviderProps> = ({ children }) => {
  const [seguros, setSeguros] = useState<Seguro[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSeguros = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/appointments/insurances?codCita=1');
      
      if (!response.ok) {
        throw new Error(`Error al obtener seguros: ${response.status}`);
      }

      const result = await response.json();
      // La API de appointments devuelve { success: true, data: [...] }
      setSeguros(result.success ? result.data : []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      console.error('Error al obtener seguros:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSeguros();
  }, []);

  const getSegurosDescripcion = (codigo: string): string => {
    if (!codigo) return '';
    
    // Buscar el seguro comparando los códigos sin espacios en blanco
    const seguro = seguros.find(s => s.Seguro.trim() === codigo.trim());
    return seguro ? seguro.Nombre : `Seguro ${codigo.trim()}`;
  };

  const refetchSeguros = async (): Promise<void> => {
    await fetchSeguros();
  };

  return (
    <SegurosContext.Provider
      value={{
        seguros,
        loading,
        error,
        getSegurosDescripcion,
        refetchSeguros
      }}
    >
      {children}
    </SegurosContext.Provider>
  );
};

export const useSeguros = (): SegurosContextType => {
  const context = useContext(SegurosContext);
  if (context === undefined) {
    throw new Error('useSeguros debe ser usado dentro de un SegurosProvider');
  }
  return context;
};
