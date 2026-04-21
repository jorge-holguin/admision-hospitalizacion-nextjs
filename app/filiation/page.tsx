"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Home, Loader2, Search, Siren, CheckCircle, UserPlus, MoreVertical, Edit, Trash2, Eye } from "lucide-react"
import { Navbar } from "@/components/Navbar"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { useRouter } from "next/navigation"
import { SISVerification, SISVerificationResult } from "@/components/dashboard/SISVerification"
import { usePatient } from "@/contexts/PatientContext"
import { EmergencyModalProvider } from "@/components/emergency/modals/EmergencyModalProvider"
import { HospitalizationModalProvider } from "@/components/hospitalization/modals/HospitalizationModalProvider"
import ProtectedRoute from "@/components/ProtectedRoute"
import { SegurosCitaProvider } from "@/contexts/SegurosCitaContext"
import { FiliationProvider } from "@/contexts/filiation/FiliationProvider"
import { calculateAge } from "@/lib/ageCalculator"
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
import { DataTable } from "@/components/ui/data-table"



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
  const [searchTerm, setSearchTerm] = useState("")
  const [searchType, setSearchType] = useState<"historia" | "documento" | "nombres">("documento")
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
  const [isLoadingPatientHistory, setIsLoadingPatientHistory] = useState(false)
  const [nnConfirmation, setNnConfirmation] = useState<{
    historiaClinica: string
    resumenPaciente: any
  } | null>(null)
  
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
      // Solo buscar si cumple con los requisitos mínimos de caracteres basados en el tipo de búsqueda
      if (
        (searchType === "nombres" && debouncedSearchTerm.length >= 5) || // Al menos 5 caracteres para la búsqueda por nombre
        (searchType === "documento" && debouncedSearchTerm.length >= 8) ||
        (searchType === "historia" && debouncedSearchTerm.length >= 8)
      ) {
        handleSearch()
      }
    }
  }, [debouncedSearchTerm, searchType])

  const handleSearch = useCallback((term?: string, type?: string) => {
    const searchValue = term || searchTerm
    const searchBy = type || searchType || "documento"
    
    setIsSearching(true)
    const filter: any = {}
    
    if (searchValue) {
      filter[searchBy] = searchValue
      setHasSearched(true)
    } else {
      setHasSearched(false)
    }
    
    handleFilterChange(filter)
    setIsSearching(false)
  }, [searchTerm, searchType, handleFilterChange])

  const router = useRouter();
  const { setPatientData } = usePatient();

  const handlePatientSelect = (patient: any) => {
    // Save patient data to context
    setPatientData({
      hc: patient.HISTORIA,
      name: patient.NOMBRES,
      documento: patient.DOCUMENTO,
      pacienteId: patient.PACIENTE
    });
    
    // Abrir modal de hospitalización en lugar de redireccionar
    setSelectedPatientForHospitalization(patient);
    setIsHospitalizationModalOpen(true);
  };

  const handleEmergencySelect = (patient: any) => {
    // Save patient data to context
    setPatientData({
      hc: patient.HISTORIA || patient.hc,
      name: patient.NOMBRES || patient.name,
      documento: patient.DOCUMENTO || patient.dni,
      pacienteId: patient.PACIENTE || patient.id
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
      console.error('Error searching existing patient:', error)
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
      console.log(`🔍 Cargando datos completos de historia clínica para paciente: ${patientId}`);
      setIsLoadingPatientHistory(true);
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_CITAS_MASTER_URL}/historia-clinica/pacientes/${patientId}`);
      
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
      console.error('❌ Error al cargar historia clínica:', error);
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
    const historyData = await fetchPatientHistoryData(patient.PACIENTE);
    
    // Combinar datos del paciente con datos de historia clínica
    const completePatientData = historyData ? { ...patient, ...historyData } : patient;
    
    setSelectedPatient(completePatientData);
    setIsPatientEditModalOpen(true);
  };

  // Función para ver registro del paciente
  const handleViewPatient = async (patient: any) => {
    // Cargar datos completos de historia clínica
    const historyData = await fetchPatientHistoryData(patient.PACIENTE);
    
    // Combinar datos del paciente con datos de historia clínica
    const completePatientData = historyData ? { ...patient, ...historyData } : patient;
    
    setSelectedPatient(completePatientData);
    setIsPatientViewModalOpen(true);
  };

  // Función para anular paciente
  const handleDeletePatient = async (patient: any) => {
    if (confirm(`¿Está seguro de anular el paciente ${patient.NOMBRES}?`)) {
      try {
        // Aquí iría la lógica para anular el paciente
        toast({
          title: "Paciente anulado",
          description: `El paciente ${patient.NOMBRES} ha sido anulado correctamente.`,
        });
        // Recargar la lista
        handleSearch();
      } catch (error) {
        toast({
          title: "Error",
          description: "No se pudo anular el paciente.",
          variant: "destructive",
        });
      }
    }
  };

  // Definición de columnas para la DataTable
  const columns = [
    {
      key: "historia",
      header: "H.C.",
      cell: (patient: any) => <span className="text-sm font-medium">{patient.historia || patient.HISTORIA || '-'}</span>
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
          console.error("Error al formatear fecha:", error);
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
      cell: (patient: any) => (
        <div className="flex items-center space-x-2">
          {/* Botones principales siempre visibles */}
          <Button 
            variant="default" 
            size="sm" 
            className="bg-blue-500 hover:bg-blue-600 text-white" 
            onClick={() => handlePatientSelect(patient)}
          >
            <Home className="mr-1 h-4 w-4" /> Hospitalizar
          </Button>
          <Button 
            variant="default" 
            size="sm" 
            className="bg-red-500 hover:bg-red-600 text-white" 
            onClick={() => handleEmergencySelect(patient)}
          >
            <Siren className="mr-1 h-4 w-4" /> Emergencia
          </Button>
          <SISVerification 
            patientId={patient.PACIENTE}
            documento={patient.DOCUMENTO}
            buttonSize="sm"
            onVerificationComplete={handleSISVerificationComplete}
          />
          
          {/* Menú desplegable para acciones secundarias */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleViewPatient(patient)}>
                <Eye className="mr-2 h-4 w-4" />
                Ver Registro
              </DropdownMenuItem>
              {<DropdownMenuItem onClick={() => handleEditPatient(patient)}>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>}
              {<DropdownMenuItem 
                onClick={() => handleDeletePatient(patient)}
                className="text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Anular
              </DropdownMenuItem>}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ]

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Navbar title="Sistema de Admisión Web" subtitle="Filiación" showBackButton={false} />
        <Toaster />

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Historias Clínicas</h1>

          <Button
            variant="outline"
            size="lg"
            className="flex items-center gap-3 bg-red-600 hover:bg-red-700 text-white border-red-700 font-bold"
            onClick={() => (window.location.href = "/dashboard")}
          >
            <Home className="h-10 w-10" />
            <span className="text-lg font-bold">Dashboard</span>
          </Button>
        </div>
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-blue-700 border-b border-gray-200 pb-2 inline-block">Búsqueda de historias clínicas para hospitalización</h2>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center justify-between font-bold text-gray-900">
              <span className="text-lg">Búsqueda de Pacientes</span>
              <Button
                onClick={handleNewPatientClick}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Nuevo Paciente
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <div className="w-[200px]">
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={searchType}
                  onChange={(e) => {
                    setSearchType(e.target.value as "historia" | "documento" | "nombres")
                    setSearchTerm("") // Clear search term when changing search type
                  }}
                >
                  <option value="documento">Documento</option>
                  <option value="historia">Historia Clínica</option>
                  <option value="nombres">Apellidos y Nombres</option>
                </select>
              </div>
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                
                <Input
                  placeholder={`Buscar por ${searchType === "nombres" ? "apellidos y nombres (mín. 5 caracteres)" : searchType === "historia" ? "historia clínica (mín. 8 dígitos)" : "DNI (mín. 8 dígitos)"}`}
                  className="pl-8 pr-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
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
                className="font-medium"
              >
                {isLoading || isSearching ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Buscando...
                  </>
                ) : (
                  "Buscar"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
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
                    <div className="flex items-center">
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
                <DataTable
                  data={patients}
                  columns={columns}
                  pagination={pagination}
                  onPageChange={handlePageChange}
                  onPageSizeChange={handlePageSizeChange}
                  isLoading={isLoading}
                />
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
        patientId={selectedPatientForEmergency?.PACIENTE || ''}
        patientName={selectedPatientForEmergency?.NOMBRES || ''}
      />

      {/* Modal de Hospitalización */}
      <HospitalizationModalProvider
        isOpen={isHospitalizationModalOpen}
        onClose={() => {
          setIsHospitalizationModalOpen(false);
          setSelectedPatientForHospitalization(null);
        }}
        patientId={selectedPatientForHospitalization?.PACIENTE || ''}
        patientName={selectedPatientForHospitalization?.NOMBRES || ''}
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
                    <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-3">
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
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 text-sm">Nombre</span>
                      <span className="font-medium text-gray-800">
                        {nnConfirmation.resumenPaciente?.paterno} {nnConfirmation.resumenPaciente?.materno} {nnConfirmation.resumenPaciente?.nombre}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 text-sm">Sexo</span>
                      <span className="font-medium text-gray-800">
                        {nnConfirmation.resumenPaciente?.sexo === 'M' ? 'Masculino' : nnConfirmation.resumenPaciente?.sexo === 'F' ? 'Femenino' : nnConfirmation.resumenPaciente?.sexo || '-'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 text-sm">Fecha Nacimiento</span>
                      <span className="font-medium text-gray-800">{nnConfirmation.resumenPaciente?.fechaNacimiento || '-'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 text-sm">Dirección</span>
                      <span className="font-medium text-gray-800 text-right max-w-[200px] truncate">{nnConfirmation.resumenPaciente?.direccion || '-'}</span>
                    </div>
                  </div>

                  {/* Botón */}
                  <div className="mt-4 flex justify-center">
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
      </div>
    </ProtectedRoute>
  )
}
