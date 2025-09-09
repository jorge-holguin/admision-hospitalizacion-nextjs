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

  // Cargar médicos iniciales y configurar el cache
  useEffect(() => {
    const fetchMedicos = async () => {
      if (initialized) return;
      
      try {
        setLoading(true);
        // Intentar primero con la ruta relativa
        let response = await fetch('/api/medicos?limit=100');
        
        // Si falla, intentar con la URL completa
        if (!response.ok) {
          console.log('Intentando cargar médicos con URL absoluta...');
          response = await fetch('http://192.168.0.21:9011/api/medicos?limit=100');
        }
        
        if (response.ok) {
          const data = await response.json();
          // Asegurar que los datos tienen el formato correcto
          const medicosData = Array.isArray(data) ? data : 
                             Array.isArray(data?.data) ? data.data : 
                             Array.isArray(data?.items) ? data.items : [];
          
          console.log(`Cargados ${medicosData.length} médicos iniciales`);
          
          // Actualizar el cache con los médicos cargados
          medicosData.forEach((medico: MedicoInfo) => {
            if (medico.MEDICO) {
              medicoCache.current.set(medico.MEDICO.trim(), medico);
            }
          });
          
          setMedicos(medicosData);
        } else {
          console.error('No se pudieron cargar los médicos, status:', response.status);
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
      let response = await fetch(`/api/medicos?codigos=${codigosParam}`);
      
      // Si falla, intentar con la URL completa
      if (!response.ok) {
        response = await fetch(`http://192.168.0.21:9011/api/medicos?codigos=${codigosParam}`);
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
