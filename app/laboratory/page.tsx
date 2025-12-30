"use client"

import { useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Navbar } from "@/components/Navbar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { CalendarIcon, Search, FlaskConical, Filter, RefreshCw, Home } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { LaboratoryTable, LaboratoryCita } from "@/components/laboratory/LaboratoryTable"
import { LaboratoryDetailModal } from "@/components/laboratory/LaboratoryDetailModal"
import { toast } from "@/components/ui/use-toast"

// URL base del API externo de laboratorio
const LAB_API_BASE_URL = `${process.env.NEXT_PUBLIC_API_CITAS_MASTER_URL}/apoyodiagnostico/laboratorio/citas`

export default function LaboratoryPage() {
  const router = useRouter()
  
  // Estados de filtros
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [origen, setOrigen] = useState<string>("CE")
  const [estado, setEstado] = useState<string>("2")
  const [searchCriteria, setSearchCriteria] = useState<string>("")
  
  // Estados para búsqueda por ID
  const [searchById, setSearchById] = useState<boolean>(false)
  const [idCitaSearch, setIdCitaSearch] = useState<string>("")
  
  // Estados de datos y carga
  const [data, setData] = useState<LaboratoryCita[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  
  // Estados para modal de detalle
  const [selectedCita, setSelectedCita] = useState<LaboratoryCita | null>(null)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [detailData, setDetailData] = useState<any>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

  // Buscar con filtros usando el endpoint /agenda
  const searchWithFilters = useCallback(async () => {
    try {
      // Validar que los filtros requeridos estén completos
      if (!date) {
        toast({
          title: "Filtro requerido",
          description: "Por favor seleccione una fecha",
          variant: "destructive"
        })
        return
      }
      
      if (!origen) {
        toast({
          title: "Filtro requerido",
          description: "Por favor seleccione un origen",
          variant: "destructive"
        })
        return
      }
      
      setIsLoading(true)
      setHasSearched(true)
      
      // Formatear fecha para el endpoint (DD/MM/YYYY)
      const fechaFormateada = format(date, "dd/MM/yyyy")
      
      // Construir URL con parámetros
      const params = new URLSearchParams()
      params.append("fechaCita", fechaFormateada)
      params.append("origen", origen)
      
      // Si hay criterio de búsqueda (nombre), agregarlo
      if (searchCriteria.trim()) {
        params.append("nombre", searchCriteria.trim())
      }
      
      const url = `${LAB_API_BASE_URL}/agenda?${params.toString()}`
      
      console.log("Buscando con filtros:", url)
      
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Accept": "*/*"
        }
      })
      
      if (!response.ok) {
        throw new Error(`Error en la búsqueda: ${response.status}`)
      }
      
      const result = await response.json()
      
      // Manejar respuesta con estructura { statusCode, success, message, data: [...] }
      const dataArray = result.data || (Array.isArray(result) ? result : [])
      
      console.log("Datos recibidos:", dataArray)
      
      // Adaptar los datos al nuevo formato de la tabla
      const adaptedData = Array.isArray(dataArray) ? dataArray.map((item: any) => ({
        idCita: item.idCita || item.ID_CITA || "",
        idPaciente: item.idPaciente || item.paciente || "",
        nombrePaciente: (item.nombrePaciente || item.nombres || item.NOMBRES || "").trim(),
        nroDocumento: item.nroDocumento || item.NRO_DOCUMENTO || "",
        estado: (item.estado || item.ESTADO || "1").trim(),
        ordenx: item.ordenx || item.orden || 0,
        hora: item.hora || "",
        origen: item.origen || origen
      })) : []
            
      // Filtrar por estado si es necesario
      const filteredData = estado !== "all" 
        ? adaptedData.filter((item: LaboratoryCita) => item.estado === estado)
        : adaptedData
      
      console.log("Datos filtrados por estado:", filteredData)
      console.log("Estado seleccionado:", estado)
      console.log("Estados en datos:", adaptedData.map(d => `'${d.estado}'`))
      
      setData(filteredData)
      
      if (filteredData.length === 0) {
        toast({
          title: "Sin resultados",
          description: "No se encontraron citas con los filtros especificados",
        })
      }
    } catch (error) {
      console.error("Error en búsqueda con filtros:", error)
      toast({
        title: "Error",
        description: "No se pudo conectar con el servicio de laboratorio",
        variant: "destructive"
      })
      setData([])
    } finally {
      setIsLoading(false)
    }
  }, [date, origen, estado, searchCriteria])

  // Buscar por ID de cita usando el endpoint /buscar
  const searchByIdCita = useCallback(async () => {
    if (!idCitaSearch.trim()) {
      toast({
        title: "Campo requerido",
        description: "Ingrese un ID de cita para buscar",
        variant: "destructive"
      })
      return
    }
    
    try {
      setIsLoading(true)
      setHasSearched(true)
      
      const url = `${LAB_API_BASE_URL}/buscar?criterio=${encodeURIComponent(idCitaSearch.trim())}`
      
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Accept": "*/*"
        }
      })
      
      if (!response.ok) {
        throw new Error(`Error en la búsqueda: ${response.status}`)
      }
      
      const result = await response.json()
      
      // Manejar respuesta con estructura { data: [...] }
      const dataArray = result.data || result
      
      // Adaptar los datos al nuevo formato de la tabla
      const adaptedData = Array.isArray(dataArray) ? dataArray.map((item: any) => ({
        idCita: item.idCita || item.ID_CITA || "",
        idPaciente: item.idPaciente || item.paciente || "",
        nombrePaciente: (item.nombrePaciente || item.nombres || item.NOMBRES || "").trim(),
        nroDocumento: item.nroDocumento || item.NRO_DOCUMENTO || "",
        estado: (item.estado || item.ESTADO || "1").trim(),
        ordenx: item.ordenx || item.orden || 0,
        hora: item.hora || "",
        origen: item.origen || ""
      })) : []
      
      setData(adaptedData)
      
      if (adaptedData.length === 0) {
        toast({
          title: "Sin resultados",
          description: "No se encontró la cita con el ID especificado",
        })
      }
    } catch (error) {
      console.error("Error en búsqueda por ID:", error)
      toast({
        title: "Error",
        description: "No se pudo conectar con el servicio de laboratorio",
        variant: "destructive"
      })
      setData([])
    } finally {
      setIsLoading(false)
    }
  }, [idCitaSearch])
  
  // Obtener detalle de una cita
  const fetchCitaDetail = useCallback(async (idCita: string) => {
    try {
      setLoadingDetail(true)
      
      const url = `${LAB_API_BASE_URL}/buscar?criterio=${encodeURIComponent(idCita)}`
      
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Accept": "*/*"
        }
      })
      
      if (!response.ok) {
        throw new Error(`Error al obtener detalle: ${response.status}`)
      }
      
      const result = await response.json()
      
      // Manejar respuesta con estructura { data: [...] }
      const dataArray = result.data || result
      
      if (Array.isArray(dataArray) && dataArray.length > 0) {
        setDetailData(dataArray[0])
      } else {
        setDetailData(null)
        toast({
          title: "Sin datos",
          description: "No se encontró información de la cita",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error al obtener detalle:", error)
      toast({
        title: "Error",
        description: "No se pudo obtener el detalle de la cita",
        variant: "destructive"
      })
      setDetailData(null)
    } finally {
      setLoadingDetail(false)
    }
  }, [])

  // Manejar búsqueda principal
  const handleSearch = () => {
    // Si hay criterio de búsqueda sin filtros activos, usar búsqueda por criterio
    // Si hay filtros activos, usar búsqueda con filtros (incluye el nombre si está presente)
    searchWithFilters()
  }

  // Manejar actualizar (refrescar datos)
  const handleRefresh = () => {
    if (hasSearched) {
      searchWithFilters()
    }
  }

  // Limpiar filtros
  const handleClearFilters = () => {
    setDate(undefined) // Mostrar "Seleccionar fecha"
    setOrigen("") // Mostrar "Seleccionar origen"
    setEstado("") // Mostrar "Seleccionar estado"
    setSearchCriteria("")
    setSearchById(false)
    setIdCitaSearch("")
    setData([])
    setHasSearched(false)
  }
  
  // Manejar ver detalle
  const handleViewDetail = async (cita: LaboratoryCita) => {
    setSelectedCita(cita)
    setDetailModalOpen(true)
    await fetchCitaDetail(cita.idCita)
  }
  
  // Manejar editar (pendiente implementación)
  const handleEdit = (cita: LaboratoryCita) => {
    toast({
      title: "Función pendiente",
      description: "La edición de citas está pendiente de implementación",
    })
  }
  
  // Manejar eliminar (pendiente implementación)
  const handleDelete = (cita: LaboratoryCita) => {
    toast({
      title: "Función pendiente",
      description: "La eliminación de citas está pendiente de implementación",
    })
  }

  // Manejar Enter en el campo de búsqueda
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch()
    }
  }
  
  // Manejar Enter en el campo de búsqueda por ID
  const handleKeyPressId = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      searchByIdCita()
    }
  }

  return (
    <>
      <Navbar title="Sistema de Admisión Web" subtitle="Laboratorio" showBackButton={false} />
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <FlaskConical className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Citas Laboratorio</h1>
            <p className="text-gray-600">Gestión de citas de laboratorio</p>
          </div>
        </div>
        
        {/* Botón Dashboard en el header */}
        <Button 
          onClick={() => router.push("/dashboard")}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 text-base"
          size="lg"
        >
          <Home className="w-5 h-5" />
          Dashboard
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader className="pb-4 flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold text-blue-800">Filtros de Búsqueda</CardTitle>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleClearFilters}
              className="flex items-center gap-2"
              size="sm"
            >
              <Filter className="w-4 h-4" />
              Limpiar Filtros
            </Button>
            <Button 
              variant="outline" 
              onClick={handleRefresh}
              disabled={!hasSearched || isLoading}
              className="flex items-center gap-2"
              size="sm"
            >
              <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
              Actualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Checkbox para búsqueda por ID (en la parte superior) */}
          <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <Checkbox
              id="searchById"
              checked={searchById}
              onCheckedChange={(checked) => {
                setSearchById(checked as boolean)
                if (!checked) {
                  setIdCitaSearch("")
                }
              }}
            />
            <Label 
              htmlFor="searchById" 
              className="text-sm font-medium cursor-pointer text-blue-900"
            >
              Buscar por ID de Cita (búsqueda directa sin filtros)
            </Label>
          </div>

          {/* Primera fila: Fecha, Origen, Estado */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fecha">Fecha</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP", { locale: es }) : <span>Seleccionar fecha</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(newDate) => newDate && setDate(newDate)}
                    initialFocus
                    locale={es}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="origen">Origen</Label>
              <Select value={origen} onValueChange={setOrigen}>
                <SelectTrigger id="origen">
                  <SelectValue placeholder="Seleccionar origen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CE">Consulta Externa</SelectItem>
                  <SelectItem value="E">Emergencia</SelectItem>
                  <SelectItem value="H">Hospitalización</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="estado">Estado</Label>
              <Select value={estado} onValueChange={setEstado}>
                <SelectTrigger id="estado">
                  <SelectValue placeholder="Seleccionar estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="0">Anulado</SelectItem>
                  <SelectItem value="1">Pendiente</SelectItem>
                  <SelectItem value="2">Completada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Segunda fila: Buscador por nombre y botón (solo si no está activo búsqueda por ID) */}
          {!searchById && (
            <div className="flex gap-4 items-end">
              <div className="flex-1 space-y-2">
                <Label htmlFor="searchCriteria">Buscar por Nombre</Label>
                <Input
                  id="searchCriteria"
                  placeholder="Ingrese nombre del paciente..."
                  value={searchCriteria}
                  onChange={(e) => setSearchCriteria(e.target.value)}
                  onKeyPress={handleKeyPress}
                />
              </div>
              <Button 
                onClick={handleSearch} 
                className="bg-blue-600 hover:bg-blue-700"
                disabled={isLoading}
              >
                <Search className="w-4 h-4 mr-2" />
                Buscar
              </Button>
            </div>
          )}
          
          {/* Campo de búsqueda por ID (solo visible cuando checkbox está activo) */}
          {searchById && (
            <div className="flex gap-4 items-end animate-in slide-in-from-top-2 duration-200">
              <div className="flex-1 space-y-2">
                <Label htmlFor="idCitaSearch">ID de Cita</Label>
                <Input
                  id="idCitaSearch"
                  placeholder="Ingrese el ID de la cita..."
                  value={idCitaSearch}
                  onChange={(e) => setIdCitaSearch(e.target.value)}
                  onKeyPress={handleKeyPressId}
                  className="font-mono"
                />
              </div>
              <Button 
                onClick={searchByIdCita} 
                className="bg-green-600 hover:bg-green-700"
                disabled={isLoading || !idCitaSearch.trim()}
              >
                <Search className="w-4 h-4 mr-2" />
                Buscar por ID
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabla de resultados */}
      <LaboratoryTable
        data={data}
        isLoading={isLoading}
        hasSearched={hasSearched}
        onViewDetail={handleViewDetail}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
      
      {/* Modal de detalle */}
      <LaboratoryDetailModal
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
        data={{
          ...detailData,
          idPaciente: selectedCita?.idPaciente || detailData?.idPaciente,
          nroDocumento: selectedCita?.nroDocumento || detailData?.nroDocumento,
          nombrePaciente: selectedCita?.nombrePaciente || detailData?.nombrePaciente
        }}
        loading={loadingDetail}
      />
      </div>
    </>
  )
}
