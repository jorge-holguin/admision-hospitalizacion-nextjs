"use client"

import { type ReactNode } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Search, CheckCircle, X, Loader2, Trash2, Plus } from "lucide-react"

// ── Constante compartida ────────────────────────────────────────────────────
export const MAX_OBSERVACION_LENGTH = 200

// ── Tipos compartidos ───────────────────────────────────────────────────────
export interface MaestroExamen {
  codigo: string
  cpms: string
  grupo: string
  descripcion: string
  estado: boolean
  item: string | null
  item2: string | null
  pedido: boolean
}

export interface CiexItem {
  id: number
  codigo: string
  nombre: string
}

export interface DetalleItem {
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

export const emptyDetalle = (): DetalleItem => ({
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

// ── Badge de estado de detalle ──────────────────────────────────────────────
export function EstadoDetalleBadge({ estado }: { estado: string | undefined }): ReactNode {
  if (!estado) return null
  if (estado === '2') {
    return (
      <span className="inline-flex flex-wrap items-center px-2 py-0.5 rounded text-xs font-semibold bg-green-100 text-green-800 border border-green-300">
        ✓ Completado
      </span>
    )
  }
  if (estado === '0') {
    return (
      <span className="inline-flex flex-wrap items-center px-2 py-0.5 rounded text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-300">
        Cancelado
      </span>
    )
  }
  return (
    <span className="inline-flex flex-wrap items-center px-2 py-0.5 rounded text-xs font-semibold bg-orange-100 text-orange-800 border border-orange-300">
      Pendiente
    </span>
  )
}

// ── Props ───────────────────────────────────────────────────────────────────
interface OrdenDetallesListProps {
  detalles: DetalleItem[]
  allExamenes: MaestroExamen[]
  loadingExam: boolean
  isEditing: boolean
  updateDetalle: (idx: number, patch: Partial<DetalleItem>) => void
  removeDetalle: (idx: number) => void
  addDetalle: () => void
  buscarCiex: (idx: number, q: string) => Promise<void>
}

// ── Componente principal ────────────────────────────────────────────────────
export function OrdenDetallesList({
  detalles,
  allExamenes,
  loadingExam,
  isEditing,
  updateDetalle,
  removeDetalle,
  addDetalle,
  buscarCiex,
}: OrdenDetallesListProps) {
  return (
    <div className="space-y-3">
      {/* ── Ítems ── */}
      {detalles.map((detalle, idx) => (
        <div key={detalle.uid} className="border border-gray-200 rounded-lg p-3 space-y-3 bg-gray-50">

          {/* Cabecera del ítem */}
          <div className="flex flex-wrap items-center justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Examen #{idx + 1}
              </span>
              {isEditing && <EstadoDetalleBadge estado={detalle.estadoDetalle} />}
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

          {/* Examen / CPMS */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">
              Examen / Procedimiento <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <div className="relative flex flex-wrap items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                  <Input
                    placeholder={loadingExam ? 'Cargando exámenes...' : 'Ej: abdominal, mama, obstétrica...'}
                    value={detalle.examQuery}
                    disabled={loadingExam || !!detalle.examen}
                    onChange={(e) => {
                      const q = e.target.value
                      const results = q.trim().length > 0
                        ? allExamenes.filter(ex =>
                            (ex.descripcion || '').toLowerCase().includes(q.toLowerCase()) ||
                            (ex.codigo || '').toLowerCase().includes(q.toLowerCase()) ||
                            (ex.cpms || '').includes(q)
                          ).slice(0, 20)
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
                      <span className="font-mono font-semibold text-blue-700 mr-2">{e.codigo}</span>
                      <span className="text-gray-700">{e.descripcion}</span>
                      {e.cpms && e.cpms !== e.codigo && (
                        <span className="ml-2 text-[10px] text-gray-500">({e.cpms})</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            {detalle.examen ? (
              <div className="flex flex-wrap items-center justify-between bg-green-50 border border-green-200 rounded px-3 py-2 text-xs">
                <div className="flex flex-wrap items-center gap-1.5">
                  <CheckCircle className="h-3.5 w-3.5 text-green-600 shrink-0" />
                  <span className="font-mono font-bold text-green-800">{detalle.examen.codigo}</span>
                  <span className="text-green-700">— {detalle.examen.descripcion}</span>
                  {detalle.examen.cpms && detalle.examen.cpms !== detalle.examen.codigo && (
                    <span className="text-[10px] text-green-600">({detalle.examen.cpms})</span>
                  )}
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

          {/* Diagnóstico CIEX */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">
              Diagnóstico CIEX <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              {detalle.ciex ? (
                <div className="flex flex-wrap items-center justify-between bg-yellow-50 border border-yellow-300 rounded px-3 py-2 text-xs">
                  <div className="flex flex-wrap items-center gap-1.5">
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
                  <div className="relative flex flex-wrap items-center gap-2">
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

          {/* Observación con contador visual */}
          <div className="space-y-1">
            <div className="flex flex-wrap items-center justify-between">
              <Label className="text-xs font-medium text-gray-700">Observación</Label>
              <span
                className={`text-xs tabular-nums transition-colors ${
                  detalle.observacion.length >= MAX_OBSERVACION_LENGTH
                    ? 'text-red-500 font-semibold'
                    : detalle.observacion.length >= MAX_OBSERVACION_LENGTH * 0.8
                    ? 'text-amber-500'
                    : 'text-gray-400'
                }`}
              >
                {detalle.observacion.length}/{MAX_OBSERVACION_LENGTH}
              </span>
            </div>
            <Textarea
              value={detalle.observacion}
              onChange={(e) =>
                updateDetalle(idx, { observacion: e.target.value.slice(0, MAX_OBSERVACION_LENGTH) })
              }
              maxLength={MAX_OBSERVACION_LENGTH}
              rows={2}
              className="text-xs resize-none"
              placeholder="Observación o indicación para este examen..."
            />
          </div>
        </div>
      ))}

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
  )
}
