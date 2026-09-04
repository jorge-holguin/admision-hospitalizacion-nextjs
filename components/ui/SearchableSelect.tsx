"use client";

import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Search, ChevronDown, ChevronUp } from "lucide-react";

export interface OptionItem {
  value: string;
  display: string;
  description?: string;
  data: any;
}

interface SearchableSelectProps {
  label: string;
  value: string;
  options: OptionItem[];
  loading?: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  onSelect: (option: OptionItem) => void;
  selectName: string;
  required?: boolean;
  error?: string;
  placeholder?: string;
  disabled?: boolean;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  label,
  value,
  options,
  loading = false,
  search,
  onSearchChange,
  onSelect,
  selectName,
  required = false,
  error = "",
  placeholder = "Seleccionar...",
  disabled = false,
}) => {
  // ===== Solo un dropdown abierto =====
  const [openSelect, setOpenSelect] = useState<boolean>(false);
  
  const openDropdown = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (!disabled) {
      setOpenSelect((prev) => !prev);
    }
  };

  // Cerrar al hacer click fuera o con Escape
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const isInside = target.closest(`.searchable-select-root-${selectName}`);
      
      if (!isInside) {
        setOpenSelect(false);
      }
    };
    
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpenSelect(false);
      }
    };
    
    // Solo agregar event listeners si el dropdown está abierto
    if (openSelect) {
      document.addEventListener("mousedown", onDocClick);
      document.addEventListener("keydown", onKey);
      
      return () => {
        document.removeEventListener("mousedown", onDocClick);
        document.removeEventListener("keydown", onKey);
      };
    }
    return undefined;
  }, [selectName, openSelect, disabled]);

  return (
    <div className={`space-y-2 searchable-select-root searchable-select-root-${selectName} relative`}>
      <Label>
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      <div className="relative">
        <Button
          type="button"
          variant="outline"
          className={`w-full justify-between font-normal ${
            error ? "border-red-500" : ""
          }`}
          onClick={(e) => {
            openDropdown(e);
          }}
          disabled={disabled}
          data-state={openSelect ? "open" : "closed"}
        >
          <span className="truncate font-normal">{value || placeholder}</span>
          {openSelect ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>

        {openSelect && (
          <div 
            className="z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-hidden" 
            style={{
              width: '100%',
              position: 'absolute',
              top: '100%',
              left: '0',
              zIndex: 9999
            }}
          >
            <div className="p-2 border-b">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder={`Buscar ${label.toLowerCase()}...`}
                  value={search}
                  onChange={(e) => {
                    onSearchChange(e.target.value);
                  }}
                  className="pl-8"
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
            <div className="max-h-48 overflow-y-auto">
              {loading ? (
                  <div className="flex flex-wrap items-center justify-center p-4">
                    <Spinner size="sm" />
                    <span className="ml-2">Cargando...</span>
                  </div>
                ) : options.length > 0 ? (
                  options.map((option: OptionItem, idx: number) => (
                    <button
                      key={idx}
                      type="button"
                      className="w-full text-left px-3 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onSelect(option);
                        setOpenSelect(false); // cerrar al seleccionar
                      }}
                    >
                      <div className="text-sm font-normal">{option.display}</div>
                      {option.description && (
                        <div className="text-xs text-gray-500 font-normal">
                          {option.description}
                        </div>
                      )}
                    </button>
                  ))
                ) : (
                  <div className="px-3 py-2 text-gray-500 text-sm font-normal">
                    No se encontraron resultados
                  </div>
                )}
            </div>
          </div>
        )}
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
};

export default SearchableSelect;
