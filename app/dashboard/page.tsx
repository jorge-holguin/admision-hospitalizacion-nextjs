"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Home, LogOut, Loader2, AlertTriangle } from "lucide-react"
import { Navbar } from "@/components/Navbar"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

interface DashboardKPIs {
  totalCitas: number;
  totalHospitalizaciones: number;
  nuevosIngresosHoy: number;
  totalAltasMedicas: number;
}

export default function Dashboard() {
  const router = useRouter();
  const [kpis, setKpis] = useState<DashboardKPIs>({
    totalCitas: 0,
    totalHospitalizaciones: 0,
    nuevosIngresosHoy: 0,
    totalAltasMedicas: 0
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchKPIs = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/dashboard/kpis');
        
        if (!response.ok) {
          throw new Error(`Error al obtener KPIs: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
          setKpis(data.data);
        } else {
          throw new Error(data.error || 'Error desconocido al obtener KPIs');
        }
      } catch (err: any) {
        console.error('Error al cargar KPIs del dashboard:', err);
        setError(err.message || 'Error al cargar datos del dashboard');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchKPIs();
  }, []);
  
  const handleModuleClick = () => {
    router.push("/hospitalization")
  }

  const handleEmergenciaClick = () => {
    router.push("/emergencia")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Navbar />

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Sistema de Admisión para Hospitalización Web</h2>
          <p className="text-gray-600">Seleccione el módulo al que desea acceder</p>
        </div>

        {/* Module Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card
            className="hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:scale-105 border-2 border-transparent hover:border-blue-200"
            onClick={handleModuleClick}
          >
            <CardContent className="p-8 text-center">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Home className="w-10 h-10 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">HOSPITALIZACIÓN</h3>
              <p className="text-gray-600 text-sm">Gestión de pacientes hospitalizados</p>
            </CardContent>
          </Card>

     {/*      <Card
            className="hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:scale-105 border-2 border-transparent hover:border-green-200"
            onClick={handleEmergenciaClick}
          >
            <CardContent className="p-8 text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">EMERGENCIA</h3>
              <p className="text-gray-600 text-sm">Gestión de pacientes en emergencia</p>
            </CardContent>
          </Card> */}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-12">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Total Citas</p>
                  {isLoading ? (
                    <div className="flex items-center">
                      <Loader2 className="w-5 h-5 mr-2 animate-spin text-blue-200" />
                      <p className="text-2xl font-bold">Cargando...</p>
                    </div>
                  ) : error ? (
                    <p className="text-2xl font-bold">Error</p>
                  ) : (
                    <p className="text-2xl font-bold">{kpis.totalCitas.toLocaleString()}</p>
                  )}
                </div>
                <div className="w-8 h-8 text-blue-200 rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm">Total Hospitalizaciones</p>
                  {isLoading ? (
                    <div className="flex items-center">
                      <Loader2 className="w-5 h-5 mr-2 animate-spin text-orange-200" />
                      <p className="text-2xl font-bold">Cargando...</p>
                    </div>
                  ) : error ? (
                    <p className="text-2xl font-bold">Error</p>
                  ) : (
                    <p className="text-2xl font-bold">{kpis.totalHospitalizaciones.toLocaleString()}</p>
                  )}
                </div>
                <Home className="w-8 h-8 text-orange-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-teal-500 to-teal-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-teal-100 text-sm">Nuevos Ingresos (Hoy)</p>
                  {isLoading ? (
                    <div className="flex items-center">
                      <Loader2 className="w-5 h-5 mr-2 animate-spin text-teal-200" />
                      <p className="text-2xl font-bold">Cargando...</p>
                    </div>
                  ) : error ? (
                    <p className="text-2xl font-bold">Error</p>
                  ) : (
                    <p className="text-2xl font-bold">{kpis.nuevosIngresosHoy.toLocaleString()}</p>
                  )}
                </div>
                <div className="w-8 h-8 bg-teal-400 rounded-full flex items-center justify-center">
                  <div className="w-4 h-4 bg-white rounded-full"></div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-pink-500 to-pink-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-pink-100 text-sm">Total Altas Médicas</p>
                  {isLoading ? (
                    <div className="flex items-center">
                      <Loader2 className="w-5 h-5 mr-2 animate-spin text-pink-200" />
                      <p className="text-2xl font-bold">Cargando...</p>
                    </div>
                  ) : error ? (
                    <p className="text-2xl font-bold">Error</p>
                  ) : (
                    <p className="text-2xl font-bold">{kpis.totalAltasMedicas.toLocaleString()}</p>
                  )}
                </div>
                <div className="w-8 h-8 bg-pink-400 rounded-full flex items-center justify-center">
                  <LogOut className="w-4 h-4 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
