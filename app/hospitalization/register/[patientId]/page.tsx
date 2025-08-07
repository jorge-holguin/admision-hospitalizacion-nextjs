"use client"

import { useSearchParams, useParams, useRouter } from 'next/navigation'
import { Navbar } from "@/components/Navbar"
import { HospitalizationFormRefactored } from '@/components/hospitalization/register/HospitalizationFormRefactored'
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { HospitalizationForm } from '@/components/hospitalization/HospitalizationForm'

export default function HospitalizationRegisterPage() {
  const router = useRouter();
  // Usar useParams hook para obtener los parámetros de ruta
  const params = useParams();
  const patientId = params.patientId as string;
  
  // Obtener el orderId de los parámetros de búsqueda
  const searchParams = useSearchParams()
  const orderId = searchParams.get('orderId')
  
  // Función para volver a la página de órdenes de hospitalización
  const handleGoBack = () => {
    router.push(`/hospitalization/orders/${patientId}`);
  }
  
  return (
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
        
        <h1 className="text-2xl font-bold mb-2">HOSPITALIZACIÓN</h1>
        <h2 className="text-lg font-medium mb-6 text-gray-600">Registro de Orden de Hospitalización</h2>
        
        <HospitalizationFormRefactored patientId={patientId} orderId={orderId} />
      </main>
    </div>
  )
}
