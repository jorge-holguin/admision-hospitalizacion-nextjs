"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Calendar } from "@/components/ui/calendar"
import { Checkbox } from "@/components/ui/checkbox"
import {
  RefreshCw,
  FilterX,
  Loader2,
  Check,
  CalendarIcon,
  ChevronsUpDown,
  House,
  FileText,
} from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { Navbar } from "@/components/Navbar"
import ProtectedRoute from "@/components/ProtectedRoute"
import { TurnoSelector } from "@/components/insurance/TurnoSelector"
import { FuaViewerModal } from "@/components/insurance/FuaViewerModal"
import { EspecialidadSelector } from "@/components/insurance/EspecialidadSelector"
import {
  buscarCitas,
  buscarCitaPorId,
  buscarCitaIdPorNumAtencion,
  listarMedicos,
  ESTADO_FUA_LABEL,
  ESTADO_FUA_BADGE,
  type Cita,
  type MedicoItem,
} from "@/services/insurance/insuranceAuditService"

const PAGE_SIZE = 20

export default function InsurancePage() {
  // Filtros
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [especialidadId, setEspecialidadId] = useState<string>("")
  const [medico, setMedico] = useState<string>("todos")
  const [turno, setTurno] = useState<"M" | "T" | "TODOS">("TODOS")
  const [estadoFua, setEstadoFua] = useState<string>("TODOS") // "TODOS" = sin filtro

  // Búsqueda por FUA
  const [fuaAnio, setFuaAnio] = useState(
    new Date().getFullYear().toString().slice(-2)
  )
  const [fuaNumero, setFuaNumero] = useState("")

  // Búsqueda por ID de cita
  const [mostrarBusquedaCita, setMostrarBusquedaCita] = useState(false)
  const [citaIdInput, setCitaIdInput] = useState("")

  // Datos y estado
  const [atenciones, setAtenciones] = useState<Cita[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    page: 0,
    size: PAGE_SIZE,
    totalPages: 0,
    totalElements: 0,
  })

  // Médicos
  const [medicos, setMedicos] = useState<MedicoItem[]>([])
  const [loadingMedicos, setLoadingMedicos] = useState(false)
  const [medicoOpen, setMedicoOpen] = useState(false)
  const [medicoSearch, setMedicoSearch] = useState("")

  // Modal de visualización de FUA
  const [fuaModalOpen, setFuaModalOpen] = useState(false)
  const [fuaModalCita, setFuaModalCita] = useState<Cita | null>(null)

  // Cargar médicos cuando cambia la especialidad o la fecha
  useEffect(() => {
    if (!especialidadId || !selectedDate) {
      setMedicos([])
      setMedico("todos")
      return
    }
    let active = true
    setLoadingMedicos(true)
    listarMedicos(selectedDate, selectedDate, especialidadId)
      .then((data) => {
        if (active) setMedicos(data)
      })
      .catch(() => {
        if (active) setMedicos([])
      })
      .finally(() => {
        if (active) setLoadingMedicos(false)
      })
    return () => {
      active = false
    }
  }, [especialidadId, selectedDate])

  // Función principal: listar FUAs
  const cargarCitas = useCallback(
    async (page: number = 0) => {
      setLoading(true)
      setError(null)
      try {
        const response = await buscarCitas({
          desde: selectedDate,
          hasta: selectedDate,
          especialidadSolicitudArray: especialidadId ? [especialidadId] : undefined,
          medico: medico !== "todos" ? medico : undefined,
          turnoConsulta: turno !== "TODOS" ? turno : undefined,
          estadoFua: estadoFua !== "TODOS" ? estadoFua : undefined,
          sis: true,
          page,
          size: PAGE_SIZE,
        })
        setAtenciones(response.content || [])
        setPagination({
          page: response.number ?? 0,
          size: response.size ?? PAGE_SIZE,
          totalPages: response.totalPages ?? 0,
          totalElements: response.totalElements ?? 0,
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al cargar las citas")
        setAtenciones([])
      } finally {
        setLoading(false)
      }
    },
    [selectedDate, especialidadId, medico, turno, estadoFua]
  )

  // Auto-cargar al cambiar filtros
  useEffect(() => {
    if (mostrarBusquedaCita && citaIdInput.trim()) return
    if (fuaNumero.trim()) return
    cargarCitas(0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, especialidadId, medico, turno, estadoFua])

  // Búsqueda por ID de cita
  const buscarPorCitaId = async () => {
    if (!citaIdInput.trim()) {
      setError("Ingrese un ID de cita")
      return
    }
    setLoading(true)
    setError(null)
    try {
      const cita = await buscarCitaPorId(citaIdInput.trim())
      setAtenciones([cita])
      setPagination({ page: 0, size: 1, totalPages: 1, totalElements: 1 })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al buscar la cita")
      setAtenciones([])
    } finally {
      setLoading(false)
    }
  }

  // Búsqueda por N° FUA
  const buscarPorFua = async () => {
    if (!fuaNumero.trim()) {
      setError("Ingrese un número de FUA")
      return
    }
    const numatencion = `00005947${fuaAnio}${fuaNumero.padStart(8, "0")}`
    setLoading(true)
    setError(null)
    try {
      // 1) Obtener citaId a partir del numatencion
      const citaId = await buscarCitaIdPorNumAtencion(numatencion)
      if (!citaId || citaId === "undefined") {
        throw new Error(`No se encontró una cita para el FUA ${numatencion}`)
      }
      // 2) Obtener el detalle completo de la cita
      const citaCompleta = await buscarCitaPorId(citaId)
      setAtenciones([citaCompleta])
      setPagination({ page: 0, size: 1, totalPages: 1, totalElements: 1 })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al buscar el FUA")
      setAtenciones([])
    } finally {
      setLoading(false)
    }
  }

  const handleActualizar = () => {
    cargarCitas(pagination.page)
  }

  const handleLimpiarFiltros = () => {
    setEspecialidadId("")
    setMedico("todos")
    setTurno("TODOS")
    setEstadoFua("TODOS")
    setFuaAnio(new Date().getFullYear().toString().slice(-2))
    setFuaNumero("")
    setCitaIdInput("")
    setMostrarBusquedaCita(false)
    setSelectedDate(new Date())
  }

  const handlePageChange = (newPage: number) => {
    cargarCitas(newPage)
  }

  const medicoSeleccionadoLabel = (() => {
    if (medico === "todos") return "Todos los médicos"
    const f = medicos.find((m) => m.medico?.trim() === medico?.trim())
    return f ? `${f.medico?.trim()} - ${f.nombreMedico?.trim()}` : medico
  })()

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="container mx-auto px-6 py-8">
          <div className="mb-6 flex items-center gap-3">
            <Button
              variant="destructive"
              size="lg"
              className="font-bold text-lg"
              onClick={() => (window.location.href = "/dashboard")}
            >
              <House className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-[#9CD2D3]/30 p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8 pb-6 border-b border-[#9CD2D3]/20">
              <h1 className="text-2xl font-semibold text-[#114C5F]">
                Lista de Atenciones
              </h1>
              <div className="flex gap-3">
                <Button
                  onClick={handleActualizar}
                  className="text-white bg-[#4F9BB6] hover:bg-[#4A6EB0] shadow-md"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Actualizar
                </Button>
                <Button
                  onClick={handleLimpiarFiltros}
                  variant="outline"
                  className="border-[#9CD2D3] text-[#114C5F] hover:bg-[#9CD2D3]/10"
                >
                  <FilterX className="w-4 h-4 mr-2" />
                  Limpiar Filtros
                </Button>
              </div>
            </div>

            {/* Filtros */}
            <div className="mb-8">
              {/* Checkbox: Buscar por ID */}
              <div className="mb-4 flex items-center space-x-2">
                <Checkbox
                  id="mostrar-busqueda-cita"
                  checked={mostrarBusquedaCita}
                  onCheckedChange={(checked) => {
                    setMostrarBusquedaCita(checked as boolean)
                    if (!checked) setCitaIdInput("")
                  }}
                />
                <label
                  htmlFor="mostrar-busqueda-cita"
                  className="text-sm font-medium text-[#114C5F] cursor-pointer"
                >
                  Buscar por ID de Cita
                </label>
              </div>

              {mostrarBusquedaCita && (
                <div className="mb-6 p-4 bg-gradient-to-r from-[#4F9BB6]/5 to-[#9CD2D3]/5 rounded-lg border border-[#9CD2D3]/30">
                  <Label className="block text-sm font-medium text-[#114C5F] mb-2">
                    ID de Cita
                  </Label>
                  <div className="flex gap-3">
                    <Input
                      value={citaIdInput}
                      onChange={(e) => setCitaIdInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && buscarPorCitaId()}
                      placeholder="Ej: 260086047"
                      className="flex-1"
                    />
                    <Button
                      onClick={buscarPorCitaId}
                      disabled={!citaIdInput.trim() || loading}
                      className="bg-[#4F9BB6] hover:bg-[#4A6EB0] text-white"
                    >
                      Buscar
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Al buscar por ID, los demás filtros se ignorarán
                  </p>
                </div>
              )}

              {/* Grid de filtros */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Fecha */}
                <div>
                  <Label className="block text-sm font-medium text-[#114C5F] mb-2">
                    Fecha
                  </Label>
                  <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-between font-normal h-[38px] border-[#9CD2D3] text-[#114C5F]",
                          !selectedDate && "text-muted-foreground"
                        )}
                      >
                        {selectedDate ? format(selectedDate, "dd/MM/yyyy") : "Seleccione"}
                        <CalendarIcon className="h-4 w-4 opacity-60" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={(d) => {
                          if (d) setSelectedDate(d)
                          setCalendarOpen(false)
                        }}
                        locale={es}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Buscar por N° FUA */}
                <div>
                  <Label className="block text-sm font-medium text-[#114C5F] mb-2">
                    Buscar por N° FUA
                  </Label>
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-mono text-[#114C5F] bg-gray-100 px-2 py-1.5 rounded-l-md border border-r-0 border-[#9CD2D3] h-[38px] flex items-center">
                      00005947
                    </span>
                    <span className="text-sm text-gray-400">-</span>
                    <select
                      value={fuaAnio}
                      onChange={(e) => setFuaAnio(e.target.value)}
                      className="w-16 text-sm font-mono px-1 py-1.5 border border-[#9CD2D3] rounded-md h-[38px] text-[#114C5F]"
                    >
                      {Array.from({ length: 5 }, (_, i) => {
                        const y = new Date().getFullYear() - 2 + i
                        return (
                          <option key={y} value={y.toString().slice(-2)}>
                            {y.toString().slice(-2)}
                          </option>
                        )
                      })}
                    </select>
                    <span className="text-sm text-gray-400">-</span>
                    <input
                      type="text"
                      value={fuaNumero}
                      onChange={(e) =>
                        setFuaNumero(e.target.value.replace(/\D/g, "").slice(0, 8))
                      }
                      onKeyDown={(e) => e.key === "Enter" && buscarPorFua()}
                      placeholder="00071055"
                      maxLength={8}
                      className="w-28 text-sm font-mono px-2 py-1.5 border border-[#9CD2D3] rounded-md h-[38px] text-[#114C5F]"
                    />
                    <Button
                      onClick={buscarPorFua}
                      disabled={!fuaNumero.trim() || loading}
                      className="ml-2 bg-[#4F9BB6] hover:bg-[#4A6EB0] text-white h-[38px] px-4"
                    >
                      Buscar
                    </Button>
                  </div>
                </div>

                {/* Turno */}
                <TurnoSelector value={turno} onChange={setTurno} />

                {/* Especialidad (single-select) */}
                <EspecialidadSelector
                  value={especialidadId}
                  onChange={setEspecialidadId}
                  label="Especialidad"
                />

                {/* Médico */}
                <div>
                  <Label className="block text-sm font-medium text-[#114C5F] mb-2">
                    Médico
                  </Label>
                  {especialidadId ? (
                    <Popover open={medicoOpen} onOpenChange={setMedicoOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          className="w-full justify-between h-[38px] border-[#9CD2D3] font-normal"
                        >
                          <span className="truncate">{medicoSeleccionadoLabel}</span>
                          <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[360px] p-0" align="start">
                        <Command>
                          <CommandInput
                            placeholder="Buscar médico..."
                            value={medicoSearch}
                            onValueChange={setMedicoSearch}
                          />
                          <CommandList>
                            {loadingMedicos && (
                              <div className="px-3 py-2 text-sm text-gray-500">
                                Cargando...
                              </div>
                            )}
                            <CommandEmpty>No se encontraron médicos</CommandEmpty>
                            <CommandGroup>
                              <CommandItem
                                value="todos"
                                onSelect={() => {
                                  setMedico("todos")
                                  setMedicoOpen(false)
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    medico === "todos" ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                Todos los médicos
                              </CommandItem>
                              {medicos
                                .filter((m) => {
                                  const s = medicoSearch.toLowerCase()
                                  return (
                                    m.nombreMedico?.toLowerCase().includes(s) ||
                                    m.medico?.toLowerCase().includes(s)
                                  )
                                })
                                .map((m, idx) => {
                                  const cod = m.medico?.trim() || ""
                                  return (
                                    <CommandItem
                                      key={`${cod}-${idx}`}
                                      value={`${cod} ${m.nombreMedico}`}
                                      onSelect={() => {
                                        setMedico(cod)
                                        setMedicoOpen(false)
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          medico === cod ? "opacity-100" : "opacity-0"
                                        )}
                                      />
                                      {cod} - {m.nombreMedico?.trim()}
                                    </CommandItem>
                                  )
                                })}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  ) : (
                    <div className="h-[38px] px-3 flex items-center text-sm text-gray-500 bg-gray-100 border border-gray-200 rounded-md">
                      Seleccione una especialidad primero
                    </div>
                  )}
                </div>

                {/* Estado */}
                <div>
                  <Label className="block text-sm font-medium text-[#114C5F] mb-2">
                    Estado del FUA
                  </Label>
                  <Select value={estadoFua} onValueChange={setEstadoFua}>
                    <SelectTrigger className="h-[38px] border-[#9CD2D3]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TODOS">Todos</SelectItem>
                      <SelectItem value="0">Anulado</SelectItem>
                      <SelectItem value="1">Activo</SelectItem>
                      <SelectItem value="2">Liquidado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Tabla */}
            <div className="border border-[#9CD2D3]/30 rounded-xl overflow-hidden shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-[#4F9BB6]/10 to-[#9CD2D3]/10">
                    <TableHead className="font-semibold text-[#114C5F]">N° FUA</TableHead>
                    <TableHead className="font-semibold text-[#114C5F]">CITA ID</TableHead>
                    <TableHead className="font-semibold text-[#114C5F]">PACIENTE</TableHead>
                    <TableHead className="font-semibold text-[#114C5F]">HISTORIA</TableHead>
                    <TableHead className="font-semibold text-[#114C5F]">CONSULTORIO</TableHead>
                    <TableHead className="font-semibold text-[#114C5F]">MÉDICO</TableHead>
                    <TableHead className="font-semibold text-[#114C5F] text-center">PRESTACIÓN</TableHead>
                    <TableHead className="font-semibold text-[#114C5F]">FECHA Y HORA</TableHead>
                    <TableHead className="font-semibold text-[#114C5F]">ESTADO</TableHead>
                    <TableHead className="font-semibold text-[#114C5F] text-center">ACCIONES</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-12">
                        <div className="flex flex-col items-center gap-3">
                          <Loader2 className="w-8 h-8 animate-spin text-[#4F9BB6]" />
                          <p className="text-gray-500">Cargando atenciones...</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : error ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-12">
                        <div className="flex flex-col items-center gap-3">
                          <p className="text-red-500 font-medium">Error al cargar datos</p>
                          <p className="text-gray-500 text-sm">{error}</p>
                          <Button
                            onClick={() => cargarCitas(0)}
                            variant="outline"
                            className="mt-2"
                          >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Reintentar
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : atenciones.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-12">
                        <p className="text-gray-500">
                          No se encontraron atenciones con los filtros seleccionados
                        </p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    atenciones.map((a, index) => {
                      const estadoFuaKey = a.estadoFua != null ? String(a.estadoFua) : ""
                      return (
                        <TableRow key={`${a.citaId}-${index}`}>
                          <TableCell className="font-mono text-sm">
                            {a.numAtencion?.toString().trim() ||
                              a.numeroFua?.toString().trim() ||
                              "—"}
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {a.citaId}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {a.pacienteNombre?.trim() || a.nombre}
                              </span>
                              <span className="text-xs text-gray-500">
                                {a.pacienteId || a.paciente}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            {a.numeroHistoria?.trim() || a.historia || "—"}
                          </TableCell>
                          <TableCell>{a.consultorioNombre}</TableCell>
                          <TableCell>{a.medicoNombre}</TableCell>
                          <TableCell className="text-center font-mono text-sm">
                            {a.tipoPrestacion?.trim() || "—"}
                          </TableCell>
                          <TableCell>
                            {a.fecha && a.hora ? (
                              <div className="flex flex-col">
                                <span>
                                  {new Date(a.fecha).toLocaleDateString("es-PE")}
                                </span>
                                <span className="text-xs text-gray-500">{a.hora}</span>
                              </div>
                            ) : (
                              "—"
                            )}
                          </TableCell>
                          <TableCell>
                            <span
                              className={cn(
                                "px-3 py-1 rounded-full text-xs font-semibold",
                                ESTADO_FUA_BADGE[estadoFuaKey] ||
                                  "bg-gray-100 text-gray-800 border border-gray-300"
                              )}
                            >
                              {ESTADO_FUA_LABEL[estadoFuaKey] || "—"}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <Button
                              size="sm"
                              onClick={() => {
                                setFuaModalCita(a)
                                setFuaModalOpen(true)
                              }}
                              className="bg-[#4F9BB6] hover:bg-[#4A6EB0] text-white shadow-sm"
                            >
                              <FileText className="w-4 h-4 mr-1" />
                              Ver FUA
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Paginación */}
            {!loading && atenciones.length > 0 && pagination.totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Mostrando {pagination.page * pagination.size + 1} -{" "}
                  {Math.min(
                    (pagination.page + 1) * pagination.size,
                    pagination.totalElements
                  )}{" "}
                  de {pagination.totalElements} resultados
                </p>
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() =>
                          pagination.page > 0 && handlePageChange(pagination.page - 1)
                        }
                        className={
                          pagination.page === 0
                            ? "pointer-events-none opacity-50"
                            : "cursor-pointer"
                        }
                      />
                    </PaginationItem>
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      const pageNum =
                        pagination.page < 3 ? i : pagination.page - 2 + i
                      if (pageNum >= pagination.totalPages) return null
                      return (
                        <PaginationItem key={pageNum}>
                          <PaginationLink
                            onClick={() => handlePageChange(pageNum)}
                            isActive={pageNum === pagination.page}
                            className="cursor-pointer"
                          >
                            {pageNum + 1}
                          </PaginationLink>
                        </PaginationItem>
                      )
                    })}
                    <PaginationItem>
                      <PaginationNext
                        onClick={() =>
                          pagination.page < pagination.totalPages - 1 &&
                          handlePageChange(pagination.page + 1)
                        }
                        className={
                          pagination.page >= pagination.totalPages - 1
                            ? "pointer-events-none opacity-50"
                            : "cursor-pointer"
                        }
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </div>
        </main>

        {/* Modal de visualización de FUA */}
        <FuaViewerModal
          open={fuaModalOpen}
          onClose={() => setFuaModalOpen(false)}
          citaId={fuaModalCita?.citaId || ""}
          numeroFua={
            fuaModalCita?.numAtencion?.toString().trim() ||
            fuaModalCita?.numeroFua?.toString().trim()
          }
        />
      </div>
    </ProtectedRoute>
  )
}
