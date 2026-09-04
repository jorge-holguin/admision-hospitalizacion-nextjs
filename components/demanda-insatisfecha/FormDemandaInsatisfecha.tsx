"use client"

import React, { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import {
  Plus, Search, Pencil, Trash2, Eye, Loader2, AlertCircle, Info, CheckCircle, X, RefreshCw,
  Sun, Sunset, Calendar, Clock, User, CreditCard, Hash, Phone, MessageSquare, FileText,
  Stethoscope, UserCheck,
} from "lucide-react"
import { normalizeEspecialidad, Especialidad } from "@/services/master-tables/especialidadService"
import { es } from "date-fns/locale/es"
import { API_ENDPOINTS, buildUrl, fetchApi } from "@/lib/api-config"
import {
  listarDemandasInsatisfechas, guardarDemandaInsatisfecha, actualizarDemandaInsatisfecha,
  eliminarDemandaInsatisfecha, obtenerDemandaById, getMotivosLlamada, getMaestrosCallCenter,
  getEspecialidadesFUA, buscarPersonal, buscarMedicosPorEspecialidad, RegistroDemandaInsatisfecha, DemandaPayload,
} from "@/services/citas/demandaInsatisfechaService"
import { extractDocumentFromToken } from "@/utils/jwtUtils"

function useDebounce<T>(value: T, ms: number): T {
  const [deb, setDeb] = useState<T>(value)
  useEffect(() => {
    const t = setTimeout(() => setDeb(value), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return deb
}

function todayISO() {
  const now = new Date()
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().split("T")[0]
}

function formatDate(val?: string | Date) {
  if (!val) return "-"
  const d = new Date(val as string)
  if (isNaN(d.getTime())) return String(val)
  return d.toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit", year: "numeric" })
}

function formatDateTime(val?: string | Date) {
  if (!val) return "-"
  const d = new Date(val as string)
  if (isNaN(d.getTime())) return String(val)
  return d.toLocaleString("es-PE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })
}

function isoToDMY(iso: string): string {
  if (!iso) return ""
  const [y, m, d] = iso.split("-")
  if (!y || !m || !d) return ""
  return `${d}/${m}/${y}`
}


export default function FormDemandaInsatisfecha() {
  const usuario = extractDocumentFromToken()
  const hoy = todayISO()

  // ── Data ─────────────────────────────────────────────────────────────────
  const [registros, setRegistros] = useState<RegistroDemandaInsatisfecha[]>([])
  const [loading, setLoading] = useState(false)
  const [filterPaciente, setFilterPaciente] = useState("")

  // ── Maestros ─────────────────────────────────────────────────────────────
  const [especialidades, setEspecialidades] = useState<Especialidad[]>([])
  const [motivosLlamada, setMotivosLlamada] = useState<any[]>([])
  const [tiposComunicacion, setTiposComunicacion] = useState<any[]>([])
  const [tiposDocumento, setTiposDocumento] = useState<any[]>([])

  // ── Form dialog ──────────────────────────────────────────────────────────
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)

  // General fields
  const [espSearch, setEspSearch] = useState("")
  const [espSelected, setEspSelected] = useState<Especialidad | null>(null)
  const [espDropdown, setEspDropdown] = useState(false)

  const [medicoSearch, setMedicoSearch] = useState("")
  const [medicoSelected, setMedicoSelected] = useState<any | null>(null)
  const [medicoOptions, setMedicoOptions] = useState<any[]>([])
  const [medicoDropdown, setMedicoDropdown] = useState(false)
  const [loadingMedico, setLoadingMedico] = useState(false)

  const [fecha, setFecha] = useState<string>(hoy)
  const [fechaDisplay, setFechaDisplay] = useState<string>(() => isoToDMY(hoy))
  const [datePickerOpen, setDatePickerOpen] = useState(false)
  const [turno, setTurno] = useState("")

  // Patient fields
  const [tipoDoc, setTipoDoc] = useState("D")
  const [patientPhoto, setPatientPhoto] = useState<string | null>(null)
  const [dniInput, setDniInput] = useState("")
  const [nombrePaciente, setNombrePaciente] = useState("")
  const [pacienteReadonly, setPacienteReadonly] = useState(false)
  const [loadingPac, setLoadingPac] = useState(false)
  const [tipoCom, setTipoCom] = useState("")
  const [motivo, setMotivo] = useState("")
  const [observacion, setObservacion] = useState("")

  // Previas mes (para verificar duplicados)
  const [previasMes, setPreviasMes] = useState<any[]>([])
  const ultimoDniRef = useRef("")
  const lastEspecialidadRef = useRef<string | undefined>(undefined)

  // Info / Error / Success / Detalle / Delete dialogs
  const [showDelete, setShowDelete] = useState(false)
  const [deleteItem, setDeleteItem] = useState<RegistroDemandaInsatisfecha | null>(null)
  const [showInfo, setShowInfo] = useState(false)
  const [infoMsg, setInfoMsg] = useState("")
  const [infoDetalles, setInfoDetalles] = useState<string[]>([])
  const [showError, setShowError] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")
  const [showSuccess, setShowSuccess] = useState(false)
  const [successMsg, setSuccessMsg] = useState("")
  const [showDetalle, setShowDetalle] = useState(false)
  const [detalleItem, setDetalleItem] = useState<RegistroDemandaInsatisfecha | null>(null)

  // Debounce values
  const debouncedDni = useDebounce(dniInput, 500)
  const debouncedMedicoSearch = useDebounce(medicoSearch, 350)

  // ── Load maestros ─────────────────────────────────────────────────────────
  useEffect(() => {
    Promise.all([
      getEspecialidadesFUA().then(list => Array.isArray(list) ? list.map(normalizeEspecialidad) : []).catch(() => []),
      getMotivosLlamada(),
      getMaestrosCallCenter(),
      fetchApi(API_ENDPOINTS.utils.documentTypes).then(r => r.ok ? r.json() : []).then(d => Array.isArray(d) ? d : (d?.data || [])).catch(() => []),
    ]).then(([esps, motivos, maestros, tdocs]) => {
      setEspecialidades(esps)
      setMotivosLlamada(motivos)
      setTiposComunicacion(maestros.filter((m: any) => m.dominio === "TIPO_COMUNICACION" && !m.descripcion?.toUpperCase().includes("NINGUNO")))
      const filtered = (Array.isArray(tdocs) ? tdocs : []).filter((t: any) => !(t.nombre || t.NOMBRE || "").toUpperCase().includes("NINGUNO"))
      setTiposDocumento(filtered)
    })
    cargarRegistros()
  }, [])

  // ── Load records (estado=1) ──────────────────────────────────────────────
  const cargarRegistros = useCallback(async () => {
    setLoading(true)
    try {
      const { items } = await listarDemandasInsatisfechas({ fechaDesde: hoy, fechaHasta: hoy, size: 1000, sort: "idDemanda,desc" })
      const filtered = items
        .filter(i => String(i.estado) === "1")
        .sort((a, b) => new Date(b.regFechaCreacion || 0).getTime() - new Date(a.regFechaCreacion || 0).getTime())
      setRegistros(filtered)
    } catch (e) {
      console.error("Error cargando registros", e)
    } finally {
      setLoading(false)
    }
  }, [hoy])

  // ── Filtered records ──────────────────────────────────────────────────────
  const filteredRegistros = registros.filter(r => {
    if (!filterPaciente.trim()) return true
    const q = filterPaciente.trim().toLowerCase()
    if (/^\d+$/.test(q)) return (r.dni || r.documentoPaciente || "").toLowerCase().includes(q)
    return (r.paciente || r.nombrePaciente || "").toLowerCase().includes(q)
  })

  // ── Especialidad autocomplete ─────────────────────────────────────────────
  const filteredEsps = espSearch
    ? especialidades.filter(e => e.Nombre.toLowerCase().includes(espSearch.toLowerCase()))
    : especialidades

  // ── Médico autocomplete ───────────────────────────────────────────────────
  // Si hay especialidad seleccionada, carga todos los médicos de esa especialidad
  // con un rango de fechas de (Fecha que requiere - 30 días) a Fecha que requiere.
  useEffect(() => {
    const cambioEspecialidad = lastEspecialidadRef.current !== espSelected?.Codigo
    lastEspecialidadRef.current = espSelected?.Codigo
    if (cambioEspecialidad) {
      setMedicoSearch("")
      setMedicoSelected(null)
      setMedicoOptions([])
      setMedicoDropdown(false)
    }
    if (!espSelected) return
    setLoadingMedico(true)
    buscarMedicosPorEspecialidad(espSelected.Codigo, fecha)
      .then(data => { setMedicoOptions(data); setMedicoDropdown(data.length > 0) })
      .catch(() => setMedicoOptions([]))
      .finally(() => setLoadingMedico(false))
  }, [espSelected?.Codigo, fecha])

  // Sin especialidad: búsqueda libre por nombre/DNI (requiere 3+ caracteres)
  useEffect(() => {
    if (medicoSelected || espSelected) return
    if (debouncedMedicoSearch.length < 3) {
      setMedicoOptions([])
      setMedicoDropdown(false)
      return
    }
    setLoadingMedico(true)
    buscarPersonal(debouncedMedicoSearch)
      .then(data => { setMedicoOptions(data); setMedicoDropdown(data.length > 0) })
      .catch(() => setMedicoOptions([]))
      .finally(() => setLoadingMedico(false))
  }, [debouncedMedicoSearch, medicoSelected, espSelected])

  // Filtro client-side de médicos por especialidad según lo que escribe el usuario
  const visibleMedicos = espSelected
    ? medicoOptions.filter(m => {
        const q = medicoSearch.toLowerCase()
        if (q.length < 3) return true
        const nombre = (m.nombre || "").toLowerCase()
        const dni = (m.dni || "").toLowerCase()
        return nombre.includes(q) || dni.includes(q)
      })
    : medicoOptions

  // ── Buscar paciente por documento ─────────────────────────────────────────
  useEffect(() => {
    if (!debouncedDni || !tipoDoc) {
      setNombrePaciente("")
      setPacienteReadonly(false)
      setPatientPhoto(null)
      return
    }
    const isDniType = tipoDoc === "D" || tipoDoc === "CNV"
    if (isDniType && debouncedDni.length !== 8) return
    if (!isDniType && debouncedDni.length < 4) return

    setLoadingPac(true)
    setPacienteReadonly(false)
    const url = buildUrl(API_ENDPOINTS.filiation.searchByDocument, { documento: debouncedDni, tipoDocumento: tipoDoc })
    fetchApi(url)
      .then(r => r.ok ? r.json() : null)
      .then((data: any) => {
        if (!data) { setPacienteReadonly(false); setPatientPhoto(null); return }
        const list = Array.isArray(data) ? data : (data?.content || data?.data || [data])
        const p = list[0]
        if (p) {
          const nombre = p.NOMBRES || p.nombres || p.nombre || ""
          setNombrePaciente(nombre)
          setPacienteReadonly(!!nombre)
          setPatientPhoto(p.stringFoto || p.STRINGFOTO || null)
        }
      })
      .catch(() => { setPacienteReadonly(false); setPatientPhoto(null) })
      .finally(() => setLoadingPac(false))
  }, [debouncedDni, tipoDoc])

  // ── Verificar demandas previas del mes ────────────────────────────────────
  const verificarDemandaMes = useCallback(async (tipo: string, dni: string) => {
    if (editingId !== null) return
    try {
      const { items } = await listarDemandasInsatisfechas({ tipoDocumento: tipo, documentoPaciente: dni, size: 100 })
      const now = new Date()
      const mes = now.getMonth()
      const anio = now.getFullYear()
      const demandasMes = items.filter(i => {
        if (!i.regFechaCreacion || String(i.estado) !== "1") return false
        const d = new Date(i.regFechaCreacion)
        return d.getMonth() === mes && d.getFullYear() === anio
      })
      setPreviasMes(demandasMes)
      if (demandasMes.length > 0) {
        setInfoDetalles(demandasMes.map(i => {
          const d = new Date(i.fecha || i.regFechaCreacion || "")
          d.setMinutes(d.getMinutes() + d.getTimezoneOffset())
          return `${d.toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit", year: "numeric" })} - Especialidad: ${i.nombreEspecialidad || i.especialidad || "N/A"}`
        }))
        setInfoMsg(`El paciente ya cuenta con ${demandasMes.length === 1 ? "una demanda insatisfecha registrada" : "demandas insatisfechas registradas"} en el mes actual:`)
        setShowInfo(true)
      }
    } catch (e) {
      console.error("Error verificando demanda mes", e)
    }
  }, [editingId])

  // Trigger verificación al cambiar DNI/tipoDoc con debounce
  useEffect(() => {
    if (!debouncedDni || !tipoDoc) return
    const isDniType = tipoDoc === "D" || tipoDoc === "CNV"
    if (isDniType && debouncedDni.length !== 8) return
    if (ultimoDniRef.current === debouncedDni) return
    ultimoDniRef.current = debouncedDni
    verificarDemandaMes(tipoDoc, debouncedDni)
  }, [debouncedDni, tipoDoc, verificarDemandaMes])

  // ── Open form (new) ───────────────────────────────────────────────────────
  function abrirNuevo() {
    resetForm()
    setEditingId(null)
    setShowForm(true)
  }

  function resetForm() {
    setEspSearch(""); setEspSelected(null); setEspDropdown(false)
    setMedicoSearch(""); setMedicoSelected(null); setMedicoOptions([]); setMedicoDropdown(false)
    setFecha(hoy); setFechaDisplay(isoToDMY(hoy)); setTurno("")
    setTipoDoc("D"); setDniInput(""); setNombrePaciente(""); setPacienteReadonly(false); setPatientPhoto(null)
    setTipoCom(""); setMotivo(""); setObservacion("")
    setPreviasMes([]); ultimoDniRef.current = ""
  }

  // ── Edit record ───────────────────────────────────────────────────────────
  async function editarRegistro(item: RegistroDemandaInsatisfecha) {
    if (!item.idDemanda) return
    try {
      resetForm()
      setEditingId(item.idDemanda)
      const data = await obtenerDemandaById(item.idDemanda)
      const esp = especialidades.find(e => e.Codigo === data.especialidad)
      const isoDate = data.fecha ? data.fecha.split("T")[0] : hoy

      // Evita que el useEffect de médico borre el valor al cambiar especialidad/fecha
      lastEspecialidadRef.current = data.especialidad

      setEspSelected(esp || null)
      setEspSearch(esp?.Nombre || data.nombreEspecialidad || data.especialidad || "")
      const medicoVal = data.medicoDocumento || ""
      setMedicoSearch(data.nombreMedico || medicoVal)
      setMedicoSelected(medicoVal ? { nombre: data.nombreMedico || medicoVal, dni: medicoVal } : null)
      setFecha(isoDate)
      setFechaDisplay(isoToDMY(isoDate))
      setTurno((data.turno || "").trim())
      setTipoDoc((data.tipoDocumento || "").trim())
      setDniInput(data.documentoPaciente || "")
      setNombrePaciente(data.nombrePaciente || "")
      setPacienteReadonly(true)
      setTipoCom((data.tipoComunicacion || "").trim())
      setMotivo((data.motivo || "").trim())
      setObservacion(data.observacion || "")
      setShowForm(true)
    } catch {
      toast({ title: "Error", description: "No se pudo cargar el registro", variant: "destructive" })
    }
  }

  // ── Delete record ─────────────────────────────────────────────────────────
  function eliminarRegistro(item: RegistroDemandaInsatisfecha) {
    if (!item.idDemanda) return
    setDeleteItem(item)
    setShowDelete(true)
  }

  async function confirmarEliminacion() {
    if (!deleteItem?.idDemanda) return
    try {
      await eliminarDemandaInsatisfecha(deleteItem.idDemanda, usuario)
      toast({ title: "Eliminado", description: "El registro fue eliminado correctamente" })
      setShowDelete(false)
      setDeleteItem(null)
      cargarRegistros()
    } catch {
      toast({ title: "Error", description: "No se pudo eliminar el registro", variant: "destructive" })
    }
  }

  // ── View detail ───────────────────────────────────────────────────────────
  function verDetalle(item: RegistroDemandaInsatisfecha) {
    setDetalleItem(item)
    setShowDetalle(true)
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  async function onSubmit() {
    if (!espSelected) { toast({ title: "Requerido", description: "Seleccione una especialidad", variant: "destructive" }); return }
    if (!turno) { toast({ title: "Requerido", description: "Seleccione un turno", variant: "destructive" }); return }
    if (!fecha) { toast({ title: "Requerido", description: "Ingrese la fecha requerida", variant: "destructive" }); return }
    if (!tipoDoc) { toast({ title: "Requerido", description: "Seleccione el tipo de documento", variant: "destructive" }); return }
    if (!dniInput) { toast({ title: "Requerido", description: "Ingrese el documento del paciente", variant: "destructive" }); return }
    if (!nombrePaciente) { toast({ title: "Requerido", description: "El nombre del paciente es obligatorio", variant: "destructive" }); return }
    if (!tipoCom) { toast({ title: "Requerido", description: "Seleccione el tipo de comunicación", variant: "destructive" }); return }
    if (!motivo) { toast({ title: "Requerido", description: "Seleccione el motivo de la llamada", variant: "destructive" }); return }

    // Verificar duplicado por especialidad (solo al crear)
    if (editingId === null && previasMes.length > 0) {
      const dup = previasMes.find(i => i.especialidad === espSelected.Codigo)
      if (dup) {
        setErrorMsg("El paciente ya cuenta con una demanda insatisfecha registrada para esa misma especialidad.")
        setShowError(true)
        return
      }
    }

    const payload: DemandaPayload = {
      especialidad: espSelected.Codigo,
      medicoDocumento: medicoSelected ? (medicoSelected.dni || medicoSelected.documento || medicoSelected.DNI || "ninguno") : "ninguno",
      fecha: fecha ? new Date(fecha + "T00:00:00").toISOString() : null,
      turno: turno || "0",
      tipoDocumento: tipoDoc,
      documentoPaciente: dniInput,
      nombrePaciente,
      tipoComunicacion: tipoCom,
      motivo,
      observacion,
      estado: "1",
      origen: "A",
    }

    setSaving(true)
    try {
      if (editingId !== null) {
        await actualizarDemandaInsatisfecha(editingId, payload, usuario)
        setSuccessMsg("El registro se editó satisfactoriamente")
      } else {
        await guardarDemandaInsatisfecha(payload, usuario)
        setSuccessMsg("El registro de demanda insatisfecha se añadió correctamente")
      }
      setShowForm(false)
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 2500)
      cargarRegistros()
    } catch (e: any) {
      toast({ title: "Error al guardar", description: e?.message || "Error desconocido", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  // ── Date input handler (dd/mm/yyyy) ──────────────────────────────────────
  function handleFechaInput(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, "")
    if (digits.length > 8) return
    let display = digits
    if (digits.length > 2) display = digits.slice(0, 2) + "/" + digits.slice(2)
    if (digits.length > 4) display = digits.slice(0, 2) + "/" + digits.slice(2, 4) + "/" + digits.slice(4, 8)
    setFechaDisplay(display)
    if (digits.length === 8) {
      const d = digits.slice(0, 2), m = digits.slice(2, 4), y = digits.slice(4, 8)
      setFecha(`${y}-${m}-${d}`)
    } else if (digits.length === 0) {
      setFecha(hoy)
      setFechaDisplay(isoToDMY(hoy))
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      <Toaster />

      {/* Header + Actions */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Búsqueda por Paciente (DNI o nombre)"
              value={filterPaciente}
              onChange={e => setFilterPaciente(e.target.value)}
              className="pl-9 w-72"
            />
          </div>
          {filterPaciente && (
            <Button variant="ghost" size="icon" onClick={() => setFilterPaciente("")} title="Limpiar búsqueda">
              <X className="h-4 w-4 text-red-500" />
            </Button>
          )}
          <Button variant="outline" size="icon" onClick={cargarRegistros} title="Actualizar" disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
        <Button onClick={abrirNuevo} className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-5">
          <Plus className="h-4 w-4 mr-2" /> Añadir Registro
        </Button>
      </div>

      {/* Records table */}
      <div className="rounded-lg border bg-white overflow-x-auto shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="text-xs font-semibold">Fecha<br />Registro</TableHead>
              <TableHead className="text-xs font-semibold">Especialidad</TableHead>
              <TableHead className="text-xs font-semibold">Médico</TableHead>
              <TableHead className="text-xs font-semibold">Paciente</TableHead>
              <TableHead className="text-xs font-semibold">Fecha Req.</TableHead>
              <TableHead className="text-xs font-semibold">Turno</TableHead>
              <TableHead className="text-xs font-semibold">Acción</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={7} className="text-center py-10">
                <div className="flex flex-col items-center gap-2 text-blue-600">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <span className="text-sm font-medium">Cargando datos...</span>
                </div>
              </TableCell></TableRow>
            ) : filteredRegistros.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-10 text-gray-500 text-sm">
                No hay registros el día de hoy.
              </TableCell></TableRow>
            ) : filteredRegistros.map((r, i) => (
              <TableRow key={r.idDemanda ?? i} className="hover:bg-blue-50/40">
                <TableCell className="text-xs">{formatDateTime(r.regFechaCreacion)}</TableCell>
                <TableCell className="text-xs font-medium">{r.nombreEspecialidad || r.especialidad || "-"}</TableCell>
                <TableCell className="text-xs">{r.nombreMedico || r.medico || "-"}</TableCell>
                <TableCell className="text-xs">
                  <div className="font-medium">{r.paciente || r.nombrePaciente || "-"}</div>
                  <div className="text-[10px] text-gray-500">{r.dni || r.documentoPaciente || "-"}</div>
                </TableCell>
                <TableCell className="text-xs">{formatDate(r.fechaHoraInicio || r.fecha)}</TableCell>
                <TableCell className="text-xs">
                  <Badge variant="outline" className="text-xs">
                    {r.turno === "M" ? "Mañana" : r.turno === "T" ? "Tarde" : r.turno || "-"}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs">
                  <div className="flex flex-wrap gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-blue-600 hover:bg-blue-100" onClick={() => verDetalle(r)} title="Ver detalle">
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-amber-600 hover:bg-amber-100" onClick={() => editarRegistro(r)} title="Editar">
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-red-600 hover:bg-red-100" onClick={() => eliminarRegistro(r)} title="Eliminar">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* ── Form Dialog ──────────────────────────────────────────────────────── */}
      <Dialog open={showForm} onOpenChange={open => { if (!open && !saving) setShowForm(false) }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" onInteractOutside={e => e.preventDefault()} onEscapeKeyDown={e => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">
              Registro de comunicaciones de demanda insatisfecha
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Patient section */}
            <div className="border rounded-lg p-4 space-y-4 bg-gray-50/50">
              <h4 className="text-sm font-semibold text-gray-700 flex flex-wrap items-center gap-2">
                <User className="h-4 w-4 text-blue-500" />
                Datos del Paciente
              </h4>

              <div className="flex flex-wrap gap-4 items-start">
                {/* Patient photo */}
                <div className="flex-shrink-0 flex flex-col items-center gap-1">
                  <div className={`w-20 h-20 rounded-xl border-2 flex items-center justify-center overflow-hidden transition-all ${
                    patientPhoto ? "border-blue-300 shadow-sm" : "border-dashed border-gray-300 bg-white"
                  }`}>
                    {patientPhoto ? (
                      <img
                        src={`data:image/jpeg;base64,${patientPhoto}`}
                        alt="Foto del paciente"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="h-8 w-8 text-gray-300" />
                    )}
                  </div>
                  <span className="text-xs text-gray-400">{patientPhoto ? "Foto" : "Sin foto"}</span>
                </div>

                {/* Fields */}
                <div className="flex-1 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    {/* Tipo documento */}
                    <div className="space-y-1">
                      <Label className="text-xs text-gray-600 flex flex-wrap items-center gap-1">
                        <CreditCard className="h-3 w-3 text-blue-500" />
                        Tipo de Documento *
                      </Label>
                      <Select value={tipoDoc} onValueChange={v => { setTipoDoc(v); setDniInput(""); setNombrePaciente(""); setPatientPhoto(null); ultimoDniRef.current = "" }}>
                        <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Seleccione..." /></SelectTrigger>
                        <SelectContent>
                          {tiposDocumento.map((t: any, i: number) => {
                            const code = (t.tipoDocumento || t.TIPO_DOCUMENTO || t.codigo || "").trim()
                            const name = (t.nombre || t.NOMBRE || code).toUpperCase()
                            return <SelectItem key={i} value={code} className="text-xs">{code === "CNV" ? "CNV" : name}</SelectItem>
                          })}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* DNI */}
                    <div className="space-y-1">
                      <Label className="text-xs text-gray-600 flex flex-wrap items-center gap-1">
                        <Hash className="h-3 w-3 text-blue-500" />
                        Documento del Paciente *
                      </Label>
                      <div className="relative">
                        <Input
                          value={dniInput}
                          onChange={e => {
                            const v = e.target.value
                            const isDniType = tipoDoc === "D" || tipoDoc === "CNV"
                            if (isDniType && /\D/.test(v)) return
                            if (isDniType && v.length > 8) return
                            if (!isDniType && v.length > 15) return
                            setDniInput(v)
                            setNombrePaciente("")
                            setPatientPhoto(null)
                            ultimoDniRef.current = ""
                          }}
                          placeholder="Número de documento"
                          className="h-9 text-xs pr-8"
                          maxLength={(tipoDoc === "D" || tipoDoc === "CNV") ? 8 : 15}
                        />
                        {loadingPac && <Loader2 className="absolute right-2 top-2.5 h-4 w-4 animate-spin text-gray-400" />}
                      </div>
                    </div>

                    {/* Nombre paciente - spans 2 cols */}
                    <div className="space-y-1 col-span-2">
                      <Label className="text-xs text-gray-600 flex flex-wrap items-center gap-1">
                        <User className="h-3 w-3 text-blue-500" />
                        Nombres del Paciente *
                      </Label>
                      <Input
                        value={nombrePaciente}
                        onChange={e => setNombrePaciente(e.target.value)}
                        readOnly={pacienteReadonly}
                        placeholder={pacienteReadonly ? "" : "Ingrese nombres..."}
                        className={`h-9 text-xs ${pacienteReadonly ? "bg-gray-100 cursor-not-allowed" : ""}`}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Row 1: Especialidad + Médico */}
            <div className="grid grid-cols-2 gap-4">
              {/* Especialidad */}
              <div className="relative space-y-1">
                <Label className="text-xs text-gray-600 flex flex-wrap items-center gap-1">
                  <Stethoscope className="h-3 w-3 text-blue-500" />
                  Especialidad *
                </Label>
                <div className="relative">
                  <Input
                    placeholder="Buscar especialidad..."
                    value={espSearch}
                    onChange={e => { setEspSearch(e.target.value); setEspSelected(null); setEspDropdown(true) }}
                    onFocus={() => setEspDropdown(true)}
                    onBlur={() => setTimeout(() => setEspDropdown(false), 200)}
                    className="h-9 pr-8"
                  />
                  {espSearch && (
                    <button
                      type="button"
                      onClick={() => { setEspSearch(""); setEspSelected(null); setEspDropdown(false) }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      title="Limpiar especialidad"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                {espDropdown && filteredEsps.length > 0 && (
                  <div className="absolute z-50 w-full bg-white border rounded-md shadow-lg max-h-48 overflow-y-auto top-full mt-1">
                    {filteredEsps.slice(0, 30).map(e => (
                      <button key={e.Codigo} type="button"
                        className="w-full text-left px-3 py-2 text-xs hover:bg-blue-50 border-b last:border-0"
                        onMouseDown={() => { setEspSelected(e); setEspSearch(e.Nombre); setEspDropdown(false) }}>
                        {e.Nombre}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Médico */}
              <div className="relative space-y-1">
                <Label className="text-xs text-gray-600 flex flex-wrap items-center gap-1">
                  <UserCheck className="h-3 w-3 text-blue-500" />
                  Médico
                </Label>
                <div className="relative">
                  <Input
                    placeholder="Buscar médico por nombre o DNI..."
                    value={medicoSearch}
                    onChange={e => { setMedicoSearch(e.target.value); setMedicoSelected(null) }}
                    onFocus={() => { if (medicoOptions.length) setMedicoDropdown(true) }}
                    onBlur={() => setTimeout(() => setMedicoDropdown(false), 200)}
                    className="h-9 pr-8"
                  />
                  {loadingMedico ? (
                    <Loader2 className="absolute right-2 top-2.5 h-4 w-4 animate-spin text-gray-400" />
                  ) : medicoSearch ? (
                    <button
                      type="button"
                      onClick={() => { setMedicoSearch(""); setMedicoSelected(null); setMedicoDropdown(false) }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      title="Limpiar médico"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>
                {medicoDropdown && visibleMedicos.length > 0 && (
                  <div className="absolute z-50 w-full bg-white border rounded-md shadow-lg max-h-48 overflow-y-auto top-full mt-1">
                    {visibleMedicos.map((m, i) => (
                      <button key={i} type="button"
                        className="w-full text-left px-3 py-2 text-xs hover:bg-blue-50 border-b last:border-0"
                        onMouseDown={() => {
                          setMedicoSelected(m)
                          setMedicoSearch(m.nombre || m.NOMBRE || m.nombres || "")
                          setMedicoDropdown(false)
                        }}>
                        {m.nombre || m.NOMBRE || m.nombres || ""}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Row 2: Fecha + Turno */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs text-gray-600 flex flex-wrap items-center gap-1">
                  <Calendar className="h-3 w-3 text-blue-500" />
                  Fecha que requiere *
                </Label>
                <div className="relative">
                  <Input
                    type="text"
                    value={fechaDisplay}
                    onChange={handleFechaInput}
                    placeholder="dd/mm/yyyy"
                    maxLength={10}
                    className="h-9 pl-3 pr-10 text-sm"
                  />
                  <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-gray-100 text-gray-400 hover:text-blue-600 transition-colors"
                        title="Abrir calendario"
                      >
                        <Calendar className="h-4 w-4" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <CalendarComponent
                        mode="single"
                        locale={es}
                        selected={(() => {
                          const [y, m, d] = fecha.split('-').map(Number)
                          return new Date(y, (m || 1) - 1, d || 1)
                        })()}
                        onSelect={(newDate) => {
                          if (!newDate) return
                          const y = newDate.getFullYear()
                          const m = String(newDate.getMonth() + 1).padStart(2, '0')
                          const d = String(newDate.getDate()).padStart(2, '0')
                          setFecha(`${y}-${m}-${d}`)
                          setFechaDisplay(`${d}/${m}/${y}`)
                          setDatePickerOpen(false)
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-600 flex flex-wrap items-center gap-1">
                  <Clock className="h-3 w-3 text-blue-500" />
                  Turno *
                </Label>
                <div className="flex flex-wrap gap-2 pt-0.5">
                  <button
                    type="button"
                    onClick={() => setTurno("M")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                      turno === "M"
                        ? "border-amber-400 bg-amber-50 text-amber-700 shadow-sm"
                        : "border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <Sun className="h-4 w-4" />
                    Mañana
                  </button>
                  <button
                    type="button"
                    onClick={() => setTurno("T")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                      turno === "T"
                        ? "border-orange-400 bg-orange-50 text-orange-700 shadow-sm"
                        : "border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <Sunset className="h-4 w-4" />
                    Tarde
                  </button>
                </div>
              </div>
            </div>

            {/* Communication section */}
            <div className="border rounded-lg p-4 space-y-4 bg-gray-50/50">
              <h4 className="text-sm font-semibold text-gray-700 flex flex-wrap items-center gap-2">
                <MessageSquare className="h-4 w-4 text-blue-500" />
                Detalles de la comunicación
              </h4>
              <div className="grid grid-cols-2 gap-3">
                {/* Tipo comunicación */}
                <div className="space-y-1">
                  <Label className="text-xs text-gray-600 flex flex-wrap items-center gap-1">
                    <Phone className="h-3 w-3 text-blue-500" />
                    Tipo Comunicación *
                  </Label>
                  <Select value={tipoCom} onValueChange={setTipoCom}>
                    <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Seleccione..." /></SelectTrigger>
                    <SelectContent>
                      {tiposComunicacion.map((t: any, i: number) => (
                        <SelectItem key={i} value={String(t.codigo || t.CODIGO || "").trim()} className="text-xs">{t.descripcion || t.DESCRIPCION}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Motivo llamada */}
                <div className="space-y-1">
                  <Label className="text-xs text-gray-600 flex flex-wrap items-center gap-1">
                    <MessageSquare className="h-3 w-3 text-blue-500" />
                    Motivo*
                  </Label>
                  <Select value={motivo} onValueChange={setMotivo}>
                    <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Seleccione..." /></SelectTrigger>
                    <SelectContent>
                      {motivosLlamada.map((m: any, i: number) => (
                        <SelectItem key={i} value={String(m.motivo || m.MOTIVO || m.id || String(i)).trim()} className="text-xs">{m.nombre || m.NOMBRE || m.descripcion || m.motivo}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Observación */}
              <div className="space-y-1">
                <Label className="text-xs text-gray-600 flex flex-wrap items-center gap-1">
                  <FileText className="h-3 w-3 text-blue-500" />
                  Observación
                </Label>
                <Textarea value={observacion} onChange={e => setObservacion(e.target.value)} rows={2} placeholder="Escriba aquí..." className="text-xs resize-none" />
              </div>
            </div>
          </div>

          <DialogFooter className="pt-2 border-t">
            <Button variant="destructive" onClick={() => setShowForm(false)} disabled={saving}>Cancelar</Button>
            <Button onClick={onSubmit} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingId !== null ? "Actualizar" : "Añadir y Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Info Dialog ─────────────────────────────────────────────────────── */}
      <Dialog open={showInfo} onOpenChange={setShowInfo}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="text-blue-700 flex flex-wrap items-center gap-2"><Info className="h-5 w-5" /> Información</DialogTitle></DialogHeader>
          <p className="text-sm text-gray-700">{infoMsg}</p>
          {infoDetalles.length > 0 && (
            <ul className="mt-2 list-disc list-inside space-y-1">
              {infoDetalles.map((d, i) => <li key={i} className="text-xs text-gray-600">{d}</li>)}
            </ul>
          )}
          <DialogFooter><Button variant="outline" onClick={() => setShowInfo(false)}>Entendido</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Error Dialog ─────────────────────────────────────────────────────── */}
      <Dialog open={showError} onOpenChange={setShowError}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="text-red-600 flex flex-wrap items-center gap-2"><AlertCircle className="h-5 w-5" /> Error</DialogTitle></DialogHeader>
          <p className="text-sm text-gray-700">{errorMsg}</p>
          <DialogFooter><Button variant="destructive" onClick={() => setShowError(false)}>Cerrar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Success Dialog ───────────────────────────────────────────────────── */}
      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent className="max-w-xs text-center">
          <div className="flex flex-col items-center gap-3 py-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
            <p className="text-sm font-medium text-gray-800">{successMsg}</p>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation Dialog ─────────────────────────────────────────── */}
      <Dialog open={showDelete} onOpenChange={setShowDelete}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">Confirmar eliminación</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-700 py-2">
            ¿Está seguro de eliminar el registro de <strong>{deleteItem?.nombrePaciente || deleteItem?.paciente || "este paciente"}</strong>?
          </p>
          <DialogFooter className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowDelete(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={confirmarEliminacion}>Eliminar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Detail Dialog ────────────────────────────────────────────────────── */}
      <Dialog open={showDetalle} onOpenChange={setShowDetalle}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b pb-3">
            <DialogTitle className="text-lg flex flex-wrap items-center gap-2 text-blue-700">
              <FileText className="h-5 w-5" />
              Detalle de Demanda Insatisfecha
            </DialogTitle>
          </DialogHeader>

          {detalleItem && (
            <div className="space-y-4 py-2">
              {/* Datos del Paciente */}
              <div className="border rounded-lg p-4 space-y-4 bg-gray-50/50">
                <h4 className="text-sm font-semibold text-gray-700 flex flex-wrap items-center gap-2">
                  <User className="h-4 w-4 text-blue-500" />
                  Datos del Paciente
                </h4>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500">Tipo de Documento</p>
                    <p className="text-sm font-medium text-gray-800">{detalleItem.nombreTipoDocumento || detalleItem.tipoDocumento || "-"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500">Documento del Paciente</p>
                    <p className="text-sm font-medium text-gray-800">{detalleItem.dni || detalleItem.documentoPaciente || "-"}</p>
                  </div>
                  <div className="space-y-1 col-span-2">
                    <p className="text-xs text-gray-500">Nombres del Paciente</p>
                    <p className="text-sm font-medium text-gray-800">{detalleItem.nombrePaciente || detalleItem.paciente || "-"}</p>
                  </div>
                </div>
              </div>

              {/* Información de la demanda */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-gray-500">Especialidad</p>
                  <p className="text-sm font-medium text-gray-800">{detalleItem.nombreEspecialidad || detalleItem.especialidad || "-"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-500">Médico</p>
                  <p className="text-sm font-medium text-gray-800">{detalleItem.nombreMedico || detalleItem.medico || "-"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-500">Fecha que requiere</p>
                  <p className="text-sm font-medium text-gray-800">{formatDate(detalleItem.fechaHoraInicio || detalleItem.fecha)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-500">Turno</p>
                  <Badge variant="outline" className="text-xs font-normal">
                    {detalleItem.turno?.trim() === "M" ? "Mañana" : detalleItem.turno?.trim() === "T" ? "Tarde" : detalleItem.nombreTurno || detalleItem.turno || "-"}
                  </Badge>
                </div>
              </div>

              {/* Detalles de la comunicación */}
              <div className="border rounded-lg p-4 space-y-4 bg-gray-50/50">
                <h4 className="text-sm font-semibold text-gray-700 flex flex-wrap items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-blue-500" />
                  Detalles de la comunicación
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500">Tipo de Comunicación</p>
                    <p className="text-sm font-medium text-gray-800">{detalleItem.descripcionTipoComunicacion || detalleItem.tipoComunicacion || "-"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500">Motivo</p>
                    <p className="text-sm font-medium text-gray-800">{detalleItem.descripcionMotivo || detalleItem.motivoLlamada || "-"}</p>
                  </div>
                  <div className="space-y-1 col-span-2">
                    <p className="text-xs text-gray-500">Observación</p>
                    <p className="text-sm font-medium text-gray-800">{detalleItem.observacion || "-"}</p>
                  </div>
                </div>
              </div>

              {/* Registro */}
              <div className="border rounded-lg p-4 space-y-4 bg-gray-50/50">
                <h4 className="text-sm font-semibold text-gray-700 flex flex-wrap items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-500" />
                  Registro
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500">Estado</p>
                    {String(detalleItem.estado) === "1" ? (
                      <Badge className="bg-green-100 text-green-700 hover:bg-green-100 text-xs">Activo</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">Inactivo</Badge>
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500">Usuario creación</p>
                    <p className="text-sm font-medium text-gray-800">{detalleItem.regUsuarioCreacion || "-"}</p>
                  </div>
                  <div className="space-y-1 col-span-2">
                    <p className="text-xs text-gray-500">Fecha creación</p>
                    <p className="text-sm font-medium text-gray-800">{formatDateTime(detalleItem.regFechaCreacion)}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="border-t pt-3">
            <Button variant="outline" onClick={() => setShowDetalle(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
