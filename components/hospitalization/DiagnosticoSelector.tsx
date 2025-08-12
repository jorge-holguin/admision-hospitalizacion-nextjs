import React, { useState, useEffect, useRef } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Spinner } from "@/components/ui/spinner";
import { Diagnostico } from '@/services/diagnosticoService';
import { useDebounce } from '@/hooks/useDebounce';

interface DiagnosticoSelectorProps {
  value: string;
  onChange: (value: string, diagnosticoData?: Diagnostico) => void;
  disabled?: boolean;
  origenId?: string;
  className?: string;
  tipoOrigen?: string; // 'CE', 'EM', 'RN'
}

// Interfaz para los datos de la API CIEX
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
  // Console log para verificar el valor de tipoOrigen recibido
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
      // Otros campos requeridos por la interfaz Diagnostico
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

  // Cargar diagnósticos iniciales o diagnóstico específico si hay un ID de origen
  useEffect(() => {
    const fetchDiagnosticos = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log(`[DiagnosticoSelector] Carga inicial - tipoOrigen: ${tipoOrigen}, origenId: ${origenId}`);
        
        // Si tenemos un ID de origen, intentamos cargar ese diagnóstico específico
        if (origenId && origenId.trim() !== '') {
          try {
            // Para 'EM' y 'RN' usar la API de CIEX, para 'CE' usar la API de diagnósticos de emergencia
            if (tipoOrigen === 'EM' || tipoOrigen === 'RN') {
              console.log(`[DiagnosticoSelector] Usando API CIEX para origen ${tipoOrigen}`);

              // Usar la API de CIEX para buscar por ID - URL directa mientras se resuelve el problema con las variables de entorno
              const url = `http://192.168.0.17:9002/hospitalizacion/hospitalizacion-admision/api/v1/ciex?busqueda=${encodeURIComponent(origenId)}`;
              const token = getAuthToken();
              
              console.log(`[DiagnosticoSelector] URL de carga inicial CIEX: ${url}`);
              console.log(`[DiagnosticoSelector] Token disponible para carga inicial: ${token ? 'Sí' : 'No'} (primeros 5 caracteres: ${token.substring(0, 5)}...)`);
              
              const response = await fetch(url, {
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              });
              
              if (!response.ok) {
                throw new Error(`Error al cargar diagnóstico de CIEX: ${response.status}`);
              }
              
              const ciexData: CiexResponse = await response.json();
              
              if (ciexData.data && Array.isArray(ciexData.data) && ciexData.data.length > 0) {
                const transformedData = transformCiexData(ciexData.data);
                setDiagnosticos(transformedData);
                setAllDiagnosticos(transformedData);
                return; // Terminamos aquí si encontramos el diagnóstico
              }
            } else {
              // Usar la API original para 'CE'
              const url = `/api/diagnosticos/${encodeURIComponent(origenId)}`;
              
              const response = await fetch(url);
              
              if (response.ok && response.status !== 204) {
                const data = await response.json();
                
                if (data && data.Codigo) {
                  setDiagnosticos([data]);
                  setAllDiagnosticos([data]);
                  return; // Terminamos aquí si encontramos el diagnóstico
                }
              }
            }
          } catch (error) {
            console.error(`Error al cargar diagnóstico específico para origen ${origenId}:`, error);
            // Continuamos con la carga general en caso de error
          }
        }
        
        // Si no hay ID de origen o no se encontró diagnóstico específico, cargamos diagnósticos generales
        // Para 'EM' y 'RN' usar la API de CIEX, para 'CE' usar la API de diagnósticos de emergencia
        if (tipoOrigen === 'EM' || tipoOrigen === 'RN') {
          // Usar la API de CIEX - URL directa mientras se resuelve el problema con las variables de entorno
          const url = `http://192.168.0.17:9002/hospitalizacion/hospitalizacion-admision/api/v1/ciex?busqueda=`;
          const token = getAuthToken();
          
          console.log(`[DiagnosticoSelector] URL de carga inicial general CIEX: ${url}`);
          
          const response = await fetch(url, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (!response.ok) {
            throw new Error(`Error al cargar diagnósticos de CIEX: ${response.status}`);
          }
          
          const ciexData: CiexResponse = await response.json();
          
          if (ciexData.data && Array.isArray(ciexData.data) && ciexData.data.length > 0) {
            const transformedData = transformCiexData(ciexData.data);
            setDiagnosticos(transformedData);
            setAllDiagnosticos(transformedData);
          } else {
            setDiagnosticos([]);
            setAllDiagnosticos([]);
          }
        } else {
          // Usar la API original para 'CE'
          const url = '/api/diagnosticos/emergencia?limit=20';
          const response = await fetch(url);
          
          if (!response.ok) {
            throw new Error(`Error al cargar diagnósticos: ${response.status}`);
          }
          
          const data = await response.json();
          
          if (Array.isArray(data) && data.length > 0) {
            setDiagnosticos(data);
            setAllDiagnosticos(data);
          } else {
            setDiagnosticos([]);
            setAllDiagnosticos([]);
          }
        }
      } catch (error) {
        console.error('Error al cargar diagnósticos:', error);
        setError('Error al cargar diagnósticos');
      } finally {
        setLoading(false);
      }
    };
    
    fetchDiagnosticos();
  }, [origenId, tipoOrigen]);
  
  // Efecto para buscar diagnósticos cuando cambia el término de búsqueda
  useEffect(() => {
    // Si hay un ID de origen y ya tenemos un diagnóstico cargado, no permitimos búsqueda
    if (origenId && allDiagnosticos.length === 1 && allDiagnosticos[0].Codigo) {
      return;
    }
    
    const searchDiagnosticos = async () => {
      // Si no hay término de búsqueda, restaurar la lista original
      if (!debouncedSearchTerm) {
        setDiagnosticos(allDiagnosticos);
        return;
      }
      
      // Si el término de búsqueda es muy corto, no realizar la búsqueda en API
      if (debouncedSearchTerm.length < 2) {
        return;
      }
      
      console.log(`[DiagnosticoSelector] Búsqueda - término: "${debouncedSearchTerm}", tipoOrigen: ${tipoOrigen}`);
      
      try {
        setLoading(true);
        setError(null);
        
        // Determinar qué API usar según el tipo de origen
        // Para 'EM' y 'RN' usar la API de CIEX, para 'CE' usar la API de diagnósticos de emergencia
        if (tipoOrigen === 'EM' || tipoOrigen === 'RN') {
          console.log(`[DiagnosticoSelector] Búsqueda usando API CIEX para origen ${tipoOrigen}`);

          // Usar la API de CIEX - URL directa mientras se resuelve el problema con las variables de entorno
          const url = `http://192.168.0.17:9002/hospitalizacion/hospitalizacion-admision/api/v1/ciex?busqueda=${encodeURIComponent(debouncedSearchTerm)}`;
          const token = getAuthToken();
          
          console.log(`[DiagnosticoSelector] URL de búsqueda CIEX: ${url}`);
          console.log(`[DiagnosticoSelector] Token disponible: ${token ? 'Sí' : 'No'} (primeros 5 caracteres: ${token.substring(0, 5)}...)`);
          
          const response = await fetch(url, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (!response.ok) {
            throw new Error(`Error al buscar diagnósticos en CIEX: ${response.status}`);
          }
          
          const ciexData: CiexResponse = await response.json();
          
          if (ciexData.data && Array.isArray(ciexData.data) && ciexData.data.length > 0) {
            // Transformar los datos de CIEX al formato esperado por el componente
            const transformedData = transformCiexData(ciexData.data);
            setDiagnosticos(transformedData);
          } else {
            setDiagnosticos([]);
          }
        } else {
          // Usar la API original para 'CE'
          const url = `/api/diagnosticos/emergencia?search=${encodeURIComponent(debouncedSearchTerm)}&limit=50`;
          
          const response = await fetch(url);
          
          if (!response.ok) {
            throw new Error(`Error al buscar diagnósticos: ${response.status}`);
          }
          
          const data = await response.json();
          
          if (Array.isArray(data) && data.length > 0) {
            setDiagnosticos(data);
          } else {
            setDiagnosticos([]);
          }
        }
      } catch (error) {
        console.error(`Error al buscar diagnósticos con término "${debouncedSearchTerm}":`, error);
        setError(`Error al buscar diagnósticos: ${error}`);
      } finally {
        setLoading(false);
      }
    };
    
    searchDiagnosticos();
  }, [debouncedSearchTerm, origenId, allDiagnosticos, tipoOrigen]);

  const selectedDiagnostico = diagnosticos.find(diagnostico => 
    value === `${diagnostico.Codigo} - ${diagnostico.Nombre}`
  );

  const handleSelect = (selectedValue: string) => {
    const selected = diagnosticos.find(diagnostico => 
      selectedValue === `${diagnostico.Codigo} - ${diagnostico.Nombre}`
    );
    onChange(selectedValue, selected);
    setOpen(false);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <Popover open={open && !disabled} onOpenChange={disabled ? undefined : setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-between h-10 flex items-center",
              !value && "text-gray-500",
              disabled && "opacity-70 cursor-not-allowed"
            )}
            disabled={disabled}
          >
            <div className="truncate mr-2 text-left">{value || "Seleccione diagnóstico"}</div>
            {!disabled && <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50 flex-shrink-0" />}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput 
              placeholder="Buscar diagnóstico..." 
              value={searchTerm}
              onValueChange={setSearchTerm}
            />
            <CommandList>
              <CommandEmpty>
                {loading ? (
                  <div className="flex items-center justify-center p-4">
                    <Spinner size="sm" />
                    <span className="ml-2">Cargando...</span>
                  </div>
                ) : error ? (
                  <div className="text-center p-4 text-red-500">{error}</div>
                ) : (
                  "No se encontraron resultados"
                )}
              </CommandEmpty>
              <CommandGroup>
                {diagnosticos.map((diagnostico) => {
                  const diagnosticoValue = `${diagnostico.Codigo} - ${diagnostico.Nombre}`;
                  return (
                    <CommandItem
                      key={diagnostico.Codigo}
                      value={diagnosticoValue}
                      onSelect={() => handleSelect(diagnosticoValue)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === diagnosticoValue ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {diagnosticoValue}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};
