"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import SearchableSelect, { OptionItem } from "@/components/ui/SearchableSelect";
import { useSeguros } from "@/contexts/SegurosContext"
import { useConsultorios } from "@/contexts/ConsultoriosContext"
import { useMotivosEmergencia } from "@/contexts/MotivosEmergenciaContext"
import { useFormasIngreso } from "@/contexts/FormasIngresoContext"
import { ConsultorioEmergencySelector } from "../selectors/ConsultorioEmergencySelector";
import { usePatientData } from "@/contexts/PatientDataContext";

// Using OptionItem from SearchableSelect component

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

// Definir opciones para tipo de atención
const TIPO_ATENCION_OPTIONS = [
  { value: "E", display: "(E) - Emergencia", description: "Atención de emergencia" },
  { value: "U", display: "(U) - Urgencia", description: "Atención de urgencia" },
];

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
  loadingMotivos: propLoadingMotivos,
  loadingConsultorios: propLoadingConsultorios,
  loadingFormas: propLoadingFormas,
  loadingSeguros: propLoadingSeguros,
}) => {
  // Usar el contexto para obtener datos del paciente
  const { getPatientData } = usePatientData();
  
  // Usar contextos para consultorios 
  const { consultorios: contextConsultorios, loading: contextLoadingConsultorios } = useConsultorios();
  const { seguros: contextSeguros, loading: contextLoadingSeguros } = useSeguros();
  const { motivosEmergencia: contextMotivos, loading: contextLoadingMotivos } = useMotivosEmergencia();
  const { formasIngreso: contextFormasIngreso, loading: contextLoadingFormasIngreso } = useFormasIngreso();
  
  // Internal state for catalogs que no tienen contexto
  const [internalMotivos, setInternalMotivos] = useState<any[]>([]);
  const [internalFormasIngreso, setInternalFormasIngreso] = useState<any[]>([]);
  
  // Loading states
  const [internalLoadingMotivos, setInternalLoadingMotivos] = useState(false);
  const [internalLoadingFormas, setInternalLoadingFormas] = useState(false);
  
  // Use preloaded options if available, otherwise use context or internal state
  const motivos = preloadedMotivos || contextMotivos || internalMotivos;
  const consultorios = preloadedConsultorios || contextConsultorios;
  const formasIngreso = preloadedFormasIngreso || contextFormasIngreso || internalFormasIngreso;
  const seguros = preloadedSeguros || contextSeguros;
  
  // Use loading states from props or context
  const effectiveLoadingMotivos = propLoadingMotivos !== undefined ? propLoadingMotivos : (contextLoadingMotivos || internalLoadingMotivos);
  const effectiveLoadingConsultorios = propLoadingConsultorios !== undefined ? propLoadingConsultorios : contextLoadingConsultorios;
  const effectiveLoadingFormas = propLoadingFormas !== undefined ? propLoadingFormas : (contextLoadingFormasIngreso || internalLoadingFormas);
  const effectiveLoadingSeguros = propLoadingSeguros !== undefined ? propLoadingSeguros : contextLoadingSeguros;

  // ===== Búsquedas =====
  const [searchTipoAtencion, setSearchTipoAtencion] = useState("");
  const [searchCondicion, setSearchCondicion] = useState("");
  const [searchMotivo, setSearchMotivo] = useState("");
  const [searchConsultorio, setSearchConsultorio] = useState("");
  const [searchForma, setSearchForma] = useState("");
  const [searchSeguro, setSearchSeguro] = useState("");

  // No need for dropdown management as it's handled in the SearchableSelect component

  // ===== Cargas remotas =====
  const loadMotivos = async (search: string = "") => {
    // Skip loading if preloaded options are provided or if using context
    if (preloadedMotivos || contextMotivos) {
      console.log('🚨 Usando motivos desde contexto:', contextMotivos?.length || 0);
      return;
    }
    
    // Esta función ya no debería ejecutarse si tenemos el contexto configurado correctamente
    console.warn('⚠️ Llamando a loadMotivos directamente - esto no debería ocurrir si el contexto está configurado');
    
    try {
      setInternalLoadingMotivos(true);
      console.log('🚨 Cargando motivos desde API directamente (NO RECOMENDADO)');
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

  // Ya no necesitamos cargar consultorios manualmente, usamos el contexto
  const loadConsultorios = async (search: string = "") => {
    // Skip loading if preloaded options are provided or if using context
    if (preloadedConsultorios || contextConsultorios) return;
    
    // Esta función ya no hace nada, ya que usamos el contexto
    console.log('Usando consultorios desde el contexto');
    // No hay más código aquí porque usamos el contexto
  };

  const loadFormasIngreso = async (search: string = "") => {
    // Skip loading if preloaded options are provided or if using context
    if (preloadedFormasIngreso || contextFormasIngreso) {
      console.log('🚪 Usando formas de ingreso desde contexto:', contextFormasIngreso?.length || 0);
      return;
    }
    
    // Esta función ya no debería ejecutarse si tenemos el contexto configurado correctamente
    console.warn('⚠️ Llamando a loadFormasIngreso directamente - esto no debería ocurrir si el contexto está configurado');
    
    try {
      setInternalLoadingFormas(true);
      console.log('🚪 Cargando formas de ingreso desde API directamente (NO RECOMENDADO)');
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
    // Skip loading if preloaded options are provided or if using context
    if (preloadedSeguros || contextSeguros) return;
    
    // Esta función ya no hace nada, ya que usamos el contexto
    console.log('Usando seguros desde el contexto');
    // No hay más código aquí porque usamos el contexto
  };

  useEffect(() => {
    // Only load catalogs if not disabled (edit mode) and not already provided
    if (!disabled) {
      // Ya no cargar motivos ni formas de ingreso porque usamos contextos
      console.log('📋 Usando motivos desde contexto:', contextMotivos?.length || 0);
      console.log('📋 Usando formas de ingreso desde contexto:', contextFormasIngreso?.length || 0);
      console.log('📋 Usando consultorios desde contexto:', contextConsultorios?.length || 0);
      console.log('📋 Usando seguros desde contexto:', contextSeguros?.length || 0);
    }
  }, [disabled, contextMotivos, contextFormasIngreso, contextConsultorios, contextSeguros]);
  
  // Ya no establecemos un valor por defecto para Forma de Ingreso
  // El usuario debe seleccionarlo manualmente

  // Set default value for Seguro from patient context data
  useEffect(() => {
    // Solo ejecutar cuando tengamos patientId y seguros cargados
    if (!patientId || seguros.length === 0) return;
    
    // Obtener datos del paciente
    const patientData = getPatientData(patientId);
    if (!patientData || !patientData.seguro) return;
    
    // Si ya hay un seguro seleccionado, no hacer nada
    if (formData.seguro && formData.seguroDisplay) return;
    
    // Limpiar el código de seguro (remover espacios)
    let seguroCode = patientData.seguro.trim();
    console.log('Estableciendo seguro inicial del paciente:', seguroCode);
    console.log('Descripción del seguro:', patientData.descSeguro);
    
    // CASO ESPECIAL: Si el seguro es 06 (ESSALUD), cambiarlo automáticamente a 0 (PAGANTE)
    if (seguroCode === '06') {
      console.log('Seguro ESSALUD (06) detectado, cambiando automáticamente a PAGANTE (0)');
      seguroCode = '0';
    }
    
    // Buscar el seguro en la lista de seguros disponibles
    const matchingSeguro = seguros.find(s => 
      (s.Seguro && s.Seguro.trim() === seguroCode) || 
      (s.SEGURO && s.SEGURO.trim() === seguroCode)
    );
    
    if (matchingSeguro) {
      const seguroDisplay = `(${matchingSeguro.Seguro || matchingSeguro.SEGURO}) - ${matchingSeguro.Nombre || matchingSeguro.NOMBRE}`;
      const seguroValue = `${seguroCode} - ${matchingSeguro.Nombre || matchingSeguro.NOMBRE}`;
      console.log('Estableciendo seguro por defecto desde catálogo:', seguroDisplay);
      
      onFormChange('seguro', seguroValue);
      onFormChange('seguroDisplay', seguroDisplay);
      
      if (onSeguroChange) {
        onSeguroChange(seguroValue, matchingSeguro);
      }
    } else {
      // Si no se encuentra en la lista, usar los datos del paciente directamente
      // Si es PAGANTE (después del cambio automático), usar un nombre predeterminado
      const seguroNombre = seguroCode === '0' ? 'PAGANTE' : (patientData.descSeguro || 'Sin descripción');
      const seguroDisplay = `(${seguroCode}) - ${seguroNombre}`;
      const seguroValue = `${seguroCode} - ${seguroNombre}`;
      console.log('Estableciendo seguro por defecto desde datos del paciente:', seguroDisplay);
      
      onFormChange('seguro', seguroValue);
      onFormChange('seguroDisplay', seguroDisplay);
      
      if (onSeguroChange) {
        onSeguroChange(seguroCode, { 
          Seguro: seguroCode, 
          Nombre: seguroNombre
        });
      }
    }
  }, [seguros, patientId, getPatientData, onFormChange, onSeguroChange, formData.seguro, formData.seguroDisplay]);

  // Seguro default value now comes from patient context data instead of separate API call

  // Using the reusable SearchableSelect component

  // ===== Formato de opciones =====
  const formatTipoAtencion = useMemo(() => {
    return TIPO_ATENCION_OPTIONS.filter(
      (o: {value: string, display: string, description: string}) => !searchTipoAtencion || 
      o.display.toLowerCase().includes(searchTipoAtencion.toLowerCase())
    ).map((o: {value: string, display: string, description: string}) => ({
      value: o.value,
      display: o.display,
      description: o.description,
      data: o,
    }));
  }, [searchTipoAtencion]);

  const formatMotivos = motivos
    .filter(
      (m) =>
        !searchMotivo ||
        m.NOMBRE?.toLowerCase().includes(searchMotivo.toLowerCase()) ||
        m.MOTIVO_EMERGENCIA?.toLowerCase().includes(searchMotivo.toLowerCase())
    )
    .map((m) => ({
      value: m.MOTIVO_EMERGENCIA,
      display: `(${m.MOTIVO_EMERGENCIA}) - ${m.NOMBRE}`,
      description: "",
      data: m,
    }));

  const formatConsultorios = consultorios
    .filter(
      (c) => {
        if (!searchConsultorio) return true;
        
        const searchLower = searchConsultorio.toLowerCase();
        
        // Search in name
        if (c.NOMBRE?.toLowerCase().includes(searchLower)) return true;
        
        // Search in code - handle different formats
        const consultorioCode = c.CONSULTORIO?.toString().trim() || '';
        return consultorioCode.toLowerCase().includes(searchLower);
      }
    )
    .map((c) => ({
      value: c.CONSULTORIO,
      display: `(${c.CONSULTORIO}) - ${c.NOMBRE}`,
      description: "",
      data: c,
    }));

  const formatFormas = formasIngreso
    .filter(
      (f) => {
        if (!searchForma) return true;
        
        const searchLower = searchForma.toLowerCase();
        
        // Search in name
        if (f.NOMBRE?.toLowerCase().includes(searchLower)) return true;
        
        // Search in code - handle different formats
        const formaCode = f.FORMA_INGRESO?.toString().trim() || '';
        return formaCode.toLowerCase().includes(searchLower);
      }
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
        (s) => {
          if (!searchSeguro) return true;
          
          const searchLower = searchSeguro.toLowerCase();
          
          // Search in name
          if (s.Nombre?.toLowerCase().includes(searchLower)) return true;
          
          // Search in code - handle different formats
          const seguroCode = s.Seguro?.toString().trim() || '';
          return seguroCode.toLowerCase().includes(searchLower);
        }
      )
      .map((s) => ({
        value: s.Seguro,
        display: `(${s.Seguro}) - ${s.Nombre}`,
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
          value={formData.tipoAtencionDisplay || "(E) - Emergencia"}
          options={formatTipoAtencion}
          loading={false}
          search={searchTipoAtencion}
          onSearchChange={setSearchTipoAtencion}
          onSelect={(opt: OptionItem) => onFormChange("tipoAtencion", opt.value)}
          selectName="tipoAtencion"
          required
          error={validationErrors.tipoAtencion}
          placeholder="Seleccionar tipo de atención..."
          disabled={disabled}
        />

        {/* Consultorio */}
        <div className="space-y-2">
          <ConsultorioEmergencySelector
            label="Consultorio"
            value={formData.consultorio || ""}
            onChange={(value: string) => {
              // Buscar el consultorio seleccionado para obtener el display
              const selectedConsultorio = consultorios.find(c => c.CONSULTORIO === value);
              const display = selectedConsultorio ? 
                `${selectedConsultorio.CONSULTORIO} - ${selectedConsultorio.NOMBRE}` : 
                value;
              
              onFormChange("consultorio", value);
              onFormChange("consultorioDisplay", display);
              onConsultorioChange(value, selectedConsultorio);
            }}
            required
            placeholder="Seleccionar consultorio..."
          />
          {validationErrors.consultorio && (
            <p className="text-sm text-red-500">{validationErrors.consultorio}</p>
          )}
        </div>

        {/* Forma de Ingreso */}
        <SearchableSelect
          label="Forma de Ingreso"
          value={formData.formaIngresoDisplay || ""}
          options={formatFormas}
          loading={effectiveLoadingFormas}
          search={searchForma}
          onSearchChange={(v: string) => {
            setSearchForma(v);
            // Ya no llamamos a loadFormasIngreso porque usamos el contexto
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
          disabled={disabled}
        />

        {/* Seguro */}
        <SearchableSelect
          label="Condición del Paciente"
          value={formData.seguroDisplay || ""}
          options={formatSeguros}
          loading={effectiveLoadingSeguros}
          search={searchSeguro}
          onSearchChange={(v: string) => {
            setSearchSeguro(v);
            // Ya no llamamos a loadSeguros porque usamos el contexto
          }}
          onSelect={(opt: OptionItem) => {
            // Check if the selected insurance is ESSALUD (code 06)
            // If so, automatically change it to PAGANTE (code 0)
            let seguroValue = opt.value;
            let seguroData = opt.data;
            
            if (seguroValue === '06') {
              console.log('Seguro ESSALUD (06) detectado, cambiando automáticamente a PAGANTE (0)');
              
              // Find PAGANTE in the list of available insurance options
              const paganteSeguro = seguros.find(s => 
                (s.Seguro && s.Seguro.trim() === '0') || 
                (s.SEGURO && s.SEGURO.trim() === '0')
              );
              
              if (paganteSeguro) {
                seguroValue = '0';
                seguroData = paganteSeguro;
                
                // Update display value for PAGANTE
                const paganteDisplay = `(${paganteSeguro.Seguro || paganteSeguro.SEGURO}) - ${paganteSeguro.Nombre || paganteSeguro.NOMBRE}`;
                onFormChange("seguroDisplay", paganteDisplay);
              } else {
                // If PAGANTE not found in the list, use basic info
                seguroValue = '0';
                seguroData = { Seguro: '0', Nombre: 'PAGANTE' };
                onFormChange("seguroDisplay", "(0) - PAGANTE");
              }
            } else {
              // For other insurance types, use selected values
              onFormChange("seguroDisplay", opt.display);
            }
            
            onFormChange("seguro", seguroValue);
            onSeguroChange(seguroValue, seguroData);
          }}
          selectName="seguro"
          required
          error={validationErrors.seguro}
          placeholder="Seleccionar seguro..."
          disabled={disabled}
        />
      </div>

        {/* Motivo de Emergencia */}
        <SearchableSelect
          label="Motivo de Emergencia"
          value={formData.motivoEmergenciaDisplay || ""}
          options={formatMotivos}
          loading={false}
          search={searchMotivo}
          onSearchChange={(v: string) => {
            setSearchMotivo(v);
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
          disabled={disabled}
        />

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
