import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn, extractCode } from '@/lib/utils';
import { Spinner } from "@/components/ui/spinner";
import { OrigenHospitalizacion } from '@/services/origenHospitalizacionService';

interface OrigenSelectorProps {
  value: string;
  onChange: (value: string, origenData?: OrigenHospitalizacion) => void;
  disabled?: boolean;
  required?: boolean;
  showAllOrigins?: boolean;
  onShowAllOriginsChange?: (show: boolean) => void;
  onLoadDiagnosticos?: (origen: 'CE' | 'EM', codigo?: string) => void;
  className?: string;
  patientId?: string;
  origenFilter?: string; // Nueva prop para filtrar por procedencia (EM, CE, RN)
  onAttentionOriginChange?: (attentionOrigin: string) => void;
  onMedicoChange?: (medicoValue: string, medicoData?: any) => void;
  onDiagnosticoChange?: (diagnosticoValue: string, diagnosticoData?: any) => void;
  onSeguroChange?: (seguroValue: string, seguroData?: any) => void;
}

export const OrigenSelector: React.FC<OrigenSelectorProps> = ({ 
  value, 
  onChange, 
  disabled = false, 
  required = false,
  showAllOrigins = false,
  onShowAllOriginsChange,
  onLoadDiagnosticos,
  className = '',
  patientId,
  origenFilter, // Nueva prop para filtrar por procedencia
  onAttentionOriginChange,
  onMedicoChange,
  onDiagnosticoChange,
  onSeguroChange
}) => {
  const [open, setOpen] = useState(false);
  const [origenes, setOrigenes] = useState<OrigenHospitalizacion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const searchHospitalizationOrigins = async (search: string = '') => {
    try {
      setLoading(true);
      setError(null);
      
      const queryParams = new URLSearchParams();
      if (search) queryParams.append('search', search);
      if (!showAllOrigins) queryParams.append('onlyPending', 'true');
      
      // Añadir filtro por procedencia si está definido (EM o CE)
      if (origenFilter && (origenFilter === 'EM' || origenFilter === 'CE')) {
        queryParams.append('origen', origenFilter);
      }
      
      let url = '/api/origen-hospitalizacion';
      
      // Si hay un ID de paciente, usar el endpoint específico para pacientes
      if (patientId) {
        url = `/api/origen-hospitalizacion/paciente/${patientId}`;
      }
      
      const response = await fetch(`${url}?${queryParams.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Error al cargar orígenes: ${response.status}`);
      }
      
      const data = await response.json();
      // La API puede devolver { items: [...], total: number } o { data: [...], total: number }
      let origenesFiltrados = data.items || data.data || [];
      
      // Filtrar los orígenes por el campo ORIGEN si está definido el origenFilter
      if (origenFilter && (origenFilter === 'EM' || origenFilter === 'CE')) {
        origenesFiltrados = origenesFiltrados.filter(origen => 
          origen.ORIGEN === origenFilter
        );
      }
      
      setOrigenes(origenesFiltrados);
    } catch (error) {
      console.error('Error al cargar orígenes de hospitalización:', error);
      setError('Error al cargar orígenes de hospitalización');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    searchHospitalizationOrigins(searchTerm);
  }, [showAllOrigins, origenFilter]);

  // Encontrar el origen seleccionado basado en el valor actual
  const selectedOrigen = origenes.find(origen => {
    const displayValue = `${origen.CODIGO} [${origen.NOM_CONSULTORIO}]`;
    return value === displayValue;
  });

  const handleSelect = (origen: OrigenHospitalizacion) => {
    // Asegurarse de que los valores no sean undefined o null
    const medicoCode = origen.MEDICO ? origen.MEDICO.trim() : '';
    const medicoName = origen.NOM_MEDICO ? origen.NOM_MEDICO.trim() : '';
    const medicoValue = medicoCode && medicoName ? `${medicoCode} - ${medicoName}` : '';
    
    // Crear el valor a mostrar para el origen
    const displayValue = `${origen.CODIGO} [${origen.NOM_CONSULTORIO}]`;
    
    // Llamar al callback con el valor y el objeto completo
    onChange(displayValue, origen);
    
    // Actualizar el origen de atención (modo solo lectura)
    if (onAttentionOriginChange) {
      const attentionOrigin = origen.ORIGEN === 'CE' ? 'Consulta Externa' : 
                            origen.ORIGEN === 'EM' ? 'Emergencia' : 
                            origen.ORIGEN || '';
      onAttentionOriginChange(attentionOrigin);
    }
    
    // Actualizar el médico seleccionado
    if (onMedicoChange && medicoValue) {
      onMedicoChange(medicoValue, {
        MEDICO: medicoCode,
        NOMBRE: medicoName
      });
    }
    
    // Actualizar el diagnóstico seleccionado
    if (onDiagnosticoChange && origen.DX) {
      try {
        // El formato puede ser "CODIGO DESCRIPCION" o "CODIGO , DESCRIPCION"
        let dxString = typeof origen.DX === 'string' ? origen.DX.trim() : '';
        let dxCode = '';
        let dxName = '';
        
        // Verificar si contiene una coma (formato de STRING_AGG)
        if (dxString.includes(',')) {
          // Tomar solo el primer diagnóstico (antes de la primera coma)
          dxString = dxString.split(',')[0].trim();
        }
        
        // Extraer el código (primeras letras/números hasta el primer espacio)
        const match = dxString.match(/^([A-Z0-9\.]+)\s+(.+)$/);
        if (match) {
          dxCode = match[1].trim();
          dxName = match[2].trim();
        } else {
          // Si no se puede separar, usar todo como código
          dxCode = dxString;
        }
        
        const dxValue = dxCode && dxName ? `${dxCode} - ${dxName}` : dxCode;
                
        if (dxValue) {
          onDiagnosticoChange(dxValue, {
            Codigo: dxCode,
            Nombre: dxName
          });
        }
      } catch (error) {
        console.error('Error al procesar el diagnóstico:', error);
      }
    }
    
    // Actualizar el seguro seleccionado si existe en el origen
    if (onSeguroChange && origen.SEGURO) {
      try {
        const seguroCode = origen.SEGURO.trim();
        
        if (seguroCode) {
          // Buscar el nombre del seguro en la API
          fetch(`/api/seguros?code=${encodeURIComponent(seguroCode)}`)
            .then(response => response.json())
            .then(data => {
              if (data && data.length > 0) {
                const seguro = data[0];
                const seguroValue = `${seguro.Seguro} - ${seguro.Nombre}`;
                onSeguroChange(seguroValue, seguro);
              } else {
                // Si no se encuentra el seguro, usar solo el código
                onSeguroChange(seguroCode, { Seguro: seguroCode, Nombre: '' });
              }
            })
            .catch(error => {
              console.error('Error al buscar información del seguro:', error);
              // En caso de error, usar solo el código
              onSeguroChange(seguroCode, { Seguro: seguroCode, Nombre: '' });
            });
        }
      } catch (error) {
        console.error('Error al procesar el seguro:', error);
      }
    }
    
    // Si se proporcionó la función para cargar diagnósticos, llamarla
    if (onLoadDiagnosticos) {
      onLoadDiagnosticos(
        origen.ORIGEN as 'CE' | 'EM', 
        origen.ORIGEN === 'CE' ? origen.CODIGO : undefined
      );
    }
    
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
              "w-full justify-between font-medium text-left h-10",
              !value && "text-gray-500",
              disabled && "bg-gray-100 cursor-not-allowed"
            )}
            disabled={disabled}
          >
            <span className="truncate">
              {value || "Seleccionar origen..."}
            </span>
            {!disabled && <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0">
          <Command>
            <div className="flex items-center border-b px-3">
              <CommandInput 
                placeholder="Buscar origen..." 
                className="font-medium"
                onValueChange={(value) => {
                  setSearchTerm(value);
                  searchHospitalizationOrigins(value);
                }}
              />
            </div>
            {onShowAllOriginsChange && (
              <div className="flex items-center px-3 py-2 border-b">
                <label className="flex items-center space-x-2 text-sm cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={showAllOrigins}
                    onChange={(e) => onShowAllOriginsChange(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Mostrar todos</span>
                </label>
              </div>
            )}
            <CommandList>
              <CommandEmpty className="font-medium text-gray-500">
                {loading ? (
                  <div className="flex items-center justify-center p-4">
                    <Spinner size="sm" />
                    <span className="ml-2">Cargando orígenes...</span>
                  </div>
                ) : error ? (
                  <div className="text-center p-4 text-red-500">{error}</div>
                ) : (
                  "No se encontraron resultados."
                )}
              </CommandEmpty>
              <CommandGroup>
                {!loading && origenes.map((origen) => {
                  const displayValue = `${origen.CODIGO} [${origen.NOM_CONSULTORIO}]`;
                  return (
                    <CommandItem
                      key={origen.CODIGO}
                      value={origen.CODIGO}
                      onSelect={() => handleSelect(origen)}
                      className="font-medium"
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedOrigen?.CODIGO === origen.CODIGO ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div className="flex flex-col">
                        <span>{displayValue}</span>
                        <span className="text-xs text-gray-500">
                          {origen.ORIGEN === 'CE' ? 'CONSULTA EXTERNA' : 'EMERGENCIA'}
                          {origen.MEDICO && origen.NOM_MEDICO && ` - Médico: ${origen.MEDICO}`}
                        </span>
                      </div>
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
