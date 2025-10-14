"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog } from "@/components/ui/dialog"
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
  const [documentType, setDocumentType] = useState("DNI")
  const [documentNumber, setDocumentNumber] = useState("")
  
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

  // Cuando no se encuentra y se obtienen datos de RENIEC
  const handlePatientSearchComplete = async (searchData: any) => {
    // Paciente no existe en filiación, proceder con registro usando datos de RENIEC
    setReniecData(searchData);
    setDocumentType("DNI");
    setDocumentNumber(searchData.dni);
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
    toast({
      title: "Paciente registrado",
      description: "La historia clínica ha sido creada exitosamente.",
    })
    // Refrescar la búsqueda
    refreshData()
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

  // Función para editar paciente
  const handleEditPatient = (patient: any) => {
    setSelectedPatient(patient);
    setIsPatientEditModalOpen(true);
  };

  // Función para ver registro del paciente
  const handleViewPatient = (patient: any) => {
    setSelectedPatient(patient);
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
      key: "HISTORIA",
      header: "H.C.",
    },
    {
      key: "NOMBRES",
      header: "Nombre",
    },
    {
      key: "SEXO",
      header: "Sexo",
    },
    {
      key: "PACIENTE",
      header: "Código Paciente",
    },
    {
      key: "FECHA_NACIMIENTO",
      header: "Fecha Nac.",
      cell: (patient: any) => {
        // Mostrar la fecha en formato DD/MM/YYYY
        if (!patient.FECHA_NACIMIENTO) return "";
        
        try {
          // Ahora el backend ya nos envía la fecha en formato YYYY-MM-DD
          const rawDate = patient.FECHA_NACIMIENTO;
          
          // Si es un string con formato ISO o SQL Server (YYYY-MM-DD)
          if (typeof rawDate === 'string') {
            // Extraer los componentes de la fecha usando regex
            const match = rawDate.match(/(\d{4})-(\d{2})-(\d{2})/);
            if (match) {
              const [_, year, month, day] = match;
              return `${day}/${month}/${year}`;
            }
          }
          
          // Si es un objeto Date o puede convertirse en uno
          const date = new Date(rawDate);
          if (!isNaN(date.getTime())) {
            // Formatear manualmente para asegurar formato DD/MM/YYYY
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            return `${day}/${month}/${year}`;
          }
          
          // Si es un string pero no en formato estándar, mostrarlo como está
          if (typeof rawDate === 'string') {
            return rawDate;
          }
          
          // Si es un objeto con propiedades de fecha
          if (typeof rawDate === 'object' && rawDate !== null) {
            return JSON.stringify(rawDate);
          }
          
          // Si nada funciona, mostrar el valor original
          return String(rawDate);
        } catch (error) {
          console.error("Error al formatear fecha:", error);
          return String(patient.FECHA_NACIMIENTO || "");
        }
      },
    },
    {
      key: "DIRECCION",
      header: "Dirección",
    },
    {
      key: "Nombre_Localidad",
      header: "Localidad",
    },
    {
      key: "Distrito_Dir",
      header: "Distrito Actual",
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
        {/*   <DropdownMenu>
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
              <DropdownMenuItem onClick={() => handleEditPatient(patient)}>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleDeletePatient(patient)}
                className="text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Anular
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu> */}
        </div>
      ),
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar title="Sistema de Integral de Admisión Hospitalaria" subtitle="HOSPITALIZACIÓN" showBackButton={false} />
      <Toaster />

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Historias Clínicas</h1>

          <Button
            variant="outline"
            size="lg"
            className="flex items-center gap-3 bg-red-600 hover:bg-red-700 text-white border-red-700"
            onClick={() => (window.location.href = "/dashboard")}
          >
            <Home className="h-10 w-10" />
            <span className="text-lg font-medium">Dashboard</span>
          </Button>
        </div>
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-blue-700 border-b border-gray-200 pb-2 inline-block">Búsqueda de historias clínicas para hospitalización</h2>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Búsqueda de Pacientes</span>
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
            <CardTitle>Resultados de la Búsqueda</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={refreshData}
              disabled={isLoading}
              className="h-8 w-8 p-0"
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
            ) : (
              <>
                <div className="mb-4 text-sm text-muted-foreground">
                  {isLoading ? (
                    <div className="flex items-center">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      <span>Cargando datos...</span>
                    </div>
                  ) : (
                    <div className="flex flex-wrap justify-between items-center gap-2">
                      <span>
                        Mostrando {patients.length > 0 ? (pagination.page - 1) * pagination.pageSize + 1 : 0} a{" "}
                        {Math.min(pagination.page * pagination.pageSize, pagination.total)} de {pagination.total} registros
                      </span>
                      {searchTerm && (
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-xs">
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

      {/* Modales de Filiación */}
      <Dialog open={isPatientSearchModalOpen} onOpenChange={setIsPatientSearchModalOpen}>
        <PatientSearchModal 
          onSearchComplete={handlePatientSearchComplete}
          onPatientFound={handlePatientFound}
          onCancel={() => setIsPatientSearchModalOpen(false)}
        />
      </Dialog>

      <Dialog open={isPatientRegistrationModalOpen} onOpenChange={setIsPatientRegistrationModalOpen}>
        <PatientRegistrationModal
          reniecData={reniecData}
          documentType={documentType}
          documentNumber={documentNumber}
          onCancel={() => setIsPatientRegistrationModalOpen(false)}
          onSuccess={handleRegistrationSuccess}
        />
      </Dialog>

      <Dialog open={isPatientViewModalOpen && selectedPatient !== null} onOpenChange={setIsPatientViewModalOpen}>
        <PatientViewModal
          patient={selectedPatient}
          onClose={() => setIsPatientViewModalOpen(false)}
          onEdit={() => {
            setIsPatientViewModalOpen(false);
            setIsPatientEditModalOpen(true);
          }}
        />
      </Dialog>

      <Dialog open={isPatientEditModalOpen && selectedPatient !== null} onOpenChange={setIsPatientEditModalOpen}>
        <PatientEditModal
          patient={selectedPatient}
          onCancel={() => setIsPatientEditModalOpen(false)}
          onSuccess={handleEditSuccess}
        />
      </Dialog>
    </div>
  )
}
