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
}

export const DiagnosticoSelector: React.FC<DiagnosticoSelectorProps> = ({ 
  value, 
  onChange, 
  disabled = false,
  origenId,
  className = '',
}) => {
  const [open, setOpen] = useState(false);
  const [diagnosticos, setDiagnosticos] = useState<Diagnostico[]>([]);
  const [allDiagnosticos, setAllDiagnosticos] = useState<Diagnostico[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Cargar diagnósticos iniciales o diagnóstico específico si hay un ID de origen
  useEffect(() => {
    const fetchDiagnosticos = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Si tenemos un ID de origen, SIEMPRE usamos ese ID directamente
        if (origenId) {          
          // Verificar si el origenId es válido (no está vacío)
          if (origenId.trim() === '') {
          } else {
            try {
              const url = `/api/diagnosticos/${encodeURIComponent(origenId)}`;
              const response = await fetch(url);
            
              if (!response.ok) {
                if (response.status === 404) {
                  // Si no se encuentra el diagnóstico, continuamos con la búsqueda general
                } else {
                  throw new Error(`Error al cargar diagnóstico: ${response.status}`);
                }
              } else if (response.status === 204) {
                // Si recibimos un 204 (No Content), continuamos con la búsqueda general
                // No intentamos parsear JSON ya que no hay contenido
              } else {
                // Si encontramos un diagnóstico específico, lo mostramos y terminamos
                try {
                  const data = await response.json();
                  
                  if (data && data.Codigo) {
                    setDiagnosticos([data]);
                    setAllDiagnosticos([data]);
                    setLoading(false);
                    return;
                  }
                } catch (error) {
                  console.error('Error al parsear respuesta JSON:', error);
                  // Continuamos con la búsqueda general en caso de error de parsing
                }
              }
            } catch (error) {
              console.error('Error al buscar diagnóstico específico:', error);
              // Continuamos con la búsqueda general en caso de error
            }
          }
        }
        
        // Si no hay ID de origen o no se encontró diagnóstico específico, cargamos los primeros 10 diagnósticos
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
      } catch (error) {
        setError('Error al cargar diagnósticos');
      } finally {
        setLoading(false);
      }
    };
    
    fetchDiagnosticos();
  }, [origenId]);
  
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
      
      try {
        setLoading(true);
        setError(null);
        
        // Buscar en todos los diagnósticos disponibles
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
      } catch (error) {
        console.error(`Error al buscar diagnósticos con término "${debouncedSearchTerm}":`, error);
        setError(`Error al buscar diagnósticos: ${error}`);
      } finally {
        setLoading(false);
      }
    };
    
    searchDiagnosticos();
  }, [debouncedSearchTerm, origenId, allDiagnosticos]);

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
