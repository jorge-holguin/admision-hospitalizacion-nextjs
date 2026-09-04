"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from "@/components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";
import { Diagnostico } from "@/services/hospitalizacion/diagnosticoService";
import { useDebounce } from "@/hooks/useDebounce";
import { useAuth } from "@/components/AuthProvider";
import { toast } from "@/hooks/use-toast";
import { API_SPRING_URL } from "@/lib/api-config";

// Extender la interfaz Diagnostico
interface DiagnosticoExtendido extends Diagnostico {
  Descripcion?: string;
  CodigoCompleto?: string;
  Estado?: string;
  FechaRegistro?: string;
}

// Base API y endpoints derivados
const API_CIEX = import.meta.env.VITE_API_CIEX_URL;

const ENDPOINTS = {
  CIEX: `${API_CIEX}/ciex`, // ✅ Usar API externa de CIEX
  DIAGNOSTICOS: `${API_SPRING_URL}/diagnosticos`,
  DIAGNOSTICOS_EMERGENCIA: `${API_SPRING_URL}/diagnosticos/buscar`
} as const;

// Tipos de origen de hospitalización
type TipoOrigen = "CE" | "EM" | "RN";

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
  origenId = "",
  tipoOrigen = "CE",
  className = ""
}) => {
  const [open, setOpen] = useState(false);
  const [diagnosticos, setDiagnosticos] = useState<DiagnosticoExtendido[]>([]);
  const [allDiagnosticos, setAllDiagnosticos] = useState<DiagnosticoExtendido[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [initialDiagnostico, setInitialDiagnostico] = useState<DiagnosticoExtendido | null>(null);
  const { logout } = useAuth();

  // Transformar datos de CIEX al formato de Diagnostico
  const transformCiexData = (ciexItems: CiexItem[]): DiagnosticoExtendido[] => {
    return ciexItems.map((item) => ({
      Codigo: item.cie10?.trim() || "",
      Descripcion: item.descripcion || "",
      Nombre: item.descripcion || "",
      CodigoCompleto: `${item.cie10?.trim() || ""} - ${item.descripcion || ""}`,
      Estado: "A",
      FechaRegistro: new Date().toISOString()
    }));
  };

  // Obtener token de autenticación
  const getAuthToken = (): string => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("authToken") || "";
    }
    return "";
  };

  // Determinar si se usa API CIEX
  const useCiexApi = () => tipoOrigen === "EM" || tipoOrigen === "RN";

  // Petición API CIEX
  const fetchFromCiexApi = async (searchQuery: string): Promise<DiagnosticoExtendido[]> => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const url = `${ENDPOINTS.CIEX}?busqueda=${encodeURIComponent(normalizedQuery)}`;
    const token = getAuthToken();

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!response.ok) {
      // Verificar si es error 403 de token expirado
      if (response.status === 403) {
        const errorData = await response.json().catch(() => ({}));
        if (errorData.statusCode === 403 || errorData.message?.includes('Token')) {
          toast({
            title: "Sesión expirada",
            description: "Su token ha expirado. Por favor, vuelva a iniciar sesión.",
            variant: "destructive",
            duration: 5000,
          });
          // Cerrar sesión después de un breve delay
          setTimeout(() => logout(), 2000);
          throw new Error('Token expirado');
        }
      }
      throw new Error(`Error en API CIEX: ${response.status}`);
    }

    const ciexData: CiexResponse = await response.json();
    return ciexData.data ? transformCiexData(ciexData.data) : [];
  };

  // Petición API Diagnósticos
  const fetchFromDiagnosticosApi = async (
    searchQuery: string,
    isSpecificId = false
  ): Promise<DiagnosticoExtendido[]> => {
    const baseUrl = isSpecificId
      ? `${ENDPOINTS.DIAGNOSTICOS}/${encodeURIComponent(searchQuery)}`
      : `${ENDPOINTS.DIAGNOSTICOS_EMERGENCIA}?search=${encodeURIComponent(searchQuery)}&limit=50`;

    const url = searchQuery ? baseUrl : `${ENDPOINTS.DIAGNOSTICOS_EMERGENCIA}?limit=20`;

    const response = await fetch(url);

    if (!response.ok && !isSpecificId) {
      // Verificar si es error 403 de token expirado
      if (response.status === 403) {
        const errorData = await response.json().catch(() => ({}));
        if (errorData.statusCode === 403 || errorData.message?.includes('Token')) {
          toast({
            title: "Sesión expirada",
            description: "Su token ha expirado. Por favor, vuelva a iniciar sesión.",
            variant: "destructive",
            duration: 5000,
          });
          // Cerrar sesión después de un breve delay
          setTimeout(() => logout(), 2000);
          throw new Error('Token expirado');
        }
      }
      throw new Error(`Error en API diagnósticos: ${response.status}`);
    }

    if (response.status === 204) return [];

    const data = await response.json();
    return isSpecificId ? (data?.Codigo ? [data] : []) : Array.isArray(data) ? data : [];
  };

  // Cargar diagnósticos
  const loadDiagnosticos = async (searchQuery = "", isInitialLoad = false) => {
    try {
      setLoading(true);
      setError(null);

      const isSpecificId =
        isInitialLoad && origenId && origenId.trim() !== "" && origenId.length > 3;
      const queryToUse = isSpecificId ? origenId : searchQuery;

      let results: Diagnostico[] = [];

      // ✅ Solo cargar si hay una búsqueda específica
      if (!queryToUse) {
        setDiagnosticos([]);
        setAllDiagnosticos([]);
        setLoading(false);
        return;
      }

      if (useCiexApi()) {
        results = await fetchFromCiexApi(queryToUse);
      } else {
        results = isSpecificId
          ? await fetchFromDiagnosticosApi(queryToUse, true)
          : await fetchFromDiagnosticosApi(queryToUse, false);
      }

      if (isInitialLoad || !searchQuery) {
        setDiagnosticos(results);
        setAllDiagnosticos(results);
      } else {
        setDiagnosticos(results);
      }
    } catch (err: any) {
      console.error("Error al cargar/buscar diagnósticos:", err);
      
      // Si es error de token expirado, no mostrar mensaje adicional
      if (err.message === 'Token expirado') {
        setError("Sesión expirada. Por favor, vuelva a iniciar sesión.");
      } else {
        setError("Error al cargar/buscar diagnósticos");
      }
    } finally {
      setLoading(false);
    }
  };

  // Efectos
  useEffect(() => {
    loadDiagnosticos("", true);
  }, [origenId, tipoOrigen]);

  useEffect(() => {
    if (origenId && allDiagnosticos.length === 1 && allDiagnosticos[0].Codigo) return;
    if (!debouncedSearchTerm) {
      setDiagnosticos(allDiagnosticos);
      return;
    }

    const isCiexCode = /^[A-Z]\d{2,3}[A-Z]?$/i.test(debouncedSearchTerm.trim());
    if (debouncedSearchTerm.length < 2 && !isCiexCode) return;

    loadDiagnosticos(debouncedSearchTerm, false);
  }, [debouncedSearchTerm, origenId, allDiagnosticos, tipoOrigen]);

  useEffect(() => {
    if (value && !diagnosticos.some((d) => d.Codigo === value) && !initialDiagnostico) {
      setInitialDiagnostico({
        Codigo: value,
        Nombre: value,
        CodigoCompleto: value,
        Estado: "A"
      });
    }
  }, [value, diagnosticos]);

  const selectedDiagnostico =
    diagnosticos.find(
      (d) => d.Codigo === value || d.CodigoCompleto === value
    ) || initialDiagnostico;

  const handleSelect = (codigo: string) => {
    const selected = diagnosticos.find(
      (d) => d.Codigo === codigo || d.CodigoCompleto === codigo
    );
    if (selected) {
      onChange(selected.Codigo, selected);
      setOpen(false);
    }
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
            <span className="truncate">
              {selectedDiagnostico.CodigoCompleto ||
                `${selectedDiagnostico.Codigo} - ${selectedDiagnostico.Nombre}`}
            </span>
          ) : value ? (
            <span className="truncate">{value}</span>
          ) : (
            <span className="text-muted-foreground">Seleccionar diagnóstico</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full max-w-[400px] p-0">
        <Command>
          <CommandInput
            placeholder="Buscar por código o descripción..."
            onValueChange={setSearchTerm}
            value={searchTerm}
          />
          <CommandList>
            {loading && (
              <div className="flex flex-wrap items-center justify-center p-4">
                <Spinner className="mr-2" />
                <span>Cargando diagnósticos...</span>
              </div>
            )}
            {error && <div className="p-4 text-center text-red-500">{error}</div>}
            {!loading && !error && diagnosticos.length === 0 && (
              <CommandEmpty>No se encontraron diagnósticos.</CommandEmpty>
            )}
            {!loading && !error && diagnosticos.length > 0 && (
              <CommandGroup>
                {diagnosticos.map((diagnostico) => {
                  const searchValue = `${diagnostico.Codigo} ${
                    diagnostico.Descripcion || diagnostico.Nombre
                  }`.toLowerCase();

                  return (
                    <CommandItem
                      key={diagnostico.Codigo}
                      value={searchValue}
                      onSelect={() => handleSelect(diagnostico.Codigo)}
                      className="flex items-start py-2"
                    >
                      <div className="flex flex-col w-full">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 w-full">
                          <span className="font-bold text-primary">{diagnostico.Codigo}</span>
                          {selectedDiagnostico?.Codigo === diagnostico.Codigo && (
                            <Check className="h-4 w-4 flex-shrink-0 text-primary" />
                          )}
                        </div>
                        <span className="text-sm text-muted-foreground line-clamp-2">
                          {diagnostico.Descripcion || diagnostico.Nombre}
                        </span>
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
