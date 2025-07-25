"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Home, Loader2, Search, CheckCircle } from "lucide-react"
import { Navbar } from "@/components/Navbar"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { DataTable } from "@/components/ui/data-table"
import { useFiliacion } from "@/hooks/useFiliacion"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { es } from "date-fns/locale"

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

export default function HospitalizationSearch() {
  const [searchTerm, setSearchTerm] = useState("")
  const [searchType, setSearchType] = useState<"historia" | "documento" | "nombres">("documento")
  const [isSearching, setIsSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  
  // Apply debounce to search term with 500ms delay
  const debouncedSearchTerm = useDebounce(searchTerm, 500)
  
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

  // Effect to trigger search when debounced search term changes
  useEffect(() => {
    if (debouncedSearchTerm !== undefined) {
      // Only search if it's a name search or if the term has at least 8 characters for documento/historia
      if (
        searchType === "nombres" ||
        (searchType === "documento" && debouncedSearchTerm.length >= 8) ||
        (searchType === "historia" && debouncedSearchTerm.length >= 8)
      ) {
        handleSearch()
      }
    }
  }, [debouncedSearchTerm, searchType])

  const handleSearch = useCallback(() => {
    setIsSearching(true)
    const filter: any = {}
    
    if (searchTerm) {
      filter[searchType] = searchTerm
      setHasSearched(true)
    } else {
      setHasSearched(false)
    }
    
    handleFilterChange(filter)
    setIsSearching(false)
  }, [searchTerm, searchType, handleFilterChange])

  const router = useRouter();

  const handlePatientSelect = (patientId: string) => {
    router.push(`/hospitalization/orders/${patientId}`);
  };

  // Estado para manejar la verificación SIS
  const [sisVerificationState, setSisVerificationState] = useState<{
    isLoading: boolean;
    patientId: string | null;
    result: string | null;
    isSuccess: boolean | null;
  }>({
    isLoading: false,
    patientId: null,
    result: null,
    isSuccess: null
  });

  // Función para verificar SIS
  const handleVerifySIS = async (patientId: string, documento: string) => {
    if (!documento) {
      toast({
        title: "Error",
        description: "No se encontró número de documento para este paciente",
        variant: "destructive"
      });
      return;
    }

    setSisVerificationState({
      isLoading: true,
      patientId: patientId,
      result: null,
      isSuccess: null
    });

    try {
      const response = await fetch('http://192.168.0.21:8080/api/sis/validar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          intOpcion: "1",
          strTipoDocumento: "1",
          strNroDocumento: documento,
          strTipoFormato: "2",
          strNroContrato: documento
        })
      });

      if (!response.ok) {
        throw new Error(`Error en la consulta: ${response.status}`);
      }

      const data = await response.json();
      const resultado = data.resultado;
      
      setSisVerificationState({
        isLoading: false,
        patientId: patientId,
        result: resultado,
        isSuccess: resultado === "DATOS EXITOSOS"
      });

      // Mostrar toast con el resultado
      if (resultado === "DATOS EXITOSOS") {
        toast({
          title: "SIS Activo",
          description: "El paciente cuenta con SIS activo",
          variant: "default",
          className: "bg-green-50 border-green-200 text-green-800"
        });
      } else {
        toast({
          title: "SIS No Activo",
          description: "No se encontró afiliación SIS para el DNI consultado",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error al verificar SIS:', error);
      setSisVerificationState({
        isLoading: false,
        patientId: patientId,
        result: "Error en la consulta",
        isSuccess: false
      });
      
      toast({
        title: "Error",
        description: "No se pudo conectar con el servicio de verificación SIS",
        variant: "destructive"
      });
    }
  };

  // Define columns for the DataTable
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
      key: "DOCUMENTO",
      header: "DNI",
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
      key: "DISTRITO",
      header: "Distrito Nacimiento",
    },
    {
      key: "actions",
      header: "Acciones",
      cell: (patient: any) => (
        <div className="flex flex-col space-y-2">
          <div className="flex space-x-2">
            <Button 
              variant="default" 
              size="sm" 
              className="bg-blue-500 hover:bg-blue-600 text-white" 
              onClick={() => handlePatientSelect(patient.PACIENTE)}
            >
              <Home className="mr-2 h-4 w-4" /> HOSPITALIZAR
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="border-green-500 text-green-600 hover:bg-green-50" 
              onClick={() => handleVerifySIS(patient.PACIENTE, patient.DOCUMENTO)}
              disabled={sisVerificationState.isLoading && sisVerificationState.patientId === patient.PACIENTE}
            >
              {sisVerificationState.isLoading && sisVerificationState.patientId === patient.PACIENTE ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verificando...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" /> Verificar SIS
                </>
              )}
            </Button>
          </div>
          
          {/* Mostrar resultado de verificación SIS */}
          {sisVerificationState.patientId === patient.PACIENTE && sisVerificationState.result && !sisVerificationState.isLoading && (
            <Alert className={sisVerificationState.isSuccess ? 
              "bg-green-50 border-green-200 text-green-800" : 
              "bg-red-50 border-red-200 text-red-800"}
            >
              <CheckCircle className={`h-4 w-4 ${sisVerificationState.isSuccess ? "text-green-600" : "text-red-600"}`} />
              <AlertTitle>{sisVerificationState.isSuccess ? "SIS Activo" : "SIS No Activo"}</AlertTitle>
              <AlertDescription>
                {sisVerificationState.isSuccess ? 
                  "El paciente cuenta con SIS activo" : 
                  "No se encontró afiliación SIS para el DNI consultado"}
              </AlertDescription>
            </Alert>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar title="SIGSALUD" subtitle="HOSPITALIZACIÓN" showBackButton={false} />
      <Toaster />

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Historias Clínicas</h1>

          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
            onClick={() => (window.location.href = "/dashboard")}
          >
            <Home className="h-4 w-4" />
            Dashboard
          </Button>
        </div>
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-blue-700 border-b border-gray-200 pb-2 inline-block">Búsqueda de historias clínicas para hospitalización</h2>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Criterios de Búsqueda</CardTitle>
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
                {isSearching || isLoading ? (
                  <Loader2 className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 animate-spin" />
                ) : (
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                )}
                <div className="relative w-full">
                  <Input
                    type="search"
                    placeholder={`Buscar por ${searchType === "nombres" ? "apellidos y nombres" : searchType === "historia" ? "historia clínica (mín. 8 dígitos)" : "DNI (mín. 8 dígitos)"}`}
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
              </div>
              <Button 
                type="submit" 
                onClick={handleSearch} 
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
                          Filtrado por: {searchType === "nombres" ? "Nombres" : searchType === "historia" ? "Historia Clínica" : "DNI"} - "{searchTerm}"
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
    </div>
  )
}
