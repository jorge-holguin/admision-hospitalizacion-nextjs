import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';

// Definición de tipos
export type MedicoInfo = {
  MEDICO: string;
  NOMBRE: string;
};

type MedicosContextType = {
  medicos: MedicoInfo[];
  loading: boolean;
  getMedicoInfo: (codigo: string) => string;
};

// Crear el contexto
const MedicosContext = createContext<MedicosContextType>({
  medicos: [],
  loading: false,
  getMedicoInfo: () => '',
});

// Proveedor del contexto
export function MedicosProvider({ children }: { children: React.ReactNode }) {
  const [medicos, setMedicos] = useState<MedicoInfo[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [initialized, setInitialized] = useState<boolean>(false);

  // Cargar todos los médicos una sola vez
  useEffect(() => {
    const fetchMedicos = async () => {
      if (initialized) return;
      
      try {
        setLoading(true);
        const response = await fetch('/api/medicos');
        if (response.ok) {
          const data = await response.json();
          setMedicos(data);
        }
      } catch (error) {
        console.error('Error al cargar médicos:', error);
      } finally {
        setLoading(false);
        setInitialized(true);
      }
    };

    fetchMedicos();
  }, [initialized]);

  // Función para obtener la información formateada de un médico por código
  const getMedicoInfo = useCallback((codigo: string): string => {
    if (!codigo) return '-';
    
    const codigoLimpio = codigo.trim();
    const medico = medicos.find(m => m.MEDICO && m.MEDICO.trim() === codigoLimpio);
    
    if (medico) {
      return `(${codigoLimpio}) - ${medico.NOMBRE}`;
    }
    
    return codigoLimpio;
  }, [medicos]);

  return (
    <MedicosContext.Provider value={{ medicos, loading, getMedicoInfo }}>
      {children}
    </MedicosContext.Provider>
  );
}

// Hook personalizado para usar el contexto
export function useMedicos() {
  return useContext(MedicosContext);
}
