"use client"

import { useSearchParams, useParams, useRouter } from 'next/navigation'
import { Navbar } from "@/components/Navbar"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { EmergencyFormRefactored } from '@/components/emergency/register/EmergencyFormRefactored'
import FuaEmergencyStatusAlert from '@/components/emergency/register/FuaEmergencyStatusAlert'
import { EmergencyProvider } from '@/contexts/EmergencyProvider'

export default function EmergencyRegisterPage() {
  const router = useRouter();
  // Usar useParams hook para obtener los parámetros de ruta
  const params = useParams();
  const patientId = params.pacientId as string;
  
  // Obtener el emergencyId de los parámetros de búsqueda (para modo edición)
  const searchParams = useSearchParams()
  const emergencyId = searchParams.get('emergencyId')
  
  // Función para volver a la página de emergencias
  const handleGoBack = () => {
    router.push(`/emergency/${patientId}`);
  }
  
  return (
    <EmergencyProvider>
      <div className="flex flex-col min-h-screen bg-gray-50">
        <Navbar />
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
          
          <h1 className="text-2xl font-bold mb-2">EMERGENCIA</h1>
          <h2 className="text-lg font-medium mb-6 text-gray-600">
            {emergencyId ? 'Editar Registro de Emergencia' : 'Nuevo Registro de Emergencia'}
          </h2>

          <EmergencyFormRefactored patientId={patientId} emergencyId={emergencyId} />
        </main>
      </div>
    </EmergencyProvider>
  )
}
