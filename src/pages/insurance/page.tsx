"use client"

import { useState, useEffect, useCallback } from "react"
import { usePermissions } from "@/contexts/PermissionsContext"
import { PERMISOS } from "@/lib/permissions"
import { Button } from "@/components/ui/button"
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
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  RefreshCw,
  FilterX,
  Loader2,
  House,
  FileText,
  Search,
  ChevronsUpDown,
  Check,
  ChevronDown,
  Receipt,
  Eye,
  FileSpreadsheet,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Navbar } from "@/components/Navbar"
import ProtectedRoute from "@/components/ProtectedRoute"
import { FuaViewerModal } from "@/components/insurance/FuaViewerModal"
import { LiquidacionViewerModal } from "@/components/insurance/LiquidacionViewerModal"
import { DateRangePicker } from "@/components/insurance/DateRangePicker"
import {
  buscarAtencionesSeguro,
  exportarAtencionesSeguroExcel,
  obtenerFuaPorOrigen,
  listarTiposPrestacion,
  listarConsultoriosPorTipo,
  ORIGEN_TO_CONSULTORIO_TIPO,
  ESTADO_FUA_LABEL,
  ESTADO_FUA_BADGE,
  ESTADO_CUENTA_LABEL,
  ESTADO_CUENTA_BADGE,
  ORIGEN_LABEL,
  ORIGEN_BADGE,
  ORIGEN_ABBR,
  ESTADO_PROCESO_LABEL,
  estadoProcesoDisplay,
  type AtencionSeguro,
  type TipoPrestacionItem,
  type ConsultorioMaestroItem,
} from "@/services/insurance/insuranceAuditService"

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100, 200]
const DEFAULT_PAGE_SIZE = 20

// Tipos de origen para búsqueda de FUA
type FuaSearchOrigen = "CE" | "EM" | "HO" | "AD" | "AA"

// Primer día del mes actual (mantenido por si se reutiliza en otras pantallas)
function firstDayOfMonth(): Date {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

// Por defecto se busca solo el día actual para evitar saturar la búsqueda.
function startOfToday(): Date {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

export default function InsurancePage() {
  const { hasPermission } = usePermissions()
  const canExportar  = hasPermission(PERMISOS.SEGUROS.EXPORTAR)
  const canBuscarFua = hasPermission(PERMISOS.SEGUROS.BUSCAR_FUA)

  // Filtros (rango de fechas obligatorio)
  // Por defecto: solo el día actual (evita cargar demasiados resultados al ingresar).
  const [desde, setDesde] = useState<Date | undefined>(startOfToday())
  const [hasta, setHasta] = useState<Date | undefined>(startOfToday())
  const [origen, setOrigen] = useState<string>("TODOS")            // "TODOS" | "EM" | "HO" | "CE" | "AD"
  const [consultorio, setConsultorio] = useState<string>("")
  const [tipoPrestacion, setTipoPrestacion] = useState<string>("")
  const [estadoCuenta, setEstadoCuenta] = useState<string>("TODOS")
  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE)

  // Estado FUA tri-estado: "activo" | "anulado" | "todos". Por defecto: activo.
  const [estadoFuaFiltro, setEstadoFuaFiltro] = useState<"activo" | "anulado" | "todos">("activo")
  const estadoFuaBool: boolean | undefined =
    estadoFuaFiltro === "activo" ? true : estadoFuaFiltro === "anulado" ? false : undefined

  // Búsqueda avanzada por N° FUA (oculta tras checkbox)
  const [mostrarBusquedaFua, setMostrarBusquedaFua] = useState(false)
  const [fuaSearchOrigen, setFuaSearchOrigen] = useState<FuaSearchOrigen>("CE")
  const [fuaAnio, setFuaAnio] = useState(
    new Date().getFullYear().toString().slice(-2)
  )
  const [fuaNumero, setFuaNumero] = useState("")

  // Datos y estado
  const [atenciones, setAtenciones] = useState<AtencionSeguro[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    page: 0,
    size: DEFAULT_PAGE_SIZE,
    totalPages: 0,
    totalElements: 0,
  })

  // Selectores de consultorio
  const [consultorioOpen, setConsultorioOpen] = useState(false)
  const [consultorioSearch, setConsultorioSearch] = useState("")

  // Catálogo de tipos de prestación
  const [tiposPrestacion, setTiposPrestacion] = useState<TipoPrestacionItem[]>([])
  const [tipoPrestacionOpen, setTipoPrestacionOpen] = useState(false)
  const [tipoPrestacionSearch, setTipoPrestacionSearch] = useState("")

  // Catálogo de consultorios (según origen seleccionado)
  const [consultoriosMaestro, setConsultoriosMaestro] = useState<ConsultorioMaestroItem[]>([])
  const [loadingConsultorios, setLoadingConsultorios] = useState(false)

  // Modal de visualización de FUA
  const [fuaModalOpen, setFuaModalOpen] = useState(false)
  const [fuaModalRow, setFuaModalRow] = useState<AtencionSeguro | null>(null)

  // Modal de visualización de Liquidación
  const [liquidacionModalOpen, setLiquidacionModalOpen] = useState(false)
  const [liquidacionModalRow, setLiquidacionModalRow] = useState<AtencionSeguro | null>(null)

  // Exportar a Excel
  const [exportando, setExportando] = useState(false)

  const handleExportarExcel = async () => {
    if (!desde || !hasta) {
      setError("Seleccione un rango de fechas")
      return
    }
    setExportando(true)
    setError(null)
    try {
      const blob = await exportarAtencionesSeguroExcel({
        desde,
        hasta,
        origen: origen !== "TODOS" ? (origen as "EM" | "HO" | "CE" | "AD") : undefined,
        consultorio: consultorio || undefined,
        tipoPrestacion: tipoPrestacion.trim() || undefined,
        estadoFua: estadoFuaBool,
        estadoCuenta: estadoCuenta !== "TODOS" ? estadoCuenta : undefined,
        sis: true,
      })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      const dd = (d: Date) =>
        `${d.getFullYear()}${(d.getMonth() + 1).toString().padStart(2, "0")}${d
          .getDate()
          .toString()
          .padStart(2, "0")}`
      a.href = url
      a.download = `atenciones-sis_${dd(desde)}_${dd(hasta)}.xlsx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al exportar a Excel")
    } finally {
      setExportando(false)
    }
  }

  // Cargar catálogo de tipos de prestación al montar
  useEffect(() => {
    let active = true
    listarTiposPrestacion()
      .then((data) => {
        if (active) setTiposPrestacion(data)
      })
      .catch(() => {
        if (active) setTiposPrestacion([])
      })
    return () => {
      active = false
    }
  }, [])

  // Cargar catálogo de consultorios cuando cambia el origen
  //   TODOS → sin filtro, CE → tipo=C, EM → tipo=E, HO → tipo=H, AD → tipo=D
  useEffect(() => {
    let active = true
    const tipo = ORIGEN_TO_CONSULTORIO_TIPO[origen]
    setLoadingConsultorios(true)
    listarConsultoriosPorTipo(tipo, true)
      .then((data) => {
        if (!active) return
        setConsultoriosMaestro(data)
      })
      .catch(() => {
        if (!active) return
        setConsultoriosMaestro([])
      })
      .finally(() => {
        if (active) setLoadingConsultorios(false)
      })
    return () => {
      active = false
    }
  }, [origen])

  // Limpiar consultorio seleccionado si ya no está en el catálogo actual
  useEffect(() => {
    if (!consultorio) return
    if (consultoriosMaestro.length === 0) return
    const exists = consultoriosMaestro.some((c) => c.consultorio === consultorio)
    if (!exists) setConsultorio("")
  }, [consultoriosMaestro, consultorio])

  // Consultorios: vienen del catálogo maestro filtrado por origen
  const consultoriosUnicos = consultoriosMaestro

  const consultorioLabel = (() => {
    if (!consultorio) return "Todos los consultorios"
    const f = consultoriosMaestro.find((c) => c.consultorio === consultorio)
    return f ? `${f.consultorio} - ${f.nombreConsultorio}` : consultorio
  })()

  // Función principal: listar atenciones de seguro
  const cargarAtenciones = useCallback(
    async (page: number = 0) => {
      if (!desde || !hasta) {
        setError("Seleccione un rango de fechas")
        return
      }
      setLoading(true)
      setError(null)
      try {
        const response = await buscarAtencionesSeguro({
          desde,
          hasta,
          origen: origen !== "TODOS" ? (origen as "EM" | "HO" | "CE" | "AD") : undefined,
          consultorio: consultorio || undefined,
          tipoPrestacion: tipoPrestacion.trim() || undefined,
          estadoFua: estadoFuaBool,
          estadoCuenta: estadoCuenta !== "TODOS" ? estadoCuenta : undefined,
          sis: true, // siempre SIS
          page,
          size: pageSize,
        })
        // Defensivo: el backend puede devolver items null dentro de content
        // (p. ej. cuando tipoPrestacion=117 no existe en el maestro).
        const items = (response.content || []).filter(
          (x): x is AtencionSeguro => x != null && typeof x === "object"
        )
        setAtenciones(items)
        setPagination({
          page: response.number ?? 0,
          size: response.size ?? pageSize,
          totalPages: response.totalPages ?? 0,
          totalElements: response.totalElements ?? 0,
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al cargar las atenciones")
        setAtenciones([])
      } finally {
        setLoading(false)
      }
    },
    [desde, hasta, origen, consultorio, tipoPrestacion, estadoFuaBool, estadoCuenta, pageSize]
  )

  // Auto-cargar al cambiar filtros (con pequeño debounce para evitar lag al cambiar selects)
  useEffect(() => {
    if (mostrarBusquedaFua && fuaNumero.trim()) return
    const t = setTimeout(() => {
      cargarAtenciones(0)
    }, 250)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [desde, hasta, origen, consultorio, tipoPrestacion, estadoFuaBool, estadoCuenta, pageSize])

  // Búsqueda por N° FUA: consulta el endpoint JSON correspondiente al origen y
  // muestra el registro como una fila en la tabla.
  //   CE → /api/atencion-seguro/fua/consulta-externa?numatencion=...
  //   EM → /api/atencion-seguro/fua/emergencia?numatencion=...
  //   HO → /api/atencion-seguro/fua/hospitalizacion?numatencion=...
  const buscarPorFua = async () => {
    if (!fuaNumero.trim()) {
      setError("Ingrese un número de FUA")
      return
    }
    const numatencion = `00005947${fuaAnio}${fuaNumero.padStart(8, "0")}`
    setLoading(true)
    setError(null)
    try {
      const item = await obtenerFuaPorOrigen(fuaSearchOrigen, numatencion)
      setAtenciones([item])
      setPagination({ page: 0, size: 1, totalPages: 1, totalElements: 1 })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al buscar el FUA")
      setAtenciones([])
      setPagination({ page: 0, size: 0, totalPages: 0, totalElements: 0 })
    } finally {
      setLoading(false)
    }
  }

  const handleActualizar = () => {
    cargarAtenciones(pagination.page)
  }

  const handleLimpiarFiltros = () => {
    setDesde(startOfToday())
    setHasta(startOfToday())
    setOrigen("TODOS")
    setConsultorio("")
    setTipoPrestacion("")
    setEstadoCuenta("TODOS")
    setEstadoFuaFiltro("activo")
    setPageSize(DEFAULT_PAGE_SIZE)
    setFuaAnio(new Date().getFullYear().toString().slice(-2))
    setFuaNumero("")
    setFuaSearchOrigen("CE")
    setMostrarBusquedaFua(false)
  }

  const handlePageChange = (newPage: number) => {
    cargarAtenciones(newPage)
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="page-shell py-8">
          <div className="mb-6 flex flex-wrap items-center gap-3">
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
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-8 pb-6 border-b border-[#9CD2D3]/20">
              <h1 className="text-2xl font-semibold text-[#114C5F]">
                Lista de Atenciones SIS
              </h1>
              <div className="flex flex-wrap gap-3">
                 {canExportar && (
                  <Button
                    onClick={handleExportarExcel}
                    disabled={exportando || loading || !desde || !hasta}
                    className="text-white bg-[#1F7A4D] hover:bg-[#17633D] shadow-md disabled:opacity-60"
                  >
                    {exportando ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <FileSpreadsheet className="w-4 h-4 mr-2" />
                    )}
                    {exportando ? "Exportando..." : "Exportar Excel"}
                  </Button>
                )}
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

            {/* Filtros principales */}
            <div className="mb-8">
              {/* Fila 1: Rango de fechas | Origen | Consultorio */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Rango de fechas */}
                <DateRangePicker
                  from={desde}
                  to={hasta}
                  onSelect={(range) => {
                    setDesde(range.from)
                    setHasta(range.to)
                  }}
                  label="Rango de fechas *"
                  placeholder="Seleccione rango"
                />

                {/* Origen */}
                <div>
                  <Label className="block text-sm font-medium text-[#114C5F] mb-2">
                    Origen
                  </Label>
                  <Select value={origen} onValueChange={setOrigen}>
                    <SelectTrigger className="h-[38px] border-[#9CD2D3]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TODOS">Todos</SelectItem>
                      <SelectItem value="CE">Consulta Externa (CE)</SelectItem>
                      <SelectItem value="HO">Hospitalización (HO)</SelectItem>
                      <SelectItem value="EM">Emergencia (EM)</SelectItem>
                      <SelectItem value="AD">Apoyo al Diagnóstico (AD)</SelectItem>
                      <SelectItem value="AA">Atención Ambulatoria (AA)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Consultorio */}
                <div>
                  <Label className="block text-sm font-medium text-[#114C5F] mb-2">
                    Consultorio
                  </Label>
                  <Popover open={consultorioOpen} onOpenChange={setConsultorioOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between h-[38px] border-[#9CD2D3] font-normal"
                      >
                        <span className="truncate">{consultorioLabel}</span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full max-w-[360px] p-0" align="start">
                      <Command>
                        <CommandInput
                          placeholder="Buscar consultorio..."
                          value={consultorioSearch}
                          onValueChange={setConsultorioSearch}
                        />
                        <CommandList>
                          {loadingConsultorios && (
                            <div className="px-3 py-2 text-sm text-gray-500 flex flex-wrap items-center gap-2">
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Cargando consultorios...
                            </div>
                          )}
                          <CommandEmpty>No se encontraron consultorios</CommandEmpty>
                          <CommandGroup>
                            <CommandItem
                              value="todos"
                              onSelect={() => {
                                setConsultorio("")
                                setConsultorioOpen(false)
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  !consultorio ? "opacity-100" : "opacity-0"
                                )}
                              />
                              Todos los consultorios
                            </CommandItem>
                            {consultoriosUnicos
                              .filter((c) => {
                                const s = consultorioSearch.toLowerCase()
                                return (
                                  c.nombreConsultorio.toLowerCase().includes(s) ||
                                  c.consultorio.toLowerCase().includes(s)
                                )
                              })
                              .map((c, idx) => (
                                <CommandItem
                                  key={`${c.consultorio}-${idx}`}
                                  value={`${c.consultorio} ${c.nombreConsultorio}`}
                                  onSelect={() => {
                                    setConsultorio(c.consultorio)
                                    setConsultorioOpen(false)
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      consultorio === c.consultorio
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                  />
                                  {c.consultorio} - {c.nombreConsultorio}
                                </CommandItem>
                              ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

              </div>

              {/* Fila 2: Tipo de Prestación | Estado del FUA | Estado de Cuenta */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                {/* Tipo de Prestación (combobox con catálogo) */}
                <div>
                  <Label className="block text-sm font-medium text-[#114C5F] mb-2">
                    Tipo de Prestación
                  </Label>
                  <Popover open={tipoPrestacionOpen} onOpenChange={setTipoPrestacionOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between h-[38px] border-[#9CD2D3] font-normal"
                      >
                        <span className="truncate">
                          {(() => {
                            if (!tipoPrestacion) return "Todos los tipos"
                            const found = tiposPrestacion.find(
                              (t) => t.tipoPrestacion === tipoPrestacion
                            )
                            return found
                              ? `${found.tipoPrestacion} - ${found.nombre}`
                              : tipoPrestacion
                          })()}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full max-w-[360px] p-0" align="start">
                      <Command>
                        <CommandInput
                          placeholder="Buscar tipo de prestación..."
                          value={tipoPrestacionSearch}
                          onValueChange={setTipoPrestacionSearch}
                        />
                        <CommandList>
                          <CommandEmpty>No se encontraron tipos</CommandEmpty>
                          <CommandGroup>
                            <CommandItem
                              value="todos"
                              onSelect={() => {
                                setTipoPrestacion("")
                                setTipoPrestacionOpen(false)
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  !tipoPrestacion ? "opacity-100" : "opacity-0"
                                )}
                              />
                              Todos los tipos
                            </CommandItem>
                            {tiposPrestacion
                              .filter((t) => {
                                const s = tipoPrestacionSearch.toLowerCase()
                                return (
                                  t.tipoPrestacion.toLowerCase().includes(s) ||
                                  t.nombre.toLowerCase().includes(s)
                                )
                              })
                              .map((t) => (
                                <CommandItem
                                  key={t.tipoPrestacion}
                                  value={`${t.tipoPrestacion} ${t.nombre}`}
                                  onSelect={() => {
                                    setTipoPrestacion(t.tipoPrestacion)
                                    setTipoPrestacionOpen(false)
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      tipoPrestacion === t.tipoPrestacion
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                  />
                                  <span className="font-mono text-xs mr-2">{t.tipoPrestacion}</span>
                                  {t.nombre}
                                </CommandItem>
                              ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Estado del FUA (tri-estado: Activo / Anulado / Todos) */}
                <div>
                  <Label className="block text-sm font-medium text-[#114C5F] mb-2">
                    Estado del FUA
                  </Label>
                  <div className="flex flex-wrap items-center h-[38px] p-0.5 border border-[#9CD2D3] rounded-md bg-white">
                    {(["activo", "anulado", "todos"] as const).map((opt) => {
                      const isActive = estadoFuaFiltro === opt
                      const label =
                        opt === "activo" ? "Activo" : opt === "anulado" ? "Anulado" : "Todos"
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setEstadoFuaFiltro(opt)}
                          className={cn(
                            "flex-1 h-full text-xs font-medium rounded transition-colors",
                            isActive
                              ? opt === "activo"
                                ? "bg-green-100 text-green-800 border border-green-300 shadow-sm"
                                : opt === "anulado"
                                  ? "bg-red-100 text-red-800 border border-red-300 shadow-sm"
                                  : "bg-[#4F9BB6] text-white shadow-sm"
                              : "text-gray-600 hover:bg-gray-50"
                          )}
                        >
                          {label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Estado de Cuenta */}
                <div>
                  <Label className="block text-sm font-medium text-[#114C5F] mb-2">
                    Estado de la Cuenta
                  </Label>
                  <Select value={estadoCuenta} onValueChange={setEstadoCuenta}>
                    <SelectTrigger className="h-[38px] border-[#9CD2D3]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TODOS">Todos</SelectItem>
                      <SelectItem value="0">Anulada</SelectItem>
                      <SelectItem value="1">Activa</SelectItem>
                      <SelectItem value="2">Liquidada</SelectItem>
                      <SelectItem value="4">Auditada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Checkbox: búsqueda por N° FUA (oculto por defecto) */}
              {canBuscarFua && (
              <div className="mt-6 flex flex-wrap items-center gap-2">
                <Checkbox
                  id="mostrar-busqueda-fua"
                  checked={mostrarBusquedaFua}
                  onCheckedChange={(checked) => {
                    setMostrarBusquedaFua(checked as boolean)
                    if (!checked) setFuaNumero("")
                  }}
                />
                <label
                  htmlFor="mostrar-busqueda-fua"
                  className="text-sm font-medium text-[#114C5F] cursor-pointer"
                >
                  Búsqueda por N° de FUA
                </label>
              </div>
              )}

              {mostrarBusquedaFua && (
                <div className="mt-4 p-4 bg-gradient-to-r from-[#4F9BB6]/5 to-[#9CD2D3]/5 rounded-lg border border-[#9CD2D3]/30">
                  <div className="grid grid-cols-1 sm:grid-cols-[180px,1fr] gap-4 items-end">
                    {/* Origen del FUA */}
                    <div>
                      <Label className="block text-sm font-medium text-[#114C5F] mb-2">
                        Origen
                      </Label>
                      <Select
                        value={fuaSearchOrigen}
                        onValueChange={(v) =>
                          setFuaSearchOrigen(v as FuaSearchOrigen)
                        }
                      >
                        <SelectTrigger className="h-[38px] border-[#9CD2D3]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CE">Consulta Externa (CE)</SelectItem>
                          <SelectItem value="HO">Hospitalización (HO)</SelectItem>
                          <SelectItem value="EM">Emergencia (EM)</SelectItem>
                          <SelectItem value="AD">Apoyo al Diagnóstico (AD)</SelectItem>
                          <SelectItem value="AA">Atención Ambulatoria (AA)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* N° FUA */}
                    <div>
                      <Label className="block text-sm font-medium text-[#114C5F] mb-2">
                        N° FUA
                      </Label>
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-1">
                        <span className="text-sm font-mono text-[#114C5F] bg-gray-100 px-2 py-1.5 rounded-l-md border border-r-0 border-[#9CD2D3] h-[38px] flex flex-wrap items-center">
                          00005947
                        </span>
                        <select
                          value={fuaAnio}
                          onChange={(e) => setFuaAnio(e.target.value)}
                          className="w-full sm:w-16 text-sm font-mono px-1 py-1.5 border border-[#9CD2D3] rounded-md h-[38px] text-[#114C5F]"
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
                        <input
                          type="text"
                          value={fuaNumero}
                          onChange={(e) =>
                            setFuaNumero(e.target.value.replace(/\D/g, "").slice(0, 8))
                          }
                          onKeyDown={(e) => e.key === "Enter" && buscarPorFua()}
                          placeholder="00073838"
                          maxLength={8}
                          className="flex-1 min-w-0 text-sm font-mono px-2 py-1.5 border border-[#9CD2D3] rounded-md h-[38px] text-[#114C5F]"
                        />
                        <Button
                          onClick={buscarPorFua}
                          disabled={!fuaNumero.trim() || loading}
                          className="w-full sm:w-auto bg-[#4F9BB6] hover:bg-[#4A6EB0] text-white h-[38px] px-4"
                        >
                          <Search className="w-4 h-4 mr-2" />
                          Buscar
                        </Button>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Al buscar por N° de FUA, se abre directamente el documento usando el endpoint del origen seleccionado.
                  </p>
                </div>
              )}
            </div>

            {/* Tabla */}
            <div className="border border-[#9CD2D3]/30 rounded-xl overflow-x-auto table-responsive shadow-sm">
              <Table className="text-sm min-w-[1100px]">
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-[#4F9BB6]/10 to-[#9CD2D3]/10">
                    <TableHead className="font-semibold text-[#114C5F] text-sm px-2 py-2 w-[56px] text-center" title="Origen: E=Emergencia, AD=Apoyo al Diagnóstico, HO=Hospitalización, CE=Consulta Externa">ORIG.</TableHead>
                    <TableHead className="font-semibold text-[#114C5F] text-sm px-2 py-2">N° FUA / ID</TableHead>
                    <TableHead className="font-semibold text-[#114C5F] text-sm px-2 py-2">CUENTA</TableHead>
                    <TableHead className="font-semibold text-[#114C5F] text-sm px-2 py-2 w-[200px]">PACIENTE</TableHead>
                    <TableHead className="font-semibold text-[#114C5F] text-sm px-2 py-2 w-[220px]">CONSULTORIO / MÉDICO</TableHead>
                    <TableHead className="font-semibold text-[#114C5F] text-sm px-2 py-2 text-center">PREST.</TableHead>
                    <TableHead className="font-semibold text-[#114C5F] text-sm px-2 py-2">FECHA / HORA</TableHead>
                    <TableHead className="font-semibold text-[#114C5F] text-sm px-2 py-2 w-[170px]">USUARIO</TableHead>
                    <TableHead className="font-semibold text-[#114C5F] text-sm px-2 py-2 text-center">ESTADO</TableHead>
                    <TableHead className="font-semibold text-[#114C5F] text-sm px-2 py-2 text-center">FUA</TableHead>
                    <TableHead className="font-semibold text-[#114C5F] text-sm px-2 py-2 text-center">CUENTA</TableHead>
                    <TableHead className="font-semibold text-[#114C5F] text-sm px-2 py-2 text-center">ACCIONES</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={12} className="text-center py-12">
                        <div className="flex flex-col items-center gap-3">
                          <Loader2 className="w-8 h-8 animate-spin text-[#4F9BB6]" />
                          <p className="text-gray-500">Cargando atenciones...</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : error ? (
                    <TableRow>
                      <TableCell colSpan={12} className="text-center py-12">
                        <div className="flex flex-col items-center gap-3">
                          <p className="text-red-500 font-medium">Error al cargar datos</p>
                          <p className="text-gray-500 text-sm">{error}</p>
                          <Button
                            onClick={() => cargarAtenciones(0)}
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
                      <TableCell colSpan={12} className="text-center py-12">
                        <p className="text-gray-500">
                          No se encontraron atenciones con los filtros seleccionados
                        </p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    atenciones.map((a, index) => {
                      const estadoFuaKey = String(a.estadoFua ?? "")
                      const estadoCuentaKey = String(a.estadoCuenta ?? "")
                      const estadoProcesoKey = String(a.estadoProceso ?? "").trim()
                      const origenKey = (a.origen || "").trim()
                      const origenAbbr = ORIGEN_ABBR[origenKey] || origenKey || "—"
                      const origenLabel = ORIGEN_LABEL[origenKey] || origenKey || "—"
                      const estadoProcesoInfo = estadoProcesoDisplay(origenKey, estadoProcesoKey)
                      const estadoProcesoTitle = origenKey === "CE" ? (ESTADO_PROCESO_LABEL[estadoProcesoKey] || "Sin estado") : estadoProcesoInfo.label
                      return (
                        <TableRow key={`${a.rowId || a.atencionSeguroId}-${index}`}>
                          <TableCell className="px-2 py-2 w-[56px] text-center" title={origenLabel}>
                            <span
                              className={cn(
                                "px-2 py-0.5 rounded-md text-xs font-bold whitespace-nowrap",
                                ORIGEN_BADGE[origenKey] ||
                                  "bg-gray-100 text-gray-800 border border-gray-300"
                              )}
                            >
                              {origenAbbr}
                            </span>
                          </TableCell>
                          <TableCell className="px-2 py-2 font-mono text-sm">
                            <div className="flex flex-col leading-tight">
                              <span>{a.numeroFua?.toString().trim() || "—"}</span>
                              <span className="text-xs text-gray-500">
                                ID: {a.idOrigenTecnico?.toString().trim() || "—"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="px-2 py-2 font-mono text-sm">
                            {a.idCuenta?.toString().trim() || "—"}
                          </TableCell>
                          <TableCell className="px-2 py-2 w-[200px]">
                            <div className="flex flex-col leading-tight">
                              <span className="font-medium text-sm">
                                {a.pacienteNombre?.trim() || "—"}
                              </span>
                              <span className="text-xs text-gray-500 font-mono">
                                {a.pacienteId || "—"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="px-2 py-2 w-[220px] text-sm">
                            <div className="flex flex-col leading-tight">
                              <span className="font-medium">
                                {a.consultorioNombre?.trim() || "—"}
                              </span>
                              <span className="text-xs text-gray-500">
                                {a.medicoNombre?.trim() || "—"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="px-2 py-2 text-center">
                            <div className="flex flex-col leading-tight">
                              <span className="font-mono text-xs text-gray-500">
                                {a.tipoPrestacion?.trim() || "—"}
                              </span>
                              <span className="text-sm">
                                {a.tipoPrestacionNombre?.trim() || ""}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="px-2 py-2 text-sm">
                            {a.fecha ? (
                              <div className="flex flex-col leading-tight">
                                <span>
                                  {new Date(a.fecha).toLocaleDateString("es-PE")}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {a.hora?.trim() || ""}
                                </span>
                              </div>
                            ) : (
                              "—"
                            )}
                          </TableCell>
                          <TableCell className="px-2 py-2 w-[170px] text-sm">
                            {a.usuario || a.usuarioNombre ? (
                              <div className="flex flex-col leading-tight">
                                <span className="font-medium" title={a.usuarioNombre?.trim() || ""}>
                                  {a.usuarioNombre?.trim() || "—"}
                                </span>
                                <span className="text-xs text-gray-500 font-mono">
                                  {a.usuario?.trim() || "—"}
                                </span>
                              </div>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </TableCell>
                          <TableCell className="px-2 py-2 text-center">
                            <span
                              className={cn(
                                "px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap",
                                estadoProcesoInfo.className
                              )}
                              title={estadoProcesoTitle}
                            >
                              {estadoProcesoInfo.label}
                            </span>
                          </TableCell>
                          <TableCell className="px-2 py-2 text-center">
                            <span
                              className={cn(
                                "px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap",
                                ESTADO_FUA_BADGE[estadoFuaKey] ||
                                  "bg-gray-100 text-gray-800 border border-gray-300"
                              )}
                            >
                              {ESTADO_FUA_LABEL[estadoFuaKey] || "—"}
                            </span>
                          </TableCell>
                          <TableCell className="px-2 py-2 text-center">
                            <span
                              className={cn(
                                "px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap",
                                ESTADO_CUENTA_BADGE[estadoCuentaKey] ||
                                  "bg-gray-100 text-gray-800 border border-gray-300"
                              )}
                            >
                              {ESTADO_CUENTA_LABEL[estadoCuentaKey] || "—"}
                            </span>
                          </TableCell>
                          <TableCell className="px-2 py-2 text-center">
                            {origenKey === "CE" ? (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    size="sm"
                                    className="h-7 px-2 text-xs bg-[#4F9BB6] hover:bg-[#4A6EB0] text-white shadow-sm"
                                  >
                                    <Eye className="w-3.5 h-3.5 mr-1" />
                                    Ver
                                    <ChevronDown className="w-3.5 h-3.5 ml-0.5" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                  <DropdownMenuLabel className="text-[#114C5F]">
                                    Documentos disponibles
                                  </DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setFuaModalRow(a)
                                      setFuaModalOpen(true)
                                    }}
                                    className="cursor-pointer"
                                  >
                                    <FileText className="w-4 h-4 mr-2 text-[#4F9BB6]" />
                                    FUA
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setLiquidacionModalRow(a)
                                      setLiquidacionModalOpen(true)
                                    }}
                                    className="cursor-pointer"
                                  >
                                    <Receipt className="w-4 h-4 mr-2 text-[#4F9BB6]" />
                                    Liquidación
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            ) : (
                              <span className="text-xs text-gray-400 italic">
                                Sin acciones
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Paginación */}
            {!loading && atenciones.length > 0 && (
              <div className="mt-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="flex flex-wrap items-center gap-4">
                  <p className="text-sm text-gray-600">
                    Mostrando {pagination.page * pagination.size + 1} -{" "}
                    {Math.min(
                      (pagination.page + 1) * pagination.size,
                      pagination.totalElements
                    )}{" "}
                    de {pagination.totalElements} resultados
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <Label className="text-sm text-gray-600 whitespace-nowrap">Por página:</Label>
                    <Select
                      value={String(pageSize)}
                      onValueChange={(v) => setPageSize(Number(v))}
                    >
                      <SelectTrigger className="h-8 w-[80px] border-[#9CD2D3]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PAGE_SIZE_OPTIONS.map((s) => (
                          <SelectItem key={s} value={String(s)}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {pagination.totalPages > 1 && (
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
                )}
              </div>
            )}
          </div>
        </main>

        {/* Modal de visualización de FUA:
              1° intento: FUA firmado por idDocumento (detalleId / idOrigenTecnico)
              2° intento: /reporte/fua?citaId=... */}
        <FuaViewerModal
          open={fuaModalOpen}
          onClose={() => setFuaModalOpen(false)}
          citaId={fuaModalRow?.idOrigenTecnico?.toString().trim() || ""}
          idDocumento={fuaModalRow?.idOrigenTecnico?.toString().trim()}
          numeroFua={fuaModalRow?.numeroFua?.toString().trim()}
        />

        {/* Modal de visualización de Liquidación:
              1° intento: Liquidación firmada por idDocumento (detalleId / idOrigenTecnico)
              2° intento: /reporte/liquidacion?citaId=... */}
        <LiquidacionViewerModal
          open={liquidacionModalOpen}
          onClose={() => setLiquidacionModalOpen(false)}
          citaId={liquidacionModalRow?.idOrigenTecnico?.toString().trim() || ""}
          idDocumento={liquidacionModalRow?.idOrigenTecnico?.toString().trim()}
          cuentaId={liquidacionModalRow?.idCuenta}
        />
      </div>
    </ProtectedRoute>
  )
}
