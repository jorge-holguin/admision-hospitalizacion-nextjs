import React, { createContext, useState, useEffect, useContext, useCallback, useRef } from 'react';

// Definición de tipos
export type MedicoInfo = {
  MEDICO: string;
  NOMBRE: string;
};

type MedicosContextType = {
  medicos: MedicoInfo[];
  loading: boolean;
  getMedicoInfo: (codigo: string) => string;
  loadMedicosByCodigos: (codigos: string[]) => Promise<void>;
};

// Crear el contexto
const MedicosContext = createContext<MedicosContextType>({
  medicos: [],
  loading: false,
  getMedicoInfo: () => '',
  loadMedicosByCodigos: async () => {},
});

// Proveedor del contexto
export function MedicosProvider({ children }: { children: React.ReactNode }) {
  const [medicos, setMedicos] = useState<MedicoInfo[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [initialized, setInitialized] = useState<boolean>(false);
  const medicoCache = useRef<Map<string, MedicoInfo>>(new Map());

  // No longer load médicos initially - only when needed
  // useEffect(() => {
  //   // Removed initial loading - médicos are now loaded only when selectors are used
  // }, [initialized]);
  
  // Función para cargar médicos por códigos (batch fetch)
  const loadMedicosByCodigos = useCallback(async (codigos: string[]) => {
    if (!codigos.length) return;
    
    // Filtrar códigos que ya están en cache
    const codigosFaltantes = codigos.filter(codigo => {
      const codigoLimpio = codigo.trim();
      return codigoLimpio && !medicoCache.current.has(codigoLimpio);
    });
    
    if (!codigosFaltantes.length) {
      console.log('Todos los médicos ya están en cache');
      return;
    }
    
    console.log(`Cargando ${codigosFaltantes.length} médicos faltantes:`, codigosFaltantes);
    
    try {
      setLoading(true);
      const codigosParam = codigosFaltantes.join(',');
      
      // Intentar primero con la ruta relativa
      let response = await fetch(`/api/master-tables/medicos/search?codigos=${codigosParam}`);
      
      // Si falla, intentar con la URL completa
      if (!response.ok) {
        response = await fetch(`http://192.168.0.21:9011/api/master-tables/medicos/search?codigos=${codigosParam}`);
      }
      
      if (response.ok) {
        const data = await response.json();
        const nuevosMedicos = Array.isArray(data) ? data : 
                            Array.isArray(data?.data) ? data.data : 
                            Array.isArray(data?.items) ? data.items : [];
        
        console.log(`Cargados ${nuevosMedicos.length} médicos adicionales`);
        
        // Actualizar el cache y el estado
        nuevosMedicos.forEach((medico: MedicoInfo) => {
          if (medico.MEDICO) {
            medicoCache.current.set(medico.MEDICO.trim(), medico);
          }
        });
        
        // Combinar los nuevos médicos con los existentes, evitando duplicados
        setMedicos(prevMedicos => {
          const medicoIds = new Set(prevMedicos.map(m => m.MEDICO?.trim()));
          const medicosUnicos = [...prevMedicos];
          
          nuevosMedicos.forEach((medico: MedicoInfo) => {
            if (medico.MEDICO && !medicoIds.has(medico.MEDICO.trim())) {
              medicosUnicos.push(medico);
              medicoIds.add(medico.MEDICO.trim());
            }
          });
          
          return medicosUnicos;
        });
      }
    } catch (error) {
      console.error('Error al cargar médicos por códigos:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Función para obtener solo el nombre del médico por código
  const getMedicoInfo = useCallback((codigo: string): string => {
    if (!codigo) return '-';
    
    const codigoLimpio = codigo.trim();
    
    // Buscar por código exacto
    const medico = medicos.find(m => m.MEDICO && m.MEDICO.trim() === codigoLimpio);
    
    if (medico && medico.NOMBRE && medico.NOMBRE.trim()) {
      return medico.NOMBRE.trim(); // Devolver nombre limpio
    }
    
    // Si no encuentra, buscar por código que contenga el valor
    const medicoAlternativo = medicos.find(m => 
      m.MEDICO && m.MEDICO.trim().includes(codigoLimpio)
    );
    
    if (medicoAlternativo && medicoAlternativo.NOMBRE && medicoAlternativo.NOMBRE.trim()) {
      return medicoAlternativo.NOMBRE.trim();
    }
    
    // Si aún no encuentra, devolver el código con un prefijo para identificarlo
    return `Médico: ${codigoLimpio}`;
  }, [medicos]);

  return (
    <MedicosContext.Provider value={{ medicos, loading, getMedicoInfo, loadMedicosByCodigos }}>
      {children}
    </MedicosContext.Provider>
  );
}

// Hook personalizado para usar el contexto
export function useMedicos() {
  return useContext(MedicosContext);
}
