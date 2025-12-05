import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Spinner } from "@/components/ui/spinner";
import { useConsultorios } from '@/contexts/ConsultoriosContext';

interface Consultorio {
  CONSULTORIO: string;
  NOMBRE: string;
}

interface ConsultorioSelectorProps {
  value: string;
  onChange: (value: string, consultorioData?: Consultorio) => void;
  disabled?: boolean;
  origenId?: string;
  className?: string;
}

export const ConsultorioSelector: React.FC<ConsultorioSelectorProps> = ({ 
  value, 
  onChange, 
  disabled = false,
  origenId,
  className = ''
}) => {
  const [open, setOpen] = useState(false);
  
  // Usar consultorios de HOSPITALIZACIÓN (TIPO='H') en lugar de emergencia
  const { consultoriosHospitalizacion, loadingHospitalizacion } = useConsultorios();

  const handleSelect = (selectedValue: string) => {
    const selected = consultoriosHospitalizacion.find(consultorio => 
      selectedValue === `${consultorio.CONSULTORIO} - ${consultorio.NOMBRE}`
    );
    onChange(selectedValue, selected);
    setOpen(false);
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
            {value || "Seleccione consultorio"}
            {!disabled && <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput placeholder="Buscar consultorio..." />
            <CommandList>
              <CommandEmpty>
                {loadingHospitalizacion ? (
                  <div className="flex items-center justify-center p-4">
                    <Spinner size="sm" />
                    <span className="ml-2">Cargando...</span>
                  </div>
                ) : (
                  "No se encontraron resultados"
                )}
              </CommandEmpty>
              <CommandGroup>
                {consultoriosHospitalizacion.map((consultorio) => {
                  const consultorioValue = `${consultorio.CONSULTORIO} - ${consultorio.NOMBRE}`;
                  return (
                    <CommandItem
                      key={consultorio.CONSULTORIO}
                      value={consultorioValue}
                      onSelect={handleSelect}
                      className="flex items-center justify-between py-2"
                    >
                      <span>{consultorioValue}</span>
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === consultorioValue ? "opacity-100" : "opacity-0"
                        )}
                      />
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
