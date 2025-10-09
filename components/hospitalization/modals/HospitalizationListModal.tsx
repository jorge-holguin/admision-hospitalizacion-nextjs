"use client"

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Edit, Eye, Search, ChevronLeft, ChevronRight, X, Trash2, Printer, ChevronDown, FileText, ClipboardList, GraduationCap } from "lucide-react"
import { toast } from '@/components/ui/use-toast'
import { Spinner } from '@/components/ui/spinner'
import { useOrdenHospitalizacion } from '@/hooks/useOrdenHospitalizacion'
import { formatDate } from '@/components/hospitalization/DateFormatter'
import { usePatient } from "@/contexts/PatientContext"
import { useDocumentPrinter } from '@/components/hospitalization/DocumentPrinter'
import { useOrderOperations } from '@/components/hospitalization/OrderOperations'
import { DeleteConfirmationDialog } from '@/components/ui/delete-confirmation-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Interfaces basadas en la página existente
interface OrdenHospitalizacion {
  idHOSPITALIZACION: string
  PACIENTE: string
  NOMBRES?: string
  HISTORIA: string
  CONSULNOMBRE: string
  MEDICONOMBRE?: string
  FECHA1: string
  HORA1: string
  ORIGENOMBRE: string
  SEGURONOMBRE: string
  CUENTAID?: string
  ESTADO: string
  [key: string]: any
}

interface HospitalizationListModalProps {
  isOpen: boolean
  onClose: () => void
  patientId: string
  patientName?: string
  onCreateNew: () => void
  onView: (hospitalizationId: string, hospitalizationData: any) => void
  onEdit: (hospitalizationId: string, hospitalizationData: any) => void
}

export function HospitalizationListModal({
  isOpen,
  onClose,
  patientId,
  patientName,
  onCreateNew,
  onView,
  onEdit
}: HospitalizationListModalProps) {
  const { patientData } = usePatient()
  const [searchTerm, setSearchTerm] = useState("")
  const [hospitalizacionesEstado, setHospitalizacionesEstado] = useState<Record<string, string>>({})
  const [pacienteData, setPacienteData] = useState<any>(null)

  // Hooks para operaciones
  const { handleDirectPrint, printHospitalizationDocument } = useDocumentPrinter()
  
  const orderOperations = useOrderOperations({
    onOrderDeleted: () => refresh()
  })
  
  const { 
    deleteDialogOpen, 
    deleteItemId, 
    deleteItemName, 
    isDeleting, 
    handleDeleteOrder, 
    confirmDeleteOrder, 
    setDeleteDialogOpen 
  } = orderOperations

  // Usar el hook de órdenes de hospitalización
  const {
    ordenesHospitalizacion,
    pagination,
    loading,
    error,
    setPage,
    setPageSize,
    refresh,
    setPacienteId
  } = useOrdenHospitalizacion({
    initialPage: 1,
    initialPageSize: 5
  })

  // Establecer el pacienteId cuando el modal se abre
  useEffect(() => {
    if (isOpen && patientId) {
      setPacienteId(patientId)
      // Cargar datos del paciente desde contexto o API
      if (patientData && patientData.pacienteId === patientId) {
        setPacienteData({
          NOMBRES: patientData.name,
          HISTORIA: patientData.hc,
          DOCUMENTO: patientData.documento
        })
      }
    }
  }, [isOpen, patientId, setPacienteId, patientData])

  // Función para verificar si una orden es editable
  const isOrdenEditable = (hospitalizacionId: string): boolean => {
    const estado = hospitalizacionesEstado[hospitalizacionId]
    return estado !== '2' // No editable si está en estado '2'
  }

  // Filtrar órdenes por término de búsqueda
  const filteredOrdenes = ordenesHospitalizacion.filter(orden => {
    if (!searchTerm) return true
    const searchLower = searchTerm.toLowerCase()
    return (
      orden.CONSULNOMBRE?.toLowerCase().includes(searchLower) ||
      orden.MEDICONOMBRE?.toLowerCase().includes(searchLower) ||
      orden.ORIGENOMBRE?.toLowerCase().includes(searchLower) ||
      orden.SEGURONOMBRE?.toLowerCase().includes(searchLower) ||
      orden.idHOSPITALIZACION?.toLowerCase().includes(searchLower)
    )
  })

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
  }

  const handleViewOrder = (hospitalizacionId: string) => {
    // Encontrar los datos de la hospitalización
    const hospitalizationData = ordenesHospitalizacion.find(orden => orden.idHOSPITALIZACION === hospitalizacionId)
    onView(hospitalizacionId, hospitalizationData)
  }

  const handleEditOrder = (hospitalizacionId: string) => {
    // Encontrar los datos de la hospitalización
    const hospitalizationData = ordenesHospitalizacion.find(orden => orden.idHOSPITALIZACION === hospitalizacionId)
    onEdit(hospitalizacionId, hospitalizationData)
  }

  // Función para manejar impresión
  const handlePrintOrder = async (hospitalizacionId: string, documentType: string) => {
    try {
      await printHospitalizationDocument(hospitalizacionId, documentType)
    } catch (error) {
      console.error('Error al imprimir:', error)
      toast({
        title: "Error",
        description: "No se pudo imprimir el documento",
        variant: "destructive"
      })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
       <DialogContent 
         className="max-w-7xl max-h-[95vh] overflow-hidden flex flex-col"
         onInteractOutside={(e) => e.preventDefault()}
       >
         <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b">
           <div>
             <DialogTitle className="text-xl font-semibold text-blue-700">
               Hospitalizaciones
             </DialogTitle>
             {patientData && (
               <p className="text-sm text-gray-600 mt-1">
                 Paciente: {patientData.name} - Cod.Paciente: {patientData.pacienteId} - HC: {patientData.hc} - DNI: {patientData.documento}
               </p>
             )}
           </div>
           <div className="flex items-center gap-2">
             <Button
               onClick={onCreateNew}
               className="bg-green-600 hover:bg-green-700 text-white mr-6"
               size="sm"
             >
               <Plus className="h-4 w-4 mr-2" />
               Nueva Hospitalización
             </Button>
           </div>
         </DialogHeader>
             

        <div className="flex-1 overflow-hidden flex flex-col space-y-4">
          {/* Información del paciente y botón nueva hospitalización */}

          {/* Contenido principal */}
          <div className="flex-1 overflow-hidden">
            {/* Loading state */}
            {loading && (
              <div className="flex justify-center items-center py-12">
                <Spinner size="lg" />
                <span className="ml-3">Cargando órdenes de hospitalización...</span>
              </div>
            )}

            {/* Error state */}
            {error && (
              <div className="text-center py-8 text-red-500">
                <p>Error al cargar las órdenes de hospitalización</p>
                <Button onClick={refresh} className="mt-4">
                  Reintentar
                </Button>
              </div>
            )}

            {/* Empty state */}
            {!loading && !error && filteredOrdenes.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-500 mb-4">
                  {searchTerm ? 'No se encontraron hospitalizaciones que coincidan con la búsqueda' : 'No hay hospitalizaciones registradas'}
                </div>
                {!searchTerm && (
                  <Button onClick={onCreateNew} className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Crear Primera Hospitalización
                  </Button>
                )}
              </div>
            )}

            {/* Tabla de órdenes */}
            {!loading && !error && filteredOrdenes.length > 0 && (
              <div className="overflow-auto flex-1">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="font-semibold">Estado</TableHead>
                      <TableHead className="font-semibold">ID</TableHead>
                      <TableHead className="font-semibold">Consultorio</TableHead>
                      <TableHead className="font-semibold">Médico</TableHead>
                      <TableHead className="font-semibold">Fecha y Hora Ingreso</TableHead>
                      <TableHead className="font-semibold">Origen</TableHead>
                      <TableHead className="font-semibold">Seguro</TableHead>
                      <TableHead className="font-semibold">Cuenta</TableHead>
                      <TableHead className="font-semibold">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrdenes.map((orden, index) => {
                      const isDeleted = orden.ESTADO === '0'
                      
                      return (
                        <TableRow
                          key={orden.idHOSPITALIZACION || `orden-${index}`}
                          className={`transition-colors ${isDeleted ? 'bg-gray-100 opacity-70' : 'hover:bg-blue-50'}`}
                        >
                          <TableCell>
                            {orden.ESTADO === '0' ? (
                              <span className="px-2 py-1 rounded-md text-xs font-medium bg-gray-200 text-gray-800">ANULADO</span>
                            ) : orden.ESTADO === '2' ? (
                              <span className="px-2 py-1 rounded-md text-xs font-medium bg-yellow-200 text-yellow-800">ACTIVO</span>
                            ) : orden.ESTADO === '3' ? (
                              <span className="px-2 py-1 rounded-md text-xs font-medium bg-green-200 text-green-800">ACEPTADA</span>
                            ) : (
                              <span className="px-2 py-1 rounded-md text-xs font-medium">{orden.ESTADO}</span>
                            )}
                          </TableCell>
                          <TableCell className={`font-medium ${isDeleted ? 'text-gray-500' : 'text-blue-800'}`}>
                            {orden.idHOSPITALIZACION}
                          </TableCell>
                          <TableCell className={isDeleted ? 'text-gray-500' : ''}>
                            {orden.CONSULNOMBRE}
                          </TableCell>
                          <TableCell className={isDeleted ? 'text-gray-500' : ''}>
                            {orden.MEDICONOMBRE || 'No especificado'}
                          </TableCell>
                          <TableCell className={isDeleted ? 'text-gray-500' : ''}>
                            <div className="flex flex-col">
                              <span className="text-sm font-semibold">{formatDate(orden.FECHA1)}</span>
                              <span className="text-xs text-gray-500">{orden.HORA1}</span>
                            </div>
                          </TableCell>
                          <TableCell className={isDeleted ? 'text-gray-500' : ''}>
                            {orden.ORIGENOMBRE}
                          </TableCell>
                          <TableCell className={isDeleted ? 'text-gray-500' : ''}>
                            {orden.SEGURONOMBRE}
                          </TableCell>
                          <TableCell>
                            <span className={`font-medium ${isDeleted ? 'text-gray-500' : 'text-blue-700'}`}>
                              {orden.CUENTAID || '-'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              {/* Botón Ver */}
                              <Button
                                size="sm"
                                variant="outline"
                                className="bg-white hover:bg-blue-50 border-blue-200"
                                onClick={() => handleViewOrder(orden.idHOSPITALIZACION)}
                                disabled={isDeleted}
                                title="Ver hospitalización"
                              >
                                <Eye className="w-4 h-4 text-blue-600" />
                              </Button>
                              
                              {/* Botón Editar */}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditOrder(orden.idHOSPITALIZACION)}
                                disabled={isDeleted || !isOrdenEditable(orden.idHOSPITALIZACION)}
                                title="Editar hospitalización"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>

                              {/* Dropdown de Impresión */}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="bg-white hover:bg-blue-50 border-blue-200"
                                    disabled={isDeleted}
                                    title="Imprimir documentos"
                                  >
                                    <Printer className="w-4 h-4 mr-1 text-blue-600" />
                                    <ChevronDown className="h-3 w-3 text-blue-600" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-64 p-2">
                                  <DropdownMenuItem
                                    className="flex items-center gap-2 p-2 cursor-pointer hover:bg-blue-50 rounded-md"
                                    onClick={() => handlePrintOrder(orden.idHOSPITALIZACION, 'filiacion')}
                                  >
                                    <FileText className="w-4 h-4 text-blue-600" />
                                    <span>Hoja Filiación</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="flex items-center gap-2 p-2 cursor-pointer hover:bg-blue-50 rounded-md"
                                    onClick={() => handlePrintOrder(orden.idHOSPITALIZACION, 'orden-consentimiento')}
                                  >
                                    <ClipboardList className="w-4 h-4 text-green-600" />
                                    <span>Orden + Consentimiento</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="flex items-center gap-2 p-2 cursor-pointer hover:bg-blue-50 rounded-md"
                                    onClick={() => handlePrintOrder(orden.idHOSPITALIZACION, 'consentimiento-docencia')}
                                  >
                                    <GraduationCap className="w-4 h-4 text-amber-600" />
                                    <span>Consentimiento Docencia</span>
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>

                              {/* Botón Eliminar */}
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 hover:bg-red-50 bg-transparent"
                                onClick={() => {
                                  const pacienteName = orden.NOMBRES || patientName || patientId
                                  handleDeleteOrder(orden.idHOSPITALIZACION, pacienteName)
                                }}
                                disabled={isDeleted || !isOrdenEditable(orden.idHOSPITALIZACION)}
                                title="Eliminar hospitalización"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          {/* Paginación */}
          {!loading && !error && pagination.totalPages > 1 && (
            <div className="flex-shrink-0 flex items-center justify-between pt-4 border-t">
              <div className="text-sm text-gray-500">
                Mostrando {((pagination.page - 1) * pagination.pageSize) + 1} - {Math.min(pagination.page * pagination.pageSize, pagination.total)} de {pagination.total} hospitalizaciones
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </Button>
                <span className="text-sm">
                  Página {pagination.page} de {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                >
                  Siguiente
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Dialog de confirmación de eliminación */}
        <DeleteConfirmationDialog
          isOpen={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
          onConfirm={confirmDeleteOrder}
          itemName={deleteItemName}
          isDeleting={isDeleting}
          title="Eliminar Hospitalización"
          description="¿Estás seguro de que deseas eliminar esta hospitalización? Esta acción no se puede deshacer."
        />
      </DialogContent>
    </Dialog>
  )
}
