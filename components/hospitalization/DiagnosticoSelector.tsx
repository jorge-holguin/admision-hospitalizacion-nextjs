import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Spinner } from "@/components/ui/spinner";
import { Diagnostico } from '@/services/hospitalizacion/diagnosticoService';

// Extender la interfaz Diagnostico para incluir campos adicionales que necesitamos
interface DiagnosticoExtendido extends Diagnostico {
  Descripcion?: string;
  CodigoCompleto?: string;
  Estado?: string;
  FechaRegistro?: string;
}
import { useDebounce } from '@/hooks/useDebounce';

// API URLs
const API_CIEX_URL = 'http://192.168.0.17:9002/hospitalizacion/hospitalizacion-admision/api/v1/ciex';
const API_DIAGNOSTICOS_URL = '/api/diagnosticos';
const API_DIAGNOSTICOS_EMERGENCIA_URL = '/api/diagnosticos/emergencia';

// Tipos de origen de hospitalización
type TipoOrigen = 'CE' | 'EM' | 'RN';

interface DiagnosticoSelectorProps {
  value: string;
  onChange: (value: string, diagnosticoData?: Diagnostico) => void;
  disabled?: boolean;
  origenId?: string;
  tipoOrigen?: TipoOrigen;
  className?: string;
}

interface CiexItem {
  cie10?: string;
  descripcion?: string;
}

interface CiexResponse {
  data?: CiexItem[];
}

export const DiagnosticoSelector: React.FC<DiagnosticoSelectorProps> = ({ 
  value, 
  onChange, 
  disabled = false,
  origenId = '',
  tipoOrigen = 'CE',
  className = ''
}) => {
  console.log(`[DiagnosticoSelector] tipoOrigen recibido: ${tipoOrigen}`);

  const [open, setOpen] = useState(false);
  const [diagnosticos, setDiagnosticos] = useState<DiagnosticoExtendido[]>([]);
  const [allDiagnosticos, setAllDiagnosticos] = useState<DiagnosticoExtendido[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Función para transformar datos de CIEX al formato de Diagnostico
  const transformCiexData = (ciexItems: CiexItem[]): DiagnosticoExtendido[] => {
    return ciexItems.map(item => ({
      Codigo: item.cie10?.trim() || '',
      Descripcion: item.descripcion || '',
      Nombre: item.descripcion || '',
      CodigoCompleto: `${item.cie10?.trim() || ''} - ${item.descripcion || ''}`,
      Estado: 'A',
      FechaRegistro: new Date().toISOString()
    }));
  };

  // Función para obtener el token de autenticación
  const getAuthToken = (): string => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('authToken') || '';
    }
    return '';
  };
  
  // Función para determinar si se debe usar la API CIEX
  const useCiexApi = () => tipoOrigen === 'EM' || tipoOrigen === 'RN';
  
  // Función para hacer peticiones a la API CIEX
  const fetchFromCiexApi = async (searchQuery: string): Promise<DiagnosticoExtendido[]> => {
    // Normalizar la consulta (eliminar espacios extra, convertir a minúsculas)
    const normalizedQuery = searchQuery.trim().toLowerCase();
    
    console.log(`[DiagnosticoSelector] Buscando en API CIEX: "${normalizedQuery}"`); 
    
    // Construir URL con el término de búsqueda
    const url = `${API_CIEX_URL}?busqueda=${encodeURIComponent(normalizedQuery)}`;
    const token = getAuthToken();
    
    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error en API CIEX: ${response.status}`);
      }
      
      const ciexData: CiexResponse = await response.json();
      
      if (ciexData.data && Array.isArray(ciexData.data)) {
        console.log(`[DiagnosticoSelector] API CIEX devolvió ${ciexData.data.length} resultados`);
        return transformCiexData(ciexData.data);
      }
      
      console.log('[DiagnosticoSelector] API CIEX no devolvió resultados o formato inválido');
      return [];
    } catch (error) {
      console.error('[DiagnosticoSelector] Error al consultar API CIEX:', error);
      throw error;
    }
  };
  
  // Función para hacer peticiones a la API de diagnósticos
  const fetchFromDiagnosticosApi = async (searchQuery: string, isSpecificId = false): Promise<DiagnosticoExtendido[]> => {
    const baseUrl = isSpecificId 
      ? `${API_DIAGNOSTICOS_URL}/${encodeURIComponent(searchQuery)}` 
      : `${API_DIAGNOSTICOS_EMERGENCIA_URL}?search=${encodeURIComponent(searchQuery)}&limit=50`;
    
    const url = searchQuery ? baseUrl : `${API_DIAGNOSTICOS_EMERGENCIA_URL}?limit=20`;
    
    const response = await fetch(url);
    
    if (!response.ok && !isSpecificId) {
      throw new Error(`Error en API diagnósticos: ${response.status}`);
    }
    
    if (response.status === 204) {
      return [];
    }
    
    const data = await response.json();
    
    if (isSpecificId) {
      return data && data.Codigo ? [data] : [];
    }
    
    return Array.isArray(data) ? data : [];
  };

  // Función unificada para cargar diagnósticos por ID o búsqueda general
  const loadDiagnosticos = async (searchQuery: string = '', isInitialLoad: boolean = false) => {
    try {
      setLoading(true);
      setError(null);
      
      // Verificar si tenemos un código de origen específico (como "250081334")
      const isSpecificId = isInitialLoad && origenId && origenId.trim() !== '' && origenId.length > 3;
      const queryToUse = isSpecificId ? origenId : searchQuery;
      
      console.log(`[DiagnosticoSelector] ${isInitialLoad ? 'Carga inicial' : 'Búsqueda'} - tipoOrigen: ${tipoOrigen}, origenId: ${origenId}, query: ${queryToUse}`);
      
      let results: Diagnostico[] = [];
      
      if (useCiexApi()) {
        // Para 'EM' y 'RN' usar siempre la API CIEX
        console.log(`[DiagnosticoSelector] Usando API CIEX para origen ${tipoOrigen}`);
        
        // Si es una búsqueda por código o descripción
        if (queryToUse) {
          results = await fetchFromCiexApi(queryToUse);
        } else {
          // Si no hay término de búsqueda, cargar algunos diagnósticos comunes
          const commonCodes = ['Z590', 'Z348', 'J00X', 'A09X']; // Códigos comunes como ejemplo
          const commonCode = commonCodes[Math.floor(Math.random() * commonCodes.length)];
          results = await fetchFromCiexApi(commonCode);
        }
      } else {
        // Para 'CE' usar la API de diagnósticos
        if (isSpecificId) {
          // Si es un ID específico, usar la API de diagnósticos por ID
          console.log(`[DiagnosticoSelector] Cargando diagnóstico específico con ID: ${queryToUse}`);
          results = await fetchFromDiagnosticosApi(queryToUse, true);
        } else {
          // Si es una búsqueda general, usar la API de diagnósticos de emergencia
          console.log(`[DiagnosticoSelector] Realizando búsqueda general con término: ${queryToUse}`);
          results = await fetchFromDiagnosticosApi(queryToUse, false);
        }
      }
      
      if (isInitialLoad || !searchQuery) {
        // Si es carga inicial o se limpió el término de búsqueda, actualizar ambas listas
        setDiagnosticos(results);
        setAllDiagnosticos(results);
      } else {
        // Si es una búsqueda, solo actualizar la lista de diagnósticos filtrados
        setDiagnosticos(results);
      }
    } catch (error) {
      console.error(`Error al ${isInitialLoad ? 'cargar' : 'buscar'} diagnósticos:`, error);
      setError(`Error al ${isInitialLoad ? 'cargar' : 'buscar'} diagnósticos`);
    } finally {
      setLoading(false);
    }
  };

  // Cargar diagnósticos iniciales o diagnóstico específico si hay un ID de origen
  useEffect(() => {
    loadDiagnosticos('', true); // Carga inicial
  }, [origenId, tipoOrigen]);
  
  // Efecto para buscar diagnósticos cuando cambia el término de búsqueda
  useEffect(() => {
    // Si hay un ID de origen y ya tenemos un diagnóstico cargado, no permitimos búsqueda
    if (origenId && allDiagnosticos.length === 1 && allDiagnosticos[0].Codigo) {
      return;
    }
    
    // Si no hay término de búsqueda, restaurar la lista original
    if (!debouncedSearchTerm) {
      setDiagnosticos(allDiagnosticos);
      return;
    }
    
    // Si el término de búsqueda es muy corto, no realizar la búsqueda en API
    // A menos que parezca un código CIEX (como Z590)
    const isCiexCode = /^[A-Z]\d{2,3}[A-Z]?$/i.test(debouncedSearchTerm.trim());
    if (debouncedSearchTerm.length < 2 && !isCiexCode) {
      return;
    }
    
    // Realizar la búsqueda con el término (código o descripción)
    console.log(`[DiagnosticoSelector] Iniciando búsqueda con término: "${debouncedSearchTerm}"`);
    loadDiagnosticos(debouncedSearchTerm, false);
  }, [debouncedSearchTerm, origenId, allDiagnosticos, tipoOrigen]);

  // Crear un diagnóstico inicial si tenemos un valor pero no está en la lista de diagnósticos
  const [initialDiagnostico, setInitialDiagnostico] = useState<DiagnosticoExtendido | null>(null);
  
  useEffect(() => {
    // Si tenemos un valor inicial pero no está en la lista de diagnósticos
    if (value && !diagnosticos.some(d => d.Codigo === value) && !initialDiagnostico) {
      // Crear un diagnóstico temporal con el código proporcionado
      // en lugar de hacer una llamada a la API
      const tempDiagnostico: DiagnosticoExtendido = {
        Codigo: value,
        Nombre: value,
        CodigoCompleto: value,
        Estado: 'A'
      };
      setInitialDiagnostico(tempDiagnostico);
      console.log(`[DiagnosticoSelector] Usando diagnóstico temporal para código: ${value}`);
    }
  }, [value, diagnosticos]);
  
  const selectedDiagnostico = diagnosticos.find(diagnostico => 
    diagnostico.Codigo === value || diagnostico.CodigoCompleto === value
  ) || initialDiagnostico;
  
  const handleSelect = (codigo: string) => {
    const selected = diagnosticos.find(d => d.Codigo === codigo || d.CodigoCompleto === codigo);
    if (selected) {
      onChange(selected.Codigo, selected);
      setOpen(false);
    }
  };
  
  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
          disabled={disabled}
        >
          {selectedDiagnostico ? (
            <span className="truncate">{selectedDiagnostico.CodigoCompleto || `${selectedDiagnostico.Codigo} - ${selectedDiagnostico.Nombre}`}</span>
          ) : value ? (
            <span className="truncate">{value}</span>
          ) : (
            <span className="text-muted-foreground">Seleccionar diagnóstico</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0">
        <Command>
          <CommandInput 
            placeholder="Buscar por código o descripción..." 
            onValueChange={handleSearch} 
            value={searchTerm}
          />
          <CommandList>
            {loading && (
              <div className="flex items-center justify-center p-4">
                <Spinner className="mr-2" />
                <span>Cargando diagnósticos...</span>
              </div>
            )}
            {error && (
              <div className="p-4 text-center text-red-500">
                {error}
              </div>
            )}
            {!loading && !error && diagnosticos.length === 0 && (
              <CommandEmpty>No se encontraron diagnósticos.</CommandEmpty>
            )}
            {!loading && !error && diagnosticos.length > 0 && (
              <CommandGroup>
                {diagnosticos.map((diagnostico) => {
                  // Preparar el valor para la búsqueda (código y descripción)
                  const searchValue = `${diagnostico.Codigo} ${diagnostico.Descripcion || diagnostico.Nombre}`.toLowerCase();
                  
                  return (
                    <CommandItem
                      key={diagnostico.Codigo}
                      value={searchValue} // Usar tanto código como descripción para la búsqueda
                      onSelect={() => handleSelect(diagnostico.Codigo)}
                      className="flex items-start py-2"
                    >
                      <div className="flex flex-col w-full">
                        <div className="flex justify-between w-full">
                          <span className="font-bold text-primary">{diagnostico.Codigo}</span>
                          {selectedDiagnostico?.Codigo === diagnostico.Codigo && (
                            <Check className="h-4 w-4 flex-shrink-0 text-primary" />
                          )}
                        </div>
                        <span className="text-sm text-muted-foreground line-clamp-2">
                          {diagnostico.Descripcion || diagnostico.Nombre}
                        </span>
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
