"use client"

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Edit, Eye, Trash2, X, ChevronDown, ChevronUp } from "lucide-react"
import { toast } from '@/components/ui/use-toast'
import { Spinner } from '@/components/ui/spinner'
import { DeleteConfirmationDialog } from '@/components/ui/delete-confirmation-dialog'
import { formatDate } from '@/components/hospitalization/DateFormatter'
import { usePatient } from "@/contexts/PatientContext"

// Interfaces
interface EmergencyData {
  EMERGENCIA_ID: string;
  PACIENTE: string;
  FECHA: string;
  HORA: string;
  CONSULTORIO: string;
  MOTIVO_EMERGENCIA: string;
  MOTIVO_DESCRIPCION?: string;
  CIEX1?: string;
  MEDICO?: string;
  RELATO?: string;
  DIAGNOSTICO_DESCRIPCION?: string;
  CONSULTORIO_DESCRIPCION?: string;
  ESTADO: string;
  RowNum?: string;
}

interface PaginationData {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

interface EmergencyListModalProps {
  isOpen: boolean
  onClose: () => void
  patientId: string
  onCreateNew: () => void
  onEdit: (emergencyId: string, emergencyData: EmergencyData) => void
  onView: (emergencyId: string, emergencyData: EmergencyData) => void
}

// Mapeo de estados
const STATUS_MAP: Record<string, { label: string; className: string }> = {
  '0': { label: 'ANULADO',     className: 'bg-gray-200 text-gray-800' },
  '2': { label: 'REGISTRADO',  className: 'bg-blue-200 text-blue-800' },
  '3': { label: 'EN ATENCIÓN', className: 'bg-yellow-200 text-yellow-800' },
  '4': { label: 'ATENDIDO',    className: 'bg-green-200 text-green-800' },
  '5': { label: 'CERRADO',     className: 'bg-purple-200 text-purple-800' },
  '6': { label: 'AUSENCIA',     className: 'bg-indigo-200 text-indigo-800' },
};

const getStatusDisplay = (estado: string) => {
  const s = STATUS_MAP[estado];
  if (!s) return <span className="px-2 py-1 rounded-md text-xs font-medium">{estado}</span>;
  return (
    <span className={`px-2 py-1 rounded-md text-xs font-medium ${s.className}`}>
      {s.label}
    </span>
  );
};

// Componente simplificado para mostrar médico sin usar contexto
function MedicoDisplay({ codigoMedico }: { codigoMedico?: string }) {
  if (!codigoMedico) return <span>-</span>;
  
  const codigoLimpio = codigoMedico.trim();
  return <span>({codigoLimpio})</span>;
}

// Componente para mostrar relatos con "Leer más/menos"
function RelatoDisplay({ relato }: { relato?: string }) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (!relato || relato.trim() === '') return <span>-</span>;
  
  const maxLength = 50; // Máximo de caracteres antes de truncar
  const shouldTruncate = relato.length > maxLength;
  
  if (!shouldTruncate) {
    return <span>{relato}</span>;
  }
  
  return (
    <div className="flex items-center space-x-1">
      <span>
        {isExpanded ? relato : `${relato.substring(0, maxLength)}...`}
      </span>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsExpanded(!isExpanded)}
        className="h-6 w-6 p-0 text-blue-600 hover:text-blue-800"
      >
        {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </Button>
    </div>
  );
}

export function EmergencyListModal({
  isOpen,
  onClose,
  patientId,
  onCreateNew,
  onEdit,
  onView
}: EmergencyListModalProps) {
  const { patientData } = usePatient()
  const [emergencies, setEmergencies] = useState<EmergencyData[]>([])
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    pageSize: 5,
    total: 0,
    totalPages: 0
  })
  const [loading, setLoading] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    emergencyId: string | null;
    emergencyData: EmergencyData | null;
  }>({
    isOpen: false,
    emergencyId: null,
    emergencyData: null
  })

  // Cargar emergencias
  const fetchEmergencies = async (page = 1, pageSize = 5) => {
    if (!patientId) return

    try {
      setLoading(true)
      const response = await fetch(`/api/emergencia/patient/${patientId}?page=${page}&pageSize=${pageSize}`)
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setEmergencies(data.data || [])
          setPagination(data.pagination || {
            page: 1,
            pageSize: 10,
            total: 0,
            totalPages: 0
          })
        } else {
          toast({
            title: "Error",
            description: data.error || "Error al cargar emergencias",
            variant: "destructive"
          })
        }
      } else {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }
    } catch (error: any) {
      console.error('Error fetching emergencies:', error)
      toast({
        title: "Error de conexión",
        description: "No se pudieron cargar las emergencias",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen && patientId) {
      fetchEmergencies()
    }
  }, [isOpen, patientId])

  const handlePageChange = (newPage: number) => {
    fetchEmergencies(newPage, pagination.pageSize)
  }

  const handleDelete = async (emergencyId: string) => {
    try {
      const response = await fetch(`/api/emergencia/${emergencyId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast({
          title: "Emergencia eliminada",
          description: "La emergencia ha sido eliminada correctamente"
        })
        // Recargar la lista
        fetchEmergencies(pagination.page, pagination.pageSize)
      } else {
        const data = await response.json()
        throw new Error(data.error || 'Error al eliminar la emergencia')
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setDeleteDialog({ isOpen: false, emergencyId: null, emergencyData: null })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b">
          <div>
            <DialogTitle className="text-xl font-semibold text-red-700">
              Emergencias
            </DialogTitle>
            {patientData && (
              <p className="text-sm text-gray-600 mt-1">
                Paciente: {patientData.name} - HC: {patientData.hc} - DNI: {patientData.documento}
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
              Nueva Emergencia
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Spinner size="lg" />
            </div>
          ) : emergencies.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">No hay emergencias registradas para este paciente</p>
              <Button
                onClick={onCreateNew}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Crear Primera Emergencia
              </Button>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-semibold">Estado</TableHead>
                    <TableHead className="font-semibold">ID</TableHead>
                    <TableHead className="font-semibold">Paciente</TableHead>
                    <TableHead className="font-semibold">Fecha</TableHead>
                    <TableHead className="font-semibold">Hora</TableHead>
                    <TableHead className="font-semibold">Consultorio</TableHead>
                    <TableHead className="font-semibold">Motivo</TableHead>
                    <TableHead className="font-semibold">Seguro Liquidador</TableHead>
                    <TableHead className="font-semibold">Diagnóstico</TableHead>
                    <TableHead className="font-semibold">Médico</TableHead>
                    <TableHead className="font-semibold">Relato</TableHead>
                    <TableHead className="font-semibold">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {emergencies.map((emergency) => (
                    <TableRow 
                      key={emergency.EMERGENCIA_ID}
                      className={emergency.ESTADO === 'ANULADO' ? 'opacity-50 bg-gray-50' : ''}
                    >
                      <TableCell>{getStatusDisplay(emergency.ESTADO)}</TableCell>
                      <TableCell className="font-medium">{emergency.EMERGENCIA_ID}</TableCell>
                      <TableCell>{emergency.PACIENTE}</TableCell>
                      <TableCell>{formatDate(emergency.FECHA)}</TableCell>
                      <TableCell>{emergency.HORA}</TableCell>
                      <TableCell>{emergency.CONSULTORIO_DESCRIPCION || emergency.CONSULTORIO}</TableCell>
                      <TableCell>{emergency.MOTIVO_DESCRIPCION || emergency.MOTIVO_EMERGENCIA}</TableCell>
                      <TableCell>
                        {emergency.CIEX1 || '-'}
                      </TableCell>
                      <TableCell>{emergency.DIAGNOSTICO_DESCRIPCION || '0'}</TableCell>
                      <TableCell>
                        <MedicoDisplay 
                          codigoMedico={emergency.MEDICO} 
                        />
                      </TableCell>
                      <TableCell>
                        <RelatoDisplay relato={emergency.RELATO} />
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onView(emergency.EMERGENCIA_ID, emergency)}
                            className="h-8 w-8 p-0"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {/* Solo mostrar botones de edición y eliminación si NO está anulado */}
                          {emergency.ESTADO !== 'ANULADO' && (
                            <>
                              {emergency.ESTADO === '2' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => onEdit(emergency.EMERGENCIA_ID, emergency)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setDeleteDialog({
                                  isOpen: true,
                                  emergencyId: emergency.EMERGENCIA_ID,
                                  emergencyData: emergency
                                })}
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Paginación */}
              {pagination.totalPages > 1 && (
                <div className="flex justify-between items-center mt-4 px-4 py-2">
                  <div className="text-sm text-gray-600">
                    Mostrando {((pagination.page - 1) * pagination.pageSize) + 1} a {Math.min(pagination.page * pagination.pageSize, pagination.total)} de {pagination.total} registros
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page <= 1}
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page >= pagination.totalPages}
                    >
                      Siguiente
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Dialog de confirmación de eliminación */}
        <DeleteConfirmationDialog
          isOpen={deleteDialog.isOpen}
          onClose={() => setDeleteDialog({ isOpen: false, emergencyId: null, emergencyData: null })}
          onConfirm={() => deleteDialog.emergencyId && handleDelete(deleteDialog.emergencyId)}
          title="Eliminar Emergencia"
          description={`¿Está seguro de que desea eliminar la emergencia ${deleteDialog.emergencyData?.EMERGENCIA_ID}?`}
        />
      </DialogContent>
    </Dialog>
  )
}
