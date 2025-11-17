import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Check, ChevronsUpDown, Loader2, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface Pais {
  pais: string;
  nombre: string;
  codigo: string;
  activo: number;
  cdc: string;
}

interface PaisSelectorProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  required?: boolean;
  disabled?: boolean;
}

export const PaisSelector: React.FC<PaisSelectorProps> = ({
  value,
  onChange,
  label = "País",
  required = false,
  disabled = false
}) => {
  const [paises, setPaises] = useState<Pais[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Cargar países cuando se abre el selector o cuando hay búsqueda
  useEffect(() => {
    if (open || searchTerm) {
      void loadPaises(searchTerm);
    }
  }, [open, searchTerm]);

  const loadPaises = async (search: string = "") => {
    setLoading(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_BACKEND_URL;
      
      // Si hay búsqueda, usar endpoint de búsqueda por nombre
      const url = search 
        ? `${baseUrl}/maestro/pais/buscar?nombre=${encodeURIComponent(search)}`
        : `${baseUrl}/maestro/pais/listar`;
      
      console.log('🔍 Cargando países desde:', url);
      
      const response = await fetch(url);
      const data = await response.json();
      
      console.log('✅ Países cargados:', data);
      
      if (Array.isArray(data)) {
        setPaises(data);
      }
    } catch (error) {
      console.error('❌ Error al cargar países:', error);
      setPaises([]);
    } finally {
      setLoading(false);
    }
  };

  const selectedPais = paises.find(p => p.pais === value);

  return (
    <div className="space-y-2">
      {label && (
        <Label className="flex items-center">
          <Globe className="mr-2 h-4 w-4" /> {label} {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={disabled || loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Cargando...
              </>
            ) : selectedPais ? (
              <span className="truncate">{selectedPais.nombre}</span>
            ) : value === "146" ? (
              <span className="truncate">PERÚ</span>
            ) : (
              "Seleccionar país..."
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" onWheel={(e) => e.stopPropagation()}>
          <Command>
            <CommandInput 
              placeholder="Buscar país..." 
              value={searchTerm}
              onValueChange={setSearchTerm}
            />
            <CommandEmpty>No se encontró país.</CommandEmpty>
            <CommandGroup className="max-h-64 overflow-y-auto overscroll-contain">
              {paises.map((pais) => (
                <CommandItem
                  key={pais.pais}
                  onSelect={() => {
                    onChange(pais.pais);
                    setOpen(false);
                  }}
                  className="cursor-pointer"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4 flex-shrink-0",
                      value === pais.pais ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span className="truncate">{pais.nombre} ({pais.codigo})</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};
