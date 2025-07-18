"use client"

import { useSearchParams } from 'next/navigation'
import { Navbar } from "@/components/Navbar"
import { HospitalizationForm } from '@/components/hospitalization/HospitalizationForm'

export default function HospitalizationRegisterPage({ params }: { params: { patientId: string } }) {
  const searchParams = useSearchParams()
  const orderId = searchParams.get('orderId')
  
  return (
    <>
      <Navbar />
      <main className="container mx-auto py-6 px-4">
        <HospitalizationForm patientId={params.patientId} orderId={orderId} />
      </main>
    </>
  )
}
