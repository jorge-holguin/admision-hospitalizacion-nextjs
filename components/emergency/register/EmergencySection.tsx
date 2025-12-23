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
  
  // Ya no necesitamos estados internos porque usamos contextos
  const internalMotivos: any[] = [];
  const internalFormasIngreso: any[] = [];
  const internalLoadingMotivos = false;
  const internalLoadingFormas = false;
  
  // Use preloaded options if available, otherwise use context
  const motivos = preloadedMotivos || contextMotivos || [];
  const consultorios = preloadedConsultorios || contextConsultorios || [];
  const formasIngreso = preloadedFormasIngreso || contextFormasIngreso || [];
  const seguros = preloadedSeguros || contextSeguros || [];
  
  // Use loading states from props or context
  const effectiveLoadingMotivos = propLoadingMotivos !== undefined ? propLoadingMotivos : contextLoadingMotivos;
  const effectiveLoadingConsultorios = propLoadingConsultorios !== undefined ? propLoadingConsultorios : contextLoadingConsultorios;
  const effectiveLoadingFormas = propLoadingFormas !== undefined ? propLoadingFormas : contextLoadingFormasIngreso;
  const effectiveLoadingSeguros = propLoadingSeguros !== undefined ? propLoadingSeguros : contextLoadingSeguros;

  // ===== Búsquedas =====
  const [searchTipoAtencion, setSearchTipoAtencion] = useState("");
  const [searchCondicion, setSearchCondicion] = useState("");
  const [searchMotivo, setSearchMotivo] = useState("");
  const [searchConsultorio, setSearchConsultorio] = useState("");
  const [searchForma, setSearchForma] = useState("");
  const [searchSeguro, setSearchSeguro] = useState("");

  // No need for dropdown management as it's handled in the SearchableSelect component

  // ===== Ya no necesitamos cargas remotas, usamos contextos =====
  const loadMotivos = async (search: string = "") => {
    // Esta función ya no hace nada, solo muestra logs
    console.log('📊 Usando motivos desde contexto:', contextMotivos?.length || 0);
  };

  // Ya no necesitamos cargar consultorios manualmente, usamos el contexto
  const loadConsultorios = async (search: string = "") => {
    // Esta función ya no hace nada, solo muestra logs
    console.log('🏥 Usando consultorios desde contexto:', contextConsultorios?.length || 0);
  };

  const loadFormasIngreso = async (search: string = "") => {
    // Esta función ya no hace nada, solo muestra logs
    console.log('🚪 Usando formas de ingreso desde contexto:', contextFormasIngreso?.length || 0);
  };

  const loadSeguros = async (search: string = "") => {
    // Esta función ya no hace nada, solo muestra logs
    console.log('🛡️ Usando seguros desde contexto:', contextSeguros?.length || 0);
  };

  useEffect(() => {
  }, [contextMotivos, contextFormasIngreso, contextConsultorios, contextSeguros]);
  
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
    
    // CASO ESPECIAL: Si el seguro es 06 (ESSALUD), cambiarlo automáticamente a 0 (PAGANTE)
    if (seguroCode === '06') {
      
      // Find PAGANTE in the list of available insurance options
      const paganteSeguro = seguros.find(s => 
        (s.Seguro && s.Seguro.trim() === '0') || 
        (s.SEGURO && s.SEGURO.trim() === '0')
      );
      
      if (paganteSeguro) {
        seguroCode = '0';
        const seguroDisplay = `(${paganteSeguro.Seguro || paganteSeguro.SEGURO}) - ${paganteSeguro.Nombre || paganteSeguro.NOMBRE}`;
        onFormChange("seguroDisplay", seguroDisplay);
      } else {
        // If PAGANTE not found in the list, use basic info
        seguroCode = '0';
        const seguroDisplay = "(0) - PAGANTE";
        onFormChange("seguroDisplay", seguroDisplay);
      }
    } else {
      // For other insurance types, use selected values
      const seguroDisplay = `(${seguroCode}) - ${patientData.descSeguro}`;
      onFormChange("seguroDisplay", seguroDisplay);
    }
    
    onFormChange("seguro", seguroCode);
    onSeguroChange(seguroCode, { 
      Seguro: seguroCode, 
      Nombre: patientData.descSeguro
    });
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

  // Seguros excluidos para emergencias: 05 (Crédito Paciente) y 16 (Interconsulta)
  const SEGUROS_EXCLUIDOS_EMERGENCIA = ['05', '16'];
  
  const formatSeguros = useMemo(() => {
    return seguros
      .filter(
        (s) => {
          // Excluir seguros no permitidos en emergencias
          const seguroCode = s.Seguro?.toString().trim() || '';
          if (SEGUROS_EXCLUIDOS_EMERGENCIA.includes(seguroCode)) return false;
          
          if (!searchSeguro) return true;
          
          const searchLower = searchSeguro.toLowerCase();
          
          // Search in name
          if (s.Nombre?.toLowerCase().includes(searchLower)) return true;
          
          // Search in code - handle different formats
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
      <h2 className="text-lg font-semibold mb-4">Datos de la Emergencia</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-100 p-4 rounded-lg border border-gray-200">
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
          onSearchChange={(v: string) => setSearchForma(v)}
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
          onSearchChange={(v: string) => setSearchSeguro(v)}
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

        {/* Motivo de Emergencia */}
        <SearchableSelect
          label="Motivo de Emergencia"
          value={formData.motivoEmergenciaDisplay || ""}
          options={formatMotivos}
          loading={effectiveLoadingMotivos}
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
      </div>

      {/* Observaciones */}
      <div className="grid grid-cols-1 md:grid-cols-1 gap-4 bg-gray-100 p-4 rounded-lg border border-gray-200">
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
