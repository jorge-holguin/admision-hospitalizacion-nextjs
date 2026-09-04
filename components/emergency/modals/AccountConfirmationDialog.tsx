"use client"

import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertCircle, RefreshCw, PlusCircle, Wallet } from "lucide-react"

interface AccountInfo {
  cuentaId: string
  paciente: string
  seguro: string
  empresaSeguro?: string
  observacion?: string
  fechaApertura: string
  estado: string
  origen?: string
  horaApertura: string
}

interface AccountConfirmationDialogProps {
  isOpen: boolean
  onClose: () => void
  onReuseAccount: (cuentaId: string) => void
  onCreateNew: () => void
  accountInfo: AccountInfo | null
  isLoading?: boolean
}

export function AccountConfirmationDialog({
  isOpen,
  onClose,
  onReuseAccount,
  onCreateNew,
  accountInfo,
  isLoading = false
}: AccountConfirmationDialogProps) {
  
  if (!accountInfo) return null;

  const getSeguroLabel = (seguro: string) => {
    const seguros: Record<string, string> = {
      '0': 'PAGANTE',
      '00': 'PAGANTE',
      '02': 'SOAT',
      '17': 'CONVENIO'
    }
    return seguros[seguro] || seguro
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-2 text-amber-600">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span>Cuenta Activa Existente</span>
          </DialogTitle>
          <DialogDescription className="text-sm">
            Se encontró una cuenta activa para este paciente con el mismo tipo de seguro.
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-amber-800 font-medium text-sm">
              <Wallet className="h-4 w-4 flex-shrink-0" />
              Información de la Cuenta
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-[120px_1fr] gap-x-3 gap-y-1.5 text-sm">
              <div className="text-gray-600">N° Cuenta:</div>
              <div className="font-medium break-words">{accountInfo.cuentaId}</div>
              
              <div className="text-gray-600">Tipo Seguro:</div>
              <div className="font-medium break-words">{getSeguroLabel(accountInfo.seguro)}</div>
              
              <div className="text-gray-600">Fecha Apertura:</div>
              <div className="font-medium text-amber-700">{accountInfo.fechaApertura}</div>

              <div className="text-gray-600">Hora Apertura:</div>
              <div className="font-medium text-amber-700">{accountInfo.horaApertura}</div>

              <div className="text-gray-600">Origen:</div>
              <div className="font-medium text-amber-700">{accountInfo.origen}</div>

              
              {accountInfo.observacion && (
                <>
                  <div className="text-gray-600">Observación:</div>
                  <div className="font-medium break-words">{accountInfo.observacion}</div>
                </>
              )}
            </div>
          </div>

          <p className="mt-3 text-sm text-gray-600 leading-relaxed">
            ¿Desea <strong>reutilizar esta cuenta</strong> para la emergencia actual o <strong>crear una nueva cuenta</strong>?
          </p>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 mt-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="w-full sm:w-auto order-3 sm:order-1"
          >
            Cancelar
          </Button>
          <Button
            variant="default"
            onClick={() => onReuseAccount(accountInfo.cuentaId)}
            disabled={isLoading}
            className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white order-1 sm:order-2"
          >
            {isLoading ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin flex-shrink-0" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2 flex-shrink-0" />
            )}
            <span className="truncate">Reutilizar Cuenta</span>
          </Button>
          <Button
            variant="default"
            onClick={onCreateNew}
            disabled={isLoading}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white order-2 sm:order-3"
          >
            {isLoading ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin flex-shrink-0" />
            ) : (
              <PlusCircle className="h-4 w-4 mr-2 flex-shrink-0" />
            )}
            <span className="truncate">Crear Nueva Cuenta</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
