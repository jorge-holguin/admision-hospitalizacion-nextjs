"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Printer, Calendar, Clock, User, Stethoscope, Building2, CreditCard, FileText, Copy } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { imprimirCita, type CitaDto } from "@/services/appointments/printService"
import Image from "next/image"
import html2canvas from "html2canvas"
import * as clipboard from "clipboard-polyfill"

export type TicketData = {
  consultorio: string;
  diaAtencion: string;
  emitidoEl: string;
  historiaClinica: string;
  hora: string;
  medico: string;
  numero: string;
  numeroAtencion: string;
  operador: string;
  paciente: string;
  seguro: string;
  turno: string;
};

interface TicketPreviewModalProps {
  isOpen: boolean
  onClose: () => void
  ticketData: TicketData | null
}

export function TicketPreviewModal({ isOpen, onClose, ticketData }: TicketPreviewModalProps) {
  const [isPrinting, setIsPrinting] = useState(false)
  const [isCopying, setIsCopying] = useState(false)

  // Resetear estados cuando el modal se cierra
  useEffect(() => {
    if (!isOpen) {
      setIsPrinting(false)
      setIsCopying(false)
    }
  }, [isOpen])

  const handlePrintToThermal = async () => {
    if (!ticketData) return
    
    setIsPrinting(true)
    try {
      const citaDto: CitaDto = {
        numero: ticketData.numero,
        numeroAtencion: ticketData.numeroAtencion,
        paciente: ticketData.paciente,
        consultorio: ticketData.consultorio,
        medico: ticketData.medico,
        diaAtencion: ticketData.diaAtencion,
        turno: ticketData.turno,
        hora: ticketData.hora,
        historiaClinica: ticketData.historiaClinica,
        emitidoEl: ticketData.emitidoEl,
        operador: ticketData.operador,
        seguro: ticketData.seguro
      }
      
      await imprimirCita(citaDto)
      
      toast({
        title: "Impresión enviada",
        description: "El ticket se está imprimiendo en la impresora térmica",
        className: "bg-green-50 border-green-200 text-green-800"
      })
      
      // Resetear estado antes de cerrar
      setIsPrinting(false)
      
      setTimeout(() => {
        onClose()
      }, 1500)
    } catch (error) {
      console.error('Error al imprimir:', error)
      toast({
        title: "Error al imprimir",
        description: "No se pudo enviar el ticket a la impresora térmica",
        variant: "destructive"
      })
      setIsPrinting(false)
    }
  }

  // Copiar TODO el contenido del ticket como imagen (sin recortes)
  const handleCopyAsImage = async () => {
    if (!ticketData) return
    setIsCopying(true)

    try {
      const src = document.getElementById('ticket-cita')
      if (!src) throw new Error('No se encontró el elemento del ticket')

      // 1) Esperar un momento para asegurar que todo esté renderizado
      await new Promise(resolve => setTimeout(resolve, 100))

      // 2) Convertir imágenes de Next.js a base64 para evitar problemas de CORS
      const images = Array.from(src.getElementsByTagName('img'))
      const imagePromises = images.map(async (img) => {
        try {
          // Si la imagen ya está cargada y es del mismo origen, convertir a base64
          if (img.complete && img.naturalHeight > 0) {
            const canvas = document.createElement('canvas')
            canvas.width = img.naturalWidth
            canvas.height = img.naturalHeight
            const ctx = canvas.getContext('2d')
            if (ctx) {
              ctx.drawImage(img, 0, 0)
              try {
                const dataUrl = canvas.toDataURL('image/png')
                img.setAttribute('data-original-src', img.src)
                img.src = dataUrl
              } catch (e) {
                console.warn('No se pudo convertir imagen a base64:', e)
              }
            }
          }
        } catch (e) {
          console.warn('Error procesando imagen:', e)
        }
      })
      await Promise.all(imagePromises)

      // 3) Capturar directamente el elemento original (no clonar)
      const scale = 2
      const canvas = await html2canvas(src, {
        scale,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        scrollX: 0,
        scrollY: 0,
        windowWidth: src.scrollWidth,
        windowHeight: src.scrollHeight,
        logging: false,
        removeContainer: false,
        imageTimeout: 0
      })

      // Restaurar imágenes originales
      images.forEach(img => {
        const originalSrc = img.getAttribute('data-original-src')
        if (originalSrc) {
          img.src = originalSrc
          img.removeAttribute('data-original-src')
        }
      })

      // 4) Copiar PNG al portapapeles
      const blob: Blob | null = await new Promise(res => canvas.toBlob(res, 'image/png'))
      if (!blob) throw new Error('No se pudo generar la imagen')

      await clipboard.write([
        new clipboard.ClipboardItem({ [blob.type]: blob })
      ])

      toast({
        title: "📋 Ticket copiado como imagen",
        description: "Pega la imagen en WhatsApp Web con Ctrl+V (usa Chrome o Edge).",
        className: "bg-green-50 border-green-200 text-green-800",
        duration: 5000
      })
    } catch (error) {
      console.error('Error al copiar como imagen:', error)
      toast({
        title: "Error al copiar imagen",
        description: error instanceof Error ? error.message : "No se pudo copiar el ticket como imagen",
        variant: "destructive"
      })
    } finally {
      setIsCopying(false)
    }
  }

  if (!ticketData) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl w-full max-h-[95vh] p-0 gap-0 bg-white overflow-hidden">
        {/* Header oculto para accesibilidad */}
        <DialogHeader className="sr-only">
          <DialogTitle>Ticket de Cita Médica</DialogTitle>
        </DialogHeader>

        {/* Contenedor scrollable del modal (NO en #ticket-cita) */}
        <div className="overflow-y-auto max-h-[calc(95vh-120px)]">
          {/* El ticket NO debe tener overflow/limitaciones */}
          <div id="ticket-cita" className="bg-gradient-to-br from-blue-50 to-white p-6">
            {/* Header con logo */}
            <div className="text-center mb-4 pb-4 border-b-2 border-blue-200">
              <div className="flex justify-center mb-2">
                <Image
                  src="/hjatch-logo.jpg"
                  alt="HJATCH Logo"
                  width={60}
                  height={60}
                  className="rounded-full shadow-md"
                />
              </div>
              <h1 className="text-lg font-bold text-blue-900 mb-1">
                Hospital José Agurto Tello
              </h1>
              <p className="text-xs text-blue-700 font-medium">HJATCH - Chosica</p>
              <p className="text-sm font-bold text-blue-800 mt-2 bg-blue-100 py-1 px-4 rounded-lg inline-block">
                TICKET DE CITA MÉDICA
              </p>
            </div>

            {/* Número de cita y datos principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              {/* Número de cita */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-3 rounded-xl shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs opacity-90 mb-1">N° DE CITA</p>
                    <p className="text-2xl font-bold tracking-wider">{ticketData.numero}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs opacity-90 mb-1">ORDEN</p>
                    <p className="text-2xl font-bold">{ticketData.numeroAtencion}</p>
                  </div>
                </div>
              </div>
              
              {/* Fecha y hora */}
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-3 rounded-xl shadow-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4" />
                  <h3 className="font-bold text-xs">FECHA Y HORA</h3>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs opacity-90">Fecha</p>
                    <p className="text-lg font-bold">{ticketData.diaAtencion}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs opacity-90">Hora</p>
                    <p className="text-lg font-bold">{ticketData.hora}</p>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-orange-400 flex items-center gap-2">
                  <Clock className="h-3 w-3" />
                  <span className="text-xs font-medium">Turno: {ticketData.turno}</span>
                </div>
              </div>
            </div>

            {/* Información del paciente */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
              {/* Paciente */}
              <div className="md:col-span-3 bg-white rounded-lg p-3 shadow-md border border-blue-100">
                <div className="flex items-center gap-2 mb-2">
                  <User className="h-4 w-4 text-blue-600" />
                  <p className="text-xs text-gray-500 font-medium">PACIENTE</p>
                </div>
                <p className="font-bold text-gray-900 text-sm">{ticketData.paciente}</p>
              </div>
              
              {/* Historia Clínica */}
              <div className="bg-blue-50 p-3 rounded-lg shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  <FileText className="h-4 w-4 text-blue-600" />
                  <p className="text-xs text-gray-600 font-medium">H. Clínica</p>
                </div>
                <p className="text-xl font-bold text-blue-900">{ticketData.historiaClinica}</p>
              </div>
              
              {/* Seguro */}
              <div className="md:col-span-2 bg-green-50 p-3 rounded-lg shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  <CreditCard className="h-4 w-4 text-green-600" />
                  <p className="text-xs text-gray-600 font-medium">Seguro</p>
                </div>
                <p className="text-sm font-bold text-green-900 leading-tight">{ticketData.seguro}</p>
              </div>
            </div>

            {/* Consultorio y médico */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              <div className="bg-white rounded-lg p-3 shadow-md border border-blue-100">
                <div className="flex items-center gap-2 mb-2">
                  <Building2 className="h-4 w-4 text-blue-600" />
                  <p className="text-xs text-gray-500 font-medium">CONSULTORIO</p>
                </div>
                <p className="font-bold text-gray-900 text-sm">{ticketData.consultorio}</p>
              </div>
              
              <div className="bg-white rounded-lg p-3 shadow-md border border-blue-100">
                <div className="flex items-center gap-2 mb-2">
                  <Stethoscope className="h-4 w-4 text-blue-600" />
                  <p className="text-xs text-gray-500 font-medium">MÉDICO</p>
                </div>
                <p className="font-bold text-gray-900 text-sm">{ticketData.medico}</p>
              </div>
            </div>

            {/* Importante */}
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded-r-lg mb-3">
              <p className="text-xs font-bold text-yellow-900 mb-1">⚠️ IMPORTANTE</p>
              <p className="text-xs text-yellow-800 leading-relaxed">
                Presentarse <span className="font-bold">15 minutos antes</span>. Traer DNI y carnet del seguro.
              </p>
            </div>

            {/* Footer */}
            <div className="text-center pt-3 border-t border-gray-200">
              <p className="text-xs text-gray-500">Emitido: {ticketData.emitidoEl} | Operador: {ticketData.operador}</p>
            </div>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="p-3 bg-gray-50 border-t space-y-2 flex-shrink-0">
          <Button
            onClick={handlePrintToThermal}
            disabled={isPrinting || isCopying}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-5 font-semibold shadow-lg"
          >
            {isPrinting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Imprimiendo...
              </>
            ) : (
              <>
                <Printer className="h-4 w-4 mr-2" />
                Imprimir Ticket
              </>
            )}
          </Button>
          
          <Button
            onClick={handleCopyAsImage}
            disabled={isCopying || isPrinting}
            className="w-full bg-emerald-600 text-white rounded-lg py-5 hover:bg-emerald-700 transition font-semibold shadow-lg"
          >
            {isCopying ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Copiando...
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-2" />
                Copiar como imagen
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
