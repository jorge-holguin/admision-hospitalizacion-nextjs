"use client"

import { useState, useCallback, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Search, CheckCircle, FileText, Stethoscope, ClipboardList, X, Plus, Trash2 } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { extractDocumentFromToken } from "@/utils/jwtUtils"

const APOYO_DIAGNOSTICO_BASE_URL = process.env.NEXT_PUBLIC_API_APOYO_DIAGNOSTICO_URL || 'http://192.168.5.239:9020'
const API_CITAS_URL = process.env.NEXT_PUBLIC_API_CITAS_MASTER_URL || 'http://192.168.0.252:9011/api'

const MAESTRO_TYPE_MAP: Record<string, string> = {
  'ECO': 'ECO',
  'RX': 'RX',
  'LAB': 'LAB',
  'TOMO': 'TOMO',
}

const UPS_LABELS: Record<string, { label: string; tipoServicio: string; grupo: string }> = {
  '080900': { label: 'Ecografía (Diagnóstico por Imágenes - Ultrasonido)', tipoServicio: 'ECO', grupo: 'ECO' },
  '080400': { label: 'Rayos X (Diagnóstico por Imágenes - Radiodiagnóstico)', tipoServicio: 'RX', grupo: 'RX' },
  '150000': { label: 'Laboratorio (Patología Clínica)', tipoServicio: 'LAB', grupo: 'LAB' },
}

interface ReferenciaItem {
  rownum: string
  paciente: { tipo_documento: string; numero_documento: string; nombres: string; primer_apellido: string; segundo_apellido: string }
  datos_referencia: {
    codigo_especialidad: string; codigoEstado: string; estado: string; fecha_referencia: string
    servicio_origen: string; codigo_establecimiento_origen: string; servicio_destino: string
    numero_referencia: string; id_referencia: string; resume_exfisico?: string | null; motivo_referencia?: string
  }
  diagnosticos: Array<{ id: string; codigo_ciex: string; tipo_diagnostico: string }>
  cpt_procedimiento: Array<{ cpt1: string }> | string | null
  cpt_laboratorio: Array<{ cpt1: string }> | string | null
  cpt_imagenes: Array<{ cpt1: string }> | string | null
}

interface MaestroExamen {
  codigo: string
  grupo: string
  descripcion: string
  estado: boolean
  cpms: string | null
  item: string | null
  item2: string | null
}

interface CiexItem {
  id: number
  codigo: string
  nombre: string
}

export interface OrdenDetalleEdit {
  cpms: string | null
  ciex: string | null
  cantidad: number
  observacion?: string | null
  cpmsDescripcion?: string | null
  estadoDetalle?: string
}

export interface OrdenToEdit {
  idOrden: number
  idPaciente?: string
  tipoServicio?: string
  idLugar?: string | number
  origen?: string
  origenId?: string
  idTipoSeguro?: string
  idMedico?: number
  cama?: string | null
  detalles: OrdenDetalleEdit[]
}

interface DetalleItem {
  uid: string
  examen: MaestroExamen | null
  examQuery: string
  examResults: MaestroExamen[]
  ciex: CiexItem | null
  ciexQuery: string
  ciexResults: CiexItem[]
  ciexLoading: boolean
  observacion: string
  estadoDetalle?: string
}

const emptyDetalle = (): DetalleItem => ({
  uid: Math.random().toString(36).slice(2),
  examen: null,
  examQuery: '',
  examResults: [],
  ciex: null,
  ciexQuery: '',
  ciexResults: [],
  ciexLoading: false,
  observacion: '',
})

interface CrearOrdenApoyoDiagnosticoModalProps {
  isOpen: boolean
  onClose: () => void
  referencia?: ReferenciaItem
  pacienteId: string
  selectedSeguro: string
  seguroPaciente?: string
  isPacientePeriferico?: boolean
  onOrdenCreada: (ordenId: number) => void
  ordenToEdit?: OrdenToEdit
}

function obtenerTipoAtencion(servicioOrigen = ''): 'CE' | 'EM' | 'HO' | 'OT' {
  if (servicioOrigen.startsWith('22')) return 'CE'
  if (servicioOrigen.startsWith('23')) return 'EM'
  if (servicioOrigen.startsWith('24')) return 'HO'
  return 'CE'
}

export function CrearOrdenApoyoDiagnosticoModal({
  isOpen,
  onClose,
  referencia,
  pacienteId,
  selectedSeguro,
  seguroPaciente,
  isPacientePeriferico,
  onOrdenCreada,
  ordenToEdit,
}: CrearOrdenApoyoDiagnosticoModalProps) {
  const ups = referencia?.datos_referencia?.servicio_destino || ''
  const ordenTipoServicio = ordenToEdit?.tipoServicio?.trim().toUpperCase() || ''
  const upsInfo = UPS_LABELS[ups] ?? { label: ordenTipoServicio || 'Ecografía', tipoServicio: ordenTipoServicio || 'ECO', grupo: ordenTipoServicio || 'ECO' }
  const diag = referencia?.diagnosticos?.[0]

  const [detalles, setDetalles] = useState<DetalleItem[]>([emptyDetalle()])
  const [allExamenes, setAllExamenes] = useState<MaestroExamen[]>([])
  const [loadingExam, setLoadingExam] = useState(false)
  const [creando, setCreando] = useState(false)

  // ── helpers para actualizar un detalle por índice ──────────
  const updateDetalle = (idx: number, patch: Partial<DetalleItem>) => {
    setDetalles(prev => prev.map((d, i) => i === idx ? { ...d, ...patch } : d))
  }

  const addDetalle = () => setDetalles(prev => [...prev, emptyDetalle()])

  const removeDetalle = (idx: number) => {
    setDetalles(prev => prev.filter((_, i) => i !== idx))
  }

  // Inicializar filas al abrir el modal
  useEffect(() => {
    if (!isOpen) return

    if (ordenToEdit?.detalles?.length) {
      // ── Modo edición: pre-cargar desde la orden existente ──
      const initial: DetalleItem[] = ordenToEdit.detalles.map(d => ({
        ...emptyDetalle(),
        examen: d.cpms
          ? { cpms: d.cpms, descripcion: d.cpmsDescripcion || d.cpms, codigo: d.cpms, grupo: '', estado: true, item: null, item2: null }
          : null,
        ciex: d.ciex ? { id: 0, codigo: d.ciex, nombre: '' } : null,
        ciexQuery: d.ciex || '',
        observacion: d.observacion || '',
        estadoDetalle: d.estadoDetalle,
      }))
      setDetalles(initial)
      ordenToEdit.detalles.forEach(async (d, i) => {
        if (!d.ciex) return
        try {
          const base = API_CITAS_URL.replace(/\/+$/, '')
          const params = new URLSearchParams({ soloAT: 'true', codigo: d.ciex, limit: '5' })
          const res = await fetch(`${base}/transversal/ciexhis-v2?${params}`)
          if (res.ok) {
            const json = await res.json()
            const lista: CiexItem[] = Array.isArray(json?.data) ? json.data : []
            const found = lista.find((c: CiexItem) => c.codigo.toUpperCase() === d.ciex!.toUpperCase())
            if (found) setDetalles(prev => prev.map((det, idx) => idx === i ? { ...det, ciex: found } : det))
          }
        } catch { /* ignorar */ }
      })
      return
    }

    // ── Modo creación: pre-cargar desde referencia/cpt ──
    const imgs = referencia?.cpt_imagenes
    const cpts: string[] = Array.isArray(imgs) ? imgs.map((i: any) => i.cpt1).filter(Boolean) : []
    const diagnosticos = referencia?.diagnosticos || []
    const observacion = referencia?.datos_referencia?.resume_exfisico || ''

    const count = Math.max(1, cpts.length)
    const initial: DetalleItem[] = Array.from({ length: count }, (_, i) => {
      const diagEntry = diagnosticos[i] ?? diagnosticos[0]
      return {
        ...emptyDetalle(),
        ciex: diagEntry?.codigo_ciex ? { id: 0, codigo: diagEntry.codigo_ciex, nombre: '' } : null,
        ciexQuery: diagEntry?.codigo_ciex || '',
        observacion,
      }
    })
    setDetalles(initial)

    diagnosticos.slice(0, count).forEach(async (diagEntry: any, i: number) => {
      if (!diagEntry?.codigo_ciex) return
      try {
        const base = API_CITAS_URL.replace(/\/+$/, '')
        const params = new URLSearchParams({ soloAT: 'true', codigo: diagEntry.codigo_ciex, limit: '5' })
        const res = await fetch(`${base}/transversal/ciexhis-v2?${params}`)
        if (res.ok) {
          const json = await res.json()
          const lista: CiexItem[] = Array.isArray(json?.data) ? json.data : []
          const found = lista.find((c: CiexItem) => c.codigo.toUpperCase() === diagEntry.codigo_ciex.toUpperCase())
          if (found) setDetalles(prev => prev.map((d, idx) => idx === i ? { ...d, ciex: found } : d))
        }
      } catch { /* ignorar */ }
    })

    cpts.forEach(async (cptCode, i) => {
      try {
        const base = APOYO_DIAGNOSTICO_BASE_URL.replace(/\/+$/, '')
        const res = await fetch(`${base}/api/maestros/cpms/${encodeURIComponent(cptCode)}`)
        if (res.ok) {
          const json = await res.json()
          const lista: MaestroExamen[] = Array.isArray(json?.data) ? json.data : []
          if (lista.length > 0) setDetalles(prev => prev.map((d, idx) => idx === i ? { ...d, examen: lista[0] } : d))
        }
      } catch { /* ignorar */ }
    })
  }, [isOpen])

  // Cargar catálogo de exámenes al abrir
  useEffect(() => {
    if (!isOpen) return
    const cargar = async () => {
      setLoadingExam(true)
      try {
        const base = APOYO_DIAGNOSTICO_BASE_URL.replace(/\/+$/, '')
        const tipoMaestro = MAESTRO_TYPE_MAP[upsInfo.tipoServicio?.toUpperCase() || 'ECO'] || 'ECO'
        const params = new URLSearchParams({ tipo: 'EXAMEN', estado: '1' })
        const res = await fetch(`${base}/api/apoyo-diagnostico/maestros/${tipoMaestro}?${params}`)
        if (res.ok) {
          const json = await res.json()
          const lista: MaestroExamen[] = Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : []
          setAllExamenes(lista.filter((e) => e.cpms))
        }
      } catch {
        setAllExamenes([])
      } finally {
        setLoadingExam(false)
      }
    }
    cargar()
  }, [isOpen, referencia?.datos_referencia?.servicio_destino, ordenToEdit?.idOrden])

  // Buscar CIEX en servidor (compartido)
  const buscarCiex = useCallback(async (idx: number, q: string) => {
    if (!q.trim() || q.length < 2) { updateDetalle(idx, { ciexResults: [] }); return }
    updateDetalle(idx, { ciexLoading: true })
    try {
      const base = API_CITAS_URL.replace(/\/+$/, '')
      const params = new URLSearchParams({ soloAT: 'true', nombre: q.trim(), limit: '15' })
      const res = await fetch(`${base}/transversal/ciexhis-v2?${params}`)
      if (res.ok) {
        const json = await res.json()
        const lista: CiexItem[] = Array.isArray(json?.data) ? json.data : []
        updateDetalle(idx, { ciexResults: lista })
      }
    } catch {
      updateDetalle(idx, { ciexResults: [] })
    } finally {
      updateDetalle(idx, { ciexLoading: false })
    }
  }, [])


  const handleCrear = async () => {
    const valid = detalles.filter(d => d.examen && d.ciex?.codigo)
    if (valid.length === 0) {
      toast({ title: 'Detalle requerido', description: 'Agregue al menos un examen con diagnóstico CIEX.', variant: 'destructive' })
      return
    }
    const incomplete = detalles.findIndex(d => (d.examen && !d.ciex?.codigo) || (!d.examen && d.ciex?.codigo))
    if (incomplete >= 0) {
      toast({ title: 'Detalle incompleto', description: `El examen #${incomplete + 1} requiere tanto examen como diagnóstico CIEX.`, variant: 'destructive' })
      return
    }
    setCreando(true)
    try {
      const usuarioDni = extractDocumentFromToken() || 'SISTEMA'
      const isEditing = !!ordenToEdit
      const body: any = {
        idPaciente: pacienteId,
        tipoServicio: isEditing ? (ordenToEdit!.tipoServicio || upsInfo.tipoServicio) : upsInfo.tipoServicio,
        idLugar: isEditing
          ? (ordenToEdit!.idLugar != null ? Number(ordenToEdit!.idLugar) : 0)
          : (Number(referencia?.datos_referencia?.codigo_establecimiento_origen) || 0),
        origen: isEditing
          ? (ordenToEdit!.origen || obtenerTipoAtencion(referencia?.datos_referencia?.servicio_origen || ''))
          : obtenerTipoAtencion(referencia?.datos_referencia?.servicio_origen || ''),
        origenId: isEditing
          ? (ordenToEdit!.origenId || '0')
          : (isPacientePeriferico ? '0' : (referencia?.datos_referencia?.id_referencia || '0')),
        idTipoSeguro: ((isEditing ? ordenToEdit!.idTipoSeguro : '')
          || seguroPaciente
          || selectedSeguro
          || '0').toString().trim(),
        idMedico: Number(isEditing ? (ordenToEdit!.idMedico || 1) : 1) || 1,
        cama: isEditing ? (ordenToEdit!.cama ?? null) : null,
        detalles: valid.map(d => ({
          cpms: d.examen!.cpms,
          cantidad: 1,
          ciex: d.ciex!.codigo,
          observacion: d.observacion.trim(),
        })),
      }
      if (isEditing) body.idOrden = ordenToEdit!.idOrden
      console.log('[CrearOrden] payload:', JSON.stringify(body, null, 2))
      const url = isEditing
        ? `${APOYO_DIAGNOSTICO_BASE_URL}/api/apoyo-diagnostico/ordenes/${ordenToEdit!.idOrden}`
        : `${APOYO_DIAGNOSTICO_BASE_URL}/api/apoyo-diagnostico/ordenes`
      const res = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', 'Usuario': usuarioDni },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error((err as any)?.message || `Error ${res.status}`)
      }
      const respuesta = await res.json()
      const idOrden = isEditing
        ? ordenToEdit!.idOrden
        : (respuesta?.idOrden ?? respuesta?.data?.idOrden ?? respuesta?.id)
      toast({
        title: isEditing ? '✅ Orden actualizada' : '✅ Orden creada',
        description: isEditing
          ? `Orden #${idOrden} actualizada con ${valid.length} examen(es).`
          : `Orden #${idOrden} con ${valid.length} examen(es) creada exitosamente.`
      })
      onOrdenCreada(idOrden)
      handleClose()
    } catch (e: any) {
      toast({
        title: ordenToEdit ? 'Error al actualizar orden' : 'Error al crear orden',
        description: e.message || 'No se pudo procesar la orden.',
        variant: 'destructive'
      })
    } finally {
      setCreando(false)
    }
  }

  const handleClose = () => {
    setDetalles([emptyDetalle()])
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <ClipboardList className="h-5 w-5 text-blue-600" />
            {ordenToEdit ? 'Editar Orden' : 'Crear Orden'} de Apoyo Diagnóstico
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">

          {/* ── Referencia info (si existe) ── */}
          {referencia?.datos_referencia?.numero_referencia && (
            <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-blue-800 flex items-center gap-1">
                  <FileText className="h-4 w-4" />
                  Referencia {referencia.datos_referencia.numero_referencia}
                </span>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded font-medium">
                  {referencia.datos_referencia.estado}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-700">
                <div><span className="font-medium">Fecha:</span> {referencia.datos_referencia.fecha_referencia}</div>
                <div><span className="font-medium">Origen:</span> {referencia.datos_referencia.codigo_establecimiento_origen}</div>
                <div className="col-span-2 flex items-center gap-2">
                  <Stethoscope className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                  <span className="font-medium text-blue-700">{upsInfo.label}</span>
                </div>
                <div className="col-span-2 flex items-center gap-2">
                  <span className="font-medium">Diagnóstico ref.:</span>
                  {diag ? (
                    <span className="font-mono bg-yellow-50 text-yellow-800 px-1.5 py-0.5 rounded text-xs">
                      {diag.codigo_ciex}
                    </span>
                  ) : (
                    <span className="text-amber-600 text-xs">No incluido — seleccionar abajo</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── Lista de detalles ── */}
          <div className="space-y-3">
            {detalles.map((detalle, idx) => (
              <div key={detalle.uid} className="border border-gray-200 rounded-lg p-3 space-y-3 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                      Examen #{idx + 1}
                    </span>
                    {ordenToEdit && detalle.estadoDetalle && (
                      detalle.estadoDetalle === '2'
                        ? <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-green-100 text-green-800 border border-green-300">✓ Completado</span>
                        : detalle.estadoDetalle === '0'
                          ? <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-300">Cancelado</span>
                          : <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-orange-100 text-orange-800 border border-orange-300">Pendiente</span>
                    )}
                  </div>
                  {detalles.length > 1 && (
                    <button
                      onClick={() => removeDetalle(idx)}
                      className="text-red-400 hover:text-red-600 p-1 rounded"
                      title="Eliminar examen"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {/* Examen CPMS */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">
                    Examen / Procedimiento <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <div className="relative flex items-center gap-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                        <Input
                          placeholder={loadingExam ? 'Cargando exámenes...' : 'Ej: abdominal, mama, obstétrica...'}
                          value={detalle.examQuery}
                          disabled={loadingExam || !!detalle.examen}
                          onChange={(e) => {
                            const q = e.target.value
                            const results = q.trim().length > 0
                              ? allExamenes.filter(ex => ex.descripcion.toLowerCase().includes(q.toLowerCase()) || (ex.cpms ?? '').includes(q)).slice(0, 20)
                              : []
                            updateDetalle(idx, { examQuery: q, examResults: results })
                          }}
                          className="pl-8 h-9 text-xs"
                        />
                      </div>
                      {loadingExam && <Loader2 className="h-4 w-4 animate-spin text-gray-400 shrink-0" />}
                    </div>
                    {detalle.examResults.length > 0 && (
                      <div className="absolute z-50 w-full border rounded-md mt-1 max-h-44 overflow-y-auto bg-white shadow-lg divide-y">
                        {detalle.examResults.map((e) => (
                          <div
                            key={e.codigo}
                            onClick={() => updateDetalle(idx, { examen: e, examQuery: '', examResults: [] })}
                            className="px-3 py-2 text-xs cursor-pointer hover:bg-blue-50 transition-colors"
                          >
                            <span className="font-mono font-semibold text-blue-700 mr-2">{e.cpms}</span>
                            <span className="text-gray-700">{e.descripcion}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {detalle.examen ? (
                    <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded px-3 py-2 text-xs">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle className="h-3.5 w-3.5 text-green-600 shrink-0" />
                        <span className="font-mono font-bold text-green-800">{detalle.examen.cpms}</span>
                        <span className="text-green-700">— {detalle.examen.descripcion}</span>
                      </div>
                      <button
                        onClick={() => updateDetalle(idx, { examen: null, examQuery: '' })}
                        className="text-red-400 hover:text-red-600 ml-2"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs text-amber-600">⚠️ Escriba para filtrar exámenes</p>
                  )}
                </div>

                {/* CIEX */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">
                    Diagnóstico CIEX <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    {detalle.ciex ? (
                      <div className="flex items-center justify-between bg-yellow-50 border border-yellow-300 rounded px-3 py-2 text-xs">
                        <div className="flex items-center gap-1.5">
                          <CheckCircle className="h-3.5 w-3.5 text-yellow-700 shrink-0" />
                          <span className="font-mono font-bold text-yellow-800">{detalle.ciex.codigo}</span>
                          {detalle.ciex.nombre && <span className="text-gray-700">— {detalle.ciex.nombre}</span>}
                        </div>
                        <button
                          onClick={() => updateDetalle(idx, { ciex: null, ciexQuery: '', ciexResults: [] })}
                          className="text-red-400 hover:text-red-600 ml-2"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="relative flex items-center gap-2">
                          <div className="relative flex-1">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                            <Input
                              placeholder="Buscar diagnóstico CIE-X (ej: diabetes, fractura...)"
                              value={detalle.ciexQuery}
                              onChange={(e) => {
                                updateDetalle(idx, { ciexQuery: e.target.value })
                                if (e.target.value.length >= 2) buscarCiex(idx, e.target.value)
                                else updateDetalle(idx, { ciexResults: [] })
                              }}
                              className="pl-8 h-9 text-xs"
                            />
                          </div>
                          {detalle.ciexLoading && <Loader2 className="h-4 w-4 animate-spin text-gray-400 shrink-0" />}
                        </div>
                        {detalle.ciexResults.length > 0 && (
                          <div className="absolute z-50 w-full border rounded-md mt-1 max-h-44 overflow-y-auto bg-white shadow-lg divide-y">
                            {detalle.ciexResults.map((c) => (
                              <div
                                key={c.id}
                                onClick={() => updateDetalle(idx, { ciex: c, ciexQuery: '', ciexResults: [] })}
                                className="px-3 py-2 text-xs cursor-pointer hover:bg-yellow-50 transition-colors"
                              >
                                <span className="font-mono font-semibold text-yellow-800 mr-2">{c.codigo}</span>
                                <span className="text-gray-700">{c.nombre}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        <p className="text-xs text-amber-600">⚠️ Seleccione el diagnóstico CIEX de la lista</p>
                      </>
                    )}
                  </div>
                </div>

                {/* Observación del detalle */}
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-gray-700">Observación</Label>
                  <Textarea
                    value={detalle.observacion}
                    onChange={(e) => updateDetalle(idx, { observacion: e.target.value })}
                    rows={2}
                    className="text-xs resize-none"
                    placeholder="Observación o indicación para este examen..."
                  />
                </div>
              </div>
            ))}
          </div>

          {/* ── Botón agregar examen ── */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addDetalle}
            className="w-full border-dashed border-blue-300 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Agregar otro examen
          </Button>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose} disabled={creando}>
            Cancelar
          </Button>
          <Button
            onClick={handleCrear}
            disabled={detalles.every(d => !d.examen && !d.ciex) || creando}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {creando ? (
              <><Loader2 className="h-4 w-4 animate-spin mr-2" />Guardando...</>
            ) : ordenToEdit ? (
              <><ClipboardList className="h-4 w-4 mr-2" />Actualizar Orden</>
            ) : (
              <><ClipboardList className="h-4 w-4 mr-2" />Crear Orden</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
