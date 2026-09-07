"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { ToggleSwitch } from "@/components/ui/toggle-switch"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Home, Loader2, Search, Siren, CheckCircle, UserPlus, MoreVertical, Edit, Trash2, Eye, Ban } from "lucide-react"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Navbar } from "@/components/Navbar"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { useRouter } from "@/lib/router"
import { useLocation } from "react-router-dom"
import { SISVerification, SISVerificationResult } from "@/components/dashboard/SISVerification"
import { usePatient } from "@/contexts/PatientContext"
import { EmergencyModalProvider } from "@/components/emergency/modals/EmergencyModalProvider"
import { HospitalizationModalProvider } from "@/components/hospitalization/modals/HospitalizationModalProvider"
import ProtectedRoute from "@/components/ProtectedRoute"
import { SegurosCitaProvider } from "@/contexts/SegurosCitaContext"
import { FiliationProvider } from "@/contexts/filiation/FiliationProvider"
import { calculateAge } from "@/lib/ageCalculator"
import { extractDocumentFromToken } from "@/utils/jwtUtils"
import { convertISOToSQLDate } from "@/utils/timeUtils"


// Filiation components
import { PatientSearchBar } from "@/components/filiation/PatientSearchBar"
import { PatientSearchModal } from "@/components/filiation/modals/PatientSearchModal"
import { PatientRegistrationModal } from "@/components/filiation/modals/PatientRegistrationModal"
import { PatientResultsTable } from "@/components/filiation/PatientResultsTable"
import { PatientViewModal } from "@/components/filiation/modals/PatientViewModal"
import { PatientEditModal } from "@/components/filiation/modals/PatientEditModal"
import { ReniecService } from "@/services/filiation/reniecService"
import { useFiliacion } from "@/hooks/useFiliacion"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { API_ENDPOINTS } from "@/lib/api-config"
import { DataTable } from "@/components/ui/data-table"
import { usePermissions } from "@/contexts/PermissionsContext"
import { PERMISOS } from "@/lib/permissions"



// Debounce helper function
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(timer)
    }
  }, [value, delay])

  return debouncedValue
}

export default function FiliationPage() {
  const { hasPermission, permissions, isLoaded } = usePermissions()
  const canCrearPaciente   = hasPermission(PERMISOS.PACIENTES.CREAR)
  const canVerPaciente     = hasPermission(PERMISOS.PACIENTES.VER)
  const canEditarPaciente  = hasPermission(PERMISOS.PACIENTES.EDITAR)
  const canCrearHosp       = hasPermission(PERMISOS.HOSPITALIZACION.CREAR)
  const canCrearEmer       = hasPermission(PERMISOS.EMERGENCIA.CREAR)
  const canVerificarSIS    = hasPermission(PERMISOS.PACIENTES.VER_SIS)

  const [searchTerm, setSearchTerm] = useState("")
  const [searchType, setSearchType] = useState<"historia" | "documento" | "nombres">("documento")
  const [estadoFiltro, setEstadoFiltro] = useState<"1" | "0">("1")
  const [isSearching, setIsSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  
  // Estados para modales de emergencia y hospitalización
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false)
  const [selectedPatientForEmergency, setSelectedPatientForEmergency] = useState<any>(null)
  const [isHospitalizationModalOpen, setIsHospitalizationModalOpen] = useState(false)
  const [selectedPatientForHospitalization, setSelectedPatientForHospitalization] = useState<any>(null)
  
  // Estados para modales de filiación
  const [isPatientSearchModalOpen, setIsPatientSearchModalOpen] = useState(false)
  const [isPatientRegistrationModalOpen, setIsPatientRegistrationModalOpen] = useState(false)
  const [isPatientViewModalOpen, setIsPatientViewModalOpen] = useState(false)
  const [isPatientEditModalOpen, setIsPatientEditModalOpen] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState<any>(null)
  const [reniecData, setReniecData] = useState<any>(null)
  const [sisData, setSisData] = useState<any>(null)
  const [documentType, setDocumentType] = useState("DNI")
  const [documentNumber, setDocumentNumber] = useState("")
  const [searchDocumentType, setSearchDocumentType] = useState<string>("D")
  const [documentTypesList, setDocumentTypesList] = useState<{ tipoDocumento: string; nombre: string }[]>([])
  const [isLoadingDocumentTypes, setIsLoadingDocumentTypes] = useState(false)
  const [isLoadingPatientHistory, setIsLoadingPatientHistory] = useState(false)
  // Estado para el diálogo de anulación
  const [anularDialog, setAnularDialog] = useState<{ open: boolean; patient: any | null }>({
    open: false,
    patient: null,
  })
  const [anularArgumento, setAnularArgumento] = useState("")
  const [isAnulando, setIsAnulando] = useState(false)
  const [anulacionExitosa, setAnulacionExitosa] = useState<{ open: boolean; patientName: string }>({
    open: false,
    patientName: "",
  })

  const [nnConfirmation, setNnConfirmation] = useState<{
    historiaClinica: string
    resumenPaciente: any
  } | null>(null)
  
  // Cargar tipos de documento para el selector de búsqueda
  useEffect(() => {
    const loadDocumentTypes = async () => {
      setIsLoadingDocumentTypes(true)
      try {
        const response = await fetch(API_ENDPOINTS.utils.documentTypes)
        if (!response.ok) throw new Error('Error al cargar tipos de documento')
        const data = await response.json()
        const list = Array.isArray(data) ? data : data?.data || []
        const active = list.filter((t: any) => t.activo === 1 || t.activo === '1' || t.activo === 1.0)
        setDocumentTypesList(active)
        // Asegurar que el valor por defecto sea DNI si está disponible
        const dni = active.find((t: any) => t.tipoDocumento?.trim() === 'D')
        if (dni) {
          setSearchDocumentType(dni.tipoDocumento.trim())
        } else if (active.length > 0) {
          setSearchDocumentType(active[0].tipoDocumento.trim())
        }
      } catch (error) {
        console.error('Error cargando tipos de documento:', error)
      } finally {
        setIsLoadingDocumentTypes(false)
      }
    }
    loadDocumentTypes()
  }, [])

  // Aplicar debounce al término de búsqueda con retardo variable basado en el tipo de búsqueda
  const debounceDelay = searchType === "nombres" ? 1000 : 500; // Retardo más largo para la búsqueda por nombre
  const debouncedSearchTerm = useDebounce(searchTerm, debounceDelay)
  
  const {
    data: patients,
    pagination,
    isLoading,
    error,
    handlePageChange,
    handlePageSizeChange,
    handleFilterChange,
    refreshData
  } = useFiliacion()

  // useEffect para activar la búsqueda cuando el término de búsqueda se modifica
  useEffect(() => {
    if (debouncedSearchTerm !== undefined) {
      const isDni = searchDocumentType === 'D'
      const minDocument = isDni ? 8 : 1

      // Solo buscar si cumple con los requisitos mínimos de caracteres basados en el tipo de búsqueda
      if (
        (searchType === "nombres" && debouncedSearchTerm.length >= 5) || // Al menos 5 caracteres para la búsqueda por nombre
        (searchType === "documento" && debouncedSearchTerm.length >= minDocument) ||
        (searchType === "historia" && debouncedSearchTerm.length >= 8)
      ) {
        handleSearch()
      }
    }
  }, [debouncedSearchTerm, searchType, searchDocumentType])

  // Re-aplicar búsqueda cuando cambia el filtro de estado y ya hay una búsqueda activa
  useEffect(() => {
    if (hasSearched) {
      handleSearch()
    }
  }, [estadoFiltro])

  const handleSearch = useCallback((term?: string, type?: string) => {
    const searchValue = term || searchTerm
    const searchBy = type || searchType || "documento"
    
    setIsSearching(true)
    const filter: any = {}
    
    if (searchValue) {
      filter[searchBy] = searchValue
      if (searchBy === "documento") {
        filter.tipoDocumento = searchDocumentType
      }
      setHasSearched(true)
    } else {
      setHasSearched(false)
    }

    // Filtro por estado: 1 = activas, 0 = anuladas, vacío = todas
    if (estadoFiltro) {
      filter.estado = estadoFiltro
    }
    
    handleFilterChange(filter)
    setIsSearching(false)
  }, [searchTerm, searchType, searchDocumentType, estadoFiltro, handleFilterChange])

  const router = useRouter();
  const { pathname } = useLocation();
  const isClinicalHistory = pathname.includes('/historias-clinicas');
  const { setPatientData } = usePatient();

  // Normaliza campos que el backend puede devolver en UPPERCASE o camelCase
  const getPatientId = (patient: any) =>
    String(patient?.PACIENTE || patient?.paciente || patient?.pacienteId || patient?.id || '').trim()
  const getPatientName = (patient: any) =>
    String(patient?.NOMBRES || patient?.nombres || patient?.name || '').trim()
  const getPatientDocument = (patient: any) =>
    String(patient?.DOCUMENTO || patient?.documento || patient?.dni || '').trim()
  const getPatientHistoria = (patient: any) =>
    String(patient?.HISTORIA || patient?.historia || patient?.hc || patient?.historiaClinica || '').trim()

  const handlePatientSelect = (patient: any) => {
    // Save patient data to context
    setPatientData({
      hc: getPatientHistoria(patient),
      name: getPatientName(patient),
      documento: getPatientDocument(patient),
      pacienteId: getPatientId(patient)
    });
    
    // Abrir modal de hospitalización en lugar de redireccionar
    setSelectedPatientForHospitalization(patient);
    setIsHospitalizationModalOpen(true);
  };

  const handleEmergencySelect = (patient: any) => {
    const patientId = getPatientId(patient)
    const patientName = getPatientName(patient)
    const documento = getPatientDocument(patient)
    const historia = getPatientHistoria(patient)

    // Save patient data to context
    setPatientData({
      hc: historia,
      name: patientName,
      documento: documento,
      pacienteId: patientId
    });
    
    // Abrir modal de emergencia
    setSelectedPatientForEmergency(patient);
    setIsEmergencyModalOpen(true);
  };

  // Funciones para manejar los modales de filiación
  const handleNewPatientClick = () => {
    setIsPatientSearchModalOpen(true)
  }

  // Cuando se encuentra un paciente en filiación
  const handlePatientFound = (patientData: any) => {
    // Cerrar modal de búsqueda
    setIsPatientSearchModalOpen(false);
    
    // Actualizar el término de búsqueda para mostrar el paciente en la tabla
    setSearchTerm(patientData.DOCUMENTO || patientData.documento || '');
    setSearchType('documento');
    
    toast({
      title: "Paciente encontrado",
      description: `Paciente ${patientData.NOMBRES || patientData.nombres} encontrado en el sistema.`,
    });
  };

  // Cuando no se encuentra y se obtienen datos de RENIEC (o null para llenado manual)
  const handleSearchComplete = (reniecSearchData: any, sisSearchData: any) => {
    setReniecData(reniecSearchData);
    setSisData(sisSearchData);
    setDocumentType(reniecSearchData?.documentType || "DNI");
    setDocumentNumber(reniecSearchData?.document || "");
    setIsPatientRegistrationModalOpen(true);
    setIsPatientSearchModalOpen(false);
  }

  const handlePatientView = (patient: any) => {
    if (!patient) {
      toast({
        title: "Error",
        description: "No se pudo cargar la información del paciente.",
        variant: "destructive"
      })
      return
    }
    setSelectedPatient(patient)
    setIsPatientViewModalOpen(true)
  }

  const handlePatientEdit = (patient: any) => {
    if (!patient) {
      toast({
        title: "Error",
        description: "No se pudo cargar la información del paciente para editar.",
        variant: "destructive"
      })
      return
    }
    setSelectedPatient(patient)
    setIsPatientEditModalOpen(true)
  }

  const handleRegistrationSuccess = () => {
    setIsPatientRegistrationModalOpen(false)
    setReniecData(null)
    setSisData(null)
    toast({
      title: "Paciente registrado",
      description: "La historia clínica ha sido creada exitosamente.",
    })
    // Refrescar la búsqueda
    refreshData()
  }

  const handleRegistrationSuccessWithSearch = (identificador: string, extra?: { isNN?: boolean; resumenPaciente?: any }) => {
    setIsPatientRegistrationModalOpen(false)
    setReniecData(null)
    setSisData(null)
    
    const isNN = extra?.isNN || (identificador?.startsWith("NN"))
    const searchBy: "historia" | "documento" = isNN ? "historia" : "documento"

    // Guardar datos para el diálogo de confirmación solo si es NN
    if (isNN && extra?.resumenPaciente) {
      setNnConfirmation({
        historiaClinica: identificador,
        resumenPaciente: extra.resumenPaciente,
      })
    }

    // Realizar búsqueda automática
    setSearchType(searchBy)
    setSearchTerm(identificador)

    setTimeout(() => {
      handleSearch(identificador, searchBy)
    }, 500)

    toast({
      title: "Paciente registrado",
      description: isNN
        ? `Historia clínica NN creada. Buscando paciente con historia ${identificador}...`
        : `Historia clínica creada. Buscando paciente con documento ${identificador}...`,
    })
  }

  const handleEditSuccess = () => {
    setIsPatientEditModalOpen(false)
    setSelectedPatient(null)
    toast({
      title: "Paciente actualizado",
      description: "La información del paciente ha sido actualizada.",
    })
    // Refrescar la búsqueda
    refreshData()
  }

  // Función auxiliar para buscar paciente existente
  const searchExistingPatient = async (dni: string) => {
    try {
      const filter = { documento: dni }
      handleFilterChange(filter)
      // Simular búsqueda - en implementación real esto vendría del hook
      return [] // Retornar array vacío por ahora
    } catch (error) {
      return []
    }
  }

  // Estado para almacenar los resultados de verificación SIS por paciente
  const [sisVerificationResults, setSisVerificationResults] = useState<Record<string, SISVerificationResult>>({});
  
  // Función para manejar la finalización de la verificación SIS
  const handleSISVerificationComplete = (result: SISVerificationResult) => {
    setSisVerificationResults(prev => ({
      ...prev,
      [result.patientId]: result
    }));
  };

  // Función para cargar datos completos de historia clínica
  const fetchPatientHistoryData = async (patientId: string) => {
    try {
      setIsLoadingPatientHistory(true);
      
      const response = await fetch(`${import.meta.env.VITE_API_CITAS_MASTER_URL}/historia-clinica/pacientes/${patientId}`);
      
      if (!response.ok) {
        throw new Error(`Error al obtener historia clínica: ${response.status}`);
      }
      
      const historyData = await response.json();
      
      // Aplanar objetos anidados para evitar errores de React
      const flattenedData = { ...historyData };
      
      // ✅ IMPORTANTE: Mantener objetos completos para campos específicos
      // NO aplanar estos campos porque necesitamos el objeto completo para extraer códigos
      const camposConObjeto = ['gradoInstruccion', 'ocupacion', 'codEtnia', 'distrito', 'lugarNacimiento', 'conyugeOcupacion', 'estadoCivil', 'seguro'];
      
      Object.keys(flattenedData).forEach(key => {
        if (flattenedData[key] && typeof flattenedData[key] === 'object' && !Array.isArray(flattenedData[key])) {
          // Si es un campo que necesita mantener el objeto completo, no aplanarlo
          if (camposConObjeto.includes(key)) {
            // No hacer nada, mantener el objeto
          } else {
            // Para otros campos, intentar extraer el código o nombre
            const obj = flattenedData[key];
            if (obj.codigo !== undefined) {
              flattenedData[key] = obj.codigo;
            } else if (obj.nombre !== undefined) {
              flattenedData[key] = obj.nombre;
            } else {
              // Si no tiene codigo ni nombre, convertir a string
              flattenedData[key] = JSON.stringify(obj);
            }
          }
        }
      });
      
      return flattenedData;
    } catch (error) {
      toast({
        title: "Advertencia",
        description: "No se pudieron cargar algunos datos adicionales del paciente.",
        variant: "default"
      });
      return null;
    } finally {
      setIsLoadingPatientHistory(false);
    }
  };

  // Función para editar paciente
  const handleEditPatient = async (patient: any) => {
    // Cargar datos completos de historia clínica
    const historyData = await fetchPatientHistoryData(getPatientId(patient));
    
    // Combinar datos del paciente con datos de historia clínica
    const completePatientData = historyData ? { ...patient, ...historyData } : patient;
    
    setSelectedPatient(completePatientData);
    setIsPatientEditModalOpen(true);
  };

  // Función para ver registro del paciente
  const handleViewPatient = async (patient: any) => {
    // Cargar datos completos de historia clínica
    const historyData = await fetchPatientHistoryData(getPatientId(patient));
    
    // Combinar datos del paciente con datos de historia clínica
    const completePatientData = historyData ? { ...patient, ...historyData } : patient;
    
    setSelectedPatient(completePatientData);
    setIsPatientViewModalOpen(true);
  };

  // Función para abrir el diálogo de anulación
  const handleDeletePatient = (patient: any) => {
    setAnularArgumento("")
    setAnularDialog({ open: true, patient })
  }

  // Función que ejecuta la anulación contra el backend
  const confirmAnularPatient = async () => {
    if (!anularArgumento.trim()) {
      toast({ title: "Campo requerido", description: "Debe ingresar el motivo de anulación.", variant: "destructive" })
      return
    }
    const patient = anularDialog.patient
    const patientId = getPatientId(patient)
    const usuario = extractDocumentFromToken()
    setIsAnulando(true)
    try {
      const url = `${API_ENDPOINTS.filiation.anular(patientId)}?argumento=${encodeURIComponent(anularArgumento.trim())}&usuario=${encodeURIComponent(usuario)}`
      const response = await fetch(url, { method: 'PUT' })
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData?.message || errData?.error || `Error ${response.status}`)
      }
      setAnularDialog({ open: false, patient: null })
      setAnulacionExitosa({ open: true, patientName: getPatientName(patient) })
      refreshData()
    } catch (error: any) {
      toast({ title: "Error al anular", description: error.message || "No se pudo anular el paciente.", variant: "destructive" })
    } finally {
      setIsAnulando(false)
    }
  }

  // Helper para determinar si un registro está anulado
  const isAnuladaRecord = (patient: any) => {
    const estado = patient.estado ?? patient.ESTADO
    return String(estado).trim() === "0" || estado === false || estado === 0
  }

  // Definición de columnas para la DataTable
  const columns = [
    {
      key: "historia",
      header: "H.C.",
      cell: (patient: any) => <span className="text-sm font-medium">{patient.historia || patient.HISTORIA || '-'}</span>
    },
    {
      key: "estado",
      header: "Estado",
      cell: (patient: any) => {
        const estado = patient.estado ?? patient.ESTADO
        const isActive = estado === undefined || estado === null || estado === true || estado === 1 || String(estado).trim() === '1'
        const isInactive = estado === false || estado === 0 || String(estado).trim() === '0'
        return (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${isActive ? 'bg-green-100 text-green-800 ring-1 ring-green-300' : isInactive ? 'bg-red-100 text-red-800 ring-1 ring-red-300' : 'bg-gray-100 text-gray-800 ring-1 ring-gray-300'}`}>
            {isActive ? <CheckCircle className="w-3.5 h-3.5" /> : isInactive ? <Ban className="w-3.5 h-3.5" /> : <span className="w-3.5 h-3.5 rounded-full bg-current" />}
            {isActive ? 'Activa' : isInactive ? 'Anulada' : 'Desconocido'}
          </span>
        )
      }
    },
    {
      key: "nombres",
      header: "Nombre",
      cell: (patient: any) => <span className="text-sm font-medium">{patient.nombres || patient.NOMBRES || '-'}</span>
    },
    {
      key: "sexo",
      header: "Sexo",
      cell: (patient: any) => <span className="text-sm">{patient.sexo || patient.SEXO || '-'}</span>
    },
    {
      key: "paciente",
      header: "Código Paciente / Documento",
      cell: (patient: any) => {
        const codigo = patient.paciente || patient.PACIENTE || '-';
        const documento = patient.documento || patient.DOCUMENTO || '-';
        return (
          <div className="flex flex-col">
            <span className="text-sm font-medium">{codigo}</span>
            <span className="text-xs text-gray-600">{documento}</span>
          </div>
        )
      }
    },
    {
      key: "fechaNacimiento",
      header: "Fecha Nac. / Edad",
      cell: (patient: any) => {
        const fecha = patient.fechaNacimiento || patient.FECHA_NACIMIENTO || patient.FECHNAC;
        if (!fecha) return "";

        try {
          // Formatear fecha usando utilidad existente
          const formattedDate = convertISOToSQLDate(fecha);

          // Calcular edad usando utilidad existente
          const age = calculateAge(fecha);

          // Construir texto de edad con años y meses
          let ageText = "";
          if (age.years > 0 || age.months > 0) {
            const parts: string[] = [];
            if (age.years > 0) {
              parts.push(`${age.years} ${age.years === 1 ? 'año' : 'años'}`);
            }
            if (age.months > 0) {
              parts.push(`${age.months} ${age.months === 1 ? 'mes' : 'meses'}`);
            }
            ageText = parts.join(', ');
          }

          return formattedDate ? (
            <div className="flex flex-col">
              <span className="text-sm font-medium">{formattedDate}</span>
              <span className="text-xs text-gray-600">{ageText}</span>
            </div>
          ) : String(fecha);
        } catch (error) {
          return String(fecha || "");
        }
      },
    },
    {
      key: "direccion",
      header: "Dirección",
      cell: (patient: any) => <span className="text-sm">{patient.direccion || patient.DIRECCION || '-'}</span>
    },
    {
      key: "telefono1",
      header: "Telefono",
      cell: (patient: any) => {
        const tel1 = patient.telefono1 || patient.TELEFONO1 || '';
        const tel2 = patient.telefono2 || patient.TELEFONO2 || '';
        return (
          <div className="flex flex-col">
            {tel1 && <span className="text-sm font-medium">{tel1}</span>}
            {tel2 && <span className="text-xs text-gray-600">{tel2}</span>}
          </div>
        );
      }
    },
    {
      key: "distritoDir",
      header: "Distrito Actual",
      cell: (patient: any) => {
        // Soporta tanto camelCase (distritoDir) como UPPERCASE (DISTRITO_DIR, distritoDir)
        const distrito = patient.distritoDir || patient.DISTRITO_DIR || patient.Distrito_Dir || patient.distrito || patient.DISTRITO || '';
        return <span className="text-sm">{distrito}</span>;
      }
    },
    {
      key: "actions",
      header: "Acciones",
      cell: (patient: any) => {
        const isAnulada = isAnuladaRecord(patient)
        return (
          <div className="flex flex-wrap items-center gap-2">
            {!isClinicalHistory && !isAnulada && canCrearHosp && (
              <Button
                variant="default"
                size="sm"
                className="bg-blue-500 hover:bg-blue-600 text-white"
                onClick={() => handlePatientSelect(patient)}
              >
                <Home className="mr-1 h-4 w-4" /> Hospitalizar
              </Button>
            )}
            {!isClinicalHistory && !isAnulada && canCrearEmer && (
              <Button
                variant="default"
                size="sm"
                className="bg-red-500 hover:bg-red-600 text-white"
                onClick={() => handleEmergencySelect(patient)}
              >
                <Siren className="mr-1 h-4 w-4" /> Emergencia
              </Button>
            )}
            {!isClinicalHistory && !isAnulada && canVerificarSIS && (
              <SISVerification
                patientId={getPatientId(patient)}
                documento={getPatientDocument(patient)}
                buttonSize="sm"
                onVerificationComplete={handleSISVerificationComplete}
              />
            )}

            {isClinicalHistory ? (
              /* Iconos con etiquetas para /historias-clinicas */
              <div className="inline-flex flex-wrap items-center gap-0.5 p-1 rounded-lg border border-gray-200 bg-white shadow-sm">
                {canVerPaciente && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2.5 flex flex-wrap items-center gap-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md text-xs font-medium"
                    onClick={() => handleViewPatient(patient)}
                  >
                    <Eye className="h-3.5 w-3.5 shrink-0" />
                    Ver
                  </Button>
                )}
                {canVerPaciente && (canEditarPaciente || !isAnulada) && (
                  <div className="w-px h-5 bg-gray-200" />
                )}
                {canEditarPaciente && !isAnulada && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2.5 flex flex-wrap items-center gap-1.5 text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-md text-xs font-medium"
                    onClick={() => handleEditPatient(patient)}
                  >
                    <Edit className="h-3.5 w-3.5 shrink-0" />
                    Editar
                  </Button>
                )}
                {canEditarPaciente && !isAnulada && (
                  <div className="w-px h-5 bg-gray-200" />
                )}
                {!isAnulada && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2.5 flex flex-wrap items-center gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md text-xs font-medium"
                    onClick={() => handleDeletePatient(patient)}
                  >
                    <Trash2 className="h-3.5 w-3.5 shrink-0" />
                    Eliminar
                  </Button>
                )}
              </div>
            ) : (
              /* Menú desplegable para acciones secundarias */
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {canVerPaciente && (
                    <DropdownMenuItem onClick={() => handleViewPatient(patient)}>
                      <Eye className="mr-2 h-4 w-4" />
                      Ver Historia
                    </DropdownMenuItem>
                  )}
                  {canEditarPaciente && !isAnulada && (
                    <DropdownMenuItem onClick={() => handleEditPatient(patient)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Editar
                    </DropdownMenuItem>
                  )}
                  {!isAnulada && (
                    <DropdownMenuItem
                      onClick={() => handleDeletePatient(patient)}
                      className="text-red-600"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Anular
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        )
      },
    },
  ]

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Navbar title="Sistema de Admisión Web" subtitle={isClinicalHistory ? "Historias Clínicas" : "Filiación"} showBackButton={false} />
        <Toaster />

      {/* Main Content */}
      <main className="page-shell py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          <h1 className="text-2xl font-bold text-gray-900">
            {isClinicalHistory ? 'Historias Clínicas' : 'Hospitalización / Emergencia'}
          </h1>

          <Button
            variant="outline"
            size="sm"
            className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white border-red-700 font-semibold w-full sm:w-auto"
            onClick={() => (window.location.href = "/dashboard")}
          >
            <Home className="h-5 w-5" />
            <span className="text-sm">Dashboard</span>
          </Button>
        </div>
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-blue-700 border-b border-gray-200 pb-2 inline-block">
            {isClinicalHistory ? 'Búsqueda y gestión de historias clínicas' : 'Búsqueda de historias clínicas para hospitalización'}
          </h2>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 font-bold text-gray-900">
              <span className="text-lg">Búsqueda de Pacientes</span>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                <div className="flex flex-wrap items-center gap-2">
                  <ToggleSwitch
                    checked={estadoFiltro === "1"}
                    onChange={(checked: boolean) => setEstadoFiltro(checked ? "1" : "0")}
                    disabled={isLoading}
                    size="md"
                    checkedClassName="bg-green-500"
                  />
                  <span className="text-sm font-medium text-gray-700 select-none">Solo Activos</span>
                </div>
                {canCrearPaciente && (
                  <Button
                    onClick={handleNewPatientClick}
                    className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Nuevo Paciente
                  </Button>
                )}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-row items-stretch gap-2">
              <div className="flex flex-row gap-2 min-w-0 shrink-0">
                <Select
                  value={searchType}
                  onValueChange={(value) => {
                    setSearchType(value as "historia" | "documento" | "nombres")
                    setSearchTerm("") // Clear search term when changing search type
                  }}
                >
                  <SelectTrigger className="w-[90px] sm:w-[120px] h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="min-w-[160px]">
                    <SelectItem value="documento">Documento</SelectItem>
                    <SelectItem value="historia">Historia Clínica</SelectItem>
                    <SelectItem value="nombres">Apellidos y Nombres</SelectItem>
                  </SelectContent>
                </Select>

                {searchType === "documento" && (
                  <Select
                    value={searchDocumentType}
                    onValueChange={(value) => {
                      setSearchDocumentType(value)
                      setSearchTerm("")
                    }}
                    disabled={isLoadingDocumentTypes}
                  >
                    <SelectTrigger className="w-[70px] sm:w-[90px] h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {documentTypesList.map((t) => (
                        <SelectItem key={t.tipoDocumento.trim()} value={t.tipoDocumento.trim()}>
                          {t.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="relative flex-1 min-w-0">
                <Search className="hidden sm:block absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />

                <Input
                  placeholder={`Buscar por ${searchType === "nombres" ? "apellidos y nombres (mín. 5 caracteres)" : searchType === "historia" ? "historia clínica (mín. 8 dígitos)" : `${documentTypesList.find(t => t.tipoDocumento.trim() === searchDocumentType)?.nombre || 'Documento'} (mín. ${searchDocumentType === 'D' ? '8' : '1'} caracteres)`}`}
                  className={`w-full ${searchTerm ? "pr-8" : "pr-3"} pl-3 sm:pl-8`}
                  value={searchTerm}
                  onChange={(e) => {
                    const value = e.target.value
                    if (searchType === "documento" && searchDocumentType === "D") {
                      // DNI: solo dígitos, máximo 8
                      const digits = value.replace(/\D/g, "").slice(0, 8)
                      setSearchTerm(digits)
                    } else {
                      setSearchTerm(value)
                    }
                  }}
                  maxLength={searchType === "documento" && searchDocumentType === "D" ? 8 : undefined}
                  disabled={isLoading}
                />

                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchTerm("")
                      setHasSearched(false)
                      handleFilterChange({})
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    disabled={isLoading}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                )}
              </div>
              <Button
                type="submit"
                onClick={() => handleSearch()}
                disabled={isLoading || isSearching}
                className="shrink-0 font-medium h-10 w-auto px-3 sm:px-4 bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isLoading || isSearching ? (
                  <>
                    <Loader2 className="h-4 w-4 sm:mr-2 animate-spin" />
                    <span className="hidden sm:inline">Buscando...</span>
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Buscar</span>
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
            <CardTitle className="font-bold text-gray-900 text-lg">Resultados de la Búsqueda</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={refreshData}
              disabled={isLoading}
              className="h-8 w-8 p-0 font-medium"
            >
              <span className="sr-only">Actualizar datos</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}
              >
                <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
                <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                <path d="M16 21h5v-5" />
              </svg>
            </Button>
          </CardHeader>
          <CardContent>
            {error ? (
              <div className="p-4 text-center text-red-500">
                <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>{error}</p>
              </div>
            ) : !hasSearched ? (
              <div className="p-8 text-center text-gray-500">
                <Search className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium">Realice una búsqueda para ver resultados</p>
                <p className="text-sm mt-2">
                  {searchType === "nombres" 
                    ? "Ingrese nombres o apellidos del paciente" 
                    : searchType === "historia" 
                      ? "Ingrese al menos 8 dígitos de la historia clínica" 
                      : "Ingrese al menos 8 dígitos del DNI"}
                </p>
              </div>
            ) : isLoading ? (
              <div className="p-8 text-center">
                <Loader2 className="w-16 h-16 mx-auto mb-4 text-blue-500 animate-spin" />
                <p className="text-lg font-medium text-gray-700 mb-2">Buscando pacientes...</p>
                <p className="text-sm text-gray-500">
                  Por favor espere mientras se realiza la búsqueda
                </p>
              </div>
            ) : patients.length === 0 ? (
              <div className="p-8 text-center">
                <Search className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium text-gray-700 mb-2">No se encontraron resultados</p>
                <p className="text-sm text-gray-500 mb-6">
                  No se encontró ningún paciente con {searchType === "nombres" ? "el nombre" : searchType === "historia" ? "la historia clínica" : "el documento"} "{searchTerm}"
                </p>
                {searchType === "documento" && (
                  <Button
                    onClick={() => {
                      setDocumentNumber(searchTerm);
                      setIsPatientSearchModalOpen(true);
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Crear Nueva Historia Clínica
                  </Button>
                )}
              </div>
            ) : (
              <>
                <div className="mb-4 text-sm font-medium text-gray-700">
                  {isLoading ? (
                    <div className="flex flex-wrap items-center">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      <span className="font-medium">Cargando datos...</span>
                    </div>
                  ) : (
                    <div className="flex flex-wrap justify-between items-center gap-2">
                      <span className="font-medium">
                        Mostrando {patients.length > 0 ? (pagination.page - 1) * pagination.pageSize + 1 : 0} a{" "}
                        {Math.min(pagination.page * pagination.pageSize, pagination.total)} de {pagination.total} registros
                      </span>
                      {searchTerm && (
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-xs font-medium">
                          Filtrado por: {searchType === "nombres" ? "Nombres" : searchType === "historia" ? "Historia Clínica" : "Documento"} - "{searchTerm}"
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <TooltipProvider>
                  <DataTable
                    data={patients}
                    columns={columns}
                    pagination={pagination}
                    onPageChange={handlePageChange}
                    onPageSizeChange={handlePageSizeChange}
                    isLoading={isLoading}
                    getRowClassName={(patient: any) =>
                      isAnuladaRecord(patient)
                        ? "bg-red-50/70 border-l-4 border-l-red-500 hover:bg-red-100/70"
                        : ""
                    }
                  />
                </TooltipProvider>
              </>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Modal de Emergencia */}
      <EmergencyModalProvider
        isOpen={isEmergencyModalOpen}
        onClose={() => {
          setIsEmergencyModalOpen(false);
          setSelectedPatientForEmergency(null);
        }}
        patientId={getPatientId(selectedPatientForEmergency)}
        patientName={getPatientName(selectedPatientForEmergency)}
      />

      {/* Modal de Hospitalización */}
      <HospitalizationModalProvider
        isOpen={isHospitalizationModalOpen}
        onClose={() => {
          setIsHospitalizationModalOpen(false);
          setSelectedPatientForHospitalization(null);
        }}
        patientId={getPatientId(selectedPatientForHospitalization)}
        patientName={getPatientName(selectedPatientForHospitalization)}
      />

      {/* Modales de Filiación - Envueltos en providers solo cuando están abiertos o hay confirmación NN */}
      {(isPatientSearchModalOpen || isPatientRegistrationModalOpen || isPatientViewModalOpen || isPatientEditModalOpen || nnConfirmation) && (
        <SegurosCitaProvider>
          <FiliationProvider>
            {/* Diálogo de confirmación para NN (tipo documento 0) */}
            {nnConfirmation && (
              <Dialog open={true} onOpenChange={(open) => { if (!open) setNnConfirmation(null) }}>
                <DialogContent className="max-w-md">
                  {/* Header con icono */}
                  <div className="flex flex-col items-center text-center pb-4 border-b">
                    <div className="w-16 h-16 rounded-full bg-green-100 flex flex-wrap items-center justify-center mb-3">
                      <CheckCircle className="w-10 h-10 text-green-600" />
                    </div>
                    <DialogTitle className="text-xl font-bold text-gray-800">¡Historia Clínica Creada!</DialogTitle>
                    <DialogDescription className="text-gray-500 mt-1">
                      Registro de Recién Nacido
                    </DialogDescription>
                  </div>

                  {/* Número de Historia destacado */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 my-4">
                    <p className="text-xs text-blue-600 font-medium uppercase tracking-wide">N° Historia Clínica</p>
                    <p className="text-2xl font-bold text-blue-800 mt-1">{nnConfirmation.historiaClinica}</p>
                  </div>

                  {/* Datos del paciente */}
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1">
                      <span className="text-gray-500 text-sm">Nombre</span>
                      <span className="font-medium text-gray-800">
                        {nnConfirmation.resumenPaciente?.paterno} {nnConfirmation.resumenPaciente?.materno} {nnConfirmation.resumenPaciente?.nombre}
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1">
                      <span className="text-gray-500 text-sm">Sexo</span>
                      <span className="font-medium text-gray-800">
                        {nnConfirmation.resumenPaciente?.sexo === 'M' ? 'Masculino' : nnConfirmation.resumenPaciente?.sexo === 'F' ? 'Femenino' : nnConfirmation.resumenPaciente?.sexo || '-'}
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1">
                      <span className="text-gray-500 text-sm">Fecha Nacimiento</span>
                      <span className="font-medium text-gray-800">{nnConfirmation.resumenPaciente?.fechaNacimiento || '-'}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1">
                      <span className="text-gray-500 text-sm">Dirección</span>
                      <span className="font-medium text-gray-800 text-right sm:max-w-[200px] truncate">{nnConfirmation.resumenPaciente?.direccion || '-'}</span>
                    </div>
                  </div>

                  {/* Botón */}
                  <div className="mt-4 flex flex-wrap justify-center">
                    <Button 
                      onClick={() => setNnConfirmation(null)} 
                      className="bg-green-600 hover:bg-green-700 text-white px-8 py-2"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Aceptar
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
            {isPatientSearchModalOpen && (
              <Dialog open={isPatientSearchModalOpen} onOpenChange={setIsPatientSearchModalOpen}>
                <PatientSearchModal 
                  onSearchComplete={handleSearchComplete}
                  onPatientFound={handlePatientFound}
                  onCancel={() => setIsPatientSearchModalOpen(false)}
                  prefilledDocument={documentNumber}
                />
              </Dialog>
            )}

            {isPatientRegistrationModalOpen && (
              <Dialog open={isPatientRegistrationModalOpen} onOpenChange={setIsPatientRegistrationModalOpen}>
                {(() => {
                  return null;
                })()}
                <PatientRegistrationModal
                  reniecData={reniecData}
                  sisData={sisData}
                  documentType={documentType}
                  documentNumber={documentNumber}
                  onCancel={() => setIsPatientRegistrationModalOpen(false)}
                  onSuccess={handleRegistrationSuccess}
                  onSuccessWithDocument={handleRegistrationSuccessWithSearch}
                />
              </Dialog>
            )}

            {isPatientViewModalOpen && selectedPatient && (
              <Dialog open={isPatientViewModalOpen} onOpenChange={setIsPatientViewModalOpen}>
                <PatientViewModal
                  patient={selectedPatient}
                  onClose={() => setIsPatientViewModalOpen(false)}
                  onEdit={() => {
                    setIsPatientViewModalOpen(false);
                    setIsPatientEditModalOpen(true);
                  }}
                />
              </Dialog>
            )}

            {isPatientEditModalOpen && selectedPatient && (
              <Dialog open={isPatientEditModalOpen} onOpenChange={setIsPatientEditModalOpen}>
                <PatientEditModal
                  patient={selectedPatient}
                  onCancel={() => setIsPatientEditModalOpen(false)}
                  onSuccess={handleEditSuccess}
                />
              </Dialog>
            )}
          </FiliationProvider>
        </SegurosCitaProvider>
      )}
      {/* Diálogo de éxito de anulación */}
      <Dialog open={anulacionExitosa.open} onOpenChange={(open) => setAnulacionExitosa({ open, patientName: anulacionExitosa.patientName })}>
        <DialogContent className="max-w-sm">
          <div className="flex flex-col items-center text-center py-4">
            <div className="w-16 h-16 rounded-full bg-green-100 flex flex-wrap items-center justify-center mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <DialogTitle className="text-xl font-bold text-gray-900">Historia anulada</DialogTitle>
            <DialogDescription className="text-gray-600 mt-2">
              La historia del paciente{" "}
              <span className="font-semibold text-gray-900">{anulacionExitosa.patientName}</span>
              {" "}se ha eliminado correctamente.
            </DialogDescription>
          </div>
          <div className="flex flex-wrap justify-center mt-2">
            <Button
              onClick={() => setAnulacionExitosa({ open: false, patientName: "" })}
              className="bg-green-600 hover:bg-green-700 text-white px-8"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Aceptar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Diálogo de anulación de filiación */}
      <Dialog
        open={anularDialog.open}
        onOpenChange={(open) => {
          if (!open && !isAnulando) setAnularDialog({ open: false, patient: null })
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex flex-wrap items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Anular Filiación
            </DialogTitle>
            <DialogDescription>
              Está a punto de anular al paciente{" "}
              <span className="font-semibold text-gray-900">
                {getPatientName(anularDialog.patient)}
              </span>
              . Esta acción es una eliminación lógica y requiere un motivo.
            </DialogDescription>
          </DialogHeader>

          <div className="py-2 space-y-2">
            <Label htmlFor="anular-argumento" className="text-sm font-medium">
              Motivo de anulación <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="anular-argumento"
              placeholder="Ingrese el motivo por el cual se anula esta filiación..."
              value={anularArgumento}
              onChange={(e) => setAnularArgumento(e.target.value)}
              rows={3}
              className="resize-none"
              disabled={isAnulando}
            />
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setAnularDialog({ open: false, patient: null })}
              disabled={isAnulando}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={confirmAnularPatient}
              disabled={isAnulando || !anularArgumento.trim()}
            >
              {isAnulando ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Anulando...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Confirmar Anulación
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </ProtectedRoute>
  )
}
