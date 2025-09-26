"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { usePatientData, useFetchPatientData } from "@/contexts/PatientDataContext";
import { usePatientAccount } from "@/contexts/PatientAccountContext";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Search, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { FormActionsEmergency } from "../register/FormActionsEmergency";
import { useMotivosEmergencia } from "@/contexts/MotivosEmergenciaContext";
import { useConsultorios } from "@/contexts/ConsultoriosContext";
import { useFormasIngreso } from "@/contexts/FormasIngresoContext";
import { useSeguros } from "@/contexts/SegurosContext";

// Componentes modulares para emergencia
import { PatientSectionEmergency } from './PatientSectionEmergency'
import { AdditionalViewFieldsSection } from './AdditionalViewFieldsSection'
import { FormHeaderEmergency } from '../register/FormHeaderEmergency'
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
  onError?: (error: string) => void;
}

export const EmergencySectionView: React.FC<EmergencySectionViewProps> = ({
  emergencyId,
  initialData,
  readOnly,
  onSave,
  onError,
}) => {
  const router = useRouter();
  
  // Obtener el patientId desde los datos iniciales
  const patientId = initialData?.PACIENTE;
  
  // Usar el contexto de datos del paciente
  const { getPatientData } = usePatientData();
  const { fetchPatientData, isLoading: patientDataLoading } = useFetchPatientData(patientId);
  
  // Usar el contexto de cuenta del paciente
  const { fetchPatientAccountBySeguro } = usePatientAccount();

  // ===== Estados locales =====
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  type FormDataType = {
    tipoAtencion: string;
    condicionPaciente: string;
    motivoEmergencia: string;
    motivoEmergenciaDisplay?: string;
    consultorio: string;
    consultorioDisplay?: string;
    formaIngreso: string;
    formaIngresoDisplay?: string;
    seguro: string;
    seguroDisplay?: string;
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
    motivoEmergenciaDisplay: "",
    consultorio: "",
    consultorioDisplay: "",
    formaIngreso: "",
    formaIngresoDisplay: "",
    seguro: "",
    seguroDisplay: "",
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

  // Función para verificar si es PAGANTE o SOAT
  const isPaganteOrSoat = useCallback((seguroLiq?: string): boolean => {
    if (!seguroLiq) return false;
    const seguroCode = seguroLiq.trim();
    
    const isPagante = seguroCode === '0' || seguroCode === '00' || 
                     seguroCode.startsWith('(0)') || seguroCode.startsWith('(00)') ||
                     seguroCode.includes('PAGANTE');
    const isSoat = seguroCode === '02' || seguroCode.startsWith('(02)') || 
                  seguroCode.includes('SOAT');
    
    return isPagante || isSoat;
  }, []);

  // Función para verificar si es SIS
  const isSIS = useCallback((seguroLiq?: string): boolean => {
    if (!seguroLiq) return false;
    const seguroCode = seguroLiq.trim();
    
    // Códigos de seguro SIS
    const sisInsuranceCodes = ['20', '21', '22', '23', '24', '25', '01'];
    
    return sisInsuranceCodes.includes(seguroCode) || 
           seguroCode.startsWith('(01)') || 
           sisInsuranceCodes.some(code => seguroCode.startsWith(`(${code})`)) || 
           seguroCode.includes('SIS');
  }, []);

  // Función para verificar si permite edición especial (solo condición del paciente)
  const allowsSpecialEdit = useCallback((): boolean => {
    const estado = initialData?.ESTADO;
    const seguroLiq = initialData?.SEGUROLIQ;
    
    // Permitir edición especial para PAGANTE/SOAT en cualquier estado
    const isPagOrSoat = isPaganteOrSoat(seguroLiq);
    
    // Para PAGANTE/SOAT, permitir edición especial sin importar el estado
    return isPagOrSoat;
  }, [initialData?.ESTADO, initialData?.SEGUROLIQ, isPaganteOrSoat]);

  // Función para verificar si un campo específico debe estar habilitado
  const isFieldEnabled = useCallback((fieldName: string): boolean => {
    // Si está eliminado, no permitir edición
    if (isDeleted) return false;
    
    const estado = initialData?.ESTADO;
    const seguroLiq = initialData?.SEGUROLIQ;
    
    // Caso especial: ESTADO='2' para SOAT o SIS - permitir editar todo excepto consultorio
    if (estado === '2' && (isPaganteOrSoat(seguroLiq) || isSIS(seguroLiq))) {
      // Para consultorio, siempre bloqueado
      if (fieldName === 'consultorio') return false;
      
      // Para los demás campos, permitir edición
      return true;
    }
    
    // Si permite edición especial (PAGANTE/SOAT en otros estados)
    if (allowsSpecialEdit() && estado !== '2') {
      return fieldName === 'seguroLiq';
    }
    
    // Si está en modo readOnly completo, no permitir edición
    if (readOnly) return false;
    
    // Para otros casos, usar la lógica normal de fieldsLocked
    return !fieldsLocked;
  }, [readOnly, isDeleted, allowsSpecialEdit, fieldsLocked, initialData?.ESTADO, initialData?.SEGUROLIQ, isPaganteOrSoat, isSIS]);

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
  const { motivosEmergencia: motivos, loading: loadingMotivos } = useMotivosEmergencia();
  const { consultorios, loading: loadingConsultorios } = useConsultorios();
  const { formasIngreso, loading: loadingFormas } = useFormasIngreso();
  const { seguros, loading: loadingSeguros } = useSeguros();

  // ===== Loading =====
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  // ===== Cargas remotas - Ya no necesarias porque usamos contextos =====
  const loadMotivos = async (search: string = "") => {
    // Ya no hacemos llamadas directas porque usamos el contexto
    console.log('🚨 loadMotivos llamado - usando contexto en su lugar');
    console.log('📋 Motivos disponibles desde contexto:', motivos?.length || 0);
  };

  const loadConsultorios = async (search: string = "") => {
    // Ya no hacemos llamadas directas porque usamos el contexto
    console.log('🚨 loadConsultorios llamado - usando contexto en su lugar');
    console.log('🏥 Consultorios disponibles desde contexto:', consultorios?.length || 0);
  };

  const loadFormasIngreso = async (search: string = "") => {
    // Ya no hacemos llamadas directas porque usamos el contexto
    console.log('🚨 loadFormasIngreso llamado - usando contexto en su lugar');
    console.log('🚪 Formas de ingreso disponibles desde contexto:', formasIngreso?.length || 0);
  };

  const loadSeguros = async (search: string = "") => {
    // Ya no hacemos llamadas directas porque usamos el contexto
    console.log('🚨 loadSeguros llamado - usando contexto en su lugar');
    console.log('🛡️ Seguros disponibles desde contexto:', seguros?.length || 0);
  };

  // Cargar datos iniciales
  useEffect(() => {
    if (initialData) {
      if (process.env.NODE_ENV === 'development') {
        console.log('Cargando datos iniciales:', initialData);
      }
      
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
      
      if (process.env.NODE_ENV === 'development') {
        console.log('Datos originales:', {
          MOTIVO_EMERGENCIA: initialData.MOTIVO_EMERGENCIA,
          CONSULTORIO: initialData.CONSULTORIO,
          FORMA_INGRESO: initialData.FORMA_INGRESO,
          SEGURO: initialData.SEGURO
        });
      }
      
      setFormData({
        tipoAtencion: cleanApiString(initialData.TIPOATENCION),
        condicionPaciente: cleanApiString(initialData.ESTADO_PACIENTE),
        motivoEmergencia: extractCode(initialData.MOTIVO_EMERGENCIA),
        motivoEmergenciaDisplay: initialData.MOTIVO_DESCRIPCION ? 
          `(${extractCode(initialData.MOTIVO_EMERGENCIA)}) - ${initialData.MOTIVO_DESCRIPCION}` : '',
        consultorio: extractCode(initialData.CONSULTORIO),
        consultorioDisplay: initialData.CONSULTORIO_DESCRIPCION ? 
          `(${extractCode(initialData.CONSULTORIO)}) - ${initialData.CONSULTORIO_DESCRIPCION}` : '',
        formaIngreso: extractCode(initialData.FORMA_INGRESO),
        formaIngresoDisplay: initialData.FORMA_INGRESO_DESCRIPCION ? 
          `(${extractCode(initialData.FORMA_INGRESO)}) - ${initialData.FORMA_INGRESO_DESCRIPCION}` : '',
        // Usar SEGUROLIQ en lugar de SEGURO para la condición del paciente
        seguro: extractCode(initialData.SEGUROLIQ || initialData.SEGURO),
        seguroDisplay: initialData.SEGUROLIQ_NOMBRE ? 
          `(${extractCode(initialData.SEGUROLIQ)}) - ${initialData.SEGUROLIQ_NOMBRE}` : 
          (initialData.SEGURO_NOMBRE ? `(${extractCode(initialData.SEGURO)}) - ${initialData.SEGURO_NOMBRE}` : ''),
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

    // Cargar datos desde contextos
    console.log('📊 Datos disponibles desde contextos:');
    console.log('  - Motivos:', motivos?.length || 0);
    console.log('  - Consultorios:', consultorios?.length || 0);
    console.log('  - Formas de ingreso:', formasIngreso?.length || 0);
    console.log('  - Seguros:', seguros?.length || 0);
  }, [motivos, consultorios, formasIngreso, seguros]);

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
  const handleFormChange = async (field: string, value: string) => {
    if (process.env.NODE_ENV === 'development' && field === 'seguroLiq') {
      console.log(`handleFormChange - Campo: ${field}, Valor: ${value}`);
    }
    
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

    // Si se cambió el tipo de seguro, buscar cuenta correspondiente usando el contexto
    if (field === 'seguroLiq' && value && initialData?.PACIENTE) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`Cambio de seguro detectado - Paciente: ${initialData.PACIENTE}, Nuevo valor: ${value}`);
      }
      
      try {
        // Usar el contexto para buscar la cuenta por tipo de seguro
        const accountData = await fetchPatientAccountBySeguro(initialData.PACIENTE, value);
        
        if (accountData && accountData.cuentaId) {
          if (process.env.NODE_ENV === 'development') {
            console.log(`Cuenta encontrada: ${accountData.cuentaId}`);
          }
          // Actualizar tanto numeroCuenta como cuentaId en el formulario
          setFormData((prev: FormDataType) => ({
            ...prev,
            numeroCuenta: accountData.cuentaId,
            cuentaId: accountData.cuentaId,
          }));
          
          toast({
            title: 'Cuenta actualizada',
            description: `Se encontró y asignó la cuenta ${accountData.cuentaId} para el tipo de seguro seleccionado`,
          });
        } else {
          if (process.env.NODE_ENV === 'development') {
            console.log(`No se encontró cuenta para el seguro ${value}`);
          }
          // Establecer numeroCuenta como 'No disponible' si no se encuentra cuenta
          setFormData((prev: FormDataType) => ({
            ...prev,
            numeroCuenta: 'No disponible',
          }));
          
          toast({
            title: 'Cuenta no encontrada',
            description: `No se encontró una cuenta activa para el tipo de seguro seleccionado. Será necesario crear una nueva cuenta.`,
            variant: 'destructive',
          });
        }
      } catch (error) {
        console.error('Error al buscar cuenta por seguro:', error);
        toast({
          title: 'Error',
          description: 'Error al buscar cuenta por tipo de seguro',
          variant: 'destructive',
        });
      }
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
      
      if (process.env.NODE_ENV === 'development') {
        console.log('Formato de fecha:', {
          original: formData.fecha,
          paraPrisma: formattedDate
        });
      }
      
      // Función auxiliar para limitar la longitud de los campos
      const limitLength = (value: string | null | undefined, maxLength: number): string => {
        if (value === null || value === undefined) return '';
        return String(value).substring(0, maxLength);
      };
      
      // Verificar si es PAGANTE o SOAT para bypass de validación de cuenta
      const paganteOrSoatInsuranceCodes = ['0', '00', '02'];
      const isPayingOrSoat = Boolean(formData.seguroLiq && paganteOrSoatInsuranceCodes.includes(formData.seguroLiq.trim()));
      
      if (process.env.NODE_ENV === 'development') {
        console.log('Validación de cuenta:', {
          seguroLiq: formData.seguroLiq,
          isPayingOrSoat,
          numeroCuenta: formData.numeroCuenta
        });
      }
      
      // Validar que haya una cuenta válida antes de actualizar (excepto para PAGANTE y SOAT)
      if (!isPayingOrSoat && (!formData.numeroCuenta || formData.numeroCuenta === 'No disponible')) {
        toast({
          title: "Error de validación",
          description: "No se puede actualizar el registro sin una cuenta válida. Por favor, verifique que el tipo de seguro tenga una cuenta asociada.",
          variant: "destructive",
        });
        return;
      }

      // Preparar datos con longitudes limitadas según el esquema de la base de datos
      // IMPORTANTE: SEGURO debe ser igual a SEGUROLIQ
      const seguroLiqValue = limitLength(formData.seguroLiq, 3);
      
      // Verificar si el seguro ha cambiado para actualizar la cuenta
      const seguroOriginal = initialData?.SEGUROLIQ?.trim();
      const seguroNuevo = seguroLiqValue.trim();
      const seguroHaCambiado = seguroOriginal !== seguroNuevo;
      
      if (process.env.NODE_ENV === 'development') {
        console.log('Verificación de cambio de seguro:', {
          original: seguroOriginal,
          nuevo: seguroNuevo,
          haCambiado: seguroHaCambiado
        });
      }
      
      // Si el seguro ha cambiado y tenemos una cuenta válida, actualizar la tabla CUENTA
      // Para PAGANTE/SOAT, usar la cuenta original del registro si existe
      const cuentaParaActualizar = formData.numeroCuenta && formData.numeroCuenta !== 'No disponible' 
        ? formData.numeroCuenta 
        : initialData?.CUENTAID;
        
      if (seguroHaCambiado && cuentaParaActualizar && cuentaParaActualizar !== 'No disponible') {
        if (process.env.NODE_ENV === 'development') {
          console.log(`Actualizando cuenta ${cuentaParaActualizar} con nuevo seguro: ${seguroNuevo}`);
        }
        
        try {
          const cuentaResponse = await fetch(`/api/cuenta/update/${cuentaParaActualizar}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ seguro: seguroNuevo }),
          });
          
          if (!cuentaResponse.ok) {
            const errorData = await cuentaResponse.json();
            throw new Error(errorData.error || 'Error al actualizar la cuenta');
          }
          
          const cuentaResult = await cuentaResponse.json();
          if (process.env.NODE_ENV === 'development') {
            console.log('Cuenta actualizada exitosamente');
          }
          
          toast({
            title: 'Cuenta actualizada',
            description: `La cuenta se actualizó correctamente al nuevo tipo de seguro`,
          });
        } catch (cuentaError: any) {
          console.error('Error al actualizar cuenta:', cuentaError);
          toast({
            title: 'Advertencia',
            description: `Error al actualizar la cuenta: ${cuentaError.message}`,
            variant: 'destructive',
          });
          // Continuar con la actualización de la emergencia aunque falle la cuenta
        }
      }
      
      const updateData = {
        TIPOATENCION: limitLength(formData.tipoAtencion, 1),          // Char(1)
        MOTIVO_EMERGENCIA: limitLength(formData.motivoEmergencia, 2),  // Char(2)
        CONSULTORIO: limitLength(formData.consultorio, 6),            // Char(6)
        FORMA_INGRESO: limitLength(formData.formaIngreso, 1),         // Char(1)
        SEGURO: seguroLiqValue,                                       // Char(3) - Igual a SEGUROLIQ
        SEGUROLIQ: seguroLiqValue,                                    // Char(3)
        OBSERVACION1: limitLength(formData.observacion1, 100),         // Estimado VarChar(100)
        OBSERVACION2: limitLength(formData.observacion2, 100),         // Estimado VarChar(100)
        ACOMPANANTE: limitLength(formData.acompanante, 100),          // VarChar(100)
        TIPO_DOCUMENTOA: limitLength(formData.tipoDocumentoA, 2),     // Char(2)
        DOCUMENTOA: limitLength(formData.documentoA, 15),             // Char(15)
        FECHA: formattedDate,                                         // DateTime
        HORA: limitLength(formData.hora, 5),                          // Char(5)
      };
      
      // Log para verificar que SEGURO = SEGUROLIQ
      if (process.env.NODE_ENV === 'development') {
        console.log('Datos de actualización:', {
          SEGURO: updateData.SEGURO,
          SEGUROLIQ: updateData.SEGUROLIQ,
          sonIguales: updateData.SEGURO === updateData.SEGUROLIQ,
          longitudes: Object.fromEntries(
            Object.entries(updateData)
              .filter(([_, v]) => typeof v === 'string')
              .map(([k, v]) => [k, `${(v as string).length} caracteres`])
          )
        });
      }
      
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
        if (process.env.NODE_ENV === 'development') {
          console.log('Redirigiendo a lista de emergencias del paciente:', initialData.PACIENTE);
        }
        router.push(`/emergency/${initialData.PACIENTE}`);
      } else if (patientData && patientData.PACIENTE) {
        if (process.env.NODE_ENV === 'development') {
          console.log('Redirigiendo a lista de emergencias (usando patientData):', patientData.PACIENTE);
        }
        router.push(`/emergency/${patientData.PACIENTE}`);
      } else {
        // Si no se encuentra el ID del paciente, volver a la página anterior
        if (process.env.NODE_ENV === 'development') {
          console.log('No se encontró ID del paciente, volviendo atrás');
        }
        router.back();
      }
    } catch (error: any) {
      const errorMessage = error.message || "Error al guardar los cambios";
      
      // Call onError if provided (for modal integration)
      if (onError) {
        onError(errorMessage);
      } else {
        // Default toast if no onError handler
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      }
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
                disabled={!isFieldEnabled('fecha')}
                validationErrors={validationErrors}
                patientId={initialData?.PACIENTE}
                onFormChange={handleFormChange}
                cuentaId={formData.numeroCuenta}
                emergencyCuentaId={initialData?.CUENTAID}
                isViewMode={true}
              />
              
              {/* Campos Adicionales */}
              <AdditionalViewFieldsSection
                formData={formData}
                onFormChange={handleFormChange}
                validationErrors={validationErrors}
                disabled={!isFieldEnabled('patientSection')}
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
                    disabled={!isFieldEnabled('tipoAtencion')}
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
                    disabled={!isFieldEnabled('formaIngreso')}
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
                    disabled={!isFieldEnabled('seguroLiq')}
                  />
                </div>

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
                    disabled={!isFieldEnabled('motivoEmergencia')}
                  />


                {/* Observaciones */}
                <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="observacion1">Observaciones</Label>
                    <Textarea
                      id="observacion1"
                      value={formData.observacion1 || ""}
                      onChange={(e) => handleFormChange("observacion1", e.target.value)}
                      disabled={!isFieldEnabled('observacion1')}
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
                    isEditable={!readOnly || allowsSpecialEdit()}
                    patientId={initialData?.PACIENTE}
                    isUpdate={true}
                    formData={formData}
                    insuranceCode={formData.seguroLiq}
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
