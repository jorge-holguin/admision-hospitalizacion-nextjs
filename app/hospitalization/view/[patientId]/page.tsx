"use client"

import { useParams, useSearchParams } from 'next/navigation'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/Navbar'
import { HospitalizationViewRefactored } from '@/components/hospitalization/view'
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default function HospitalizationViewPage() {
  const router = useRouter();
  // Usar useParams hook para obtener los parámetros de ruta
  const params = useParams();
  const patientId = params.patientId as string;
  
  // Registrar para depuración
  console.log('PatientId obtenido en vista:', patientId);
  
  // Obtener el orderId de los parámetros de búsqueda
  const searchParams = useSearchParams()
  const orderId = searchParams.get('orderId')
  
  // Función para volver a la página de órdenes de hospitalización
  const handleGoBack = () => {
    router.push(`/hospitalization/orders/${patientId}`);
  }
  
  return (
    <>
      <Navbar />
      <main className="container mx-auto py-6 px-4">
        <div className="mb-4">
          <Button 
            variant="outline" 
            onClick={handleGoBack}
            className="flex items-center gap-2 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a Órdenes de Hospitalización
          </Button>
          <h1 className="text-2xl font-bold">Visualización de Hospitalización</h1>
          <p className="text-gray-600">
            {orderId ? `Orden #${orderId}` : 'Sin orden seleccionada'}
          </p>
        </div>
        <HospitalizationViewRefactored 
          patientId={patientId} 
          orderId={orderId} 
        />
      </main>
    </>
  )
}
