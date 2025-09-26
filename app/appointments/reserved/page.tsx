"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Eye, Search, RefreshCw, Calendar, User, Clock, FileText, UserCheck } from "lucide-react"
import { Navbar } from "@/components/Navbar"
import { PatientAssignmentReservedModal } from "@/app/appointments/reserved/modal/PatientAssignmentReservedModal"
import { useRouter } from "next/navigation"
import { toast } from "@/components/ui/use-toast"
import { TipoCitaProvider } from "@/contexts/TipoCitaContext"
import { SegurosCitaProvider } from "@/contexts/SegurosCitaContext"

// Interfaces
interface ReservaData {
  tipoDocumento: string
  numeroDocumento: string
  nombres: string
  especialidad: string
  especialidadNombre: string
  medico: string
  medicoNombre: string
  turno: string
  fecha: string
  hora: string
  correo: string
  codigo: string
  estado: string
  citaId?: number
  tipoAtencion?: string | null
  rutaReferencia?: string
  consultorio?: string | null
}

interface EspecialidadData {
  idEspecialidad: string
  nombre: string
}

interface PatientData {
  HISTORIA: string
  NOMBRES: string
  NOMBRE?: string
  PATERNO?: string
  MATERNO?: string
  SEXO: string
  DOCUMENTO: string
  TIPO_DOCUMENTO?: string
  FECHA_NACIMIENTO: string
  EDAD?: string
  ESTADO_CIVIL?: string
  DIRECCION: string
  DISTRITO: string
  Distrito_Dir?: string
  TELEFONO1?: string
  TELEFONO2?: string
  SEGURO?: string
  NOMBRE_SEGURO?: string
  RELIGION?: string
  DESRELIGION?: string
  Nombre_Localidad?: string
  LOCALIDAD?: string
  STRING_FOTO?: string
  PACIENTE?: string
}

export default function ReservedAppointmentsPage() {
  const router = useRouter()
  const [reservas, setReservas] = useState<ReservaData[]>([])
  const [especialidades, setEspecialidades] = useState<EspecialidadData[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingEspecialidades, setLoadingEspecialidades] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedEspecialidad, setSelectedEspecialidad] = useState<string>("0001")
  const [selectedReserva, setSelectedReserva] = useState<ReservaData | null>(null)
  const [patientData, setPatientData] = useState<PatientData | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loadingPatient, setLoadingPatient] = useState(false)
  const [loadingReservas, setLoadingReservas] = useState<Set<string>>(new Set())
  const [currentPage, setCurrentPage] = useState(0)
  const [pageSize] = useState(10)
  const [totalElements, setTotalElements] = useState(0)

  // Función para obtener fechas
  const getDateRange = () => {
    const today = new Date()
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 2, 0) // Último día del mes siguiente
    
    const formatDate = (date: Date) => {
      return date.toISOString().split('T')[0]
    }
    
    return {
      fechaInicio: formatDate(today),
      fechaFin: formatDate(nextMonth)
    }
  }

  // Cargar especialidades
  const loadEspecialidades = async () => {
    setLoadingEspecialidades(true)
    try {
      const { fechaInicio, fechaFin } = getDateRange()
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_RESERVAS_URL}/app-citas/especialidades?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`)
      
      if (!response.ok) {
        throw new Error('Error al cargar especialidades')
      }
      
      const data = await response.json()
      setEspecialidades(data)
      
      // Si hay especialidades, seleccionar la primera por defecto
      if (data.length > 0 && !selectedEspecialidad) {
        setSelectedEspecialidad(data[0].idEspecialidad)
      }
    } catch (error) {
      console.error('Error al cargar especialidades:', error)
      toast({
        title: "Error",
        description: "No se pudieron cargar las especialidades",
        variant: "destructive"
      })
    } finally {
      setLoadingEspecialidades(false)
    }
  }

  // Cargar reservas
  const loadReservas = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_RESERVAS_URL}/solicitudes/listar-paginado?especialidad=${selectedEspecialidad}&page=${currentPage}&size=${pageSize}`)
      
      if (!response.ok) {
        throw new Error('Error al cargar reservas')
      }
      
      const data = await response.json()
      setReservas(data.content || [])
      setTotalElements(data.totalElements || 0)
    } catch (error) {
      console.error('Error al cargar reservas:', error)
      toast({
        title: "Error",
        description: "No se pudieron cargar las reservas",
        variant: "destructive"
      })
      // Usar datos mock en caso de error
      setReservas([])
    } finally {
      setLoading(false)
    }
  }

  // Cargar especialidades al montar el componente
  useEffect(() => {
    loadEspecialidades()
  }, [])

  // Cargar reservas cuando cambie la especialidad o página
  useEffect(() => {
    if (selectedEspecialidad) {
      loadReservas()
    }
  }, [selectedEspecialidad, currentPage])

  // Buscar paciente por documento usando API filiacion2
  const searchPatientByDocument = async (documento: string, reservaCodigo: string) => {
    // Agregar esta reserva al set de loading
    setLoadingReservas(prev => new Set([...prev, reservaCodigo]))
    
    try {
      console.log(`🔍 Buscando paciente con documento: ${documento}`)
      const response = await fetch(`/api/filiacion2?documento=${documento}`)
      
      if (!response.ok) {
        throw new Error('Error al buscar paciente')
      }
      
      const data = await response.json()
      console.log('📋 Datos del paciente recibidos:', data)
      
      // Los datos vienen en un array dentro de data.data
      const patientInfo = data.data && data.data.length > 0 ? data.data[0] : null
      console.log('👤 Información del paciente extraída:', patientInfo)
      
      if (patientInfo && patientInfo.HISTORIA) {
        setPatientData({
          HISTORIA: patientInfo.HISTORIA || '',
          NOMBRES: patientInfo.NOMBRES || '',
          NOMBRE: patientInfo.NOMBRE || '',
          PATERNO: patientInfo.PATERNO || '',
          MATERNO: patientInfo.MATERNO || '',
          SEXO: patientInfo.SEXO || '',
          DOCUMENTO: patientInfo.DOCUMENTO || documento,
          TIPO_DOCUMENTO: patientInfo.TIPO_DOCUMENTO || '',
          FECHA_NACIMIENTO: patientInfo.FECHA_NACIMIENTO || '',
          EDAD: patientInfo.EDAD || '',
          ESTADO_CIVIL: patientInfo.ESTADO_CIVIL || '',
          DIRECCION: patientInfo.DIRECCION || '',
          DISTRITO: patientInfo.DISTRITO || patientInfo.Distrito_Dir || '',
          Distrito_Dir: patientInfo.Distrito_Dir || '',
          TELEFONO1: patientInfo.TELEFONO1,
          TELEFONO2: patientInfo.TELEFONO2,
          SEGURO: patientInfo.SEGURO,
          NOMBRE_SEGURO: patientInfo.NOMBRE_SEGURO,
          RELIGION: patientInfo.RELIGION,
          DESRELIGION: patientInfo.DESRELIGION,
          Nombre_Localidad: patientInfo.Nombre_Localidad,
          LOCALIDAD: patientInfo.LOCALIDAD,
          STRING_FOTO: patientInfo.STRING_FOTO,
          PACIENTE: patientInfo.PACIENTE
        })
        console.log('✅ Datos del paciente guardados correctamente')
        return true
      } else {
        console.log('❌ No se encontraron datos del paciente')
        toast({
          title: "Paciente no encontrado",
          description: `No se encontró información para el documento: ${documento}`,
          variant: "destructive"
        })
        return false
      }
    } catch (error) {
      console.error('❌ Error al buscar paciente:', error)
      toast({
        title: "Error",
        description: "Error al buscar información del paciente",
        variant: "destructive"
      })
      return false
    } finally {
      // Remover esta reserva del set de loading
      setLoadingReservas(prev => {
        const newSet = new Set(prev)
        newSet.delete(reservaCodigo)
        return newSet
      })
    }
  }

  // Obtener información completa de la solicitud incluyendo citaId
  const getSolicitudInfo = async (codigo: string) => {
    try {
      console.log('🔍 Obteniendo información de la solicitud:', codigo)
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_RESERVAS_URL}/solicitudes/codigo/${codigo}`, {
        method: 'GET',
        headers: {
          'accept': '*/*'
        }
      })

      if (!response.ok) {
        throw new Error(`Error al obtener solicitud: ${response.status} ${response.statusText}`)
      }

      const solicitudData = await response.json()
      console.log('📋 Información de la solicitud obtenida:', solicitudData)
      
      return solicitudData
    } catch (error) {
      console.error('❌ Error al obtener información de la solicitud:', error)
      toast({
        title: "Error",
        description: "Error al obtener información de la solicitud",
        variant: "destructive"
      })
      return null
    }
  }

  // Manejar clic en revisar
  const handleRevisar = async (reserva: ReservaData) => {
    console.log('🔄 Iniciando revisión de reserva:', reserva.codigo)
    setSelectedReserva(reserva)
    
    // Cambiar estado a "EN REVISION" si está pendiente
    if (reserva.estado === "PENDIENTE") {
      setReservas(prev => prev.map(r => 
        r.codigo === reserva.codigo 
          ? { ...r, estado: "EN REVISION" }
          : r
      ))
    }
    
    // Obtener información completa de la solicitud (incluyendo citaId)
    const solicitudInfo = await getSolicitudInfo(reserva.codigo)
    if (!solicitudInfo) {
      console.log('❌ No se pudo obtener información de la solicitud')
      return
    }

    // Actualizar la reserva seleccionada con la información completa
    const reservaCompleta = {
      ...reserva,
      citaId: solicitudInfo.citaId,
      rutaReferencia: solicitudInfo.rutaReferencia,
      consultorio: solicitudInfo.consultorio,
      tipoAtencion: solicitudInfo.tipoAtencion
    }
    setSelectedReserva(reservaCompleta)
    console.log('📋 Reserva actualizada con citaId:', reservaCompleta.citaId)
    
    // Actualizar la lista de reservas con el citaId
    setReservas(prev => prev.map(r => 
      r.codigo === reserva.codigo 
        ? { ...r, citaId: solicitudInfo.citaId }
        : r
    ))
    
    // Buscar información del paciente por documento
    const found = await searchPatientByDocument(reserva.numeroDocumento, reserva.codigo)
    if (found) {
      console.log('✅ Abriendo modal con datos del paciente')
      setIsModalOpen(true)
    } else {
      console.log('❌ No se pudo abrir el modal - datos del paciente no encontrados')
    }
  }

  // Manejar ver ficha referencia
  const handleVerFichaReferencia = (reserva: ReservaData) => {
    // Aquí iría la lógica para mostrar la ficha de referencia
    toast({
      title: "Ficha de Referencia",
      description: `Mostrando ficha para: ${reserva.nombres}`,
    })
  }

  // Filtrar reservas por término de búsqueda
  const filteredReservas = reservas.filter(reserva => 
    reserva.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    reserva.nombres.toLowerCase().includes(searchTerm.toLowerCase()) ||
    reserva.especialidadNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    reserva.medicoNombre.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Función para obtener el color del badge según el estado
  const getEstadoBadgeColor = (estado: string) => {
    switch (estado) {
      case "PENDIENTE":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "APROBADA":
        return "bg-green-100 text-green-800 border-green-200"
      case "DENEGADA":
        return "bg-red-100 text-red-800 border-red-200"
      case "OBSERVADA":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "ANULADA":
        return "bg-gray-100 text-gray-800 border-gray-200"
      case "EN REVISION":
        return "bg-orange-100 text-orange-800 border-orange-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  // Función para formatear turno
  const formatTurno = (turno: string) => {
    return turno === 'M' ? 'MAÑANA' : turno === 'T' ? 'TARDE' : turno
  }

  const totalPages = Math.ceil(totalElements / pageSize)

  return (
    <TipoCitaProvider>
      <SegurosCitaProvider>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          
          <main className="container mx-auto px-6 py-8">
            {/* Header */}
            <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between items-start">
              <div className="flex items-center gap-4">
                <Button 
                  variant="outline" 
                  onClick={() => router.push('/appointments')}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Volver a Citas
                </Button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Bandeja de Solicitudes de Reservas</h1>
                  <p className="text-gray-600">Gestión de citas médicas - Sistema Hospitalario</p>
                </div>
              </div>
              
              <Button
                variant="outline"
                onClick={() => {
                  loadEspecialidades()
                  loadReservas()
                }}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Actualizar
              </Button>
            </div>

            {/* Filtros y búsqueda */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Filtros y Búsqueda
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 flex-col sm:flex-row">
                  <div className="flex-1">
                    <label className="text-sm font-medium mb-2 block">Especialidad</label>
                    <Select
                      value={selectedEspecialidad}
                      onValueChange={(value) => {
                        setSelectedEspecialidad(value)
                        setCurrentPage(0) // Reset página al cambiar especialidad
                      }}
                      disabled={loadingEspecialidades}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar especialidad..." />
                      </SelectTrigger>
                      <SelectContent>
                        {especialidades.map((esp) => (
                          <SelectItem key={esp.idEspecialidad} value={esp.idEspecialidad}>
                            {esp.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1">
                    <label className="text-sm font-medium mb-2 block">Buscar</label>
                    <Input
                      placeholder="Buscar por código, paciente, especialidad o médico..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tabla de reservas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Solicitudes de Reservas
                  </span>
                  <span className="text-sm font-normal text-gray-500">
                    Mostrando {filteredReservas.length} de {totalElements} registros
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center items-center py-12">
                    <RefreshCw className="h-6 w-6 animate-spin" />
                    <span className="ml-2">Cargando reservas...</span>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50">
                          <TableHead className="font-semibold">CÓDIGO</TableHead>
                          <TableHead className="font-semibold">CITA_ID</TableHead>
                          <TableHead className="font-semibold">PACIENTE</TableHead>
                          <TableHead className="font-semibold">ESPECIALIDAD</TableHead>
                          <TableHead className="font-semibold">MÉDICO</TableHead>
                          <TableHead className="font-semibold">TURNO</TableHead>
                          <TableHead className="font-semibold">FECHA Y HORA</TableHead>
                          <TableHead className="font-semibold">ESTADO</TableHead>
                          <TableHead className="font-semibold">ACCIONES</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredReservas.map((reserva) => (
                          <TableRow key={reserva.codigo} className="hover:bg-gray-50">
                            <TableCell className="font-medium text-blue-600">
                              {reserva.codigo}
                            </TableCell>
                            <TableCell className="font-medium">
                              {reserva.citaId || '-'}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-gray-400" />
                                <div>
                                  <div className="font-medium">{reserva.nombres}</div>
                                  <div className="text-sm text-gray-500">{reserva.numeroDocumento}</div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">
                              {reserva.especialidadNombre}
                            </TableCell>
                            <TableCell>
                              {reserva.medicoNombre}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-purple-50 text-purple-700">
                                {formatTurno(reserva.turno)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-gray-400" />
                                <div>
                                  <div className="font-medium">{reserva.fecha}</div>
                                  <div className="text-sm text-gray-500">{reserva.hora}</div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant="outline" 
                                className={getEstadoBadgeColor(reserva.estado)}
                              >
                                {reserva.estado}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleRevisar(reserva)}
                                  disabled={loadingReservas.has(reserva.codigo)}
                                  className="flex items-center gap-2"
                                >
                                  <UserCheck className="h-4 w-4" />
                                  {loadingReservas.has(reserva.codigo)
                                    ? 'Cargando...' 
                                    : 'Revisar'
                                  }
                                </Button>
                {/*                 <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleVerFichaReferencia(reserva)}
                                  className="flex items-center gap-2"
                                >
                                  <FileText className="h-4 w-4" />
                                  Ver Imagen
                                </Button> */}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    
                    {filteredReservas.length === 0 && (
                      <div className="text-center py-12">
                        <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          No se encontraron reservas
                        </h3>
                        <p className="text-gray-500">
                          {searchTerm 
                            ? 'Intenta con otros términos de búsqueda' 
                            : 'No hay solicitudes de reservas disponibles para esta especialidad'
                          }
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Paginación */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6 pt-4 border-t">
                    <div className="text-sm text-gray-500">
                      Página {currentPage + 1} de {totalPages} - Total: {totalElements} registros
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                        disabled={currentPage === 0}
                      >
                        Anterior
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                        disabled={currentPage === totalPages - 1}
                      >
                        Siguiente
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </main>

          {/* Modal de asignación de paciente */}
          {(() => {
            console.log('🔍 Estados del modal:', {
              isModalOpen,
              hasPatientData: !!patientData,
              hasSelectedReserva: !!selectedReserva,
              patientData: patientData ? { HISTORIA: patientData.HISTORIA, NOMBRES: patientData.NOMBRES } : null,
              selectedReserva: selectedReserva ? { codigo: selectedReserva.codigo, nombres: selectedReserva.nombres } : null
            })
            return null
          })()}
          {isModalOpen && patientData && selectedReserva && (
            <PatientAssignmentReservedModal
              isOpen={isModalOpen}
              onClose={() => {
                setIsModalOpen(false)
                setSelectedReserva(null)
                setPatientData(null)
              }}
              patient={patientData}
              appointment={{
                codigo: selectedReserva.codigo,
                citaId: selectedReserva.citaId?.toString() || '',
                fecha: selectedReserva.fecha,
                hora: selectedReserva.hora,
                especialidad: selectedReserva.especialidad,
                especialidadNombre: selectedReserva.especialidadNombre,
                medico: selectedReserva.medico,
                medicoNombre: selectedReserva.medicoNombre,
                estado: selectedReserva.estado
              }}
              onApprove={(data: any) => {
                console.log('Aprobación de reserva:', data)
                // Aquí iría la lógica para aprobar la reserva
                toast({
                  title: "Reserva Aprobada",
                  description: "La solicitud ha sido aprobada correctamente",
                })
                setIsModalOpen(false)
                setSelectedReserva(null)
                setPatientData(null)
                loadReservas()
              }}
              onDeny={(motivo: string) => {
                console.log('Denegación de reserva:', motivo)
                // Aquí iría la lógica para denegar la reserva
                return Promise.resolve()
              }}
              onObserve={(motivo: string) => {
                console.log('Observación de reserva:', motivo)
                // Aquí iría la lógica para observar la reserva
                return Promise.resolve()
              }}
              onSuccess={() => {
                toast({
                  title: "Éxito",
                  description: "Reserva procesada correctamente",
                })
                setIsModalOpen(false)
                setSelectedReserva(null)
                setPatientData(null)
                // Recargar reservas
                loadReservas()
              }}
            />
          )}
        </div>
      </SegurosCitaProvider>
    </TipoCitaProvider>
  )
}
