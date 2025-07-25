"use client"

import React, { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Trash2, Printer, Edit, Loader2, ChevronDown, FileText, ClipboardList, GraduationCap, FileSpreadsheet } from "lucide-react"
import { Navbar } from "@/components/Navbar"
import { useOrdenHospitalizacion } from "@/hooks/useOrdenHospitalizacion"
import { Spinner } from "@/components/ui/spinner"
import { PDFViewerModal } from "@/components/ui/pdf-viewer-modal"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useParams } from "next/navigation"

// Import the OrdenHospitalizacion type from the service
import { OrdenHospitalizacion as OrdenHospitalizacionType } from '@/services/ordenHospitalizacionService';

// Create a wrapper component that uses the useParams hook
export default function HospitalizationOrdersPage() {
  // Use the useParams hook to get the patientId
  const params = useParams();
  const patientId = params.patientId as string;
  
  return <HospitalizationOrders patientId={patientId} />;
}

// The actual component that receives patientId as a prop
function HospitalizationOrders({ patientId }: { patientId: string }) {
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
      console.log('🔍 Fetch interceptado:', url, init);
      
      // Ya no necesitamos verificar o redirigir llamadas a la API de paciente
      // ya que ahora usamos la API principal con paginación
      
      return originalFetch(input, init);
    };
    
    // Registrar información sobre las rutas disponibles
    console.log('📊 Rutas API esperadas para órdenes de hospitalización:');
    console.log('- /api/orden-hospitalizacion - Endpoint principal con paginación');
    console.log('- /api/orden-hospitalizacion/[id] - Obtener una orden específica por ID');
    console.log('- /api/orden-hospitalizacion/editable - Verificar si un paciente tiene órdenes editables');
    
    // Restaurar el fetch original cuando se desmonte el componente
    return () => {
      window.fetch = originalFetch;
    };
  }, []);
  
  // Agregar un efecto para verificar si hay otros componentes o hooks que puedan estar causando el problema
  useEffect(() => {
    console.log('🔎 Verificando hooks y componentes activos en la página de órdenes de hospitalización');
    console.log('- useOrdenHospitalizacion está configurado con pacienteId:', patientId);
    
    // Intentar detectar otros hooks o componentes que puedan estar haciendo llamadas incorrectas
    const allScripts = document.querySelectorAll('script');
    console.log(`- Número de scripts en la página: ${allScripts.length}`);
    
    // Verificar si hay algún error en la consola relacionado con las rutas API
    console.log('- Verificando errores de red en la consola...');
  }, [patientId]);

  // Establecer el pacienteId cuando el componente se monta
  useEffect(() => {
    if (patientId) {
      loadPatientData();
      checkEditableStatus();
      console.log('📝 [HospitalizationOrders] Estableciendo pacienteId en el hook:', patientId);
      setPacienteId(patientId);
    }
  }, [patientId]);
  
  // Registrar cuando cambian las órdenes de hospitalización
  useEffect(() => {
    console.log('📝 [HospitalizationOrders] Órdenes de hospitalización actualizadas:', {
      cantidad: ordenesHospitalizacion.length,
      muestra: ordenesHospitalizacion.length > 0 ? ordenesHospitalizacion[0] : 'Sin datos'
    });
  }, [ordenesHospitalizacion]);

  // Cargar datos del paciente
  const loadPatientData = async () => {
    try {
      setPacienteLoading(true);
      console.log('📋 Obteniendo datos del paciente desde:', `/api/filiacion/${patientId}`);
      
      const response = await fetch(`/api/filiacion/${patientId}`);
      
      if (!response.ok) {
        throw new Error(`Error al obtener datos del paciente: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('📋 Datos del paciente recibidos:', data);
      
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
      console.log('🔍 Verificando estado editable para paciente:', patientId);
      
      const response = await fetch(`/api/orden-hospitalizacion/editable?pacienteId=${patientId}`);
      
      if (!response.ok) {
        throw new Error(`Error al verificar estado editable: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('🔍 Estado editable recibido:', data);
      
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
        console.log(`Fuente de datos: ${data.source}`);
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

  // Efecto para obtener el estado de cada hospitalización cuando se cargan las órdenes
  useEffect(() => {
    if (ordenesHospitalizacion.length > 0) {
      const fetchHospitalizacionesEstado = async () => {
        const estados: Record<string, string> = {};
        
        // Usar el ESTADO que ya viene en las órdenes de hospitalización
        for (const orden of ordenesHospitalizacion) {
          try {
            // Verificar si la orden ya tiene un ESTADO
            if (orden.ESTADO) {
              console.log(`Usando ESTADO existente para orden ${orden.idHOSPITALIZACION}: ${orden.ESTADO}`);
              estados[orden.idHOSPITALIZACION] = orden.ESTADO;
            } 
            // Solo hacer la llamada API si idHOSPITALIZACION existe y no tenemos el ESTADO
            else if (orden.idHOSPITALIZACION && orden.idHOSPITALIZACION.trim() !== '') {
              console.log(`Obteniendo ESTADO para orden ${orden.idHOSPITALIZACION}`);
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

  // Formatear fecha para mostrar
  const formatDate = (date: Date | string | null | undefined): string => {
    if (!date) return '-';
    try {
      // If the date is already a Date object, use it directly
      const dateObj = date instanceof Date ? date : new Date(date);
      if (isNaN(dateObj.getTime())) {
        // If invalid date, return the original value as string
        return typeof date === 'string' ? date : '-';
      }
      // Format the date using Intl.DateTimeFormat
      return new Intl.DateTimeFormat('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }).format(dateObj);
    } catch (error) {
      console.error('Error al formatear fecha:', error);
      return typeof date === 'string' ? date : '-';
    }
  };

  const handleNewOrder = () => {
    // Ensure we have the patient data before redirecting
    if (!pacienteData && !pacienteLoading) {
      // If we don't have patient data yet, fetch it first
      console.log('📋 Obteniendo datos del paciente para nueva orden desde:', `/api/filiacion/${patientId}`);
      fetch(`/api/filiacion/${patientId}`)
        .then(res => {
          if (!res.ok) {
            throw new Error(`Error al obtener datos del paciente: ${res.status}`);
          }
          return res.json();
        })
        .then(response => {
          console.log('📋 Datos del paciente recibidos para nueva orden:', response);
          
          // Store the patient data and then redirect
          if (response.success && response.data) {
            setPacienteData(response.data);
          } else if (response.NOMBRES) {
            setPacienteData(response);
          }
          
          // Redirect to the registration page with the patient ID
          window.location.href = `/hospitalization/register/${patientId}`;
        })
        .catch(err => {
          console.error('Error al obtener datos del paciente para nueva orden:', err);
          // Redirect anyway even if we couldn't get the patient data
          window.location.href = `/hospitalization/register/${patientId}`;
        });
    } else {
      // We already have the patient data or it's loading, so just redirect
      window.location.href = `/hospitalization/register/${patientId}`;
    }
  }

  const handleEditOrder = (orderId?: string) => {
    if (!orderId || orderId.trim() === '') {
      console.error('No se puede editar: ID de orden de hospitalización no válido');
      return;
    }
    // Redireccionar a la vista de detalles en lugar de la página de registro
    window.location.href = `/hospitalization/view/${patientId}?orderId=${orderId}`;
  }

  const handleDeleteOrder = (orderId?: string) => {
    if (!orderId || orderId.trim() === '') {
      console.error('No se puede eliminar: ID de orden de hospitalización no válido');
      return;
    }
    
    // Implementar eliminación real con API
    if (confirm('¿Está seguro de eliminar esta orden de hospitalización?')) {
      // Aquí iría la llamada a la API para eliminar
      // Por ahora solo actualizamos la UI
      refresh();
    }
  }

  const handlePrintOrder = (orderId?: string, documentType?: 'filiacion' | 'orden-consentimiento' | 'consentimiento-docencia' | 'fua') => {
    if (!orderId || orderId.trim() === '') {
      console.error('No se puede imprimir: ID de orden de hospitalización no válido');
      return;
    }
    
    // Eliminar espacios en blanco del ID
    const cleanId = orderId.trim();
    
    // Determinar el título del documento para el visor de PDF
    const documentName = documentType === 'filiacion' ? 'Hoja de Filiación' :
                        documentType === 'orden-consentimiento' ? 'Orden de Hospitalización + Consentimiento' :
                        documentType === 'consentimiento-docencia' ? 'Consentimiento para actividades de docencia' :
                        documentType === 'fua' ? 'FUA' : 'Documento';
    
    console.log(`Preparando visualización de ${documentName} para orden ${cleanId}`);
    
    // Configurar las URLs y abrir el visor de PDF según el tipo de documento
    switch(documentType) {
      case 'filiacion':
        // Para la hoja de filiación, necesitamos hacer una llamada a la API local primero
        fetch(`/api/filiacion/${patientId}`)
          .then(response => {
            if (!response.ok) throw new Error('Error al obtener datos de filiación');
            return response.json();
          })
          .then(data => {
            console.log('Datos de filiación obtenidos:', data);
            // Configurar el visor de PDF con la URL de la hoja de filiación
            setPdfTitle('Hoja de Filiación');
            setPdfUrls([`/api/print/filiacion/${patientId}`]);
            setPdfViewerOpen(true);
          })
          .catch(error => {
            console.error('Error al obtener datos de filiación:', error);
            alert('Error al generar la hoja de filiación');
          });
        break;
      
      case 'orden-consentimiento':
        // Configurar el visor de PDF con las URLs de orden y consentimiento
        setPdfTitle('Orden de Hospitalización + Consentimiento');
        setPdfUrls([
          `http://192.168.0.21:8080/api/reporte/pdf/orden-hospitalizacion/${cleanId}`,
          `http://192.168.0.21:8080/api/reporte/pdf/consentimiento-hospitalizacion/${cleanId}`
        ]);
        setPdfViewerOpen(true);
        break;
      
      case 'consentimiento-docencia':
        // Implementar cuando esté disponible la API
        alert('Funcionalidad de impresión de consentimiento para docencia en desarrollo');
        break;
      
      case 'fua':
        // Implementar cuando esté disponible la API
        alert('Funcionalidad de impresión de FUA en desarrollo');
        break;
      
      default:
        alert('Tipo de documento no reconocido');
        break;
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* PDF Viewer Modal */}
      <PDFViewerModal
        open={pdfViewerOpen}
        onClose={() => setPdfViewerOpen(false)}
        pdfUrls={pdfUrls}
        title={pdfTitle}
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
                      Paciente: {pacienteData?.NOMBRES || ''} {pacienteData?.APELLIDOS || ''} - HC: <strong>{patientId}</strong>
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
                    {ordenesHospitalizacion.map((orden, index) => (
                      <TableRow
                        key={orden.idHOSPITALIZACION ? orden.idHOSPITALIZACION : `orden-${index}`}
                        className="hover:bg-blue-50 transition-colors cursor-pointer"
                        onClick={() => orden.idHOSPITALIZACION ? handleEditOrder(orden.idHOSPITALIZACION) : null}
                      >
                        <TableCell className="font-medium text-blue-800">{orden.idHOSPITALIZACION}</TableCell>
                        <TableCell>
                          {orden.Paciente || (pacienteData?.NOMBRES ? `${pacienteData.NOMBRES} ${pacienteData.APELLIDOS || ''}` : '')}
                          <div className="text-xs text-gray-500 mt-1">Código: {patientId}</div>
                        </TableCell>
                        <TableCell>{orden.Historia || patientId}</TableCell>
                        <TableCell>{orden.CONSULNOMBRE}</TableCell>
                        <TableCell>{orden.MEDICONOMBRE || 'No especificado'}</TableCell>
                        <TableCell>{formatDate(orden.FECHA1)}</TableCell>
                        <TableCell>{orden.HORA1}</TableCell>
                        <TableCell>{orden.ORIGENOMBRE}</TableCell>
                        <TableCell>{orden.SEGURONOMBRE}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            {isOrdenEditable(orden.idHOSPITALIZACION) && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleEditOrder(orden.idHOSPITALIZACION)
                                }}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            )}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="bg-white hover:bg-blue-50 border-blue-200"
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
                                  <span>Orden de Hospitalización + Consentimiento</span>
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
                            {orden.idHOSPITALIZACION && isOrdenEditable(orden.idHOSPITALIZACION) && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 hover:bg-red-50 bg-transparent"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDeleteOrder(orden.idHOSPITALIZACION)
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
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
