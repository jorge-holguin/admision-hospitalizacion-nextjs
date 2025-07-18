"use client"

import { useSearchParams } from 'next/navigation'
import { Navbar } from "@/components/Navbar"
import { HospitalizationForm } from '@/components/hospitalization/HospitalizationForm'
import { use } from 'react'

type PageProps = {
  params: Promise<{ patientId: string }> | { patientId: string }
}

export default function HospitalizationRegisterPage({ params }: PageProps) {
  // Usar React.use() para desenvolver los parámetros de ruta
  // Esto es necesario en las nuevas versiones de Next.js donde params es una promesa
  const resolvedParams = 'then' in params ? use(params) : params
  const patientId = resolvedParams.patientId
  
  // Obtener el orderId de los parámetros de búsqueda
  const searchParams = useSearchParams()
  const orderId = searchParams.get('orderId')
  
  return (
    <>
      <Navbar />
      <main className="container mx-auto py-6 px-4">
        <HospitalizationForm patientId={patientId} orderId={orderId} />
      </main>
    </>
  )
}
