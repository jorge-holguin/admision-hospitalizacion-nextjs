"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Download, ExternalLink, FileText, Loader2 } from "lucide-react"
import { useEffect, useState } from "react"

interface FuaViewerModalProps {
  open: boolean
  onClose: () => void
  /** ID de cita: se usa para construir la URL del reporte FUA en PDF (fallback). */
  citaId?: string
  /** ID de documento (detalleId): se usa para el FUA firmado (primera opción). */
  idDocumento?: string
  numeroFua?: string
}

// Visor del documento FUA (PDF).
//   1ª opción: FUA firmado
//      GET {FIRMADO_BASE}/ConsultaExterna/Fua056/getDocumentoFirmado?idDocumento=...&idTipoDocumento=10
//   2ª opción (fallback ante 400/500/error de red):
//      GET {API_BASE}/reporte/fua?citaId=...
const API_BASE = import.meta.env.VITE_API_CITAS_MASTER_URL
const FIRMADO_BASE =
  import.meta.env.VITE_FIRMADO_URL ?? "http://192.168.0.20:9200"
const ID_TIPO_DOCUMENTO_FUA = "10"

export function FuaViewerModal({
  open,
  onClose,
  citaId,
  idDocumento,
  numeroFua,
}: FuaViewerModalProps) {
  const [loading, setLoading] = useState(true)
  const [documentUrl, setDocumentUrl] = useState<string>("")
  const [usandoFirmado, setUsandoFirmado] = useState(false)

  const fallbackUrl = citaId
    ? `${API_BASE}/reporte/fua?citaId=${encodeURIComponent(citaId)}`
    : ""
  const firmadoUrl = idDocumento
    ? `${FIRMADO_BASE}/ConsultaExterna/Fua056/getDocumentoFirmado?idDocumento=${encodeURIComponent(
        idDocumento
      )}&idTipoDocumento=${ID_TIPO_DOCUMENTO_FUA}`
    : ""

  useEffect(() => {
    if (!open) return
    setLoading(true)
    setUsandoFirmado(false)
    // Si no hay idDocumento, ir directo al fallback.
    if (!firmadoUrl) {
      setDocumentUrl(fallbackUrl)
      return
    }
    let cancelled = false
    // Probar el FUA firmado con HEAD. Si responde 2xx → usar firmado.
    // Si devuelve 4xx/5xx o falla (CORS/red) → usar fallback.
    fetch(firmadoUrl, { method: "HEAD" })
      .then((res) => {
        if (cancelled) return
        if (res.ok) {
          setDocumentUrl(firmadoUrl)
          setUsandoFirmado(true)
        } else {
          setDocumentUrl(fallbackUrl)
        }
      })
      .catch(() => {
        if (!cancelled) setDocumentUrl(fallbackUrl)
      })
    return () => {
      cancelled = true
    }
  }, [open, citaId, idDocumento, firmadoUrl, fallbackUrl])

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-5xl w-[95vw] h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b bg-gradient-to-r from-[#4F9BB6]/10 to-[#9CD2D3]/10">
          <DialogTitle className="text-[#114C5F] flex flex-wrap items-center gap-2">
            <FileText className="w-5 h-5" />
            FUA {numeroFua ? `N° ${numeroFua}` : ""}
            {citaId ? (
              <span className="text-sm text-gray-500 font-normal ml-2">(Cita {citaId})</span>
            ) : null}
            {usandoFirmado && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-800 border border-green-300 ml-2">
                Firmado
              </span>
            )}
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 relative bg-gray-100 overflow-hidden">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-8 h-8 animate-spin text-[#4F9BB6]" />
                <p className="text-sm text-gray-500">Cargando documento firmado...</p>
              </div>
            </div>
          )}
          {documentUrl && (
            <iframe
              key={documentUrl}
              src={documentUrl}
              title={`FUA ${citaId || ""}`}
              className="w-full h-full border-0"
              onLoad={() => setLoading(false)}
            />
          )}
          {!documentUrl && (
            <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-500">
              No hay un ID de cita disponible para mostrar el FUA.
            </div>
          )}
        </div>
        {/* Footer con acciones */}
        <div className="px-6 py-3 border-t bg-gray-50 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(documentUrl, "_blank", "noopener,noreferrer")}
            className="border-[#9CD2D3] text-[#114C5F] hover:bg-[#9CD2D3]/10 w-full sm:w-auto"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Abrir en nueva pestaña
          </Button>
          <Button
            size="sm"
            className="bg-[#4F9BB6] hover:bg-[#4A6EB0] text-white"
            asChild
          >
            <a href={documentUrl} download>
              <Download className="w-4 h-4 mr-2" />
              Descargar
            </a>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
