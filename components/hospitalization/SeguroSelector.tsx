import React, { useState, useEffect, useRef } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Spinner } from "@/components/ui/spinner";
import { Seguro } from '@/services/hospitalizacion/seguroService';

// Función para obtener el nombre completo del código de financiamiento
const getFinancingCodeName = (code: string): string => {
  switch (code) {
    case '0':
      return '0 - PAGANTE';
    case '17':
      return '17 - OTROS PROGRAMAS';
    case '20':
      return '20 - SIS PEAS (DU046)';
    case '21':
      return '21 - SIS PEAS COMPLEMENTARIO';
    case '22':
      return '22 - SIS INDEPENDIENTE';
    case '23':
      return '23 - SIS EMPRENDEDOR (NRUS)';
    case '24':
      return '24 - SIS MICROEMPRESAS';
    case '25':
      return '25 - SIS TEMPORAL';
    case '02':
      return '02 - SOAT';
    default:
      return code; // Si no hay coincidencia, devuelve solo el código
  }
};

interface SeguroSelectorProps {
  value: string;
  onChange: (value: string, seguroData?: Seguro) => void;
  disabled?: boolean;
  className?: string;
}

export const SeguroSelector: React.FC<SeguroSelectorProps> = ({ 
  value, 
  onChange, 
  disabled = false,
  className = ''
}) => {
  const [open, setOpen] = useState(false);
  const [seguros, setSeguros] = useState<Seguro[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Crear una referencia para controlar si ya se ha hecho la llamada a la API
  const fetchedRef = useRef(false);

  useEffect(() => {
    // Evitar llamadas duplicadas usando una referencia
    if (fetchedRef.current) return;
    
    const fetchSeguros = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('/api/seguros');
        
        if (!response.ok) {
          throw new Error(`Error al cargar seguros: ${response.status}`);
        }
        
        const data = await response.json();
        setSeguros(data);
        
        // Marcar que ya se ha hecho la llamada
        fetchedRef.current = true;
      } catch (error) {
        console.error('Error al cargar seguros:', error);
        setError('Error al cargar seguros');
      } finally {
        setLoading(false);
      }
    };
    
    fetchSeguros();
  }, []);

  // Buscar el seguro seleccionado, considerando diferentes formatos posibles
  const selectedSeguro = seguros.find(seguro => {
    // Puede venir como "25" o como "25 - SIS TEMPORAL"
    if (value === seguro.Seguro || value === `${seguro.Seguro} - ${seguro.Nombre}`) {
      return true;
    }
    return false;
  });

  const handleSelect = (selectedValue: string) => {
    const selected = seguros.find(seguro => 
      selectedValue === `${seguro.Seguro} - ${seguro.Nombre}`
    );
    onChange(selectedValue, selected);
    setOpen(false);
  };

  // Función para mostrar el valor formateado en el botón
  const displayValue = () => {
    if (!value) return "Seleccione seguro";
    
    // Si el valor ya contiene un guión, puede ser que ya tenga el formato correcto
    if (value.includes(' - ')) {
      // Verificar si es un formato completo como "25 - SIS TEMPORAL"
      const parts = value.split(' - ');
      if (parts.length === 2) {
        // Verificar si el código está en nuestro switch case
        const code = parts[0];
        if (getFinancingCodeName(code) !== code) {
          // Si el código tiene un nombre definido, usamos ese formato
          return getFinancingCodeName(code);
        }
        // Si no, devolvemos el valor tal cual
        return value;
      }
    }
    
    // Si solo tenemos el código (ej: "25"), usamos la función para obtener el nombre completo
    return getFinancingCodeName(value);
  };

  return (
    <div className="space-y-2">
      <Popover open={open && !disabled} onOpenChange={disabled ? undefined : setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-between h-10",
              !value && "text-gray-500",
              disabled && "opacity-70 cursor-not-allowed"
            )}
            disabled={disabled}
          >
            {displayValue()}
            {!disabled && <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput placeholder="Buscar seguro..." />
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
                {seguros.map((seguro) => {
                  const seguroValue = `${seguro.Seguro} - ${seguro.Nombre}`;
                  return (
                    <CommandItem
                      key={seguro.Seguro}
                      value={seguroValue}
                      onSelect={() => handleSelect(seguroValue)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === seguroValue ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {seguroValue}
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
