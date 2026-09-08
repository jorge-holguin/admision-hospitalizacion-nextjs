"use client"

import { Button } from '@/components/ui/button'
import { Loader2, Save, AlertCircle, CheckCircle2, User, X } from "lucide-react"
import { useRouter } from "@/lib/router"

import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"
import { useEffect, useState } from 'react'
import { usePatientAccount } from '@/contexts/PatientAccountContext'
import { extractDocumentFromToken, extractNombreCompletoFromToken } from '@/utils/jwtUtils'
import { API_ENDPOINTS, buildUrl, fetchApi } from '@/lib/api-config'
import { MultiAccountSelectorDialog, type ActiveAccount } from '@/components/shared/MultiAccountSelectorDialog'

interface FormActionsProps {
  onSave: () => void
  onCancel: () => void
  submitting: boolean
  isEditable: boolean
  patientId: string
  insuranceCode: string
  onBeforeSave?: () => boolean | Promise<boolean>
  onAccountSelected?: (cuentaId: string | null) => void
  onCreateNewAccount?: () => void
  formData?: any
}

export function FormActions({
  onSave,
  onCancel,
  submitting,
  isEditable,
  patientId,
  insuranceCode,
  onBeforeSave,
  onAccountSelected,
  onCreateNewAccount,
  formData
}: FormActionsProps) {
  const router = useRouter()
  const { fetchPatientAccountBySeguro } = usePatientAccount()
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [isConfirming, setIsConfirming] = useState(false)
  const [checkingFua, setCheckingFua] = useState(false)
  const [hasFua, setHasFua] = useState<boolean | null>(null)
  const [fuaId, setFuaId] = useState<string | null>(null)
  const [bypassFuaCheck, setBypassFuaCheck] = useState(false)
  const [showFuaWarning, setShowFuaWarning] = useState(false)
  const [userDocument, setUserDocument] = useState<string>('')
  const [userName, setUserName] = useState<string>('')
  const [showMultiAccountDialog, setShowMultiAccountDialog] = useState(false)
  const [activeAccounts, setActiveAccounts] = useState<ActiveAccount[]>([])
  const [multiAccountLoading, setMultiAccountLoading] = useState(false)

  useEffect(() => {
    try {
      setUserDocument(extractDocumentFromToken())
      setUserName(extractNombreCompletoFromToken())
    } catch {
      setUserDocument('')
      setUserName('')
    }
  }, [])

  // List of SIS insurance codes that require FUA validation
  const sisInsuranceCodes = ['20', '21', '22', '23', '24', '25']
  const segurosConCuenta = ['0', '00', '02', '17']

  // Check if the current insurance code requires FUA validation (only SIS)
  const requiresFuaValidation = sisInsuranceCodes.includes(insuranceCode?.split(' ')[0] || '')
  const requiereCuenta = segurosConCuenta.includes(insuranceCode?.split(' ')[0] || '')

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
    
    // For insurances that require an account (PAGANTE/SOAT/CONVENIO),
    // check active accounts and let the user choose/reuse via the shared modal.
    if (requiereCuenta) {
      const seguroCode = (insuranceCode?.split(' ')[0] || '').trim()
      setMultiAccountLoading(true)
      try {
        const url = buildUrl(API_ENDPOINTS.accounts.byPatient(patientId), {
          estado: '1',
          origen: 'HO',
          seguro: seguroCode
        })
        const response = await fetchApi(url)
        if (response.ok) {
          const data = await response.json()
          const list: ActiveAccount[] = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : [])
          if (list.length > 0) {
            setActiveAccounts(list)
            setShowMultiAccountDialog(true)
            setMultiAccountLoading(false)
            return
          } else {
            onAccountSelected?.(null)
          }
        } else {
          onAccountSelected?.(null)
        }
      } catch {
        onAccountSelected?.(null)
      } finally {
        setMultiAccountLoading(false)
      }
      setHasFua(true)
      setShowConfirmDialog(true)
      return
    }
    
    // If this insurance type requires validation (SIS only), check cuenta and FUA
    if (requiresFuaValidation && patientId) {
      setCheckingFua(true)
      try {
        const trimmedCode = insuranceCode?.split(' ')[0] || ''
        // Usar contexto en lugar de llamada directa
        const accountData = await fetchPatientAccountBySeguro(patientId, trimmedCode)
        
        setHasFua(!!accountData)
        setFuaId(accountData?.cuentaId || null)
        setShowFuaWarning(!accountData) // Show warning only if validation failed
      } catch (error) {
        console.error('Error validating cuenta usando contexto:', error)
        // If there's an error checking, we'll show the warning
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

  const handleMultiAccountSelect = (cuentaId: string) => {
    onAccountSelected?.(cuentaId)
    setShowMultiAccountDialog(false)
    setHasFua(true)
    setShowConfirmDialog(true)
  }

  const handleMultiAccountCreateNew = () => {
    if (onCreateNewAccount) {
      onCreateNewAccount()
    } else {
      onAccountSelected?.(null)
    }
    setShowMultiAccountDialog(false)
    setHasFua(true)
    setShowConfirmDialog(true)
  }
  
  const handleNavigateToEmergencia = () => {
    router.push(`/emergencia/${patientId}`)
  }

  const f = formData || {}

  const extractDescription = (value: string, defaultValue: string = '—'): string => {
    if (!value) return defaultValue
    if (value.includes(' - ')) {
      return value.split(' - ').slice(1).join(' - ').trim() || value.trim()
    }
    const bracketMatch = value.match(/\[(.*?)]/)
    if (bracketMatch) return bracketMatch[1].trim() || value.trim()
    return value.trim()
  }

  const names = String(f.names || '').trim()
  const paternal = String(f.paternalSurname || '').trim()
  const maternal = String(f.maternalSurname || '').trim()
  const nameTokens = new Set(names.toLowerCase().split(/\s+/).filter(Boolean))
  let patientName = names
  if (paternal && !nameTokens.has(paternal.toLowerCase())) {
    patientName += ' ' + paternal
    nameTokens.add(paternal.toLowerCase())
  }
  if (maternal && !nameTokens.has(maternal.toLowerCase())) {
    patientName += ' ' + maternal
    nameTokens.add(maternal.toLowerCase())
  }
  patientName = patientName.trim() || '—'
  const roomDisplay = extractDescription(f.hospitalizedIn)
  const insuranceDisplay = extractDescription(f.financing)
  const attentionDisplay = extractDescription(f.attentionOrigin)
  const doctorDisplay = extractDescription(f.authorizingDoctor)
  const summaryDescription = '¿Está seguro que desea guardar este registro de hospitalización?'

  return (
    <>
      <MultiAccountSelectorDialog
        isOpen={showMultiAccountDialog}
        onClose={() => setShowMultiAccountDialog(false)}
        onSelectAccount={handleMultiAccountSelect}
        onCreateNew={handleMultiAccountCreateNew}
        accounts={activeAccounts}
        isLoading={multiAccountLoading}
        title="Cuentas HO activas para el paciente"
      />

      <div className="flex flex-wrap justify-end gap-2 mt-6">
        <Button 
          onClick={handleSaveClick}
          disabled={submitting || isConfirming || !isEditable || multiAccountLoading}
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
        description={summaryDescription}
        confirmText="Guardar"
        cancelText="Cancelar"
        isConfirming={isConfirming}
        confirmDisabled={requiresFuaValidation && !hasFua && showFuaWarning && !bypassFuaCheck}
        additionalContent={
          <>
            {/* Resumen principal */}
            <div className="p-3 bg-gray-50 rounded border text-sm text-gray-700 space-y-1">
              <div className="flex justify-between gap-2">
                <span className="font-medium">Paciente:</span>
                <strong className="text-right">{patientName}</strong>
              </div>
              <div className="flex justify-between gap-2">
                <span className="font-medium">Hospitalizado en:</span>
                <strong className="text-right">{roomDisplay}</strong>
              </div>
              <div className="flex justify-between gap-2">
                <span className="font-medium">Financiamiento:</span>
                <strong className="text-right">{insuranceDisplay}</strong>
              </div>
            </div>

            {/* Detalles de la hospitalización */}
            <div className="mt-4 space-y-1 text-sm text-gray-700">
              {formData?.document && (
                <p><span className="font-medium">Documento:</span> {formData.document}</p>
              )}
              {formData?.date && (
                <p><span className="font-medium">Fecha:</span> {formData.date} <span className="font-medium ml-2">Hora:</span> {formData.time}</p>
              )}
              {formData?.attentionOrigin && (
                <p><span className="font-medium">Origen de atención:</span> {attentionDisplay}</p>
              )}
              {formData?.authorizingDoctor && (
                <p><span className="font-medium">Médico autorizante:</span> {doctorDisplay}</p>
              )}
              {formData?.diagnosis && (
                <p><span className="font-medium">Diagnóstico:</span> {formData.diagnosis}</p>
              )}
            </div>

            {/* Mostrar mensaje de validación de FUA si es necesario */}
            {requiresFuaValidation && checkingFua && (
              <div className="flex flex-wrap items-center gap-2 mt-4 p-2 bg-blue-50 text-blue-800 rounded">
                <Loader2 className="h-4 w-4 animate-spin" />
                <p>Verificando FUA activo...</p>
              </div>
            )}
            
            {/* Mensaje de cuenta y FUA válidos */}
            {requiresFuaValidation && hasFua && fuaId && (
              <div className="flex flex-wrap items-center gap-2 mt-4 p-2 bg-green-50 text-green-800 rounded">
                <CheckCircle2 className="h-4 w-4" />
                <p>Cuenta SIS válida: <strong>{fuaId}</strong></p>
              </div>
            )}
            
            {/* Mensaje de advertencia si la validación SIS falla */}
            {requiresFuaValidation && !hasFua && showFuaWarning && (
              <div className="space-y-4 mt-4">
                <div className="flex flex-wrap items-center gap-2 p-2 bg-red-50 text-red-800 rounded">
                  <AlertCircle className="h-4 w-4" />
                  <p className="font-semibold">No se encontró cuenta SIS válida o FUA activo para este paciente.</p>
                </div>
              </div>
            )}

            {/* Información del usuario que ejecuta la operación */}
            <div className="flex items-start gap-3 mt-4 p-3 bg-blue-50 border border-blue-100 rounded text-sm">
              <User className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-semibold text-blue-900">Usuario que realiza la operación</p>
                <p className="text-blue-800">
                  <span className="font-semibold">{userName || 'No identificado'}</span>
                  <span className="ml-1 text-blue-600">(DNI: {userDocument || 'No identificado'})</span>
                </p>
              </div>
            </div>
          </>
        }
      />
    </>
  )
}
