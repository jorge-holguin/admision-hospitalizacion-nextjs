"use client"

import { Button } from '@/components/ui/button'
import { Loader2, Save } from "lucide-react"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"
import { useState } from 'react'

interface FormActionsProps {
  onSave: () => void
  onCancel: () => void
  submitting: boolean
  isEditable: boolean
}

export function FormActions({ 
  onSave, 
  onCancel, 
  submitting, 
  isEditable 
}: FormActionsProps) {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)

  const handleSaveClick = () => {
    setShowConfirmDialog(true)
  }

  const handleConfirmSave = () => {
    setShowConfirmDialog(false)
    onSave()
  }

  const handleCancelConfirm = () => {
    setShowConfirmDialog(false)
  }

  return (
    <>
      <div className="flex justify-end space-x-2 mt-6">
        <Button 
          variant="outline" 
          onClick={onCancel}
          disabled={submitting}
        >
          Cancelar
        </Button>
        <Button 
          onClick={handleSaveClick}
          disabled={submitting || !isEditable}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Guardar
            </>
          )}
        </Button>
      </div>

      <ConfirmationDialog
        isOpen={showConfirmDialog}
        onClose={handleCancelConfirm}
        title="Confirmar Acción"
        description="¿Está seguro que desea guardar esta orden de hospitalización?"
        onConfirm={handleConfirmSave}
        confirmText="Guardar"
        cancelText="Cancelar"
      />
    </>
  )
}
