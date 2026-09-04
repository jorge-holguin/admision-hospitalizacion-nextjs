"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Loader2, RefreshCw, Download, FilterX } from "lucide-react"
import { getEspecialidades, Especialidad } from "@/services/master-tables/especialidadService"
import {
  listarDemandasInsatisfechas, getMaestrosCallCenter,
  RegistroDemandaInsatisfecha,
} from "@/services/citas/demandaInsatisfechaService"
import { toast } from "@/components/ui/use-toast"

function todayISO() {
  const now = new Date()
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().split("T")[0]
}

function firstOfMonthISO() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`
}

function formatDateTime(val?: string) {
  if (!val) return "-"
  const d = new Date(val)
  if (isNaN(d.getTime())) return val
  return d.toLocaleString("es-PE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })
}

function formatDate(val?: string) {
  if (!val) return "-"
  const d = new Date(val)
  if (isNaN(d.getTime())) return val
  d.setMinutes(d.getMinutes() + d.getTimezoneOffset())
  return d.toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit", year: "numeric" })
}

function mapEstado(e?: string | number) {
  const s = String(e ?? "")
  if (s === "1" || s.toLowerCase() === "activo") return "Activo"
  if (s === "0" || s.toLowerCase() === "inactivo") return "Inactivo"
  return s || "-"
}

const PAGE_SIZE = 20

export default function ReportesDemandaInsatisfecha() {
  // Filters
  const [fechaDesde, setFechaDesde] = useState(firstOfMonthISO())
  const [fechaHasta, setFechaHasta] = useState(todayISO())
  const [estadoFilter, setEstadoFilter] = useState("Todos")
  const [especialidadFilter, setEspecialidadFilter] = useState("Todos")
  const [tipoComunicacionFilter, setTipoComunicacionFilter] = useState("Todos")

  // Data
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(0)
  const [totalRows, setTotalRows] = useState(0)

  // Maestros
  const [especialidades, setEspecialidades] = useState<Especialidad[]>([])
  const [tiposComunicacion, setTiposComunicacion] = useState<any[]>([])

  useEffect(() => {
    Promise.all([
      getEspecialidades().catch(() => []),
      getMaestrosCallCenter(),
    ]).then(([esps, maestros]) => {
      setEspecialidades(esps)
      setTiposComunicacion(maestros.filter((m: any) => m.dominio === "TIPO_COMUNICACION"))
    })
    buscar(0)
  }, [])

  const buildParams = useCallback(() => {
    const p: Record<string, any> = { sort: "regFechaCreacion,desc" }
    if (fechaDesde) p.fechaDesde = fechaDesde
    if (fechaHasta) p.fechaHasta = fechaHasta
    if (estadoFilter !== "Todos") p.estado = estadoFilter
    if (especialidadFilter !== "Todos") p.especialidad = especialidadFilter
    if (tipoComunicacionFilter !== "Todos") p.tipoComunicacion = tipoComunicacionFilter
    return p
  }, [fechaDesde, fechaHasta, estadoFilter, especialidadFilter, tipoComunicacionFilter])

  const mapRow = (item: RegistroDemandaInsatisfecha, index: number, pageOffset: number) => ({
    index: pageOffset + index + 1,
    regFechaCreacion: formatDateTime(item.regFechaCreacion),
    regUsuarioCreacion: item.regUsuarioCreacion || "-",
    especialidad: item.nombreEspecialidad || item.especialidad || "-",
    medico: item.nombreMedico || item.medico || item.medicoDocumento || "-",
    fecha: formatDate(item.fechaHoraInicio || item.fecha),
    turno: item.turno === "M" ? "Mañana" : item.turno === "T" ? "Tarde" : item.turno || "-",
    documentoPaciente: item.documentoPaciente || item.dni || "-",
    tipoDocumento: item.nombreTipoDocumento || item.tipoDocumento || "-",
    paciente: item.nombrePaciente || item.paciente || "-",
    tipoComunicacion: item.descripcionTipoComunicacion || item.tipoComunicacion || "-",
    motivo: item.descripcionMotivo || item.motivoLlamada || item.motivo || "-",
    observacion: item.observacion || "-",
    estado: mapEstado(item.estado),
  })

  const buscar = useCallback(async (page: number = 0) => {
    setLoading(true)
    setCurrentPage(page)
    try {
      const params = buildParams()
      const { items, total } = await listarDemandasInsatisfechas({ ...params, page, size: PAGE_SIZE })
      const offset = page * PAGE_SIZE
      setRows(items.map((item, i) => mapRow(item, i, offset)))
      setTotalRows(total)
    } catch (e) {
      console.error("Error cargando reportes", e)
      toast({ title: "Error", description: "No se pudieron cargar los reportes", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [buildParams])

  const limpiarFiltros = () => {
    setFechaDesde(firstOfMonthISO())
    setFechaHasta(todayISO())
    setEstadoFilter("Todos")
    setEspecialidadFilter("Todos")
    setTipoComunicacionFilter("Todos")
    setTimeout(() => buscar(0), 100)
  }

  const exportarExcel = async () => {
    toast({ title: "Generando Excel...", description: "Por favor espere" })
    try {
      const params = buildParams()
      const { items } = await listarDemandasInsatisfechas({ ...params, page: 0, size: 100000 })
      const data = items.map((item, i) => ({
        "N°": i + 1,
        "Fec. Creación": formatDateTime(item.regFechaCreacion),
        "Especialidad": item.nombreEspecialidad || item.especialidad || "-",
        "Médico": item.nombreMedico || item.medico || item.medicoDocumento || "-",
        "Fecha Req.": formatDate(item.fechaHoraInicio || item.fecha),
        "Turno": item.turno === "M" ? "Mañana" : item.turno === "T" ? "Tarde" : item.turno || "-",
        "Doc. Paciente": item.documentoPaciente || item.dni || "-",
        "Tipo Doc.": item.nombreTipoDocumento || item.tipoDocumento || "-",
        "Paciente": item.nombrePaciente || item.paciente || "-",
        "Tipo Comun.": item.descripcionTipoComunicacion || item.tipoComunicacion || "-",
        "Motivo": item.descripcionMotivo || item.motivoLlamada || item.motivo || "-",
        "Observación": item.observacion || "-",
        "Estado": mapEstado(item.estado),
        "Usuario Creador": item.regUsuarioCreacion || "-",
      }))

      if (!data.length) {
        toast({ title: "Sin datos", description: "No hay datos para exportar", variant: "destructive" })
        return
      }

      // Build CSV
      const headers = Object.keys(data[0])
      const csv = [
        headers.join(","),
        ...data.map(row => headers.map(h => `"${String((row as any)[h]).replace(/"/g, '""')}"`).join(",")),
      ].join("\n")

      const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `Reporte_Demanda_Insatisfecha_${todayISO()}.csv`
      a.click()
      URL.revokeObjectURL(url)
      toast({ title: "Excel exportado", description: `${data.length} registros exportados` })
    } catch {
      toast({ title: "Error", description: "No se pudo exportar el archivo", variant: "destructive" })
    }
  }

  const totalPages = Math.max(1, Math.ceil(totalRows / PAGE_SIZE))

  const COLUMNS = [
    { key: "index", label: "N°" },
    { key: "regFechaCreacion", label: "Fec. Creación" },
    { key: "especialidad", label: "Especialidad" },
    { key: "medico", label: "Médico" },
    { key: "paciente", label: "Paciente" },
    { key: "motivo", label: "Motivo" },
    { key: "estado", label: "Estado" },
    { key: "regUsuarioCreacion", label: "Usuario" },
  ]

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between flex-wrap gap-2">
        <h3 className="text-base font-semibold text-gray-800">Filtros de Búsqueda</h3>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => buscar(0)} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} /> Actualizar
          </Button>
          <Button variant="outline" size="sm" onClick={exportarExcel} disabled={loading}>
            <Download className="h-4 w-4 mr-1" /> Exportar CSV
          </Button>
          <Button variant="ghost" size="sm" onClick={limpiarFiltros}>
            <FilterX className="h-4 w-4 mr-1" /> Limpiar
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end p-4 bg-gray-50 rounded-lg border">
        <div className="space-y-1">
          <Label className="text-xs text-gray-600">Desde</Label>
          <Input type="date" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)} className="h-8 text-xs w-full sm:w-36" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-gray-600">Hasta</Label>
          <Input type="date" value={fechaHasta} onChange={e => { setFechaHasta(e.target.value); buscar(0) }} className="h-8 text-xs w-full sm:w-36" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-gray-600">Especialidad</Label>
          <Select value={especialidadFilter} onValueChange={v => { setEspecialidadFilter(v); buscar(0) }}>
            <SelectTrigger className="h-8 text-xs w-full sm:w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Todos" className="text-xs">Todas</SelectItem>
              {especialidades.map(e => <SelectItem key={e.Codigo} value={e.Codigo} className="text-xs">{e.Nombre}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-gray-600">Tipo Comunicación</Label>
          <Select value={tipoComunicacionFilter} onValueChange={v => { setTipoComunicacionFilter(v); buscar(0) }}>
            <SelectTrigger className="h-8 text-xs w-full sm:w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Todos" className="text-xs">Todos</SelectItem>
              {tiposComunicacion.map((t: any, i: number) => (
                <SelectItem key={i} value={t.codigo || t.CODIGO || ""} className="text-xs">{t.descripcion || t.DESCRIPCION}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-gray-600">Estado</Label>
          <Select value={estadoFilter} onValueChange={v => { setEstadoFilter(v); buscar(0) }}>
            <SelectTrigger className="h-8 text-xs w-full sm:w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Todos" className="text-xs">Todos</SelectItem>
              <SelectItem value="1" className="text-xs">Activo</SelectItem>
              <SelectItem value="0" className="text-xs">Inactivo</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-14 gap-3 text-blue-600">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="text-sm font-medium">Cargando datos...</span>
        </div>
      ) : (
        <div className="rounded-lg border bg-white shadow-sm overflow-x-auto table-responsive">
          <Table className="min-w-[800px]">
            <TableHeader>
              <TableRow className="bg-gray-50">
                {COLUMNS.map(c => (
                  <TableHead key={c.key} className="text-xs font-semibold whitespace-nowrap">{c.label}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow><TableCell colSpan={COLUMNS.length} className="text-center py-10 text-gray-500 text-sm">
                  No hay registros para los filtros seleccionados.
                </TableCell></TableRow>
              ) : rows.map((row, i) => (
                <TableRow key={i} className="hover:bg-blue-50/30">
                  {COLUMNS.map(c => (
                    <TableCell key={c.key} className="text-xs whitespace-nowrap">
                      {c.key === "estado" ? (
                        <Badge className={`text-xs ${row[c.key] === "Activo" ? "bg-green-100 text-green-700 border-green-200" : row[c.key] === "Inactivo" ? "bg-red-100 text-red-700 border-red-200" : "bg-gray-100 text-gray-600"}`} variant="outline">
                          {row[c.key]}
                        </Badge>
                      ) : c.key === "motivo" ? (
                        <Badge className="text-xs bg-red-50 text-red-700 border-red-200" variant="outline">{row[c.key]}</Badge>
                      ) : (
                        row[c.key]
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination */}
      <div className="flex flex-wrap items-center justify-between text-xs text-gray-600">
        <span>{totalRows} registro{totalRows !== 1 ? "s" : ""} encontrado{totalRows !== 1 ? "s" : ""}</span>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" className="h-7 text-xs px-3" onClick={() => buscar(0)} disabled={currentPage === 0 || loading}>«</Button>
          <Button variant="outline" size="sm" className="h-7 text-xs px-3" onClick={() => buscar(currentPage - 1)} disabled={currentPage === 0 || loading}>‹</Button>
          <span className="px-2">Pág. {currentPage + 1} / {totalPages}</span>
          <Button variant="outline" size="sm" className="h-7 text-xs px-3" onClick={() => buscar(currentPage + 1)} disabled={currentPage >= totalPages - 1 || loading}>›</Button>
          <Button variant="outline" size="sm" className="h-7 text-xs px-3" onClick={() => buscar(totalPages - 1)} disabled={currentPage >= totalPages - 1 || loading}>»</Button>
        </div>
      </div>
    </div>
  )
}
