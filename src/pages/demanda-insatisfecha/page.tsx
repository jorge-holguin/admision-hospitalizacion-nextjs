"use client"

import React, { useState, Suspense } from "react"
import { Navbar } from "@/components/Navbar"
import { Toaster } from "@/components/ui/toaster"
import ProtectedRoute from "@/components/ProtectedRoute"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PhoneOff, ClipboardList, BarChart2, Home } from "lucide-react"
import { useRouter } from "@/lib/router"

const FormDemandaInsatisfecha = React.lazy(
  () => import("@/components/demanda-insatisfecha/FormDemandaInsatisfecha")
)

const ReportesDemandaInsatisfecha = React.lazy(
  () => import("@/components/demanda-insatisfecha/ReportesDemandaInsatisfecha")
)

const LazyLoading = () => (
  <div className="flex items-center justify-center py-20 text-blue-600 text-sm">Cargando...</div>
)

type Tab = "registro" | "reportes"

export default function DemandaInsatisfechaPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<Tab>("registro")

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Navbar
          title="Demanda Insatisfecha"
          subtitle="HOSPITAL JOSÉ AGURTO TELLO DE CHOSICA - HJATCH"
          showBackButton
          backUrl="/dashboard"
        />

        <main className="page-shell py-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                <PhoneOff className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">Demanda Insatisfecha</h2>
                <p className="text-sm text-gray-500">Registro y reporte de comunicaciones de demanda insatisfecha</p>
              </div>
            </div>
            <Button
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white border-red-700"
              onClick={() => router.push("/dashboard")}
            >
              <Home className="h-4 w-4" />
              Dashboard
            </Button>
          </div>

          <div className="flex gap-2 mb-4 border-b border-gray-200">
            <button
              onClick={() => setActiveTab("registro")}
              className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium border-b-2 transition-colors
                ${activeTab === "registro"
                  ? "border-blue-600 text-blue-700 bg-blue-50/50"
                  : "border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-100"}`}
            >
              <ClipboardList className="h-4 w-4" />
              Registro Diario
            </button>
            <button
              onClick={() => setActiveTab("reportes")}
              className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium border-b-2 transition-colors
                ${activeTab === "reportes"
                  ? "border-blue-600 text-blue-700 bg-blue-50/50"
                  : "border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-100"}`}
            >
              <BarChart2 className="h-4 w-4" />
              Reportes
            </button>
          </div>

          <Card className="shadow-sm">
            <CardHeader className="pb-2 pt-4 px-5">
              <CardTitle className="text-sm font-semibold text-gray-700">
                {activeTab === "registro"
                  ? "Registros del día actual"
                  : "Reportes de Demanda Insatisfecha"}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <Suspense fallback={<LazyLoading />}>
                {activeTab === "registro" ? <FormDemandaInsatisfecha /> : <ReportesDemandaInsatisfecha />}
              </Suspense>
            </CardContent>
          </Card>
        </main>

        <Toaster />
      </div>
    </ProtectedRoute>
  )
}
