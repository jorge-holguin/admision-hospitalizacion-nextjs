"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Home, LogOut } from "lucide-react"
import { Navbar } from "@/components/Navbar"
import { useRouter } from "next/navigation"

export default function Dashboard() {
  const router = useRouter();
  
  const handleModuleClick = () => {
    router.push("/hospitalization")
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
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-12">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Nuevos Pacientes</p>
                  <p className="text-2xl font-bold">386</p>
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
                  <p className="text-2xl font-bold">2,408</p>
                </div>
                <Home className="w-8 h-8 text-orange-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-teal-500 to-teal-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-teal-100 text-sm">Nuevos Ingresos</p>
                  <p className="text-2xl font-bold">352</p>
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
                  <p className="text-pink-100 text-sm">Altas Médicas</p>
                  <p className="text-2xl font-bold">159</p>
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
