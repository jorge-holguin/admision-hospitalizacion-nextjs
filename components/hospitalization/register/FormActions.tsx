"use client"

import { Button } from '@/components/ui/button'
import { Loader2, Save, AlertCircle, CheckCircle2,X  } from "lucide-react"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"
import { useState, useEffect } from 'react'
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

interface FormActionsProps {
  onSave: () => void
  onCancel: () => void
  submitting: boolean
  isEditable: boolean
  patientId: string
  insuranceCode: string
  onBeforeSave?: () => boolean | Promise<boolean>
}

export function FormActions({ 
  onSave, 
  onCancel, 
  submitting, 
  isEditable,
  patientId,
  insuranceCode,
  onBeforeSave
}: FormActionsProps) {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [isConfirming, setIsConfirming] = useState(false)
  const [checkingFua, setCheckingFua] = useState(false)
  const [hasFua, setHasFua] = useState<boolean | null>(null)
  const [fuaId, setFuaId] = useState<string | null>(null)
  const [bypassFuaCheck, setBypassFuaCheck] = useState(false)
  const [showFuaWarning, setShowFuaWarning] = useState(false)

  // List of SIS insurance codes that require FUA validation
  const sisInsuranceCodes = ['20', '21', '22', '23', '24', '25']
  
  // Check if the current insurance code requires FUA validation
  const requiresFuaValidation = sisInsuranceCodes.includes(insuranceCode?.split(' ')[0] || '')

  const handleSaveClick = async () => {
    // Validar el formulario antes de continuar si existe la función onBeforeSave
    if (onBeforeSave) {
      const isValid = await onBeforeSave();
      if (!isValid) {
        // Si la validación falla, no continuamos con el proceso
        return;
      }
    }
    
    // Reset states
    setBypassFuaCheck(false)
    setHasFua(null)
    setFuaId(null)
    setShowFuaWarning(false)
    
    // If this insurance type requires FUA validation, check for active FUA
    if (requiresFuaValidation && patientId) {
      setCheckingFua(true)
      try {
        const response = await fetch(`/api/fua/check?patientId=${patientId}`)
        const data = await response.json()
        
        setHasFua(data.hasFua)
        setFuaId(data.fuaId)
        setShowFuaWarning(!data.hasFua) // Show warning only if no FUA found
      } catch (error) {
        console.error('Error checking FUA status:', error)
        // If there's an error checking FUA, we'll show the warning
        setShowFuaWarning(true)
      } finally {
        setCheckingFua(false)
      }
    }
    
    // Show the confirmation dialog
    setShowConfirmDialog(true)
  }

  const handleConfirmSave = () => {
    // If FUA validation is required but no FUA found and bypass not checked, don't proceed
    if (requiresFuaValidation && !hasFua && showFuaWarning && !bypassFuaCheck) {
      return
    }
    
    setIsConfirming(true) // Set confirming state to true immediately
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
          disabled={submitting || isConfirming}
          className="bg-[#e91e63] hover:bg-[#d81b60] text-white hover:text-white"
        >
          <X className="mr-2 h-4 w-4" />
          Cancelar
        </Button>

        <Button 
          onClick={handleSaveClick}
          disabled={submitting || isConfirming || !isEditable}
          className="bg-[#0074ba] hover:bg-[#0067a6] text-white hover:text-white"
        >
          {submitting || isConfirming ? (
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
        onConfirm={handleConfirmSave}
        title="Confirmar Hospitalización"
        description="¿Está seguro que desea guardar esta hospitalización?"
        confirmText="Guardar"
        cancelText="Cancelar"
        isConfirming={isConfirming}
        confirmDisabled={requiresFuaValidation && !hasFua && showFuaWarning && !bypassFuaCheck}
        additionalContent={
          <>
            {/* Mostrar mensaje de validación de FUA si es necesario */}
            {requiresFuaValidation && checkingFua && (
              <div className="flex items-center space-x-2 mt-4 p-2 bg-blue-50 text-blue-800 rounded">
                <Loader2 className="h-4 w-4 animate-spin" />
                <p>Verificando FUA activo...</p>
              </div>
            )}
            
            {/* Mensaje de FUA encontrado */}
            {requiresFuaValidation && hasFua && fuaId && (
              <div className="flex items-center space-x-2 mt-4 p-2 bg-green-50 text-green-800 rounded">
                <CheckCircle2 className="h-4 w-4" />
                <p>FUA activo encontrado: <strong>{fuaId}</strong></p>
              </div>
            )}
            
            {/* Mensaje de advertencia si no hay FUA activo */}
            {requiresFuaValidation && !hasFua && showFuaWarning && (
              <div className="space-y-4 mt-4">
                <div className="flex items-center space-x-2 p-2 bg-red-50 text-red-800 rounded">
                  <AlertCircle className="h-4 w-4" />
                  <p className="font-semibold">No se ha encontrado un FUA activo para este paciente en las últimas 3 horas.</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="bypass-fua" 
                    checked={bypassFuaCheck} 
                    onCheckedChange={(checked) => setBypassFuaCheck(checked === true)}
                  />
                  <Label htmlFor="bypass-fua" className="text-sm font-medium text-red-600">
                    Hospitalizar de todos modos (sin FUA activo)
                  </Label>
                </div>
              </div>
            )}
          </>
        }
      />
    </>
  )
}
