"use client"

import React, { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Trash2, Printer, Edit, ChevronDown, FileText, ClipboardList, GraduationCap, FileSpreadsheet, Eye } from "lucide-react"
import { Navbar } from "@/components/Navbar"
import { useToast } from '@/components/ui/use-toast';
import { Spinner } from '@/components/ui/spinner';
import { PDFViewerModal } from '@/components/ui/pdf-viewer-modal';
import { DeleteConfirmationDialog } from '@/components/ui/delete-confirmation-dialog';
import { useOrdenHospitalizacion } from '@/hooks/useOrdenHospitalizacion';
// Importar componentes personalizados
import { formatDate } from '@/components/hospitalization/DateFormatter';
import { useDocumentPrinter } from '@/components/hospitalization/DocumentPrinter';
import { useOrderOperations } from '@/components/hospitalization/OrderOperations';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useParams } from "next/navigation"

// Variables de entorno ya importadas desde DocumentPrinter

// Crear un componente envoltorio que utiliza el hook useParams
export default function HospitalizationOrdersPage() {
  // Utilizar el hook useParams para obtener el patientId
  const params = useParams();
  const patientId = params.patientId as string;
  
  return <HospitalizationOrders patientId={patientId} />;
}

// The actual component that receives patientId as a prop
function HospitalizationOrders({ patientId }: { patientId: string }) {
  // Hooks
  const { toast } = useToast();
  
  // Estado para almacenar los datos del paciente
  const [pacienteData, setPacienteData] = useState<any>(null);
  const [pacienteLoading, setPacienteLoading] = useState<boolean>(true);
  const [isEditable, setIsEditable] = useState<boolean>(false);
  const [checkingEditStatus, setCheckingEditStatus] = useState<boolean>(true);
  const [hospitalizacionesEstado, setHospitalizacionesEstado] = useState<Record<string, string>>({});
  
  // Estado para el visor de PDF
  const [pdfViewerOpen, setPdfViewerOpen] = useState<boolean>(false);
  const [pdfUrls, setPdfUrls] = useState<string[]>([]);
  const [pdfTitle, setPdfTitle] = useState<string>('');
  
  // Hooks personalizados para operaciones
  const { handleDirectPrint, printHospitalizationDocument } = useDocumentPrinter();
  
  const orderOperations = useOrderOperations({
    onOrderDeleted: () => refresh()
  });
  
  // Destructurar las propiedades y métodos del hook de operaciones
  const { 
    deleteDialogOpen, 
    deleteItemId, 
    deleteItemName, 
    isDeleting, 
    handleDeleteOrder, 
    confirmDeleteOrder, 
    handleEditOrder, 
    setDeleteDialogOpen 
  } = orderOperations;
  
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
    initialPageSize: 10
  });

  // Referencia para rastrear si ya se ha montado el componente
  const componentMounted = useRef(false);

  // Agregar un efecto para depurar las llamadas API
  useEffect(() => {
    // Sobrescribir temporalmente el método fetch para registrar todas las llamadas
    const originalFetch = window.fetch;
    window.fetch = function(input: RequestInfo | URL, init?: RequestInit) {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input instanceof Request ? input.url : String(input);      
      // Ya no necesitamos verificar o redirigir llamadas a la API de paciente
      // ya que ahora usamos la API principal con paginación
      
      return originalFetch(input, init);
    };
    
    // Restaurar el fetch original cuando se desmonte el componente
    return () => {
      window.fetch = originalFetch;
    };
  }, []);
  
  // Agregar un efecto para verificar si hay otros componentes o hooks que puedan estar causando el problema
  useEffect(() => {
    // Intentar detectar otros hooks o componentes que puedan estar haciendo llamadas incorrectas
    const allScripts = document.querySelectorAll('script');
  }, [patientId]);

  // Establecer el pacienteId cuando el componente se monta
  useEffect(() => {
    if (patientId) {
      loadPatientData();
      checkEditableStatus();
      setPacienteId(patientId);
    }
  }, [patientId]);
  
  // Registrar cuando cambian las órdenes de hospitalización
  useEffect(() => {
  }, [ordenesHospitalizacion]);

  // Cargar datos del paciente
  const loadPatientData = async () => {
    try {
      setPacienteLoading(true);      
      const response = await fetch(`/api/filiacion/${patientId}`);
      
      if (!response.ok) {
        throw new Error(`Error al obtener datos del paciente: ${response.status}`);
      }
      
      const data = await response.json();      
      // Verificar la estructura de la respuesta y extraer los datos del paciente
      if (data.success && data.data) {
        setPacienteData(data.data);
      } else if (data.NOMBRES) {
        setPacienteData(data);
      }
    } catch (error) {
      console.error('Error al cargar datos del paciente:', error);
    } finally {
      setPacienteLoading(false);
    }
  };
  
  // Verificar si el paciente tiene un registro de hospitalización con ESTADO = '1'
  const checkEditableStatus = async () => {
    try {
      setCheckingEditStatus(true);      
      const response = await fetch(`/api/orden-hospitalizacion/editable?pacienteId=${patientId}`);
      
      if (!response.ok) {
        throw new Error(`Error al verificar estado editable: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Verificar si data.isEditable existe y es un booleano
      if (typeof data.isEditable === 'boolean') {
        setIsEditable(data.isEditable);
      } else {
        console.warn('El campo isEditable no es un booleano o no existe:', data);
        // Por defecto, permitir edición si no hay información clara
        setIsEditable(true);
      }
      
      // Mostrar información adicional de depuración
      if (data.source) {
      }
      
      if (data.error) {
        console.warn('Error reportado por la API:', data.error);
      }
    } catch (error) {
      console.error('Error al verificar estado editable:', error);
      setIsEditable(false); // Por defecto, no permitir edición si hay error
    } finally {
      setCheckingEditStatus(false);
    }
  };

  // Efecto para obtener los estados de las órdenes de hospitalización
  useEffect(() => {
    if (ordenesHospitalizacion && ordenesHospitalizacion.length > 0) {
      const fetchHospitalizacionesEstado = async () => {
        const estados: Record<string, string> = {};
        
        // Iterar sobre cada orden para obtener su estado actual
        for (const orden of ordenesHospitalizacion) {
          try {
            // Verificar si la orden ya tiene un ESTADO
            if (orden.ESTADO) {
              estados[orden.idHOSPITALIZACION] = orden.ESTADO;
            } 
            // Solo hacer la llamada API si idHOSPITALIZACION existe y no tenemos el ESTADO
            else if (orden.idHOSPITALIZACION && orden.idHOSPITALIZACION.trim() !== '') {
              const response = await fetch(`/api/orden-hospitalizacion/${orden.idHOSPITALIZACION}`);
              
              if (response.ok) {
                const data = await response.json();
                if (data && data.ESTADO) {
                  estados[orden.idHOSPITALIZACION] = data.ESTADO;
                }
              }
            } else {
              console.warn('Orden de hospitalización sin ID válido:', orden);
            }
          } catch (error) {
            console.error(`Error al obtener estado de hospitalización ${orden.idHOSPITALIZACION || 'desconocido'}:`, error);
          }
        }
        
        setHospitalizacionesEstado(estados);
      };
      
      fetchHospitalizacionesEstado();
    }
  }, [ordenesHospitalizacion]);
  
  // Función para verificar si una orden es editable según su estado
  const isOrdenEditable = (ordenId?: string): boolean => {
    // Si no hay ID o es vacío, no es editable
    if (!ordenId || ordenId.trim() === '') {
      return false;
    }
    const estado = hospitalizacionesEstado[ordenId];
    return estado === '1' || estado === '2';
  };

  // Función para obtener datos del paciente para una nueva orden
  const fetchPatientData = async () => {
    try {
      const res = await fetch(`/api/filiacion/${patientId}`);
      if (!res.ok) {
        throw new Error(`Error al obtener datos del paciente: ${res.status}`);
      }
      const response = await res.json();
      
      // Store the patient data
      if (response.success && response.data) {
        setPacienteData(response.data);
      } else if (response.NOMBRES) {
        setPacienteData(response);
      }
      
      return response;
    } catch (err) {
      // Manejar error silenciosamente
      return null;
    }
  };
  
  // Función para crear una nueva orden
  const handleNewOrder = () => {
    // Si no tenemos datos del paciente y no están cargando, intentar obtenerlos primero
    if (!pacienteData && !pacienteLoading) {
      fetchPatientData()
        .finally(() => {
          // Redireccionar a la página de registro con el ID del paciente
          window.location.href = `/hospitalization/register/${patientId}`;
        });
    } else {
      // Ya tenemos los datos del paciente o están cargando, así que solo redireccionamos
      window.location.href = `/hospitalization/register/${patientId}`;
    }
  }






  const handlePrintOrder = (orderId?: string, documentType?: 'filiacion' | 'orden-consentimiento' | 'consentimiento-docencia' | 'fua') => {
    if (!orderId || orderId.trim() === '') {
      toast({
        title: 'Error',
        description: 'No se puede imprimir: ID de orden de hospitalización no válido',
        variant: 'destructive'
      });
      return;
    }
    
    // Eliminar espacios en blanco del ID
    const cleanId = orderId.trim();
    printHospitalizationDocument(cleanId, documentType || 'orden-consentimiento');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Visor de PDF */}
      <PDFViewerModal
        open={pdfViewerOpen}
        onClose={() => setPdfViewerOpen(false)}
        pdfUrls={pdfUrls}
        title={pdfTitle}
        patientId={patientId}
      />
      
      {/* Diálogo de confirmación de eliminación */}
      <DeleteConfirmationDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={confirmDeleteOrder}
        title="Confirmar eliminación"
        description="Esta acción eliminará permanentemente el registro de hospitalización. ¿Está seguro de continuar?"
        itemName={deleteItemName}
        isLoading={isDeleting}
      />
      {/* Header */}
      <Navbar 
        title="SIGSALUD" 
        subtitle="HOSPITALIZACIÓN" 
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
                  <div>Órdenes de Hospitalización</div>
                  {pacienteLoading ? (
                    <div className="flex items-center gap-2 text-sm font-normal mt-1">
                      <div>Cargando información del paciente...</div>
                      <Spinner />
                    </div>
                  ) : (
                    <div className="text-sm font-normal mt-1">
                      Paciente: {pacienteData?.NOMBRES || ''} {pacienteData?.APELLIDOS || ''} - HC: <strong>{pacienteData?.HISTORIA}</strong>
                    </div>
                  )}
                </div>
              </CardTitle>
              <Button onClick={handleNewOrder} className="bg-green-600 hover:bg-green-700">
                <Plus className="w-4 h-4 mr-2" />
                Nueva Orden
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
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

            {/* Orders Table */}
            {!loading && !error && ordenesHospitalizacion.length > 0 && (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="font-semibold">ID</TableHead>
                      <TableHead className="font-semibold">Paciente</TableHead>
                      <TableHead className="font-semibold">Historia</TableHead>
                      <TableHead className="font-semibold">Consultorio</TableHead>
                      <TableHead className="font-semibold">Médico</TableHead>
                      <TableHead className="font-semibold">Fecha Ingreso</TableHead>
                      <TableHead className="font-semibold">Hora Ingreso</TableHead>
                      <TableHead className="font-semibold">Origen</TableHead>
                      <TableHead className="font-semibold">Seguro</TableHead>
                      <TableHead className="font-semibold">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ordenesHospitalizacion.map((orden, index) => {
                      // Verificar si la orden está eliminada lógicamente (ESTADO='0')
                      const isDeleted = orden.ESTADO === '0';
                      
                      return (
                        <TableRow
                          key={orden.idHOSPITALIZACION ? orden.idHOSPITALIZACION : `orden-${index}`}
                          className={`transition-colors ${isDeleted ? 'bg-gray-100 opacity-70' : 'hover:bg-blue-50'}`}
                        >
                          <TableCell className={`font-medium ${isDeleted ? 'text-gray-500' : 'text-blue-800'}`}>{orden.idHOSPITALIZACION}</TableCell>
                          <TableCell>
                            {patientId}
                            <div className="text-xs text-gray-500 mt-1">{orden.Paciente || (pacienteData?.NOMBRES ? `${pacienteData.NOMBRES} ${pacienteData.APELLIDOS || ''}` : '')}</div>
                          </TableCell>
                          <TableCell className={isDeleted ? 'text-gray-500' : ''}>{orden.HISTORIA}</TableCell>
                          <TableCell className={isDeleted ? 'text-gray-500' : ''}>{orden.CONSULNOMBRE}</TableCell>
                          <TableCell className={isDeleted ? 'text-gray-500' : ''}>{orden.MEDICONOMBRE || 'No especificado'}</TableCell>
                          <TableCell className={isDeleted ? 'text-gray-500' : ''}>{formatDate(orden.FECHA1)}</TableCell>
                          <TableCell className={isDeleted ? 'text-gray-500' : ''}>{orden.HORA1}</TableCell>
                          <TableCell className={isDeleted ? 'text-gray-500' : ''}>{orden.ORIGENOMBRE}</TableCell>
                          <TableCell className={isDeleted ? 'text-gray-500' : ''}>{orden.SEGURONOMBRE}</TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              {/* View button - active when state is '3', disabled when state is '2' or deleted */}
                              <Button
                                size="sm"
                                variant="outline"
                                className="bg-white hover:bg-blue-50 border-blue-200"
                                onClick={() => orden.idHOSPITALIZACION ? handleEditOrder(orden.idHOSPITALIZACION, patientId) : null}
                                disabled={isDeleted || hospitalizacionesEstado[orden.idHOSPITALIZACION] === '2'}
                              >
                                <Eye className="w-4 h-4 text-blue-600" />
                              </Button>
                              
                              {/* Edit button - always shown, but disabled when not editable or deleted */}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  handleEditOrder(orden.idHOSPITALIZACION, patientId)
                                }}
                                disabled={isDeleted || !isOrdenEditable(orden.idHOSPITALIZACION)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="bg-white hover:bg-blue-50 border-blue-200"
                                    disabled={isDeleted}
                                  >
                                    <Printer className="w-4 h-4 mr-1 text-blue-600" />
                                    <ChevronDown className="h-3 w-3 text-blue-600" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-64 p-2">
                                  <DropdownMenuItem
                                    className="flex items-center gap-2 p-2 cursor-pointer hover:bg-blue-50 rounded-md"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      if (orden.idHOSPITALIZACION) {
                                        handlePrintOrder(orden.idHOSPITALIZACION, 'filiacion')
                                      }
                                    }}
                                  >
                                    <FileText className="w-4 h-4 text-blue-600" />
                                    <span>Hoja de Filiación</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="flex items-center gap-2 p-2 cursor-pointer hover:bg-blue-50 rounded-md"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      if (orden.idHOSPITALIZACION) {
                                        handlePrintOrder(orden.idHOSPITALIZACION, 'orden-consentimiento')
                                      }
                                    }}
                                  >
                                    <ClipboardList className="w-4 h-4 text-green-600" />
                                    <span>Orden de Hospitalización</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="flex items-center gap-2 p-2 cursor-pointer hover:bg-blue-50 rounded-md"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      if (orden.idHOSPITALIZACION) {
                                        handlePrintOrder(orden.idHOSPITALIZACION, 'consentimiento-docencia')
                                      }
                                    }}
                                  >
                                    <GraduationCap className="w-4 h-4 text-amber-600" />
                                    <span>Consentimiento para actividades de docencia</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="flex items-center gap-2 p-2 cursor-pointer hover:bg-blue-50 rounded-md"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      if (orden.idHOSPITALIZACION) {
                                        handlePrintOrder(orden.idHOSPITALIZACION, 'fua')
                                      }
                                    }}
                                  >
                                    <FileSpreadsheet className="w-4 h-4 text-purple-600" />
                                    <span>FUA</span>
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                              {/* Delete button - always shown, but disabled when not editable or deleted */}
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 hover:bg-red-50 bg-transparent"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  const pacienteName = orden.Paciente || 
                                    (pacienteData?.NOMBRES ? `${pacienteData.NOMBRES} ${pacienteData.APELLIDOS || ''}` : `${patientId}`);
                                  handleDeleteOrder(orden.idHOSPITALIZACION, pacienteName)
                                }}
                                disabled={isDeleted || !isOrdenEditable(orden.idHOSPITALIZACION)}
                              >
                                <Trash2 className="w-4 h-4" />
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
                    Mostrando {ordenesHospitalizacion.length > 0 ? (pagination.page - 1) * pagination.pageSize + 1 : 0} a{" "}
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

            {!loading && !error && ordenesHospitalizacion.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>No hay órdenes de hospitalización registradas para este paciente</p>
                <Button onClick={handleNewOrder} className="mt-4 bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Crear Primera Orden
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
