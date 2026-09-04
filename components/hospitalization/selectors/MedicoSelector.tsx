import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Spinner } from "@/components/ui/spinner";
import { useDebounce } from '@/hooks/useDebounce';
import { Medico } from '@/services/hospitalizacion/medicoService';
import { useMedicosOnDemand } from '@/hooks/useMedicosOnDemand';

interface MedicoSelectorProps {
  value: string;
  onChange: (value: string, medicoData?: Medico) => void;
  disabled?: boolean;
  consultorioId?: string;
  className?: string;
}

export const MedicoSelector: React.FC<MedicoSelectorProps> = ({ 
  value, 
  onChange,
  disabled = false,
  consultorioId,
  className
}) => {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  
  // Usar hook de médicos bajo demanda
  const { medicos, loading, error, searchMedicos } = useMedicosOnDemand();
  
  // Buscar médicos cuando cambie el término de búsqueda o consultorio
  useEffect(() => {
    if (open && debouncedSearchTerm) {
      searchMedicos(debouncedSearchTerm, consultorioId);
    }
  }, [debouncedSearchTerm, consultorioId, open, searchMedicos]);

  const selectedMedico = medicos.find((medico: Medico) => 
    value === `${medico.MEDICO} - ${medico.NOMBRE}`
  );

  const handleSelect = (selectedValue: string) => {
    const selected = medicos.find((medico: Medico) => 
      selectedValue === `${medico.MEDICO} - ${medico.NOMBRE}`
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
            {value || "Seleccione médico"}
            {!disabled && <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput 
              placeholder="Buscar médico..." 
              value={searchTerm}
              onValueChange={setSearchTerm}
            />
            <CommandList>
              <CommandEmpty>
                {loading ? (
                  <div className="flex flex-wrap items-center justify-center p-4">
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
                {medicos.map((medico) => {
                  const medicoValue = `${medico.MEDICO} - ${medico.NOMBRE}`;
                  return (
                    <CommandItem
                      key={medico.MEDICO}
                      value={medicoValue}
                      onSelect={() => handleSelect(medicoValue)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === medicoValue ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {medicoValue}
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
