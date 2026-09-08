"use client"

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Edit, Eye, Trash2, X, ChevronDown, ChevronUp } from "lucide-react"
import { toast } from '@/components/ui/use-toast'
import { Spinner } from '@/components/ui/spinner'
import { DeleteConfirmationDialog } from '@/components/ui/delete-confirmation-dialog'
import { formatDate } from '@/components/hospitalization/DateFormatter'
import { usePatient } from "@/contexts/PatientContext"
import { emergenciaService } from "@/services/emergencia/emergenciaService"
import { API_ENDPOINTS, fetchApi } from "@/lib/api-config"

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
  SEGUROLIQ?: string;
  SEGURO_NOMBRE?: string;
  CUENTAID?: string;
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
  patientName?: string
  onCreateNew: () => void
  onEdit: (emergencyId: string, emergencyData: EmergencyData) => void
  onView: (emergencyId: string, emergencyData: EmergencyData) => void
}

// Mapeo de estados
const STATUS_MAP: Record<string, { label: string; className: string }> = {
  '0': { label: 'ANULADO',     className: 'bg-gray-200 text-gray-800' },
  '2': { label: 'REGISTRADO',  className: 'bg-blue-200 text-blue-800' },
  '3': { label: 'EN ATENCI�N', className: 'bg-yellow-200 text-yellow-800' },
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

// Componente simplificado para mostrar m�dico sin usar contexto
function MedicoDisplay({ codigoMedico }: { codigoMedico?: string }) {
  if (!codigoMedico) return <span>-</span>;
  
  const codigoLimpio = codigoMedico.trim();
  return <span>({codigoLimpio})</span>;
}

// Componente para mostrar relatos con "Leer m�s/menos"
function RelatoDisplay({ relato }: { relato?: string }) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (!relato || relato.trim() === '') return <span>-</span>;
  
  const maxLength = 50; // M�ximo de caracteres antes de truncar
  const shouldTruncate = relato.length > maxLength;
  
  if (!shouldTruncate) {
    return <span>{relato}</span>;
  }
  
  return (
    <div className="flex flex-wrap items-center gap-1">
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

// El endpoint /emergency/paciente/{id} devuelve un array plano con camelCase
// Esta funci�n lo convierte al shape uppercase que espera la tabla
function mapApiToEmergencyData(item: any): EmergencyData {
  return {
    EMERGENCIA_ID: item.emergenciaId || item.EMERGENCIA_ID || '',
    PACIENTE: item.paciente || item.PACIENTE || '',
    FECHA: item.fecha || item.FECHA || '',
    HORA: item.hora || item.HORA || '',
    CONSULTORIO: item.consultorio || item.CONSULTORIO || '',
    MOTIVO_EMERGENCIA: item.motivoConsulta || item.MOTIVO_EMERGENCIA || '',
    MOTIVO_DESCRIPCION: item.motivoConsulta || item.MOTIVO_DESCRIPCION || '',
    CIEX1: item.seguro || item.CIEX1 || '',
    MEDICO: item.medico || item.MEDICO || '0',
    RELATO: item.relato || item.RELATO || '',
    DIAGNOSTICO_DESCRIPCION: item.diagnostico || item.DIAGNOSTICO_DESCRIPCION || '0',
    CONSULTORIO_DESCRIPCION: item.consultorioNombre || item.CONSULTORIO_DESCRIPCION || '',
    ESTADO: String(item.estado ?? item.ESTADO ?? ''),
    SEGUROLIQ: item.seguro || item.SEGUROLIQ || '',
    SEGURO_NOMBRE: item.seguroNombre || item.SEGURO_NOMBRE || '',
    CUENTAID: item.cuentaId || item.CUENTAID || '',
    RowNum: item.rowNum || item.RowNum || ''
  };
}

function extractRawList(result: any): any[] {
  if (Array.isArray(result)) return result;
  if (Array.isArray(result?.data)) return result.data;
  if (Array.isArray(result?.content)) return result.content;
  return [];
}

function extractTotal(result: any, fallback: number): number {
  if (Array.isArray(result)) return fallback;
  return result?.pagination?.total ?? result?.totalElements ?? fallback;
}

export function EmergencyListModal({
  isOpen,
  onClose,
  patientId,
  patientName,
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
  const [deleteArgumento, setDeleteArgumento] = useState('')

  // Cargar emergencias
  const fetchEmergencies = async (page = 1, pageSize = 5) => {
    if (!patientId) return
    try {
      setLoading(true)
      const result: any = await emergenciaService.getEmergenciasByPacienteId(patientId, { page, pageSize })
      // El endpoint Spring puede devolver: array plano, { data: [...] } o { content: [...] }
      const rawList = extractRawList(result)
      const list = rawList.map(mapApiToEmergencyData)
      setEmergencies(list)

      const total = extractTotal(result, list.length)
      setPagination({
        page,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize))
      })
    } catch (error: any) {
      console.error('Error fetching emergencies:', error)
      toast({
        title: "Error de conexi�n",
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
    const cuentaId = deleteDialog.emergencyData?.CUENTAID?.trim()
    const argumento = deleteArgumento.trim()
    if (!argumento) {
      toast({
        title: 'Argumento requerido',
        description: 'Debe ingresar un motivo para anular la emergencia',
        variant: 'destructive'
      })
      return
    }
    try {
      await emergenciaService.deleteEmergencia(emergencyId, argumento)

      // Desactivar la cuenta asociada si existe
      if (cuentaId) {
        try {
          await fetchApi(API_ENDPOINTS.accounts.deactivate(cuentaId), { method: 'POST' })
        } catch (cuentaErr) {
        }
      }

      toast({
        title: "Emergencia anulada",
        description: `La emergencia ${emergencyId} ha sido anulada correctamente`
      })
      // Recargar la lista
      fetchEmergencies(pagination.page, pagination.pageSize)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || 'Error al anular la emergencia',
        variant: "destructive"
      })
    } finally {
      setDeleteDialog({ isOpen: false, emergencyId: null, emergencyData: null })
      setDeleteArgumento('')
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-7xl max-h-[95vh] overflow-hidden flex flex-col"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0 pb-4 border-b">
          <div>
            <DialogTitle className="text-xl font-semibold text-red-700">
              Emergencias
            </DialogTitle>
            {patientData && (
              <p className="text-sm font-medium text-gray-700 mt-1">
                Nombres: {patientData.name} - Cod.Paciente: {patientData.pacienteId} - HC: {patientData.hc} - DNI: {patientData.documento} 
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
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
            <div className="flex flex-wrap justify-center items-center h-64">
              <Spinner size="lg" />
            </div>
          ) : emergencies.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-700 mb-4 font-medium">No hay emergencias registradas para este paciente</p>
              <Button
                onClick={onCreateNew}
                className="bg-green-600 hover:bg-green-700 text-white font-bold"
              >
                <Plus className="h-4 w-4 mr-2" />
                Crear Primera Emergencia
              </Button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto table-responsive">
                <Table className="min-w-[900px]">
                  <TableHeader>
                  <TableRow>
                    <TableHead className="font-bold text-gray-900">Estado</TableHead>
                    <TableHead className="font-bold text-gray-900">ID</TableHead>
                    <TableHead className="font-bold text-gray-900">Fecha y Hora</TableHead>
                    <TableHead className="font-bold text-gray-900">Consultorio</TableHead>
                    <TableHead className="font-bold text-gray-900">Motivo</TableHead>
                    <TableHead className="font-bold text-gray-900">Seguro Liquidador</TableHead>
                    <TableHead className="font-bold text-gray-900">Cuenta</TableHead>
                    <TableHead className="font-bold text-gray-900">Diagnóstico</TableHead>
                    <TableHead className="font-bold text-gray-900">Médico</TableHead>
                    <TableHead className="font-bold text-gray-900">Relato</TableHead>
                    <TableHead className="font-bold text-gray-900">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {emergencies.map((emergency) => (
                    <TableRow 
                      key={emergency.EMERGENCIA_ID}
                      className={emergency.ESTADO === '0' || emergency.ESTADO === 'ANULADO' ? 'opacity-50 bg-gray-50' : ''}
                    >
                      <TableCell className="font-medium text-gray-800">{getStatusDisplay(emergency.ESTADO)}</TableCell>
                      <TableCell className="font-bold text-gray-900">{emergency.EMERGENCIA_ID}</TableCell>
                      <TableCell className="font-medium text-gray-800">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{formatDate(emergency.FECHA)}</span>
                          <span className="text-xs text-gray-600">{emergency.HORA}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium text-gray-800">{emergency.CONSULTORIO_DESCRIPCION || emergency.CONSULTORIO}</TableCell>
                      <TableCell className="font-medium text-gray-800">{emergency.MOTIVO_DESCRIPCION || emergency.MOTIVO_EMERGENCIA}</TableCell>
                      <TableCell className="font-medium text-gray-800">
                        {emergency.SEGUROLIQ && emergency.SEGURO_NOMBRE ? 
                          `(${emergency.SEGUROLIQ.trim()}) - ${emergency.SEGURO_NOMBRE}` : 
                          emergency.CIEX1 || '-'
                        }
                      </TableCell>
                      <TableCell className="font-medium text-gray-800">
                        <span className="font-bold text-blue-700">
                          {emergency.CUENTAID || '-'}
                        </span>
                      </TableCell>
                      <TableCell className="font-medium text-gray-800">{emergency.DIAGNOSTICO_DESCRIPCION || '0'}</TableCell>
                      <TableCell className="font-medium text-gray-800">
                        <MedicoDisplay 
                          codigoMedico={emergency.MEDICO} 
                        />
                      </TableCell>
                      <TableCell className="font-medium text-gray-800">
                        <RelatoDisplay relato={emergency.RELATO} />
                      </TableCell>
                      <TableCell>
                        <div className="inline-flex items-center gap-2 p-1.5 rounded-lg border border-blue-200 bg-blue-50/60">
                          {/* Bot�n Ver - siempre disponible incluso para anulados */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onView(emergency.EMERGENCIA_ID, emergency)}
                            className="shrink-0 h-8 w-8 p-0"
                            title="Ver emergencia"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          
                          {/* Bot�n Editar - disponible solo para estado 2, deshabilitado para otros */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => emergency.ESTADO === '2' ? onEdit(emergency.EMERGENCIA_ID, emergency) : undefined}
                            className="shrink-0 h-8 w-8 p-0"
                            disabled={emergency.ESTADO !== '2'}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          
                          {/* Bot�n Eliminar - disponible solo para estado 2, deshabilitado para otros */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => emergency.ESTADO === '2' ? (setDeleteDialog({
                              isOpen: true,
                              emergencyId: emergency.EMERGENCIA_ID,
                              emergencyData: emergency
                            }), setDeleteArgumento('')) : undefined}
                            className="shrink-0 h-8 w-8 p-0 text-red-600 hover:text-red-700 disabled:text-gray-400 disabled:hover:text-gray-400"
                            disabled={emergency.ESTADO !== '2'}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  </TableBody>
                </Table>
              </div>

              {/* Paginaci�n */}
              {pagination.totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 mt-4 px-4 py-2">
                  <div className="text-sm font-medium text-gray-700">
                    Mostrando {((pagination.page - 1) * pagination.pageSize) + 1} a {Math.min(pagination.page * pagination.pageSize, pagination.total)} de {pagination.total} registros
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page <= 1}
                      className="font-medium"
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page >= pagination.totalPages}
                      className="font-medium"
                    >
                      Siguiente
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Dialog de confirmaci�n de eliminaci�n */}
        <DeleteConfirmationDialog
          isOpen={deleteDialog.isOpen}
          onClose={() => { setDeleteDialog({ isOpen: false, emergencyId: null, emergencyData: null }); setDeleteArgumento('') }}
          onConfirm={() => deleteDialog.emergencyId && handleDelete(deleteDialog.emergencyId)}
          title="Anular Emergencia"
          description="Esta acci�n anular� el registro. La cuenta asociada tambi�n ser� desactivada."
          confirmDisabled={!deleteArgumento.trim()}
          detailContent={
            deleteDialog.emergencyData && (
              <div className="space-y-3">
                <div className="bg-gray-50 border border-gray-200 rounded-md p-3 space-y-1 text-sm">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1">
                    <span className="text-gray-500">ID:</span>
                    <span className="font-bold">{deleteDialog.emergencyData.EMERGENCIA_ID}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1">
                    <span className="text-gray-500">Fecha:</span>
                    <span className="font-medium">{formatDate(deleteDialog.emergencyData.FECHA)} {deleteDialog.emergencyData.HORA}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1">
                    <span className="text-gray-500">Consultorio:</span>
                    <span className="font-medium">{deleteDialog.emergencyData.CONSULTORIO_DESCRIPCION || deleteDialog.emergencyData.CONSULTORIO}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1">
                    <span className="text-gray-500">Motivo:</span>
                    <span className="font-medium">{deleteDialog.emergencyData.MOTIVO_DESCRIPCION || deleteDialog.emergencyData.MOTIVO_EMERGENCIA || '-'}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1">
                    <span className="text-gray-500">Seguro:</span>
                    <span className="font-medium">
                      {deleteDialog.emergencyData.SEGURO_NOMBRE
                        ? `(${deleteDialog.emergencyData.SEGUROLIQ?.trim()}) - ${deleteDialog.emergencyData.SEGURO_NOMBRE}`
                        : deleteDialog.emergencyData.CIEX1 || '-'}
                    </span>
                  </div>
                  {deleteDialog.emergencyData.CUENTAID && (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1">
                      <span className="text-gray-500">Cuenta:</span>
                      <span className="font-bold text-blue-700">{deleteDialog.emergencyData.CUENTAID}</span>
                    </div>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="emergency-delete-argumento" className="text-sm font-medium text-gray-700">
                    Argumento / Motivo de anulaci�n <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="emergency-delete-argumento"
                    value={deleteArgumento}
                    onChange={(e) => setDeleteArgumento(e.target.value)}
                    placeholder="Ingrese el motivo por el que anula esta emergencia"
                    className="min-h-[80px] resize-none"
                  />
                </div>
              </div>
            )
          }
        />
      </DialogContent>
    </Dialog>
  )
}
