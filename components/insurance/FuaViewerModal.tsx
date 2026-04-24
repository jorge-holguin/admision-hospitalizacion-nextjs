"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Download, ExternalLink, FileText, Loader2 } from "lucide-react"
import { useEffect, useState } from "react"

interface FuaViewerModalProps {
  open: boolean
  onClose: () => void
  citaId: string
  numeroFua?: string
}

// Visor de FUA usando el endpoint del backend de citas.
// Ej: http://192.168.0.252:9011/api/reporte/fua?citaId=260059002
const API_BASE = process.env.NEXT_PUBLIC_API_CITAS_MASTER_URL

export function FuaViewerModal({ open, onClose, citaId, numeroFua }: FuaViewerModalProps) {
  const [loading, setLoading] = useState(true)

  const documentUrl = citaId
    ? `${API_BASE}/reporte/fua?citaId=${encodeURIComponent(citaId)}`
    : ""

  useEffect(() => {
    if (open) setLoading(true)
  }, [open, citaId])

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-5xl w-[95vw] h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b bg-gradient-to-r from-[#4F9BB6]/10 to-[#9CD2D3]/10">
          <DialogTitle className="text-[#114C5F] flex items-center gap-2">
            <FileText className="w-5 h-5" />
            FUA {numeroFua ? `N° ${numeroFua}` : ""}
            {citaId ? <span className="text-sm text-gray-500 font-normal ml-2">(Cita {citaId})</span> : null}
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
          {citaId && (
            <iframe
              key={documentUrl}
              src={documentUrl}
              title={`FUA ${citaId}`}
              className="w-full h-full border-0"
              onLoad={() => setLoading(false)}
            />
          )}
        </div>
        {/* Footer con acciones */}
        <div className="px-6 py-3 border-t bg-gray-50 flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(documentUrl, "_blank", "noopener,noreferrer")}
            className="border-[#9CD2D3] text-[#114C5F] hover:bg-[#9CD2D3]/10"
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
