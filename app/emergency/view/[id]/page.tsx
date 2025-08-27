"use client"

import { useRouter, useParams, useSearchParams } from "next/navigation"
import { useState, useEffect } from 'react'
import { Navbar } from "@/components/Navbar"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Edit } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Spinner } from "@/components/ui/spinner"
import { Badge } from "@/components/ui/badge"
import EmergencySectionView from '@/components/emergency/view/EmergencySectionView'
import { resolveStatus } from '@/utils/statusUtils'
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"

export default function EmergencyViewEditPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const emergencyId = params.id as string;
  const urlMode = searchParams.get('mode') || 'view';
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [emergencyData, setEmergencyData] = useState<any>(null);
  const [patientId, setPatientId] = useState<string | null>(null);
  const [mode, setMode] = useState<'edit' | 'read'>(urlMode === 'edit' ? 'edit' : 'read');
  const [statusInfo, setStatusInfo] = useState<{
    isReadOnly: boolean;
    statusText: string;
  }>({ isReadOnly: urlMode !== 'edit', statusText: 'Cargando...' });

  // Fetch emergency data
  useEffect(() => {
    const fetchEmergencyData = async () => {
      try {
        setLoading(true);
        setError(null); // Reset error state
        
        // Validate emergencyId
        if (!emergencyId || emergencyId === 'undefined') {
          throw new Error('ID de emergencia inválido');
        }
        
        const response = await fetch(`/api/emergencia/${emergencyId}`);
        
        // Handle HTTP errors
        if (response.status === 404) {
          throw new Error('Registro de emergencia no encontrado');
        } else if (response.status === 403) {
          throw new Error('No tiene permisos para acceder a este registro');
        } else if (!response.ok) {
          throw new Error(`Error al cargar los datos de emergencia (${response.status})`);
        }
        
        const data = await response.json();
        
        if (data.success && data.data) {
          const emergency = data.data;
          setEmergencyData(emergency);
          
          // Validate patient ID
          if (!emergency.PACIENTE) {
            throw new Error('El registro no contiene un ID de paciente válido');
          }
          
          setPatientId(emergency.PACIENTE);
          
          // Determinar el estado según el estado de la emergencia y el modo de la URL
          const emergencyStatus = emergency.ESTADO;
          const isEditable = emergencyStatus === '2'; // Solo estado REGISTRADO (2) es editable
          
          // Si el modo de la URL es 'edit' y el registro es editable, permitir edición
          if (urlMode === 'edit' && isEditable) {
            setMode('edit');
            setStatusInfo({
              isReadOnly: false,
              statusText: 'Modo edición'
            });
          } else {
            setMode('read');
            setStatusInfo({
              isReadOnly: true,
              statusText: urlMode === 'edit' && !isEditable 
                ? 'No editable - Estado del registro no permite modificaciones'
                : 'Modo visualización'
            });
          }
        } else {
          throw new Error(data.error || 'No se encontraron datos de emergencia');
        }
      } catch (error: any) {
        console.error('Error fetching emergency data:', error);
        setError(error.message);
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive"
        });
        
        // No redirigir automáticamente, permitir al usuario ver el error y decidir qué hacer
        // El usuario puede usar el botón "Volver" para navegar manualmente
      } finally {
        setLoading(false);
      }
    };
    
    if (emergencyId) {
      fetchEmergencyData();
    } else {
      setError('ID de emergencia no proporcionado');
      setLoading(false);
    }
  }, [emergencyId]);

  // Efecto para monitorear cambios en el parámetro mode de la URL
  useEffect(() => {
    // Solo actualizar si ya tenemos datos cargados
    if (emergencyData) {
      const newMode = urlMode === 'edit' ? 'edit' : 'read';
      const isEditable = emergencyData.ESTADO === '2';
      
      // Actualizar el modo y el estado de solo lectura según la URL y el estado del registro
      if (newMode === 'edit' && isEditable) {
        setMode('edit');
        setStatusInfo({
          isReadOnly: false,
          statusText: 'Modo edición'
        });
      } else {
        setMode('read');
        setStatusInfo({
          isReadOnly: true,
          statusText: urlMode === 'edit' && !isEditable 
            ? 'No editable - Estado del registro no permite modificaciones'
            : 'Modo visualización'
        });
      }
    }
  }, [urlMode, emergencyData]);

  // Function to go back to the emergency list
  const handleGoBack = () => {
    if (patientId) {
      router.push(`/emergency/${patientId}`);
    } else {
      router.push('/dashboard');
    }
  };

  // Function to toggle edit mode
  const handleToggleEditMode = () => {
    if (mode === 'read' && emergencyData?.ESTADO === '2') {
      // Switch to edit mode and update state immediately
      setMode('edit');
      setStatusInfo({
        isReadOnly: false,
        statusText: 'Modo edición'
      });
      // Update URL without full page navigation
      router.push(`/emergency/view/${emergencyId}?mode=edit`, { scroll: false });
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />
      <Toaster />
      <main className="flex-1 container mx-auto py-6 px-4 max-w-7xl">
        <div className="mb-6">
          <Button 
            variant="outline" 
            onClick={handleGoBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
        </div>
        
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-2">EMERGENCIA</h1>
            <h2 className="text-lg font-medium text-gray-600">
              {mode === 'edit' ? 'Editar Registro de Emergencia' : 'Ver Registro de Emergencia'}
            </h2>
          </div>
          
          <div className="flex items-center gap-3">
            {mode === 'read' && emergencyData?.ESTADO === '2' && (
              <Button
                onClick={handleToggleEditMode}
                className="bg-green-600 hover:bg-green-700 text-white"
                size="sm"
              >
                <Edit className="w-4 h-4 mr-2" />
                Editar
              </Button>
            )}
            
            <Badge 
              variant={mode === 'edit' ? "outline" : "secondary"}
              className="text-sm py-1 px-3"
            >
              {statusInfo.statusText}
            </Badge>
          </div>
        </div>
        
        {statusInfo.isReadOnly && (
          <Alert className="mb-6 bg-amber-50 border-amber-200">
            <AlertTitle className="text-amber-800">Registro en modo lectura</AlertTitle>
            <AlertDescription className="text-amber-700">
              Este registro está cerrado y no puede ser modificado.
            </AlertDescription>
          </Alert>
        )}
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Spinner size="lg" />
          </div>
        ) : error ? (
          <Alert variant="destructive" className="mb-6">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : (
          emergencyData && (
            <EmergencySectionView 
              emergencyId={emergencyId}
              initialData={emergencyData}
              readOnly={statusInfo.isReadOnly}
              onSave={(updatedData) => {
                // Update local state with new data
                setEmergencyData(updatedData);
                toast({
                  title: "Datos actualizados",
                  description: "Los datos de emergencia se han actualizado correctamente"
                });
              }}
            />
          )
        )}
      </main>
    </div>
  );
}
