"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Search, ChevronDown, ChevronUp } from "lucide-react";


interface OptionItem {
  value: string;
  display: string;
  description?: string;
  data: any;
}

interface EmergencySectionProps {
  formData: any;
  patientId: string;
  validationErrors: Record<string, string>;
  disabled: boolean;
  onFormChange: (field: string, value: string) => void;
  onMotivoChange: (value: string, motivoData: any) => void;
  onConsultorioChange: (value: string, consultorioData: any) => void;
  onFormaIngresoChange: (value: string, formaData: any) => void;
  onSeguroChange: (value: string, seguroData: any) => void;
  onMedicoChange: (value: string, medicoData: any) => void;
  onDiagnosticoChange: (value: string, diagnosticoData: any) => void;
  // Optional preloaded options to avoid duplicate API calls
  preloadedMotivos?: any[];
  preloadedConsultorios?: any[];
  preloadedFormasIngreso?: any[];
  preloadedSeguros?: any[];
  loadingMotivos?: boolean;
  loadingConsultorios?: boolean;
  loadingFormas?: boolean;
  loadingSeguros?: boolean;
}

export const EmergencySection: React.FC<EmergencySectionProps> = ({
  formData,
  patientId,
  validationErrors,
  disabled,
  onFormChange,
  onMotivoChange,
  onConsultorioChange,
  onFormaIngresoChange,
  onSeguroChange,
  onMedicoChange,
  onDiagnosticoChange,
  preloadedMotivos,
  preloadedConsultorios,
  preloadedFormasIngreso,
  preloadedSeguros,
  loadingMotivos: externalLoadingMotivos,
  loadingConsultorios: externalLoadingConsultorios,
  loadingFormas: externalLoadingFormas,
  loadingSeguros: externalLoadingSeguros,
}) => {
  // ===== Opciones locales =====
  const TIPO_ATENCION_OPTIONS = [
    { value: "E", display: "(E) - Emergencia" },
    { value: "U", display: "(U) - Urgencias" },
  ];

  // ===== Estados remotos =====
  const [internalMotivos, setInternalMotivos] = useState<any[]>([]);
  const [internalConsultorios, setInternalConsultorios] = useState<any[]>([]);
  const [internalFormasIngreso, setInternalFormasIngreso] = useState<any[]>([]);
  const [internalSeguros, setInternalSeguros] = useState<any[]>([]);

  // ===== Loading =====
  const [internalLoadingMotivos, setInternalLoadingMotivos] = useState(false);
  const [internalLoadingConsultorios, setInternalLoadingConsultorios] = useState(false);
  const [internalLoadingFormas, setInternalLoadingFormas] = useState(false);
  const [internalLoadingSeguros, setInternalLoadingSeguros] = useState(false);
  
  // Use preloaded options if available, otherwise use internal state
  const motivos = preloadedMotivos || internalMotivos;
  const consultorios = preloadedConsultorios || internalConsultorios;
  const formasIngreso = preloadedFormasIngreso || internalFormasIngreso;
  const seguros = preloadedSeguros || internalSeguros;
  
  const loadingMotivos = externalLoadingMotivos !== undefined ? externalLoadingMotivos : internalLoadingMotivos;
  const loadingConsultorios = externalLoadingConsultorios !== undefined ? externalLoadingConsultorios : internalLoadingConsultorios;
  const loadingFormas = externalLoadingFormas !== undefined ? externalLoadingFormas : internalLoadingFormas;
  const loadingSeguros = externalLoadingSeguros !== undefined ? externalLoadingSeguros : internalLoadingSeguros;

  // ===== Búsquedas =====
  const [searchTipoAtencion, setSearchTipoAtencion] = useState("");
  const [searchCondicion, setSearchCondicion] = useState("");
  const [searchMotivo, setSearchMotivo] = useState("");
  const [searchConsultorio, setSearchConsultorio] = useState("");
  const [searchForma, setSearchForma] = useState("");
  const [searchSeguro, setSearchSeguro] = useState("");

  // ===== Solo un dropdown abierto =====
  const [openSelect, setOpenSelect] = useState<string | null>(null);
  const openDropdown = (name: string) => {
    setOpenSelect((prev) => (prev === name ? null : name));
  };

  // Cerrar al hacer click fuera o con Escape
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".searchable-select-root")) setOpenSelect(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenSelect(null);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  // ===== Cargas remotas =====
  const loadMotivos = async (search: string = "") => {
    // Skip loading if preloaded options are provided
    if (preloadedMotivos) return;
    
    try {
      setInternalLoadingMotivos(true);
      const res = await fetch(
        `/api/motivo-emergencia?search=${encodeURIComponent(search)}`
      );
      if (!res.ok) throw new Error(String(res.status));
      const json = await res.json();
      const items = json.items ?? json.data ?? [];
      const filtered = items.filter((x: any) => !("ACTIVO" in x) || x.ACTIVO === "1");
      setInternalMotivos(filtered);
    } catch (e) {
      console.error("Error motivos:", e);
      setInternalMotivos([]);
    } finally {
      setInternalLoadingMotivos(false);
    }
  };

  const loadConsultorios = async (search: string = "") => {
    // Skip loading if preloaded options are provided
    if (preloadedConsultorios) return;
    
    try {
      setInternalLoadingConsultorios(true);
      const res = await fetch(
        `/api/consultorio?search=${encodeURIComponent(search)}`
      );
      if (!res.ok) throw new Error(String(res.status));
      const json = await res.json();
      const items = json.items ?? json.data ?? [];
      setInternalConsultorios(items);
    } catch (e) {
      console.error("Error consultorios:", e);
      setInternalConsultorios([]);
    } finally {
      setInternalLoadingConsultorios(false);
    }
  };

  const loadFormasIngreso = async (search: string = "") => {
    try {
      setInternalLoadingFormas(true);
      const res = await fetch(
        `/api/forma-ingreso?search=${encodeURIComponent(search)}`
      );
      if (!res.ok) throw new Error(String(res.status));
      const json = await res.json();
      const items = json.items ?? json.data ?? [];
      const filtered = items.filter((x: any) => !("ACTIVO" in x) || x.ACTIVO === "1");
      setInternalFormasIngreso(filtered);
    } catch (e) {
      console.error("Error formas ingreso:", e);
      setInternalFormasIngreso([]);
    } finally {
      setInternalLoadingFormas(false);
    }
  };

  const loadSeguros = async (search: string = "") => {
    // Skip loading if preloaded options are provided
    if (preloadedSeguros) return;
    
    try {
      console.log('Cargando seguros, búsqueda:', search);
      setInternalLoadingSeguros(true);
      const res = await fetch(
        `/api/seguros${search ? `?search=${encodeURIComponent(search)}` : ''}`
      );
      if (!res.ok) throw new Error(String(res.status));
      const json = await res.json();
      console.log('Respuesta API seguros:', json);
      
      // Determinar la estructura de datos correcta
      let items = [];
      if (json.items) {
        items = json.items;
        console.log('Usando json.items para seguros');
      } else if (json.data) {
        items = json.data;
        console.log('Usando json.data para seguros');
      } else if (Array.isArray(json)) {
        items = json;
        console.log('Usando array directo para seguros');
      } else {
        console.error('Estructura de datos de seguros desconocida:', json);
        items = [];
      }
      
      console.log('Items de seguros procesados:', items);
      setInternalSeguros(items);
    } catch (e) {
      console.error("Error seguros:", e);
      setInternalSeguros([]);
    } finally {
      setInternalLoadingSeguros(false);
    }
  };

  useEffect(() => {
    // Only load catalogs if not disabled (edit mode)
    if (!disabled) {
      loadMotivos();
      loadConsultorios();
      loadFormasIngreso();
      loadSeguros();
    }
  }, [disabled]);

  // ===== SearchableSelect (fuente normal) =====
  const SearchableSelect = ({
    label,
    value,
    options,
    loading,
    search,
    onSearchChange,
    onSelect,
    selectName,
    required = false,
    error = "",
    placeholder = "Seleccionar...",
  }: any) => (
    <div className="space-y-2 searchable-select-root">
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
          onClick={() => openDropdown(selectName)}
          disabled={disabled}
        >
          <span className="truncate font-normal">{value || placeholder}</span>
          {openSelect === selectName ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>

        {openSelect === selectName && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-hidden">
            <div className="p-2 border-b">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder={`Buscar ${label.toLowerCase()}...`}
                  value={search}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="max-h-48 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center p-4">
                  <Spinner size="sm" />
                  <span className="ml-2">Cargando...</span>
                </div>
              ) : options.length > 0 ? (
                options.map((option: any, idx: number) => (
                  <button
                    key={idx}
                    type="button"
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                    onClick={() => {
                      onSelect(option);
                      setOpenSelect(null); // cerrar al seleccionar
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

  // ===== Formato de opciones =====
  const formatTipoAtencion = TIPO_ATENCION_OPTIONS
    .filter(
      (o) =>
        !searchTipoAtencion ||
        o.display.toLowerCase().includes(searchTipoAtencion.toLowerCase())
    )
    .map((o) => ({ value: o.value, display: o.display, data: o }));

  const formatMotivos = motivos
    .filter(
      (m) =>
        !searchMotivo ||
        m.NOMBRE?.toLowerCase().includes(searchMotivo.toLowerCase())
    )
    .map((m) => ({
      value: m.MOTIVO_EMERGENCIA,
      display: `(${m.MOTIVO_EMERGENCIA}) - ${m.NOMBRE}`,
      description: "",
      data: m,
    }));

  const formatConsultorios = consultorios
    .filter(
      (c) =>
        !searchConsultorio ||
        c.NOMBRE?.toLowerCase().includes(searchConsultorio.toLowerCase())
    )
    .map((c) => ({
      value: c.CONSULTORIO,
      display: `(${c.CONSULTORIO}) - ${c.NOMBRE}`,
      description: "",
      data: c,
    }));

  const formatFormas = formasIngreso
    .filter(
      (f) =>
        !searchForma || f.NOMBRE?.toLowerCase().includes(searchForma.toLowerCase())
    )
    .map((f) => ({
      value: f.FORMA_INGRESO,
      display: `(${f.FORMA_INGRESO}) - ${f.NOMBRE}`,
      description: "",
      data: f,
    }));

  const formatSeguros = useMemo(() => {
    console.log('Datos de seguros disponibles:', seguros);
    return seguros
      .filter(
        (s) => !searchSeguro || 
          (s.Nombre?.toLowerCase().includes(searchSeguro.toLowerCase()) || 
           s.NOMBRE?.toLowerCase().includes(searchSeguro.toLowerCase()))
      )
      .map((s) => ({
        value: s.Seguro || s.SEGURO,
        display: `(${s.Seguro || s.SEGURO}) - ${s.Nombre || s.NOMBRE}`,
        description: "",
        data: s,
      }));
  }, [seguros, searchSeguro]);

  // Helper para mostrar display actual a partir del code guardado
  const displayFrom = (
    opts: { value: string; display: string }[],
    code?: string
  ) => opts.find((o) => o.value === code)?.display || "";

  return (
    <div className="space-y-6 mt-8" data-testid="emergency-section">
      <h3 className="text-lg font-semibold mb-4">Datos de la Emergencia</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Tipo de Atención (E/U) */}
        <SearchableSelect
          label="Tipo Atención"
          value={displayFrom(TIPO_ATENCION_OPTIONS, formData.tipoAtencion)}
          options={formatTipoAtencion}
          loading={false}
          search={searchTipoAtencion}
          onSearchChange={setSearchTipoAtencion}
          onSelect={(opt: OptionItem) => onFormChange("tipoAtencion", opt.value)}
          selectName="tipoAtencion"
          required
          error={validationErrors.tipoAtencion}
          placeholder="Seleccionar tipo de atención..."
        />

        {/* Motivo de Ingreso */}
        <SearchableSelect
          label="Motivo de Ingreso"
          value={formData.motivoEmergenciaDisplay || ""}
          options={formatMotivos}
          loading={loadingMotivos}
          search={searchMotivo}
          onSearchChange={(v: string) => {
            setSearchMotivo(v);
            loadMotivos(v);
          }}
          onSelect={(opt: OptionItem) => {
            onFormChange("motivoEmergencia", opt.value);
            onFormChange("motivoEmergenciaDisplay", opt.display);
            onMotivoChange(opt.value, opt.data);
          }}
          selectName="motivo"
          required
          error={validationErrors.motivoEmergencia}
          placeholder="Seleccionar motivo..."
        />

        {/* Consultorio */}
        <SearchableSelect
          label="Consultorio"
          value={formData.consultorioDisplay || ""}
          options={formatConsultorios}
          loading={loadingConsultorios}
          search={searchConsultorio}
          onSearchChange={(v: string) => {
            setSearchConsultorio(v);
            loadConsultorios(v);
          }}
          onSelect={(opt: OptionItem) => {
            onFormChange("consultorio", opt.value);
            onFormChange("consultorioDisplay", opt.display);
            onConsultorioChange(opt.value, opt.data);
          }}
          selectName="consultorio"
          required
          error={validationErrors.consultorio}
          placeholder="Seleccionar consultorio..."
        />

        {/* Forma de Ingreso */}
        <SearchableSelect
          label="Forma de Ingreso"
          value={formData.formaIngresoDisplay || ""}
          options={formatFormas}
          loading={loadingFormas}
          search={searchForma}
          onSearchChange={(v: string) => {
            setSearchForma(v);
            loadFormasIngreso(v);
          }}
          onSelect={(opt: OptionItem) => {
            onFormChange("formaIngreso", opt.value);
            onFormChange("formaIngresoDisplay", opt.display);
            onFormaIngresoChange(opt.value, opt.data);
          }}
          selectName="formaIngreso"
          required
          error={validationErrors.formaIngreso}
          placeholder="Seleccionar forma de ingreso..."
        />

        {/* Seguro */}
        <SearchableSelect
          label="Seguro"
          value={formData.seguroDisplay || ""}
          options={formatSeguros}
          loading={loadingSeguros}
          search={searchSeguro}
          onSearchChange={(v: string) => {
            setSearchSeguro(v);
            loadSeguros(v);
          }}
          onSelect={(opt: OptionItem) => {
            onFormChange("seguro", opt.value);
            onFormChange("seguroDisplay", opt.display);
            onSeguroChange(opt.value, opt.data);
          }}
          selectName="seguro"
          required
          error={validationErrors.seguro}
          placeholder="Seleccionar seguro..."
        />
      </div>

      {/* Observaciones */}
      <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
        <div className="space-y-2">
          <Label htmlFor="observacion1">Observaciones</Label>
          <Textarea
            id="observacion1"
            value={formData.observacion1 || ""}
            onChange={(e) => onFormChange("observacion1", e.target.value)}
            disabled={disabled}
            placeholder="Observaciones adicionales..."
            rows={3}
          />
        </div>
      </div>
    </div>
  );
};

export default EmergencySection;
