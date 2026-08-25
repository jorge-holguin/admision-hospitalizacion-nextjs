"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Printer, Calendar, Clock, User, Stethoscope, Building2, CreditCard, FileText, Copy, CheckCircle2, Download } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { imprimirCita, type CitaDto } from "@/services/appointments/printService"
import { obtenerEntidadSISPorCodigo } from "@/services/appointments/sisEntitiesService"
import Image from "next/image"
import html2canvas from "html2canvas"

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
  numRef?: string;      // Número de referencia SIS (opcional)
  entidadSis?: string;  // Entidad SIS (opcional)
  codigoSeguro?: string; // Código del seguro para validar si es SIS
};

interface TicketPreviewModalProps {
  isOpen: boolean
  onClose: () => void
  ticketData: TicketData | null
}

export function TicketPreviewModal({ isOpen, onClose, ticketData }: TicketPreviewModalProps) {
  const [isPrinting, setIsPrinting] = useState(false)
  const [isCopying, setIsCopying] = useState(false)
  const [entidadSisNombre, setEntidadSisNombre] = useState<string>('')
  const [copySuccess, setCopySuccess] = useState<'copied' | 'downloaded' | null>(null)

  // Función para ofuscar el nombre del operador
  // Ejemplo: "HOLGUIN CUCALON JORGE" -> "JHOLGUIN"
  const ofuscarOperador = (nombreCompleto: string): string => {
    if (!nombreCompleto || nombreCompleto.trim() === '') return ''
    
    const partes = nombreCompleto.trim().split(/\s+/)
    if (partes.length === 0) return ''
    
    // Si solo hay una palabra, devolver la primera letra en mayúscula
    if (partes.length === 1) {
      return partes[0].charAt(0).toUpperCase()
    }
    
    // Tomar la primera letra del último elemento (nombre) + primer apellido
    const nombre = partes[partes.length - 1] // Último elemento es el nombre
    const primerApellido = partes[0] // Primer elemento es el primer apellido
    
    return (nombre.charAt(0) + primerApellido).toUpperCase()
  }

  // Cargar nombre de entidad SIS cuando se abre el modal
  useEffect(() => {
    const fetchEntidadSisNombre = async () => {
      if (!ticketData?.entidadSis) {
        setEntidadSisNombre('')
        return
      }

      try {
        console.log('🔍 Obteniendo nombre de entidad SIS:', ticketData.entidadSis)
        const result = await obtenerEntidadSISPorCodigo(ticketData.entidadSis.trim())
        if (result.success && result.data) {
          setEntidadSisNombre(result.data.NOMBRE)
          console.log('✅ Nombre de entidad SIS obtenido:', result.data.NOMBRE)
        } else {
          console.warn('⚠️ No se pudo obtener el nombre de la entidad SIS')
          setEntidadSisNombre('')
        }
      } catch (error) {
        console.error('❌ Error al obtener nombre de entidad SIS:', error)
        setEntidadSisNombre('')
      }
    }

    if (isOpen && ticketData) {
      fetchEntidadSisNombre()
    }
  }, [isOpen, ticketData])

  // Resetear estados cuando el modal se cierra
  useEffect(() => {
    if (!isOpen) {
      setIsPrinting(false)
      setIsCopying(false)
      setEntidadSisNombre('')
      setCopySuccess(null)
    }
  }, [isOpen])

  const handlePrintToThermal = async () => {
    if (!ticketData) return
    
    setIsPrinting(true)
    try {
      // Verificar si el seguro es SIS (códigos 20-25)
      const codigoSeguro = ticketData.codigoSeguro?.trim() || ''
      const esSIS = ['20', '21', '22', '23', '24', '25'].includes(codigoSeguro)
      
      // Formatear EESS como "(código) - nombre" si tenemos el nombre
      let eessFormatted = ''
      if (ticketData.entidadSis) {
        if (entidadSisNombre) {
          eessFormatted = `(${ticketData.entidadSis.trim()}) - ${entidadSisNombre}`
        } else {
          eessFormatted = ticketData.entidadSis.trim()
        }
      }

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
        operador: ofuscarOperador(ticketData.operador),
        seguro: ticketData.seguro,
        // Solo incluir nroRef y eess si es seguro SIS
        ...(esSIS && {
          nroRef: ticketData.numRef || '',
          eess: eessFormatted
        })
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

  // Función auxiliar para forzar estilos de grid en el clon (html2canvas no procesa media queries)
  const forceGridStyles = (element: HTMLElement) => {
    // Buscar todos los elementos con clases de grid responsivo y forzar el layout desktop
    const grids = element.querySelectorAll('[class*="grid"]')
    grids.forEach((grid) => {
      const el = grid as HTMLElement
      const classes = el.className
      
      // Forzar grid-cols-2 para elementos con md:grid-cols-2
      if (classes.includes('md:grid-cols-2')) {
        el.style.display = 'grid'
        el.style.gridTemplateColumns = 'repeat(2, minmax(0, 1fr))'
        el.style.gap = '0.75rem'
      }
      
      // Forzar grid-cols-3 para elementos con md:grid-cols-3
      if (classes.includes('md:grid-cols-3')) {
        el.style.display = 'grid'
        el.style.gridTemplateColumns = 'repeat(3, minmax(0, 1fr))'
        el.style.gap = '0.75rem'
      }
      
      // Forzar col-span para elementos con md:col-span-2 o md:col-span-3
      if (classes.includes('md:col-span-2')) {
        el.style.gridColumn = 'span 2 / span 2'
      }
      if (classes.includes('md:col-span-3')) {
        el.style.gridColumn = 'span 3 / span 3'
      }
    })
  }

  // Verificar si Clipboard API está disponible (requiere HTTPS o localhost)
  const isClipboardAvailable = (): boolean => {
    try {
      return !!(navigator.clipboard && typeof ClipboardItem !== 'undefined')
    } catch {
      return false
    }
  }

  // Copiar TODO el contenido del ticket como imagen (sin recortes)
  const handleCopyAsImage = async () => {
    if (!ticketData) return
    setIsCopying(true)
    setCopySuccess(null)

    try {
      const src = document.getElementById('ticket-cita')
      if (!src) throw new Error('No se encontró el elemento del ticket')

      // 1) Crear contenedor para el clon
      const cloneWrapper = document.createElement('div')
      cloneWrapper.style.position = 'absolute'
      cloneWrapper.style.left = '-9999px'
      cloneWrapper.style.top = '0'
      cloneWrapper.style.width = '550px'
      cloneWrapper.style.zIndex = '-1'

      const clone = src.cloneNode(true) as HTMLElement
      clone.style.maxHeight = 'none'
      clone.style.overflow = 'visible'
      clone.style.height = 'auto'
      clone.style.width = '550px'
      clone.style.backgroundColor = '#ffffff'
      clone.style.padding = '20px'
      
      clone.classList.remove('max-h-[calc(95vh-120px)]', 'overflow-y-auto')
      forceGridStyles(clone)

      cloneWrapper.appendChild(clone)
      document.body.appendChild(cloneWrapper)

      // 2) Esperar imágenes (timeout corto)
      const images = clone.getElementsByTagName('img')
      await Promise.all(
        Array.from(images).map(img => {
          if (img.complete) return Promise.resolve()
          return new Promise<void>((resolve) => {
            img.onload = () => resolve()
            img.onerror = () => resolve()
            setTimeout(resolve, 500) // Timeout corto
          })
        })
      )

      // 3) Capturar con html2canvas (scale reducido para velocidad)
      const canvas = await html2canvas(clone, {
        scale: 1.5, // Reducido de 2 para mayor velocidad
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: 550,
        windowWidth: 550
      })

      // 4) Generar blob
      const blob: Blob | null = await new Promise(res => canvas.toBlob(res, 'image/png', 0.92))
      if (!blob) throw new Error('No se pudo generar la imagen')

      // 5) Limpiar clon inmediatamente
      cloneWrapper.remove()

      // 6) Copiar o descargar
      let copiado = false
      
      if (isClipboardAvailable()) {
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ])
          copiado = true
        } catch (clipboardError) {
          console.warn('Clipboard API falló:', clipboardError)
        }
      }

      if (copiado) {
        setCopySuccess('copied')
        toast({
          title: "📋 Ticket copiado",
          description: "Pega con Ctrl+V en WhatsApp",
          className: "bg-green-50 border-green-200 text-green-800",
          duration: 4000
        })
      } else {
        // Fallback: descargar
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `ticket-cita-${ticketData.numero}.png`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        
        setCopySuccess('downloaded')
        toast({
          title: "📥 Imagen descargada",
          description: "Ábrela y compártela en WhatsApp",
          className: "bg-blue-50 border-blue-200 text-blue-800",
          duration: 4000
        })
      }
    } catch (error) {
      console.error('Error al copiar/descargar imagen:', error)
      toast({
        title: "Error al generar imagen",
        description: error instanceof Error ? error.message : "No se pudo generar la imagen",
        variant: "destructive"
      })
    } finally {
      // Limpieza de seguridad
      const ghosts = document.querySelectorAll('div[style*="left: -9999px"]')
      ghosts.forEach(ghost => ghost.remove())
      setIsCopying(false)
    }
  }

  if (!ticketData) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl w-full max-h-[95vh] p-0 gap-0 bg-white overflow-hidden" onInteractOutside={(e) => e.preventDefault()}>
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

            {/* Información SIS (solo si es seguro SIS: códigos 20-25) */}
            {ticketData.codigoSeguro && ['20', '21', '22', '23', '24', '25'].includes(ticketData.codigoSeguro.trim()) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                {/* Número de Referencia SIS */}
                {ticketData.numRef && (
                  <div className="bg-purple-50 p-3 rounded-lg shadow-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="h-4 w-4 text-purple-600" />
                      <p className="text-xs text-gray-600 font-medium">Nro. Referencia SIS</p>
                    </div>
                    <p className="text-sm font-bold text-purple-900">{ticketData.numRef}</p>
                  </div>
                )}
                
                {/* Entidad SIS (EESS) */}
                {ticketData.entidadSis && (
                  <div className="bg-purple-50 p-3 rounded-lg shadow-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <Building2 className="h-4 w-4 text-purple-600" />
                      <p className="text-xs text-gray-600 font-medium">EESS</p>
                    </div>
                    <p className="text-sm font-bold text-purple-900">
                      {entidadSisNombre 
                        ? `(${ticketData.entidadSis.trim()}) - ${entidadSisNombre}`
                        : ticketData.entidadSis}
                    </p>
                  </div>
                )}
              </div>
            )}

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
                Presentarse <span className="font-bold">30 minutos antes</span>. Traer DNI.
              </p>
            </div>

            {/* Footer */}
            <div className="text-center pt-3 border-t border-gray-200">
              <p className="text-xs text-gray-500">Emitido: {ticketData.emitidoEl} | Operador: {ofuscarOperador(ticketData.operador)}</p>
            </div>
          </div>
        </div>

        {/* Mensaje de éxito visible en el modal */}
        {copySuccess && (
          <div className={`mx-3 mt-3 p-3 rounded-lg flex items-center gap-3 ${
            copySuccess === 'copied' 
              ? 'bg-green-100 border border-green-300 text-green-800' 
              : 'bg-blue-100 border border-blue-300 text-blue-800'
          }`}>
            {copySuccess === 'copied' ? (
              <>
                <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-sm">✅ Imagen copiada al portapapeles</p>
                  <p className="text-xs">Pega con Ctrl+V en WhatsApp Web</p>
                </div>
              </>
            ) : (
              <>
                <Download className="h-5 w-5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-sm">📥 Imagen descargada</p>
                  <p className="text-xs">Ábrela desde Descargas y compártela</p>
                </div>
              </>
            )}
          </div>
        )}

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
            className={`w-full rounded-lg py-5 transition font-semibold shadow-lg ${
              copySuccess === 'copied' 
                ? 'bg-green-600 hover:bg-green-700 text-white' 
                : copySuccess === 'downloaded'
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            {isCopying ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Generando imagen...
              </>
            ) : copySuccess === 'copied' ? (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                ¡Copiado! Pega con Ctrl+V
              </>
            ) : copySuccess === 'downloaded' ? (
              <>
                <Download className="h-4 w-4 mr-2" />
                Descargado ✓
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
