import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Spinner } from "@/components/ui/spinner";
import { Seguro } from '@/services/seguroService';

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

  useEffect(() => {
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
      } catch (error) {
        console.error('Error al cargar seguros:', error);
        setError('Error al cargar seguros');
      } finally {
        setLoading(false);
      }
    };
    
    fetchSeguros();
  }, []);

  const selectedSeguro = seguros.find(seguro => 
    value === `${seguro.Seguro} - ${seguro.Nombre}`
  );

  const handleSelect = (selectedValue: string) => {
    const selected = seguros.find(seguro => 
      selectedValue === `${seguro.Seguro} - ${seguro.Nombre}`
    );
    onChange(selectedValue, selected);
    setOpen(false);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="seguro" className="text-sm font-semibold text-red-600">
        <span className="text-red-500">●</span> Seguro / Financiamiento <span className="text-red-500">*</span>
      </Label>
      <Popover open={open && !disabled} onOpenChange={disabled ? undefined : setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-between",
              !value && "text-gray-500",
              disabled && "opacity-70 cursor-not-allowed"
            )}
            disabled={disabled}
          >
            {value || "Seleccione seguro"}
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
