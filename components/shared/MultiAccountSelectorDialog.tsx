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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2, PlusCircle, Wallet } from "lucide-react"

export interface ActiveAccount {
  cuentaId: string
  paciente?: string
  seguro?: string
  origen?: string
  estado?: string
  fecha?: string
  fechaApertura?: string
  horaApertura?: string
  observacion?: string
  empresaSeguro?: string
}

interface MultiAccountSelectorDialogProps {
  isOpen: boolean
  onClose: () => void
  onSelectAccount: (cuentaId: string) => void
  onCreateNew: () => void
  accounts: ActiveAccount[]
  isLoading?: boolean
  title?: string
}

const SEGURO_LABEL: Record<string, string> = {
  '0': 'PAGANTE', '00': 'PAGANTE',
  '02': 'SOAT',
  '17': 'CONVENIO'
}

function getAperturaInfo(account: ActiveAccount) {
  const raw = account.fechaApertura || account.fecha
  if (!raw) return { fecha: '-', hora: null as string | null }

  try {
    const d = new Date(raw)
    if (Number.isNaN(d.getTime())) return { fecha: raw, hora: null }

    const fecha = d.toLocaleDateString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
    const hora = d.toLocaleTimeString('es-PE', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })
    return { fecha, hora }
  } catch {
    return { fecha: raw, hora: null }
  }
}

export function MultiAccountSelectorDialog(
  props: Readonly<MultiAccountSelectorDialogProps>
) {
  const {
    isOpen,
    onClose,
    onSelectAccount,
    onCreateNew,
    accounts,
    isLoading = false,
    title = 'Cuentas Activas Encontradas'
  } = props
  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="sm:max-w-[680px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-2 text-amber-600">
            <Wallet className="h-5 w-5 flex-shrink-0" />
            {title}
          </DialogTitle>
          <DialogDescription>
            Se encontraron {accounts.length} cuentas activas para este paciente. Seleccione una para reutilizarla o cree una nueva.
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="font-bold text-gray-700">N° Cuenta</TableHead>
                <TableHead className="font-bold text-gray-700">Seguro</TableHead>
                <TableHead className="font-bold text-gray-700">Origen</TableHead>
                <TableHead className="font-bold text-gray-700">Fecha Apertura</TableHead>
                <TableHead className="font-bold text-gray-700">Acción</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.map((account) => {
                const { fecha, hora } = getAperturaInfo(account)
                return (
                <TableRow key={account.cuentaId} className="hover:bg-amber-50">
                  <TableCell className="font-bold text-blue-700">{account.cuentaId}</TableCell>
                  <TableCell className="font-medium">
                    {account.seguro ? (SEGURO_LABEL[account.seguro.trim()] || account.seguro) : '-'}
                  </TableCell>
                  <TableCell className="font-medium">{account.origen || '-'}</TableCell>
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span>{fecha}</span>
                      {hora && (
                        <span className="text-xs text-gray-500">{hora}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onSelectAccount(account.cuentaId)}
                      disabled={isLoading}
                      className="text-amber-700 border-amber-300 hover:bg-amber-50"
                    >
                      {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Usar esta'}
                    </Button>
                  </TableCell>
                </TableRow>
              )})}
            </TableBody>
          </Table>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 mt-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            Cancelar
          </Button>
          <Button
            variant="default"
            onClick={onCreateNew}
            disabled={isLoading}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <PlusCircle className="h-4 w-4 mr-2" />
            )}
            Crear Nueva Cuenta
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
