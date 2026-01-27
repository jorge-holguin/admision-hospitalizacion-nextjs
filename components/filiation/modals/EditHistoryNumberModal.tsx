"use client"

import React, { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Spinner } from "@/components/ui/spinner"
import { AlertCircle, FileText } from "lucide-react"
import { extractDocumentFromToken } from "@/utils/jwtUtils"

interface EditHistoryNumberModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (newHistory: string) => void
  currentHistory: string
  patientId: string
}

export function EditHistoryNumberModal({
  isOpen,
  onClose,
  onSuccess,
  currentHistory,
  patientId
}: EditHistoryNumberModalProps) {
  const [newHistory, setNewHistory] = useState("")
  const [argument, setArgument] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleClose = () => {
    setNewHistory("")
    setArgument("")
    setError(null)
    onClose()
  }

  const handleSubmit = async () => {
    // Validar campos
    if (!newHistory.trim()) {
      setError("Debe ingresar el nuevo número de historia clínica")
      return
    }

    if (!argument.trim()) {
      setError("Debe ingresar un argumento que justifique el cambio")
      return
    }

    if (newHistory.trim() === currentHistory.trim()) {
      setError("El nuevo número de historia debe ser diferente al actual")
      return
    }

    try {
      setIsSubmitting(true)
      setError(null)

      const usuario = extractDocumentFromToken()
      if (!usuario) {
        throw new Error("No se pudo obtener el usuario actual")
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_CITAS_MASTER_URL
      const url = `${apiUrl}/historia-clinica/pacientes/actualizar-historia/${patientId}?historiaNueva=${encodeURIComponent(newHistory.trim())}&argumento=${encodeURIComponent(argument.trim())}&usuario=${usuario}`

      console.log('🔄 Actualizando número de historia:', url)

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || `Error ${response.status}`)
      }

      console.log('✅ Número de historia actualizado correctamente')
      onSuccess(newHistory.trim())
      handleClose()
    } catch (err: any) {
      console.error('❌ Error al actualizar número de historia:', err)
      setError(err.message || 'Error al actualizar el número de historia')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-blue-800 font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Editar Número de Historia Clínica
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Historia Actual */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-gray-700">
              Historia Clínica Actual
            </Label>
            <Input
              value={currentHistory}
              disabled
              className="bg-gray-100 text-gray-600"
            />
          </div>

          {/* Nueva Historia */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-gray-700">
              Nueva Historia Clínica <span className="text-red-500">*</span>
            </Label>
            <Input
              value={newHistory}
              onChange={(e) => setNewHistory(e.target.value)}
              placeholder="Ingrese el nuevo número de historia"
              maxLength={20}
              disabled={isSubmitting}
            />
          </div>

          {/* Argumento/Justificación */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-gray-700">
              Argumento/Justificación <span className="text-red-500">*</span>
            </Label>
            <Textarea
              value={argument}
              onChange={(e) => setArgument(e.target.value)}
              placeholder="Ingrese la justificación para el cambio de número de historia"
              rows={4}
              maxLength={500}
              disabled={isSubmitting}
            />
            <p className="text-xs text-gray-500">
              {argument.length}/500 caracteres
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isSubmitting ? (
              <>
                <Spinner className="h-4 w-4 mr-2" />
                Actualizando...
              </>
            ) : (
              'Actualizar Historia'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
