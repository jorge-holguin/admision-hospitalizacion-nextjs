"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Printer, CheckCircle } from "lucide-react"

interface PrintingModalProps {
  isOpen: boolean
  onClose: () => void
}

export function PrintingModal({ isOpen, onClose }: PrintingModalProps) {
  const [progress, setProgress] = useState(0)
  const [showSuccess, setShowSuccess] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setProgress(0)
      setShowSuccess(false)
      
      // Animación de progreso
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval)
            setShowSuccess(true)
            // Cerrar después de mostrar el check
            setTimeout(() => {
              onClose()
            }, 1000)
            return 100
          }
          return prev + 2 // Incremento cada 100ms para completar en 5 segundos
        })
      }, 100)

      return () => clearInterval(interval)
    }
  }, [isOpen, onClose])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        <div className="flex flex-col items-center justify-center py-8 space-y-6">
          {!showSuccess ? (
            <>
              {/* Icono de impresora con animación */}
              <div className="relative">
                <Printer className="w-16 h-16 text-blue-600 animate-pulse" />
                <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-blue-600 rounded-full flex flex-wrap items-center justify-center">
                  <span className="text-white text-xs font-bold">{Math.round(progress)}%</span>
                </div>
              </div>

              {/* Texto */}
              <div className="text-center space-y-2">
                <h3 className="text-xl font-semibold text-gray-900">
                  Imprimiendo cita...
                </h3>
                <p className="text-sm text-gray-500">
                  Por favor espere mientras se procesa la impresión
                </p>
              </div>

              {/* Barra de progreso */}
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-blue-600 h-full rounded-full transition-all duration-100 ease-linear"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </>
          ) : (
            <>
              {/* Icono de éxito */}
              <div className="relative">
                <CheckCircle className="w-16 h-16 text-green-600 animate-bounce" />
              </div>

              {/* Texto de éxito */}
              <div className="text-center space-y-2">
                <h3 className="text-xl font-semibold text-gray-900">
                  ¡Impresión completada!
                </h3>
                <p className="text-sm text-gray-500">
                  La cita se ha enviado a imprimir correctamente
                </p>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
