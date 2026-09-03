"use client"

import { useState, useCallback, useEffect, type ReactNode } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2, FileText, Stethoscope, ClipboardList } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { extractDocumentFromToken } from "@/utils/jwtUtils"
import {
  OrdenDetallesList,
  MAX_OBSERVACION_LENGTH,
  emptyDetalle,
  type DetalleItem,
  type MaestroExamen,
  type CiexItem,
} from "./OrdenDetallesList"

const APOYO_DIAGNOSTICO_BASE_URL = import.meta.env.VITE_API_APOYO_DIAGNOSTICO_URL || 'http://192.168.5.239:9020'
const API_CITAS_URL = import.meta.env.VITE_API_CITAS_MASTER_URL || 'http://192.168.0.252:9011/api'

const truncateObservacion = (value?: string | null) => (value || '').trim().slice(0, MAX_OBSERVACION_LENGTH)

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

/**
 * Normaliza el código de seguro del selector para enviarlo como idTipoSeguro.
 * Solo recorta espacios y unifica 00 -> 0 (PAGANTE).
 */
function normalizeSeguroCode(seguro: string | undefined): string {
  const s = (seguro ?? '').toString().trim()
  if (s === '00') return '0'
  return s
}

/**
 * Normaliza un item del catálogo de exámenes proveniente del API.
 * El endpoint /api/maestros?tipo=EXAMEN&grupo={grupo}&activo=1 retorna `codigo`,
 * `descripcion` y `cpms`; `cpms` se usa para el payload de la orden.
 */
function normalizeMaestroExamen(raw: any): MaestroExamen | null {
  if (!raw || typeof raw !== 'object') return null
  const codigo = (raw.codigo ?? '').toString().trim()
  const cpms = (raw.cpms ?? '').toString().trim()
  const key = codigo || cpms
  if (!key) return null
  const activo = raw.activo ?? raw.estado
  const pedidoRaw = raw.pedido ?? raw.PEDIDO
  return {
    codigo: key,
    cpms: cpms || codigo,
    grupo: (raw.grupo ?? '').toString().trim(),
    descripcion: (raw.descripcion ?? '').toString().trim(),
    estado: activo === true || activo === 1 || activo === '1',
    item: raw.item != null ? String(raw.item) : null,
    item2: raw.item2 != null ? String(raw.item2) : null,
    pedido: pedidoRaw === true || pedidoRaw === 1 || pedidoRaw === '1',
  }
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
          ? { cpms: d.cpms, descripcion: d.cpmsDescripcion || d.cpms, codigo: d.cpms, grupo: '', estado: true, item: null, item2: null, pedido: false }
          : null,
        ciex: d.ciex ? { id: 0, codigo: d.ciex, nombre: '' } : null,
        ciexQuery: d.ciex || '',
        observacion: truncateObservacion(d.observacion),
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
    const observacion = truncateObservacion(referencia?.datos_referencia?.resume_exfisico)

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
          const raw: unknown[] = Array.isArray(json?.data) ? json.data : []
          const lista: MaestroExamen[] = raw.reduce<MaestroExamen[]>((acc, item) => {
            const e = normalizeMaestroExamen(item)
            return e ? [...acc, e] : acc
          }, [])
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
        const params = new URLSearchParams({ tipo: 'EXAMEN', grupo: tipoMaestro, activo: '1' })
        const res = await fetch(`${base}/api/maestros?${params}`)
        if (res.ok) {
          const json = await res.json()
          const raw: unknown[] = Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : []
          const lista: MaestroExamen[] = raw.reduce<MaestroExamen[]>((acc, item) => {
            const e = normalizeMaestroExamen(item)
            return e ? [...acc, e] : acc
          }, [])
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
      const origenDefault = obtenerTipoAtencion(referencia?.datos_referencia?.servicio_origen || '')

      let tipoServicio = upsInfo.tipoServicio
      if (isEditing && ordenToEdit!.tipoServicio) tipoServicio = ordenToEdit!.tipoServicio

      let idLugar = 0
      if (isEditing) {
        idLugar = ordenToEdit!.idLugar != null ? Number(ordenToEdit!.idLugar) : 0
      } else {
        idLugar = Number(referencia?.datos_referencia?.codigo_establecimiento_origen) || 0
      }

      let origen: string = origenDefault
      if (isEditing && ordenToEdit!.origen) origen = ordenToEdit!.origen

      let origenId = '0'
      if (isEditing) {
        origenId = ordenToEdit!.origenId || '0'
      } else if (isPacientePeriferico) {
        origenId = '0'
      } else {
        origenId = referencia?.datos_referencia?.id_referencia || '0'
      }

      let idTipoSeguro = '0'
      if (isEditing) {
        idTipoSeguro = (ordenToEdit!.idTipoSeguro || '0').toString().trim()
      } else {
        idTipoSeguro = (normalizeSeguroCode(selectedSeguro)
          || normalizeSeguroCode(seguroPaciente)
          || '0').toString().trim()
      }

      const idMedico = isEditing ? Number(ordenToEdit!.idMedico || 1) : 1
      const cama = isEditing ? (ordenToEdit!.cama ?? null) : null

      const isPeriferico = !!isPacientePeriferico
      const body: any = {
        idPaciente: pacienteId,
        tipoServicio,
        idLugar,
        origen,
        origenId,
        idTipoSeguro,
        idMedico,
        cama,
        periferico: isPeriferico,
        detalles: valid.map(d => ({
          cpms: d.examen!.cpms || '',
          cantidad: 1,
          ciex: d.ciex!.codigo,
          observacion: truncateObservacion(d.observacion),
        })),
      }
      if (isEditing) body.idOrden = ordenToEdit!.idOrden
      console.log('[CrearOrden] payload:', JSON.stringify(body, null, 2))

      let url: string
      if (isEditing) {
        url = `${APOYO_DIAGNOSTICO_BASE_URL}/api/apoyo-diagnostico/ordenes/${ordenToEdit!.idOrden}`
      } else if (isPeriferico) {
        url = `${APOYO_DIAGNOSTICO_BASE_URL}/api/apoyo-diagnostico/ordenes/perifericas`
      } else {
        url = `${APOYO_DIAGNOSTICO_BASE_URL}/api/apoyo-diagnostico/ordenes`
      }
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

      let toastTitle = '✅ Orden creada'
      let toastDescription = `Orden #${idOrden} con ${valid.length} examen(es) creada exitosamente.`
      if (isEditing) {
        toastTitle = '✅ Orden actualizada'
        toastDescription = `Orden #${idOrden} actualizada con ${valid.length} examen(es).`
      }
      toast({ title: toastTitle, description: toastDescription })
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

  let submitButtonContent: ReactNode
  if (creando) {
    submitButtonContent = <><Loader2 className="h-4 w-4 animate-spin mr-2" />Guardando...</>
  } else if (ordenToEdit) {
    submitButtonContent = <><ClipboardList className="h-4 w-4 mr-2" />Actualizar Orden</>
  } else {
    submitButtonContent = <><ClipboardList className="h-4 w-4 mr-2" />Crear Orden</>
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

          {/* ── Lista de detalles (componente reutilizable) ── */}
          <OrdenDetallesList
            detalles={detalles}
            allExamenes={allExamenes}
            loadingExam={loadingExam}
            isEditing={!!ordenToEdit}
            updateDetalle={updateDetalle}
            removeDetalle={removeDetalle}
            addDetalle={addDetalle}
            buscarCiex={buscarCiex}
          />
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
            {submitButtonContent}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
