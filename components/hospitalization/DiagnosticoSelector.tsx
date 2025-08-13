import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Spinner } from "@/components/ui/spinner";
import { Diagnostico } from '@/services/hospitalizacion/diagnosticoService';
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
  const [diagnosticos, setDiagnosticos] = useState<Diagnostico[]>([]);
  const [allDiagnosticos, setAllDiagnosticos] = useState<Diagnostico[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Función para transformar datos de CIEX al formato de Diagnostico
  const transformCiexData = (ciexItems: CiexItem[]): Diagnostico[] => {
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
  const fetchFromCiexApi = async (searchQuery: string): Promise<Diagnostico[]> => {
    const url = `${API_CIEX_URL}?busqueda=${encodeURIComponent(searchQuery)}`;
    const token = getAuthToken();
    
    console.log(`[DiagnosticoSelector] URL CIEX: ${url}`);
    console.log(`[DiagnosticoSelector] Token disponible: ${token ? 'Sí' : 'No'} (primeros 5 caracteres: ${token.substring(0, 5)}...)`);
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error en API CIEX: ${response.status}`);
    }
    
    const ciexData: CiexResponse = await response.json();
    
    if (ciexData.data && Array.isArray(ciexData.data) && ciexData.data.length > 0) {
      return transformCiexData(ciexData.data);
    }
    
    return [];
  };
  
  // Función para hacer peticiones a la API de diagnósticos
  const fetchFromDiagnosticosApi = async (searchQuery: string, isSpecificId = false): Promise<Diagnostico[]> => {
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
      
      const isSpecificId = isInitialLoad && origenId && origenId.trim() !== '';
      const queryToUse = isSpecificId ? origenId : searchQuery;
      
      console.log(`[DiagnosticoSelector] ${isInitialLoad ? 'Carga inicial' : 'Búsqueda'} - tipoOrigen: ${tipoOrigen}, query: ${queryToUse}`);
      
      let results: Diagnostico[] = [];
      
      if (useCiexApi()) {
        // Para 'EM' y 'RN' usar siempre la API CIEX
        console.log(`[DiagnosticoSelector] Usando API CIEX para origen ${tipoOrigen}`);
        results = await fetchFromCiexApi(queryToUse);
      } else {
        // Para 'CE' usar la API de diagnósticos
        if (isSpecificId) {
          // Si es un ID específico, usar la API de diagnósticos por ID
          results = await fetchFromDiagnosticosApi(queryToUse, true);
        } else {
          // Si es una búsqueda general, usar la API de diagnósticos de emergencia
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
    if (debouncedSearchTerm.length < 2) {
      return;
    }
    
    loadDiagnosticos(debouncedSearchTerm, false); // Búsqueda con término
  }, [debouncedSearchTerm, origenId, allDiagnosticos, tipoOrigen]);

  const selectedDiagnostico = diagnosticos.find(diagnostico => 
    diagnostico.Codigo === value || diagnostico.CodigoCompleto === value
  );
  
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
            <span className="truncate">{selectedDiagnostico.CodigoCompleto || selectedDiagnostico.Codigo}</span>
          ) : (
            <span className="text-muted-foreground">Seleccionar diagnóstico</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0">
        <Command>
          <CommandInput 
            placeholder="Buscar diagnóstico..." 
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
                {diagnosticos.map((diagnostico) => (
                  <CommandItem
                    key={diagnostico.Codigo}
                    value={diagnostico.Codigo}
                    onSelect={handleSelect}
                    className="flex items-start"
                  >
                    <div className="flex flex-col">
                      <span className="font-bold">{diagnostico.Codigo}</span>
                      <span className="text-sm text-muted-foreground">{diagnostico.Descripcion || diagnostico.Nombre}</span>
                    </div>
                    {selectedDiagnostico?.Codigo === diagnostico.Codigo && (
                      <Check className="ml-auto h-4 w-4 flex-shrink-0" />
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
