"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Edit, Eye, Trash2 } from "lucide-react"
import { Navbar } from "@/components/Navbar"
import { useToast } from '@/components/ui/use-toast';
import { Spinner } from '@/components/ui/spinner';
import { DeleteConfirmationDialog } from '@/components/ui/delete-confirmation-dialog';
import { formatDate } from '@/components/hospitalization/DateFormatter';
import { useParams, useRouter } from "next/navigation"
import { usePatient } from "@/contexts/PatientContext"

// Crear un componente envoltorio que utiliza el hook useParams
export default function EmergencyPage() {
  // Utilizar el hook useParams para obtener el patientId
  const params = useParams();
  const patientId = params.patientId as string;

  return <EmergencyList patientId={patientId} />;
}

// Definir interfaces para los datos de emergencia
interface EmergencyData {
  EMERGENCIA_ID: string;
  PACIENTE: string;
  FECHA: string;
  HORA: string;
  CONSULTORIO: string;
  MOTIVO_EMERGENCIA: string;
  MOTIVO_DESCRIPCION?: string;
  CIEX1?: string;
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

// ===== Mapeo de estados → etiqueta + color (tal como lo pediste) =====
const STATUS_MAP: Record<string, { label: string; className: string }> = {
  '0': { label: 'ANULADO',     className: 'bg-gray-200 text-gray-800' },
  '2': { label: 'REGISTRADO',  className: 'bg-blue-200 text-blue-800' },
  '3': { label: 'EN ATENCIÓN', className: 'bg-yellow-200 text-yellow-800' },
  '4': { label: 'ATENDIDO',    className: 'bg-green-200 text-green-800' },
  '5': { label: 'CERRADO',     className: 'bg-purple-200 text-purple-800' },
  '6': { label: 'INGRESO',     className: 'bg-indigo-200 text-indigo-800' },
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

// El componente principal que muestra la lista de emergencias
function EmergencyList({ patientId }: { patientId: string }) {
  const { toast } = useToast();
  const router = useRouter();
  const { patientData } = usePatient();

  // Estado para almacenar los datos
  const [emergencies, setEmergencies] = useState<EmergencyData[]>([]);
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [patientInfo, setPatientInfo] = useState<string>('');
  const [documentNumber, setDocumentNumber] = useState<string>('');

  // Estado para el diálogo de confirmación de eliminación
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [deleteItemId, setDeleteItemId] = useState<string>('');
  const [deleteItemName, setDeleteItemName] = useState<string>('');
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Cargar datos de emergencias
  const loadEmergencyData = async (page: number = 1, pageSize: number = 10) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/emergencia/patient/${patientId}?page=${page}&pageSize=${pageSize}`);

      if (!response.ok) {
        throw new Error(`Error al obtener datos de emergencia: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setEmergencies(data.data);
        setPagination(data.pagination);

        // Priorizar datos del contexto si están disponibles
        if (patientData && patientData.pacienteId === patientId) {
          setPatientInfo(patientData.name);
          setDocumentNumber(patientData.documento || '');
        } else if (data.data && data.data.length > 0) {
          // Usar datos de la API como fallback
          const firstRecord = data.data[0];
          setPatientInfo(`${firstRecord.NOMBRES || firstRecord.PACIENTE || 'PACIENTE'}`);
          setDocumentNumber(firstRecord.DOCUMENTO || '');
        } else {
          setPatientInfo('PACIENTE');
          setDocumentNumber('');
        }
      } else {
        throw new Error(data.error || 'Error desconocido al cargar datos');
      }
    } catch (error: any) {
      console.error('Error al cargar datos de emergencia:', error);
      setError(error.message || 'Error al cargar datos de emergencia');
      toast({
        title: 'Error',
        description: error.message || 'Error al cargar datos de emergencia',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Cargar datos cuando cambia el patientId o la página
  useEffect(() => {
    if (patientId) {
      loadEmergencyData(pagination.page, pagination.pageSize);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId, pagination.page, pagination.pageSize]);

  // Actualizar información del paciente cuando cambia el contexto
  useEffect(() => {
    if (patientData && patientData.pacienteId === patientId) {
      setPatientInfo(patientData.name);
      setDocumentNumber(patientData.documento || '');
    }
  }, [patientData, patientId]);

  // Función para cambiar de página
  const setPage = (page: number) => {
    setPagination(prev => ({ ...prev, page }));
  };

  // Función para refrescar los datos
  const refresh = () => {
    loadEmergencyData(pagination.page, pagination.pageSize);
  };

  // Función para crear una nueva emergencia
  const handleNewEmergency = () => {
    router.push(`/emergency/register/${patientId}`);
  };

  // Función para ver una emergencia
  const handleViewEmergency = (emergenciaId: string) => {
    router.push(`/emergency/view/${emergenciaId}?mode=view`);
  };

  // Función para editar una emergencia
  const handleEditEmergency = (emergenciaId: string) => {
    router.push(`/emergency/view/${emergenciaId}?mode=edit`);
  };

  // Función para preparar la eliminación de una emergencia
  const handleDeleteEmergency = (emergenciaId: string, patientName: string) => {
    setDeleteItemId(emergenciaId);
    setDeleteItemName(`Emergencia ${emergenciaId} - Paciente: ${patientName}`);
    setDeleteDialogOpen(true);
  };

  // Función para confirmar la eliminación de una emergencia
  const confirmDeleteEmergency = async () => {
    if (!deleteItemId) return;

    try {
      setIsDeleting(true);

      // Usar el endpoint de borrado lógico con la estructura correcta
      const response = await fetch(`/api/emergencia/${deleteItemId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ESTADO: "0" }),
      });

      if (!response.ok) {
        throw new Error(`Error al eliminar emergencia: ${response.status}`);
      }

      const data = await response.json();

      toast({
        title: 'Éxito',
        description: 'Emergencia eliminada correctamente',
      });
      
      // Refrescar la lista para mostrar el registro como eliminado
      refresh();
    } catch (error: any) {
      console.error('Error al eliminar emergencia:', error);
      toast({
        title: 'Error',
        description: error.message || 'Error al eliminar emergencia',
        variant: 'destructive'
      });
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  // ===== Reglas de edición: permite editar REGISTRADO (2) =====
  const isEmergencyEditable = (estado?: string): boolean => {
    return estado === '2'; // Solo permite editar emergencias en estado REGISTRADO (2)
  };

  // ===== Reglas de eliminación: permite eliminar REGISTRADO (2) =====
  const isEmergencyDeletable = (estado?: string): boolean => {
    return estado === '2'; // Solo permite eliminar emergencias en estado REGISTRADO (2)
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Diálogo de confirmación de eliminación */}
      <DeleteConfirmationDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={confirmDeleteEmergency}
        title="Confirmar anulación"
        description="¿Está seguro de anular el registro de la emergencia? Esta acción no se podrá revertir."
        itemName={deleteItemName}
        isLoading={isDeleting}
      />

      {/* Header */}
      <Navbar
        title="SIGSALUD"
        subtitle="EMERGENCIAS"
        showBackButton={true}
        backUrl="/hospitalization"
      />

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <Card className="shadow-lg">
          <CardHeader className="bg-blue-50 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl text-blue-800">
                <div>
                  <div>Emergencias</div>
                  <div className="text-sm font-normal mt-1">
                    Paciente: {patientInfo} - Documento: <strong>{documentNumber || patientId}</strong>
                  </div>
                </div>
              </CardTitle>
              <Button onClick={handleNewEmergency} className="bg-green-600 hover:bg-green-700">
                <Plus className="w-4 h-4 mr-2" />
                Nueva Emergencia
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">

            {/* Loading state */}
            {loading && (
              <div className="flex justify-center items-center py-12">
                <Spinner size="lg" />
                <span className="ml-3">Cargando historial de emergencia...</span>
              </div>
            )}

            {/* Error state */}
            {error && (
              <div className="text-center py-8 text-red-500">
                <p>{error}</p>
                <Button onClick={refresh} className="mt-4">
                  Reintentar
                </Button>
              </div>
            )}

            {/* Emergencies Table */}
            {!loading && !error && emergencies.length > 0 && (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="font-semibold">Estado</TableHead>
                      <TableHead className="font-semibold">ID</TableHead>
                      <TableHead className="font-semibold">Paciente</TableHead>
                      <TableHead className="font-semibold">Fecha</TableHead>
                      <TableHead className="font-semibold">Hora</TableHead>
                      <TableHead className="font-semibold">Consultorio</TableHead>
                      <TableHead className="font-semibold">Motivo</TableHead>
                      <TableHead className="font-semibold">Diagnóstico</TableHead>
                      <TableHead className="font-semibold">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {emergencies.map((emergency, index) => {
                      // Verificar si la emergencia está eliminada lógicamente (ESTADO='0')
                      const isDeleted = emergency.ESTADO === '0';

                      return (
                        <TableRow
                          key={emergency.EMERGENCIA_ID ? emergency.EMERGENCIA_ID : `emergency-${index}`}
                          className={`transition-colors ${isDeleted ? 'bg-gray-100 opacity-70' : 'hover:bg-blue-50'}`}
                        >
                          <TableCell>
                            {getStatusDisplay(emergency.ESTADO)}
                          </TableCell>
                          <TableCell className={`font-medium ${isDeleted ? 'text-gray-500' : 'text-blue-800'}`}>
                            {emergency.EMERGENCIA_ID}
                          </TableCell>
                          <TableCell>
                            {emergency.PACIENTE}
                          </TableCell>
                          <TableCell className={isDeleted ? 'text-gray-500' : ''}>
                            {formatDate(emergency.FECHA)}
                          </TableCell>
                          <TableCell className={isDeleted ? 'text-gray-500' : ''}>
                            {emergency.HORA}
                          </TableCell>
                          <TableCell className={isDeleted ? 'text-gray-500' : ''}>
                            {emergency.CONSULTORIO && emergency.CONSULTORIO_DESCRIPCION
                              ? `(${emergency.CONSULTORIO}) - ${emergency.CONSULTORIO_DESCRIPCION}`
                              : emergency.CONSULTORIO}
                          </TableCell>
                          <TableCell className={isDeleted ? 'text-gray-500' : ''}>
                            {emergency.MOTIVO_EMERGENCIA && emergency.MOTIVO_DESCRIPCION
                              ? `(${emergency.MOTIVO_EMERGENCIA}) - ${emergency.MOTIVO_DESCRIPCION}`
                              : emergency.MOTIVO_EMERGENCIA}
                          </TableCell>
                          <TableCell className={isDeleted ? 'text-gray-500' : ''}>
                            {emergency.CIEX1 && emergency.DIAGNOSTICO_DESCRIPCION
                              ? `(${emergency.CIEX1}) - ${emergency.DIAGNOSTICO_DESCRIPCION}`
                              : emergency.CIEX1 || 'No especificado'}
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              {/* View button - always available */}
                              <Button
                                size="sm"
                                variant="outline"
                                className="bg-white hover:bg-blue-50 border-blue-200"
                                onClick={() => emergency.EMERGENCIA_ID ? handleViewEmergency(emergency.EMERGENCIA_ID) : null}
                                title="Ver emergencia"
                              >
                                <Eye className="w-4 h-4 text-blue-600" />
                              </Button>

                              {/* Edit button - only enabled for editable records */}
                              <Button
                                size="sm"
                                variant="outline"
                                className={isEmergencyEditable(emergency.ESTADO) && !isDeleted 
                                  ? "bg-white hover:bg-green-50 border-green-200" 
                                  : "bg-gray-50 border-gray-200 cursor-not-allowed"}
                                onClick={() => {
                                  if (emergency.EMERGENCIA_ID && isEmergencyEditable(emergency.ESTADO) && !isDeleted) {
                                    handleEditEmergency(emergency.EMERGENCIA_ID);
                                  }
                                }}
                                disabled={isDeleted || !isEmergencyEditable(emergency.ESTADO)}
                                title={isEmergencyEditable(emergency.ESTADO) && !isDeleted ? "Editar emergencia" : "No se puede editar debido al estado"}
                              >
                                <Edit className={`w-4 h-4 ${
                                  isEmergencyEditable(emergency.ESTADO) && !isDeleted 
                                    ? "text-green-600" 
                                    : "text-gray-400"
                                }`} />
                              </Button>

                              {/* Delete button - always show but disabled based on state */}
                              <Button
                                size="sm"
                                variant="outline"
                                className={isEmergencyDeletable(emergency.ESTADO) && !isDeleted
                                  ? "bg-white hover:bg-red-50 border-red-200"
                                  : "bg-gray-50 border-gray-200 cursor-not-allowed"}
                                onClick={() => {
                                  if (emergency.EMERGENCIA_ID && isEmergencyDeletable(emergency.ESTADO) && !isDeleted) {
                                    handleDeleteEmergency(emergency.EMERGENCIA_ID, `${emergency.PACIENTE}`);
                                  }
                                }}
                                disabled={isDeleted || !isEmergencyDeletable(emergency.ESTADO)}
                                title={isEmergencyDeletable(emergency.ESTADO) && !isDeleted ? "Anular emergencia" : "No se puede anular debido al estado"}
                              >
                                <Trash2 className={`w-4 h-4 ${
                                  isEmergencyDeletable(emergency.ESTADO) && !isDeleted 
                                    ? "text-red-600" 
                                    : "text-gray-400"
                                }`} />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>

                {/* Pagination */}
                <div className="flex justify-between items-center mt-4">
                  <div className="text-sm text-gray-500">
                    Mostrando {emergencies.length > 0 ? (pagination.page - 1) * pagination.pageSize + 1 : 0} a{" "}
                    {Math.min(pagination.page * pagination.pageSize, pagination.total)} de {pagination.total} registros
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page === 1}
                      onClick={() => setPage(pagination.page - 1)}
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page >= pagination.totalPages}
                      onClick={() => setPage(pagination.page + 1)}
                    >
                      Siguiente
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {!loading && !error && emergencies.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>No hay emergencias registradas para este paciente</p>
                <Button onClick={handleNewEmergency} className="mt-4 bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Crear Primera Emergencia
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
