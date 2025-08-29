"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { usePatientData, useFetchPatientData } from "@/contexts/PatientDataContext";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Search, ChevronDown, ChevronUp, Save, Trash2, X, Loader2, AlertCircle } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { FormActionsEmergency } from "../register/FormActionsEmergency";

// Componentes modulares para emergencia
import { PatientSectionEmergency } from './PatientSectionEmergency'
import { EmergencySection } from '../register/EmergencySection'
import { AdditionalViewFieldsSection } from './AdditionalViewFieldsSection'
import { FormHeaderEmergency } from '../register/FormHeaderEmergency'
import { validateEmergencyForm } from '../register/FormValidatorEmergency'
import { Card, CardContent } from '@/components/ui/card'

interface OptionItem {
  value: string;
  display: string;
  description?: string;
  data: any;
}

interface EmergencySectionViewProps {
  emergencyId: string;
  initialData: any;
  readOnly: boolean;
  onSave?: (data: any) => void;
}

export const EmergencySectionView: React.FC<EmergencySectionViewProps> = ({
  emergencyId,
  initialData,
  readOnly,
  onSave,
}) => {
  const router = useRouter();
  
  // Obtener el patientId desde los datos iniciales
  const patientId = initialData?.PACIENTE;
  
  // Usar el contexto de datos del paciente
  const { getPatientData } = usePatientData();
  const { fetchPatientData, isLoading: patientDataLoading } = useFetchPatientData(patientId);

  // ===== Estados locales =====
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  type FormDataType = {
    tipoAtencion: string;
    condicionPaciente: string;
    motivoEmergencia: string;
    consultorio: string;
    formaIngreso: string;
    seguro: string;
    seguroLiq: string;
    observacion1: string;
    observacion2: string;
    // Datos del acompañante
    acompanante: string;
    tipoDocumentoA: string;
    documentoA: string;
    // Otros campos
    fecha: string;
    hora: string;
    estado: string;
    numeroCuenta: string;
  };
  
  const [formData, setFormData] = useState<FormDataType>({
    tipoAtencion: "",
    condicionPaciente: "",
    motivoEmergencia: "",
    consultorio: "",
    formaIngreso: "",
    seguro: "",
    seguroLiq: "",
    observacion1: "",
    observacion2: "",
    // Datos del acompañante
    acompanante: "",
    tipoDocumentoA: "",
    documentoA: "",
    // Otros campos
    fecha: "",
    hora: "",
    estado: "",
    numeroCuenta: "",
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [patientData, setPatientData] = useState<any>(null);
  const [fieldsLocked, setFieldsLocked] = useState(readOnly);
  const isDeleted = initialData?.ESTADO === "0";

  // Actualizar fieldsLocked cuando cambie readOnly
  useEffect(() => {
    setFieldsLocked(readOnly);
  }, [readOnly]);

  // Cargar datos de filiación del paciente para el modo view
  useEffect(() => {
    const loadPatientData = async () => {
      if (patientId) {
        try {
          // Primero verificar si ya tenemos los datos en el contexto
          const existingData = getPatientData(patientId);
          if (existingData) {
            setPatientData(existingData);
            return;
          }

          // Si no están en el contexto, cargar desde la API
          const fetchedData = await fetchPatientData();
          if (fetchedData) {
            setPatientData(fetchedData);
          }
        } catch (error) {
          console.error('Error loading patient data:', error);
        }
      }
    };

    loadPatientData();
  }, [patientId, getPatientData, fetchPatientData]);

  // ===== Opciones locales =====
  const TIPO_ATENCION_OPTIONS = [
    { value: "E", display: "(E) - Emergencia" },
    { value: "U", display: "(U) - Urgencias" },
  ];

  const CONDICION_PACIENTE_OPTIONS = [
    { value: "CRITICO", display: "Crítico" },
    { value: "GRAVE", display: "Grave" },
    { value: "ESTABLE", display: "Estable" },
  ];

  // ===== Estados remotos =====
  const [motivos, setMotivos] = useState<any[]>([]);
  const [consultorios, setConsultorios] = useState<any[]>([]);
  const [formasIngreso, setFormasIngreso] = useState<any[]>([]);
  const [seguros, setSeguros] = useState<any[]>([]);

  // ===== Loading =====
  const [loadingMotivos, setLoadingMotivos] = useState(false);
  const [loadingConsultorios, setLoadingConsultorios] = useState(false);
  const [loadingFormas, setLoadingFormas] = useState(false);
  const [loadingSeguros, setLoadingSeguros] = useState(false);

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
    try {
      setLoadingMotivos(true);
      const res = await fetch(
        `/api/motivo-emergencia?search=${encodeURIComponent(search)}`
      );
      if (!res.ok) throw new Error(String(res.status));
      const json = await res.json();
      const items = json.items ?? json.data ?? [];
      const filtered = items.filter((x: any) => !("ACTIVO" in x) || x.ACTIVO === "1");
      setMotivos(filtered);
    } catch (e) {
      console.error("Error motivos:", e);
      setMotivos([]);
    } finally {
      setLoadingMotivos(false);
    }
  };

  const loadConsultorios = async (search: string = "") => {
    try {
      setLoadingConsultorios(true);
      const res = await fetch(
        `/api/consultorio?tipo=E&search=${encodeURIComponent(search)}`
      );
      if (!res.ok) throw new Error(String(res.status));
      const json = await res.json();
      const items = json.items ?? json.data ?? [];
      setConsultorios(items);
    } catch (e) {
      console.error("Error consultorios:", e);
      setConsultorios([]);
    } finally {
      setLoadingConsultorios(false);
    }
  };

  const loadFormasIngreso = async (search: string = "") => {
    try {
      setLoadingFormas(true);
      const res = await fetch(
        `/api/forma-ingreso?search=${encodeURIComponent(search)}`
      );
      if (!res.ok) throw new Error(String(res.status));
      const json = await res.json();
      const items = json.items ?? json.data ?? [];
      const filtered = items.filter((x: any) => !("ACTIVO" in x) || x.ACTIVO === "1");
      setFormasIngreso(filtered);
    } catch (e) {
      console.error("Error formas ingreso:", e);
      setFormasIngreso([]);
    } finally {
      setLoadingFormas(false);
    }
  };

  const loadSeguros = async (search: string = "") => {
    try {
      setLoadingSeguros(true);
      const res = await fetch(
        `/api/seguros${search ? `?search=${encodeURIComponent(search)}` : ''}`
      );
      if (!res.ok) throw new Error(String(res.status));
      const json = await res.json();
      const items = Array.isArray(json) ? json : (json.items ?? json.data ?? []);
      setSeguros(items);
    } catch (e) {
      console.error("Error seguros:", e);
      setSeguros([]);
    } finally {
      setLoadingSeguros(false);
    }
  };

  // Cargar datos iniciales
  useEffect(() => {
    if (initialData) {
      console.log('Cargando datos iniciales:', initialData);
      
      // Función para limpiar strings de la API
      const cleanApiString = (value: string | null | undefined): string => {
        if (value === null || value === undefined) return "";
        return String(value).trim();
      };
      
      // Función para extraer el código de un campo con formato "CODIGO  "
      const extractCode = (value: string | null | undefined): string => {
        if (value === null || value === undefined) return "";
        // Convertir a string y eliminar espacios al inicio y final
        const trimmed = String(value).trim();
        // Preservar el código exactamente como viene, incluyendo ceros iniciales
        return trimmed;
      };
      
      console.log('MOTIVO_EMERGENCIA original:', initialData.MOTIVO_EMERGENCIA);
      console.log('CONSULTORIO original:', initialData.CONSULTORIO);
      console.log('FORMA_INGRESO original:', initialData.FORMA_INGRESO);
      console.log('SEGURO original:', initialData.SEGURO);
      
      setFormData({
        tipoAtencion: cleanApiString(initialData.TIPOATENCION),
        condicionPaciente: cleanApiString(initialData.ESTADO_PACIENTE),
        motivoEmergencia: extractCode(initialData.MOTIVO_EMERGENCIA),
        consultorio: extractCode(initialData.CONSULTORIO),
        formaIngreso: extractCode(initialData.FORMA_INGRESO),
        seguro: extractCode(initialData.SEGURO),
        seguroLiq: extractCode(initialData.SEGUROLIQ),
        observacion1: cleanApiString(initialData.OBSERVACION1),
        observacion2: cleanApiString(initialData.OBSERVACION2),
        // Datos del acompañante
        acompanante: cleanApiString(initialData.ACOMPANANTE),
        tipoDocumentoA: cleanApiString(initialData.TIPO_DOCUMENTOA),
        documentoA: cleanApiString(initialData.DOCUMENTOA),
        // Otros campos
        fecha: initialData.FECHA ? new Date(initialData.FECHA).toISOString().split('T')[0] : '',
        hora: initialData.HORA || '',
        estado: initialData.ESTADO || '',
        numeroCuenta: initialData.CUENTAID || '',
      });
    }

    // Cargar catálogos para edición
    loadMotivos();
    loadConsultorios();
    loadFormasIngreso();
    loadSeguros();
  }, [initialData]);

  // Función para validar el formulario
  interface ValidationResult {
    [key: string]: string;
  }
  
  const validateEmergencyForm = (data: typeof formData): ValidationResult => {
    const errors: ValidationResult = {};
    
    if (!data.motivoEmergencia) errors.motivoEmergencia = "El motivo es requerido";
    if (!data.consultorio) errors.consultorio = "El consultorio es requerido";
    if (!data.formaIngreso) errors.formaIngreso = "La forma de ingreso es requerida";
    if (!data.seguro) errors.seguro = "El seguro es requerido";
    if (!data.seguroLiq) errors.seguroLiq = "El seguro liquidador es requerido";
    
    return errors;
  };

  // Manejar cambios en los campos del formulario
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev: FormDataType) => ({
      ...prev,
      [name]: value,
    }));
    
    // Limpiar errores de validación al cambiar el valor
    if (validationErrors[name]) {
      setValidationErrors((prevErrors) => {
        const newErrors = { ...prevErrors };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Manejar cambios en el formulario
  const handleFormChange = (field: string, value: string) => {
    setFormData((prev: FormDataType) => ({
      ...prev,
      [field]: value,
    }));

    // Limpiar error de validación si existe
    if (validationErrors[field]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Manejar eliminación lógica
  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      
      // Llamar a la API para actualizar el estado a 0 (eliminado lógicamente)
      const response = await fetch(`/api/emergencia/${emergencyId}/delete`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ESTADO: "0" }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al eliminar el registro');
      }
      
      const result = await response.json();
      
      // Si tenemos un ID de cuenta, también actualizamos la cuenta y el FUA asociado
      if (formData.numeroCuenta) {
        try {
          const cuentaResponse = await fetch(`/api/cuenta/update-with-fua/${formData.numeroCuenta}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            }
          });
          
          if (!cuentaResponse.ok) {
            console.error('Error al actualizar cuenta y FUA:', await cuentaResponse.text());
          } else {
            console.log('Cuenta y FUA actualizados correctamente');
          }
        } catch (cuentaError) {
          console.error('Error al actualizar cuenta y FUA:', cuentaError);
          // No lanzamos el error para no interrumpir el flujo principal
        }
      }
      
      toast({
        title: "Registro eliminado",
        description: "El registro ha sido eliminado correctamente",
      });
      
      // Redirigir al usuario a la lista de emergencias o al dashboard
      setTimeout(() => {
        if (initialData?.PACIENTE) {
          router.push(`/emergency/${initialData.PACIENTE}`);
        } else {
          router.push('/dashboard');
        }
      }, 1500);
      
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al eliminar el registro",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  // Manejar guardado de cambios
  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      // Validar datos antes de enviar
      const errors = validateEmergencyForm(formData);
      if (Object.keys(errors).length > 0) {
        setValidationErrors(errors as Record<string, string>);
        toast({
          title: "Error de validación",
          description: "Por favor complete todos los campos requeridos",
          variant: "destructive",
        });
        return;
      }
      
      // Preparar datos para enviar
      
      // Convertir la fecha a un objeto Date válido para Prisma
      let formattedDate;
      try {
        if (formData.fecha) {
          // La fecha viene en formato YYYY-MM-DD del input date
          const dateObj = new Date(formData.fecha);
          if (!isNaN(dateObj.getTime())) {
            // Crear una fecha ISO válida
            formattedDate = dateObj.toISOString();
          } else {
            // Si no es una fecha válida, usar la fecha original
            formattedDate = initialData.FECHA;
          }
        } else {
          // Si no hay fecha, mantener la original
          formattedDate = initialData.FECHA;
        }
      } catch (error) {
        console.error('Error al formatear la fecha:', error);
        formattedDate = initialData.FECHA;
      }
      
      console.log('Formato de fecha original:', formData.fecha);
      console.log('Formato de fecha para Prisma:', formattedDate);
      
      // Función auxiliar para limitar la longitud de los campos
      const limitLength = (value: string | null | undefined, maxLength: number): string => {
        if (value === null || value === undefined) return '';
        return String(value).substring(0, maxLength);
      };
      
      // Preparar datos con longitudes limitadas según el esquema de la base de datos
      const updateData = {
        TIPOATENCION: limitLength(formData.tipoAtencion, 1),          // Char(1)
        MOTIVO_EMERGENCIA: limitLength(formData.motivoEmergencia, 2),  // Char(2)
        CONSULTORIO: limitLength(formData.consultorio, 6),            // Char(6)
        FORMA_INGRESO: limitLength(formData.formaIngreso, 1),         // Char(1)
        SEGURO: limitLength(formData.seguro, 3),                      // Char(3)
        SEGUROLIQ: limitLength(formData.seguroLiq, 3),                // Char(3)
        OBSERVACION1: limitLength(formData.observacion1, 100),         // Estimado VarChar(100)
        OBSERVACION2: limitLength(formData.observacion2, 100),         // Estimado VarChar(100)
        ACOMPANANTE: limitLength(formData.acompanante, 100),          // VarChar(100)
        TIPO_DOCUMENTOA: limitLength(formData.tipoDocumentoA, 2),     // Char(2)
        DOCUMENTOA: limitLength(formData.documentoA, 15),             // Char(15)
        FECHA: formattedDate,                                         // DateTime
        HORA: limitLength(formData.hora, 5),                          // Char(5)
      };
      
      // Log de longitudes para depuración
      console.log('Longitudes de campos enviados:');
      Object.entries(updateData).forEach(([key, value]) => {
        if (typeof value === 'string') {
          console.log(`${key}: ${value.length} caracteres - Valor: "${value}"`);
        }
      });
      
      console.log('Enviando datos:', updateData);
      
      // Llamar a la API para actualizar
      const response = await fetch(`/api/emergencia/${emergencyId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al actualizar los datos');
      }
      
      const result = await response.json();
      
      toast({
        title: "Datos actualizados",
        description: "Los datos de emergencia se han actualizado correctamente",
      });
      
      // Notificar al componente padre
      if (onSave) {
        onSave(result.data);
      }
      
      // Redirigir a la lista de emergencias del paciente
      if (initialData && initialData.PACIENTE) {
        console.log('Redirigiendo a la lista de emergencias del paciente:', initialData.PACIENTE);
        router.push(`/emergency/${initialData.PACIENTE}`);
      } else if (patientData && patientData.PACIENTE) {
        console.log('Redirigiendo a la lista de emergencias del paciente (usando patientData):', patientData.PACIENTE);
        router.push(`/emergency/${patientData.PACIENTE}`);
      } else {
        // Si no se encuentra el ID del paciente, volver a la página anterior
        console.log('No se encontró ID del paciente, volviendo a la página anterior');
        router.back();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al guardar los cambios",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

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
    disabled = false,
  }: any) => (
    <div className="space-y-2 searchable-select-root">
      <Label>
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      <div className="relative">
        <Button
          type="button"
          variant="outline"
          className={`w-full justify-between font-normal md:text-sm ${
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
          <div className="absolute z-50 mt-1 w-full bg-white border rounded-md shadow-lg">
            <div className="p-2 border-b">
              <div className="flex items-center px-3 py-2 border rounded-md">
                <Search className="h-4 w-4 mr-2 text-gray-400" />
                <input
                  type="text"
                  className="w-full bg-transparent outline-none text-sm md:text-sm"
                  placeholder="Buscar..."
                  value={search}
                  onChange={(e) => onSearchChange(e.target.value)}
                />
              </div>
            </div>
            <div className="max-h-60 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center p-4">
                  <Spinner size="sm" />
                </div>
              ) : options.length > 0 ? (
                options.map((option: OptionItem) => (
                  <button
                    key={option.value}
                    type="button"
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                    onClick={() => {
                      onSelect(option.value, option.data);
                      setOpenSelect(null);
                    }}
                  >
                    <div className="text-sm font-normal md:text-sm">{option.display}</div>
                    {option.description && (
                      <div className="text-xs text-gray-500 font-normal md:text-sm">
                        {option.description}
                      </div>
                    )}
                  </button>
                ))
              ) : (
                <div className="px-3 py-2 text-gray-500 text-sm font-normal md:text-sm">
                  No se encontraron resultados
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      {error && <p className="text-sm text-red-500 md:text-sm">{error}</p>}
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

  const formatCondicion = CONDICION_PACIENTE_OPTIONS
    .filter(
      (o) =>
        !searchCondicion ||
        o.display.toLowerCase().includes(searchCondicion.toLowerCase())
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
    return seguros
      .filter(
        (s) => !searchSeguro || s.Nombre?.toLowerCase().includes(searchSeguro.toLowerCase())
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

  // Función memoizada para encontrar el nombre de un motivo por su código
  const findMotivoName = useCallback((code: string) => {
    if (!code || !motivos.length) return code;
    
    // Asegurar que el código está correctamente formateado (mantener ceros iniciales)
    const paddedCode = code?.padStart(2, '0') || '';
    
    // Buscar primero con el código exacto
    let motivo = motivos.find(m => m.MOTIVO_EMERGENCIA === code);
    
    // Si no se encuentra, intentar con el código con padding
    if (!motivo && paddedCode !== code) {
      motivo = motivos.find(m => m.MOTIVO_EMERGENCIA === paddedCode);
    }
    
    // Si se encontró el motivo, mostrar con formato
    if (motivo) {
      return `(${motivo.MOTIVO_EMERGENCIA}) - ${motivo.NOMBRE}`;
    }
    
    // Si no se encuentra, devolver el código original
    return code;
  }, [motivos]);

  // Función memoizada para encontrar el nombre de un consultorio por su código
  const findConsultorioName = useCallback((code: string) => {
    if (!code || !consultorios.length) return code;
    
    // Buscar el consultorio por código
    const consultorio = consultorios.find(c => c.CONSULTORIO?.trim() === code?.trim());
    
    // Si se encuentra, mostrar con formato (código) - nombre
    if (consultorio) {
      return `(${consultorio.CONSULTORIO}) - ${consultorio.NOMBRE}`;
    }
    
    // Si no se encuentra, devolver el código original
    return code;
  }, [consultorios]);

  // Función memoizada para encontrar el nombre de una forma de ingreso por su código
  const findFormaIngresoName = useCallback((code: string) => {
    if (!code || !formasIngreso.length) return "No especificado";
    
    // Buscar la forma de ingreso por código
    const forma = formasIngreso.find(f => f.FORMA_INGRESO?.trim() === code?.trim());
    
    // Si se encuentra, mostrar con formato (código) - nombre
    if (forma) {
      return `(${forma.FORMA_INGRESO}) - ${forma.NOMBRE}`;
    }
    
    // Si no se encuentra pero tenemos un código, mostrar el código
    return `(${code}) - [Sin descripción]`;
  }, [formasIngreso]);

  // Función memoizada para encontrar el nombre de un seguro por su código
  const findSeguroName = useCallback((code: string) => {
    if (!code || !seguros.length) return "No especificado";
    
    // Buscar el seguro por código
    const seguro = seguros.find(s => s.Seguro?.trim() === code?.trim());
    
    // Si se encuentra, mostrar con formato (código) - nombre
    if (seguro) {
      return `(${seguro.Seguro}) - ${seguro.Nombre}`;
    }
    
    // Si no se encuentra pero tenemos un código, mostrar el código
    return `(${code}) - [Sin descripción]`;
  }, [seguros]);

  // Función para manejar los datos del paciente cargados desde PatientInfoCard
  
  const handlePatientDataLoaded = (data: any) => {
    // Check if we already have this data in context
    const existingData = getPatientData(initialData?.PACIENTE);
    if (!existingData) {
      setPatientData(data);
    } else {
      // Use data from context if available
      setPatientData(existingData);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h3 className={`text-lg font-semibold ${isDeleted ? 'text-gray-500' : ''}`}>
          Datos de la Emergencia {isDeleted && '(Eliminado)'}
        </h3>
      </div>
      
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Está seguro de eliminar este registro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no eliminará permanentemente el registro, pero lo marcará como eliminado y no estará disponible en las búsquedas regulares.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  <span>Eliminando...</span>
                </>
              ) : (
                "Eliminar"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className={`grid grid-cols-1 lg:grid-cols-3 gap-6 ${isDeleted ? 'opacity-70' : ''}`} data-testid="emergency-section-view">
        {/* Sidebar with Patient Information */}
        <div className="lg:col-span-1">
          <Card className="h-full">
            <CardContent className="p-6">
              <PatientSectionEmergency
                patientId={initialData?.PACIENTE}
                onPatientDataLoaded={handlePatientDataLoaded}
              />
            </CardContent>
          </Card>
        </div>
        
        {/* Main form content */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardContent className="p-6">
              {/* Form Header - Fecha, hora y número de cuenta */}
              <FormHeaderEmergency
                fecha={formData.fecha}
                hora={formData.hora}
                onFechaChange={(value) => handleFormChange('fecha', value)}
                onHoraChange={(value) => handleFormChange('hora', value)}
                disabled={fieldsLocked || readOnly}
                validationErrors={validationErrors}
                patientId={initialData?.PACIENTE}
                onFormChange={handleFormChange}
                emergencyCuentaId={initialData?.CUENTAID}
                isViewMode={true}
              />
              
              {/* Campos Adicionales */}
              <AdditionalViewFieldsSection
                formData={formData}
                onFormChange={handleFormChange}
                validationErrors={validationErrors}
                disabled={fieldsLocked || readOnly}
              />
              
              {/* Datos de la Emergencia - Custom dropdowns for view mode */}
              <div className="space-y-6 mt-8">
                <h3 className="text-lg font-semibold mb-4">Datos de la Emergencia</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Tipo de Atención */}
                  <SearchableSelect
                    label="Tipo Atención"
                    value={displayFrom(formatTipoAtencion, formData.tipoAtencion)}
                    options={formatTipoAtencion}
                    loading={false}
                    search={searchTipoAtencion}
                    onSearchChange={setSearchTipoAtencion}
                    onSelect={(value: string, data: any) => handleFormChange("tipoAtencion", value)}
                    selectName="tipoAtencion"
                    required
                    error={validationErrors.tipoAtencion}
                    placeholder="Seleccionar tipo de atención..."
                    disabled={fieldsLocked || readOnly}
                  />

                  {/* Motivo de Emergencia */}
                  <SearchableSelect
                    label="Motivo de Ingreso"
                    value={findMotivoName(formData.motivoEmergencia)}
                    options={formatMotivos}
                    loading={loadingMotivos}
                    search={searchMotivo}
                    onSearchChange={(v: string) => {
                      setSearchMotivo(v);
                      loadMotivos(v);
                    }}
                    onSelect={(value: string, data: any) => handleFormChange("motivoEmergencia", value)}
                    selectName="motivo"
                    required
                    error={validationErrors.motivoEmergencia}
                    placeholder="Seleccionar motivo..."
                    disabled={fieldsLocked || readOnly}
                  />

                  {/* Consultorio */}
                  <SearchableSelect
                    label="Consultorio"
                    value={findConsultorioName(formData.consultorio)}
                    options={formatConsultorios}
                    loading={loadingConsultorios}
                    search={searchConsultorio}
                    onSearchChange={(v: string) => {
                      setSearchConsultorio(v);
                      loadConsultorios(v);
                    }}
                    onSelect={(value: string, data: any) => handleFormChange("consultorio", value)}
                    selectName="consultorio"
                    required
                    error={validationErrors.consultorio}
                    placeholder="Seleccionar consultorio..."
                    disabled={true}
                  />

                  {/* Forma de Ingreso */}
                  <SearchableSelect
                    label="Forma de Ingreso"
                    value={findFormaIngresoName(formData.formaIngreso)}
                    options={formatFormas}
                    loading={loadingFormas}
                    search={searchForma}
                    onSearchChange={(v: string) => {
                      setSearchForma(v);
                      loadFormasIngreso(v);
                    }}
                    onSelect={(value: string, data: any) => handleFormChange("formaIngreso", value)}
                    selectName="formaIngreso"
                    required
                    error={validationErrors.formaIngreso}
                    placeholder="Seleccionar forma de ingreso..."
                    disabled={fieldsLocked || readOnly}
                  />

                  {/* Seguro */}
                  <SearchableSelect
                    label="Condición del Paciente"
                    value={findSeguroName(formData.seguroLiq)}
                    options={formatSeguros}
                    loading={loadingSeguros}
                    search={searchSeguro}
                    onSearchChange={(v: string) => {
                      setSearchSeguro(v);
                      loadSeguros(v);
                    }}
                    onSelect={(value: string, data: any) => handleFormChange("seguroLiq", value)}
                    selectName="seguroLiq"
                    required
                    error={validationErrors.seguroLiq}
                    placeholder="Seleccionar seguro..."
                    disabled={true}
                  />
                </div>

                {/* Observaciones */}
                <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="observacion1">Observaciones</Label>
                    <Textarea
                      id="observacion1"
                      value={formData.observacion1 || ""}
                      onChange={(e) => handleFormChange("observacion1", e.target.value)}
                      disabled={fieldsLocked || readOnly}
                      placeholder="Observaciones adicionales..."
                      rows={3}
                      className="md:text-sm"
                    />
                  </div>
                </div>
                
                {/* Form Actions - Botones de guardar y cancelar */}
                {!isDeleted && (
                  <FormActionsEmergency
                    onSave={handleSave}
                    onCancel={() => router.back()}
                    submitting={isSaving}
                    isEditable={!readOnly}
                    patientId={initialData?.PACIENTE}
                    isUpdate={true}
                    formData={formData}
                    insuranceCode={formData.seguro}
                  />
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EmergencySectionView;
