"use client"

import React from "react"
import { DataTable } from "@/components/ui/data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Edit, Eye, Printer, Trash2 } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface EmergenciaTableProps {
  data: any[]
  isLoading: boolean
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
  onView: (record: any) => void
  onEdit: (record: any) => void
  onPrint: (record: any) => void
  onDelete: (record: any) => void
}

export function EmergenciaTable({
  data,
  isLoading,
  pagination,
  onPageChange,
  onPageSizeChange,
  onView,
  onEdit,
  onPrint,
  onDelete
}: EmergenciaTableProps) {
  
  // Definir las columnas para la tabla
  const columns = [
    {
      key: "emergencia",
      header: "Emergencia",
      cell: (record: any) => (
        <span className="font-medium">{record.emergencia}</span>
      )
    },
    {
      key: "fecha",
      header: "Fecha",
      cell: (record: any) => (
        <div>
          <div>{record.fecha}</div>
          <div className="text-xs text-muted-foreground">{record.hora}</div>
        </div>
      )
    },
    {
      key: "nombres",
      header: "Paciente",
      cell: (record: any) => (
        <div>
          <div className="font-medium">{record.nombres}</div>
          <div className="text-xs text-muted-foreground">HC: {record.historia}</div>
        </div>
      )
    },
    {
      key: "sexo",
      header: "Sexo",
      cell: (record: any) => (
        <span>{record.sexo === "M" ? "Masculino" : "Femenino"}</span>
      )
    },
    {
      key: "seguro",
      header: "Seguro",
      cell: (record: any) => (
        <span className="text-sm">{record.seguro}</span>
      )
    },
    {
      key: "nombreConsultorio",
      header: "Consultorio",
      cell: (record: any) => (
        <span className="text-sm">{record.nombreConsultorio}</span>
      )
    },
    {
      key: "motivo",
      header: "Motivo",
      cell: (record: any) => (
        <span className="text-sm">{record.motivo}</span>
      )
    },
    {
      key: "estado",
      header: "Estado",
      cell: (record: any) => {
        let badgeVariant = "default"
        let statusText = "Pendiente"
        
        if (record.estado === "3") {
          badgeVariant = "success"
          statusText = "Atendido"
        } else if (record.estado === "4") {
          badgeVariant = "secondary"
          statusText = "Finalizado"
        } else if (record.estado === "2") {
          badgeVariant = "destructive"
          statusText = "Anulado"
        }
        
        return (
          <Badge variant={badgeVariant as any}>{statusText}</Badge>
        )
      }
    },
    {
      key: "actions",
      header: "Acciones",
      cell: (record: any) => (
        <div className="flex space-x-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation()
                    onView(record)
                  }}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Ver</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation()
                    onEdit(record)
                  }}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Editar</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation()
                    onPrint(record)
                  }}
                >
                  <Printer className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Imprimir</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          {record.estado !== "4" && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation()
                      onDelete(record)
                    }}
                    disabled={record.estado === "4"}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Anular</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      )
    }
  ]

  return (
    <DataTable
      data={data}
      columns={columns}
      pagination={pagination}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      isLoading={isLoading}
    />
  )
}
